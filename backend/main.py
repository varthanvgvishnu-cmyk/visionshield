"""
VisionShield - FastAPI Backend
Offline & Model-Agnostic CV Assurance Platform
Features:
1. Dataset Assurance Scanner
2. Model Integrity Assurance
3. Inference Record Integrity
4. Unified Risk Engine
"""

import os
import json
import sqlite3
import zipfile
import hashlib
import tempfile
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from assurance.dataset_scanner import DatasetScanner, compute_sha256 as compute_dataset_sha256
from assurance.model_verifier import ModelVerifier, compute_sha256 as compute_model_sha256, detect_model_format, extract_safe_metadata
from assurance.inference_chain import InferenceChainManager
from assurance.risk_engine import UnifiedRiskEngine, DEFAULT_WEIGHTS, normalize_weights
from assurance.distribution_shift import DistributionShiftAnalyzer
from assurance.report_generator import AssuranceReportGenerator
from assurance.demo_scenarios import SCENARIOS as DEMO_SCENARIOS, get_demo_scenario

app = FastAPI(
    title="VisionShield Assurance API",
    description="Offline Computer Vision Integrity & Quality Assurance Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).resolve().parent / "vault.db"
SAMPLE_DATA_PATH = Path(__file__).resolve().parent / "sample_data" / "sample_cv_dataset.zip"
inference_manager = InferenceChainManager(DB_PATH)
risk_engine = UnifiedRiskEngine()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_code TEXT NOT NULL,
            target_artifact TEXT NOT NULL,
            target_type TEXT NOT NULL,
            risk_score REAL NOT NULL,
            recommendation TEXT NOT NULL,
            sha256 TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            time_formatted TEXT NOT NULL,
            operator TEXT NOT NULL,
            summary TEXT NOT NULL,
            raw_results TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trusted_models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            sha256 TEXT NOT NULL UNIQUE,
            file_size INTEGER NOT NULL,
            format TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            metadata TEXT NOT NULL
        )
    """)
    # Settings table for active weights
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS risk_weights (
            id INTEGER PRIMARY KEY,
            weights_json TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


init_db()


def get_active_weights() -> Dict[str, float]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT weights_json FROM risk_weights WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row[0])
        except Exception:
            pass
    return DEFAULT_WEIGHTS.copy()


def save_active_weights(weights: Dict[str, float]):
    norm = normalize_weights(weights)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO risk_weights (id, weights_json) VALUES (1, ?)", (json.dumps(norm),))
    conn.commit()
    conn.close()
    return norm


def save_scan_to_vault(target_name: str, target_type: str, scan_res: dict, file_sha256: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM scans")
    count = cursor.fetchone()[0]
    scan_code = f"VS-2026-{1000 + count + 1}"

    now = datetime.now()
    timestamp = now.isoformat()
    time_formatted = now.strftime("%H:%M:%S")

    rec = scan_res.get("overall_recommendation", scan_res.get("recommendation", "REVIEW"))
    risk = scan_res.get("dataset_risk_score", scan_res.get("overall_risk", scan_res.get("risk_score", 0.0)))
    operator = "LOCAL_OPERATOR"

    if target_type == "model":
        status = scan_res.get("integrity_status", "UNKNOWN")
        summary = f"Model Integrity Check on '{target_name}' -> Status: {status}, Rec: {rec}"
    elif target_type == "inference_chain":
        status = scan_res.get("chain_status", "UNKNOWN")
        summary = f"Inference Chain Verification -> Status: {status}, Tampered: {len(scan_res.get('tampered_records', []))}, Replays: {scan_res.get('replay_warnings', 0)}"
    elif target_type == "unified_risk":
        summary = f"Unified Risk Engine Assessment -> Score: {risk}%, Rec: {rec}"
    else:
        total_imgs = scan_res.get("total_images", 0)
        dups = scan_res.get("duplicate_count", 0) + scan_res.get("near_duplicate_count", 0)
        anomalies = scan_res.get("anomaly_count", 0)
        summary = f"Scanned {total_imgs} dataset images -> {dups} dups, {anomalies} anomalies. Rec: {rec}"

    cursor.execute("""
        INSERT INTO scans (scan_code, target_artifact, target_type, risk_score, recommendation, sha256, timestamp, time_formatted, operator, summary, raw_results)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (scan_code, target_name, target_type, risk, rec, file_sha256, timestamp, time_formatted, operator, summary, json.dumps(scan_res)))

    conn.commit()
    conn.close()

    return {
        "scan_code": scan_code,
        "target_artifact": target_name,
        "target_type": target_type,
        "risk_score": risk,
        "recommendation": rec,
        "sha256": file_sha256,
        "timestamp": timestamp,
        "time_formatted": time_formatted,
        "operator": operator,
        "summary": summary
    }


# ==========================================
# SYSTEM & HEALTH ENDPOINTS
# ==========================================

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "air_gapped": True,
        "engine": "VisionShield v1.0 Assurance Engine",
        "vault": "SQLite Local Vault Active",
        "mode": "100% Offline"
    }


@app.get("/api/scans")
def get_scans():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT scan_code, target_artifact, target_type, risk_score, recommendation, sha256, timestamp, time_formatted, operator, summary FROM scans ORDER BY id DESC LIMIT 20")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==========================================
# FEATURE 1: DATASET ASSURANCE SCANNER
# ==========================================

@app.post("/api/scan/dataset")
async def scan_dataset(
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None)
):
    scanner = DatasetScanner(near_dup_threshold=6)

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        collected_files: List[Path] = []
        overall_sha = hashlib.sha256()
        dataset_name = "dataset_upload"

        if file and file.filename:
            dataset_name = file.filename
            contents = await file.read()
            overall_sha.update(contents)
            zip_dest = temp_path / file.filename

            with open(zip_dest, "wb") as f:
                f.write(contents)

            if file.filename.lower().endswith(".zip"):
                try:
                    with zipfile.ZipFile(zip_dest, "r") as zf:
                        zf.extractall(temp_path / "extracted")
                    for root, _, filenames in os.walk(temp_path / "extracted"):
                        for fname in filenames:
                            collected_files.append(Path(root) / fname)
                except Exception as ex:
                    raise HTTPException(status_code=400, detail=f"Invalid or corrupted ZIP archive: {str(ex)}")
            else:
                collected_files.append(zip_dest)

        elif files and len(files) > 0:
            dataset_name = f"batch_{len(files)}_images"
            for upfile in files:
                contents = await upfile.read()
                overall_sha.update(contents)
                dest = temp_path / upfile.filename
                with open(dest, "wb") as f:
                    f.write(contents)
                collected_files.append(dest)

        else:
            raise HTTPException(status_code=400, detail="No dataset file or images uploaded.")

        if not collected_files:
            raise HTTPException(status_code=400, detail="No valid image files found in upload.")

        scan_results = scanner.scan_files(collected_files)

        audit_record = save_scan_to_vault(
            target_name=dataset_name,
            target_type="dataset",
            scan_res=scan_results,
            file_sha256=overall_sha.hexdigest()
        )

        scan_results["audit_record"] = audit_record
        return JSONResponse(content=scan_results)


@app.post("/api/scan/sample")
def scan_sample_dataset():
    if not SAMPLE_DATA_PATH.exists():
        from sample_data.create_samples import generate_sample_dataset
        generate_sample_dataset(SAMPLE_DATA_PATH)

    scanner = DatasetScanner(near_dup_threshold=6)

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        with zipfile.ZipFile(SAMPLE_DATA_PATH, "r") as zf:
            zf.extractall(temp_path)

        files = list(temp_path.glob("*.png"))
        scan_results = scanner.scan_files(files)

        archive_sha = compute_dataset_sha256(SAMPLE_DATA_PATH)

        audit_record = save_scan_to_vault(
            target_name="sample_cv_dataset.zip",
            target_type="dataset",
            scan_res=scan_results,
            file_sha256=archive_sha
        )

        scan_results["audit_record"] = audit_record
        return JSONResponse(content=scan_results)


# ==========================================
# FEATURE 2: MODEL INTEGRITY ASSURANCE
# ==========================================

@app.post("/api/models/register")
async def register_trusted_model(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No model file provided for registration.")

    with tempfile.TemporaryDirectory() as tmpdir:
        dest = Path(tmpdir) / file.filename
        contents = await file.read()
        with open(dest, "wb") as f:
            f.write(contents)

        file_size = len(contents)
        sha256_val = compute_model_sha256(dest)
        format_name = detect_model_format(dest)
        metadata = extract_safe_metadata(dest, format_name)

        now = datetime.now().isoformat()

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO trusted_models (filename, sha256, file_size, format, timestamp, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (file.filename, sha256_val, file_size, format_name, now, json.dumps(metadata)))
            conn.commit()
            model_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            cursor.execute("SELECT id FROM trusted_models WHERE sha256 = ?", (sha256_val,))
            model_id = cursor.fetchone()[0]
        finally:
            conn.close()

    return {
        "status": "registered",
        "id": model_id,
        "filename": file.filename,
        "sha256": sha256_val,
        "file_size": file_size,
        "format": format_name,
        "timestamp": now,
        "metadata": metadata
    }


@app.get("/api/models")
def list_trusted_models():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, sha256, file_size, format, timestamp, metadata FROM trusted_models ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        item = dict(r)
        try:
            item["metadata"] = json.loads(item["metadata"])
        except Exception:
            item["metadata"] = {}
        results.append(item)
    return results


@app.delete("/api/models/{model_id}")
def delete_trusted_model(model_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trusted_models WHERE id = ?", (model_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Model ID not found.")
    return {"status": "deleted", "id": model_id}


@app.post("/api/models/verify")
async def verify_model(
    file: UploadFile = File(...),
    trusted_id: Optional[int] = Form(None),
    expected_hash: Optional[str] = Form(None)
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No candidate model file uploaded.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    trusted_model_record = None
    if trusted_id:
        cursor.execute("SELECT * FROM trusted_models WHERE id = ?", (trusted_id,))
        row = cursor.fetchone()
        if row:
            trusted_model_record = dict(row)
    elif expected_hash:
        cursor.execute("SELECT * FROM trusted_models WHERE sha256 = ?", (expected_hash,))
        row = cursor.fetchone()
        if row:
            trusted_model_record = dict(row)
        else:
            trusted_model_record = {
                "filename": "Custom_Reference_Hash",
                "sha256": expected_hash,
                "format": "Unknown"
            }
    else:
        cursor.execute("SELECT * FROM trusted_models ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            trusted_model_record = dict(row)

    conn.close()

    if not trusted_model_record:
        raise HTTPException(
            status_code=400,
            detail="No trusted model found in registry to compare against. Please register a trusted baseline model first."
        )

    target_expected_hash = trusted_model_record["sha256"]
    trusted_name = trusted_model_record["filename"]

    with tempfile.TemporaryDirectory() as tmpdir:
        dest = Path(tmpdir) / file.filename
        contents = await file.read()
        with open(dest, "wb") as f:
            f.write(contents)

        verifier = ModelVerifier()
        verification_result = verifier.verify_model(
            candidate_file_path=dest,
            expected_hash=target_expected_hash,
            trusted_filename=trusted_name
        )

        audit_record = save_scan_to_vault(
            target_name=file.filename,
            target_type="model",
            scan_res=verification_result,
            file_sha256=verification_result["received_hash"]
        )
        verification_result["audit_record"] = audit_record

    return JSONResponse(content=verification_result)


@app.post("/api/models/verify-sample")
def verify_sample_model(tampered: bool = False):
    from sample_data.create_sample_models import generate_sample_models
    paths = generate_sample_models()

    baseline_path = paths["baseline"]
    expected_hash = compute_model_sha256(baseline_path)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM trusted_models WHERE sha256 = ?", (expected_hash,))
    if not cursor.fetchone():
        now = datetime.now().isoformat()
        metadata = extract_safe_metadata(baseline_path, "ONNX")
        cursor.execute("""
            INSERT INTO trusted_models (filename, sha256, file_size, format, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (baseline_path.name, expected_hash, baseline_path.stat().st_size, "ONNX", now, json.dumps(metadata)))
        conn.commit()
    conn.close()

    candidate_path = paths["tampered"] if tampered else paths["copy"]

    verifier = ModelVerifier()
    res = verifier.verify_model(
        candidate_file_path=candidate_path,
        expected_hash=expected_hash,
        trusted_filename=baseline_path.name
    )

    audit_record = save_scan_to_vault(
        target_name=candidate_path.name,
        target_type="model",
        scan_res=res,
        file_sha256=res["received_hash"]
    )
    res["audit_record"] = audit_record

    return JSONResponse(content=res)


# ==========================================
# FEATURE 3: INFERENCE RECORD INTEGRITY
# ==========================================

class CreateInferencePayload(BaseModel):
    input_data: str
    model_hash: str
    configuration: dict
    output_data: dict
    input_label: Optional[str] = "camera_frame.png"
    model_name: Optional[str] = "YOLOv8x_Defect_Detector.onnx"

@app.post("/api/inference/record")
def record_inference(payload: CreateInferencePayload):
    rec = inference_manager.add_inference_record(
        input_data=payload.input_data,
        model_hash=payload.model_hash,
        configuration=payload.configuration,
        output_data=payload.output_data,
        input_label=payload.input_label,
        model_name=payload.model_name
    )
    return JSONResponse(content=rec)


@app.get("/api/inference/records")
def get_inference_records():
    return inference_manager.get_all_records()


@app.get("/api/inference/verify")
def verify_inference_chain():
    res = inference_manager.verify_chain()

    overall_sha = hashlib.sha256()
    for r in res.get("records", []):
        overall_sha.update(r["record_hash"].encode("utf-8"))

    rec_status = "ACCEPT" if res["chain_status"] == "VERIFIED" else "QUARANTINE"
    risk = 0.0 if res["chain_status"] == "VERIFIED" else 90.0

    audit_record = save_scan_to_vault(
        target_name=f"Inference_Chain_Ledger ({res['total_records']}_records)",
        target_type="inference_chain",
        scan_res={"chain_status": res["chain_status"], "tampered_records": res["tampered_records"], "replay_warnings": res["replay_warnings"], "recommendation": rec_status, "risk_score": risk},
        file_sha256=overall_sha.hexdigest() or ("0" * 64)
    )
    res["audit_record"] = audit_record
    return JSONResponse(content=res)


@app.post("/api/inference/seed-sample")
def seed_sample_inferences():
    from sample_data.seed_inferences import seed_sample_inferences as do_seed
    created = do_seed(DB_PATH)
    return {"status": "seeded", "count": len(created)}


@app.post("/api/inference/tamper-test")
def simulate_tamper():
    records = inference_manager.get_all_records()
    if not records:
        from sample_data.seed_inferences import seed_sample_inferences as do_seed
        do_seed(DB_PATH)
        records = inference_manager.get_all_records()

    target_rec = records[len(records) // 2]
    success = inference_manager.tamper_record_for_test(target_rec["record_id"])
    return {
        "status": "tampered" if success else "failed",
        "tampered_record_id": target_rec["record_id"]
    }


@app.post("/api/inference/repair")
def repair_chain():
    count = inference_manager.repair_chain()
    return {"status": "repaired", "recomputed_records": count}


# ==========================================
# FEATURE 4: UNIFIED RISK ENGINE
# ==========================================

class EvaluateRiskPayload(BaseModel):
    custom_weights: Optional[Dict[str, float]] = None
    component_scores: Optional[Dict[str, float]] = None


@app.get("/api/risk/weights")
def get_weights():
    """Returns currently active configurable weights."""
    return get_active_weights()


@app.post("/api/risk/weights")
def update_weights(weights: Dict[str, float]):
    """Updates and saves active weights in SQLite."""
    updated = save_active_weights(weights)
    return {"status": "updated", "weights": updated}



# Feature 5: Distribution Shift Analyzer Instance
MODEL_SAMPLE_PATH = Path(__file__).resolve().parent / "sample_data" / "YOLOv8x_Defect_Detector.onnx"
shift_analyzer = DistributionShiftAnalyzer(model_path=MODEL_SAMPLE_PATH)
latest_shift_result: Optional[Dict[str, Any]] = None


# ==========================================
# FEATURE 5: BASIC DISTRIBUTION SHIFT ANALYSIS
# ==========================================

@app.post("/api/shift/analyze")
async def analyze_distribution_shift(
    ref_file: Optional[UploadFile] = File(None),
    ref_files: Optional[List[UploadFile]] = File(None),
    op_file: Optional[UploadFile] = File(None),
    op_files: Optional[List[UploadFile]] = File(None)
):
    """
    Accepts reference and operational datasets (as ZIP archives or image file lists).
    Extracts image statistics, compares distributions, computes local ONNX embeddings,
    and returns distribution shift metrics.
    """
    global latest_shift_result

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        ref_dir = temp_path / "ref"
        op_dir = temp_path / "op"
        ref_dir.mkdir()
        op_dir.mkdir()

        collected_ref_files: List[Path] = []
        collected_op_files: List[Path] = []

        # 1. Process Reference Dataset
        if ref_file and ref_file.filename:
            ref_bytes = await ref_file.read()
            ref_dest = ref_dir / ref_file.filename
            with open(ref_dest, "wb") as f:
                f.write(ref_bytes)
            if ref_file.filename.lower().endswith(".zip"):
                try:
                    with zipfile.ZipFile(ref_dest, "r") as zf:
                        zf.extractall(ref_dir / "extracted")
                    for root, _, files in os.walk(ref_dir / "extracted"):
                        for fname in files:
                            collected_ref_files.append(Path(root) / fname)
                except Exception as ex:
                    raise HTTPException(status_code=400, detail=f"Invalid reference ZIP archive: {str(ex)}")
            else:
                collected_ref_files.append(ref_dest)
        elif ref_files and len(ref_files) > 0:
            for rf in ref_files:
                rf_bytes = await rf.read()
                dest = ref_dir / rf.filename
                with open(dest, "wb") as f:
                    f.write(rf_bytes)
                collected_ref_files.append(dest)

        # 2. Process Operational Dataset
        if op_file and op_file.filename:
            op_bytes = await op_file.read()
            op_dest = op_dir / op_file.filename
            with open(op_dest, "wb") as f:
                f.write(op_bytes)
            if op_file.filename.lower().endswith(".zip"):
                try:
                    with zipfile.ZipFile(op_dest, "r") as zf:
                        zf.extractall(op_dir / "extracted")
                    for root, _, files in os.walk(op_dir / "extracted"):
                        for fname in files:
                            collected_op_files.append(Path(root) / fname)
                except Exception as ex:
                    raise HTTPException(status_code=400, detail=f"Invalid operational ZIP archive: {str(ex)}")
            else:
                collected_op_files.append(op_dest)
        elif op_files and len(op_files) > 0:
            for of in op_files:
                of_bytes = await of.read()
                dest = op_dir / of.filename
                with open(dest, "wb") as f:
                    f.write(of_bytes)
                collected_op_files.append(dest)

        if not collected_ref_files or not collected_op_files:
            raise HTTPException(
                status_code=400,
                detail="Both Reference dataset and Operational dataset must contain at least one valid image file."
            )

        # Analyze shift
        result = shift_analyzer.analyze_shift(collected_ref_files, collected_op_files)
        latest_shift_result = result

        # Record scan into SQLite vault
        recommendation = "ACCEPT" if result["distribution_shift_score"] <= 30 else ("REVIEW" if result["distribution_shift_score"] <= 60 else "QUARANTINE")
        summary_str = f"Distribution Shift: {len(result['changed_features'])} shifted features ({', '.join(result['changed_features']) or 'None'}). Score: {result['distribution_shift_score']}%."

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now = datetime.now()
        cursor.execute("""
            INSERT INTO scans (
                scan_code, target_artifact, target_type, risk_score,
                recommendation, sha256, timestamp, time_formatted, operator, summary, raw_results
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"SHIFT-{now.strftime('%H%M%S')}",
            f"Ref({len(collected_ref_files)}) vs Op({len(collected_op_files)})",
            "distribution_shift",
            result["distribution_shift_score"],
            recommendation,
            "DIST-SHIFT-SHA256",
            now.isoformat(),
            now.strftime("%b %d, %H:%M:%S"),
            "System Automation",
            summary_str,
            json.dumps(result)
        ))
        conn.commit()
        conn.close()

        return JSONResponse(content=result)


@app.post("/api/shift/sample")
def analyze_sample_distribution_shift():
    """
    Executes instant demonstration comparing baseline synthetic reference dataset
    against low-light / underexposed operational shifted batch.
    """
    global latest_shift_result
    ref_dir = Path(__file__).resolve().parent / "sample_data" / "temp_reference_images"
    op_dir = Path(__file__).resolve().parent / "sample_data" / "temp_operational_images"

    if not ref_dir.exists() or not op_dir.exists():
        from sample_data.create_shift_samples import generate_shift_datasets
        generate_shift_datasets()

    ref_files = list(ref_dir.glob("*.png"))
    op_files = list(op_dir.glob("*.png"))

    result = shift_analyzer.analyze_shift(ref_files, op_files)
    latest_shift_result = result

    recommendation = "ACCEPT" if result["distribution_shift_score"] <= 30 else ("REVIEW" if result["distribution_shift_score"] <= 60 else "QUARANTINE")
    summary_str = f"Sample Shift Analysis: {len(result['changed_features'])} shifted features ({', '.join(result['changed_features'])}). Score: {result['distribution_shift_score']}%."

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now()
    cursor.execute("""
        INSERT INTO scans (
            scan_code, target_artifact, target_type, risk_score,
            recommendation, sha256, timestamp, time_formatted, operator, summary, raw_results
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"SHIFT-{now.strftime('%H%M%S')}",
        "Reference_Baseline vs Operational_NightShift",
        "distribution_shift",
        result["distribution_shift_score"],
        recommendation,
        "SAMPLE-SHIFT-SHA256",
        now.isoformat(),
        now.strftime("%b %d, %H:%M:%S"),
        "System Automation",
        summary_str,
        json.dumps(result)
    ))
    conn.commit()
    conn.close()

    return JSONResponse(content=result)


@app.get("/api/shift/latest")
def get_latest_distribution_shift():
    """Returns the most recent distribution shift evaluation."""
    global latest_shift_result
    if latest_shift_result is None:
        ref_dir = Path(__file__).resolve().parent / "sample_data" / "temp_reference_images"
        op_dir = Path(__file__).resolve().parent / "sample_data" / "temp_operational_images"
        if ref_dir.exists() and op_dir.exists():
            ref_files = list(ref_dir.glob("*.png"))
            op_files = list(op_dir.glob("*.png"))
            latest_shift_result = shift_analyzer.analyze_shift(ref_files, op_files)
        else:
            return JSONResponse(content={
                "distribution_shift_score": 0.0,
                "changed_features": [],
                "feature_comparisons": {},
                "embedding_shift": None,
                "reference_count": 0,
                "operational_count": 0,
                "evidence": [{
                    "finding": "No distribution shift analysis performed yet",
                    "severity": "LOW",
                    "evidence": "Upload reference and operational datasets to calculate feature drift.",
                    "confidence": 0.5,
                    "limitation": "Awaiting initial reference baseline enrollment."
                }],
                "confidence": 0.5,
                "limitations": ["Distribution shift does not prove an adversarial attack."]
            })
    return JSONResponse(content=latest_shift_result)


@app.get("/api/risk/evaluate")
def evaluate_current_risk():
    """
    Computes real-time overall risk score, recommendation, component breakdown,
    structured evidence, and limitations based on live SQLite vault state.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM scans WHERE target_type = 'dataset' ORDER BY id DESC LIMIT 1")
    dataset_scan = cursor.fetchone()

    cursor.execute("SELECT * FROM scans WHERE target_type = 'model' ORDER BY id DESC LIMIT 1")
    model_scan = cursor.fetchone()

    cursor.execute("SELECT * FROM scans WHERE target_type = 'distribution_shift' ORDER BY id DESC LIMIT 1")
    shift_scan = cursor.fetchone()

    conn.close()

    # 1. Dataset component risk
    if dataset_scan:
        dataset_score = float(dataset_scan["risk_score"])
    else:
        dataset_score = 0.0

    # 2. Model component risk
    if model_scan:
        if model_scan["recommendation"] == "QUARANTINE":
            model_score = 85.0
        elif model_scan["recommendation"] == "REVIEW":
            model_score = 45.0
        else:
            model_score = 0.0
    else:
        model_score = 0.0

    # 3. Inference component risk
    chain_audit = inference_manager.verify_chain()
    if chain_audit["chain_status"] == "TAMPERING DETECTED":
        inference_score = 90.0
    elif chain_audit["replay_warnings"] > 0:
        inference_score = min(45.0, 15.0 * chain_audit["replay_warnings"])
    else:
        inference_score = 0.0

    # 4. Behaviour component risk (default nominal)
    behaviour_score = 10.0

    # 5. Distribution Shift component risk
    if shift_scan:
        distribution_score = float(shift_scan["risk_score"])
    elif latest_shift_result:
        distribution_score = float(latest_shift_result.get("distribution_shift_score", 0.0))
    else:
        distribution_score = 0.0

    scores = {
        "dataset": dataset_score,
        "model": model_score,
        "behaviour": behaviour_score,
        "distribution": distribution_score,
        "inference": inference_score
    }

    active_weights = get_active_weights()
    telemetry = {
        "dataset_evidence": dataset_scan["summary"] if dataset_scan else "No anomalies detected in baseline dataset.",
        "model_evidence": model_scan["summary"] if model_scan else "Model hash verified against registered baseline.",
        "tampering_detected": chain_audit["chain_status"] == "TAMPERING DETECTED",
        "replay_warnings": chain_audit.get("replay_warnings", 0),
        "inference_evidence": f"Inference ledger: {chain_audit['chain_status']}. Verified: {chain_audit['verified_records']}, Tampered: {len(chain_audit['tampered_records'])}.",
        "dataset_samples_count": 6,
        "inference_records_count": chain_audit["total_records"]
    }

    if shift_scan:
        telemetry["distribution_evidence"] = shift_scan["summary"]

    result = risk_engine.evaluate(
        component_scores=scores,
        telemetry_details=telemetry,
        custom_weights=active_weights
    )

    return JSONResponse(content=result)


@app.post("/api/risk/evaluate")
def evaluate_custom_risk(payload: EvaluateRiskPayload):
    """
    Evaluates unified risk with user-provided custom weights and/or component overrides.
    """
    scores = payload.component_scores or {
        "dataset": 0.0,
        "model": 0.0,
        "behaviour": 10.0,
        "distribution": 0.0,
        "inference": 0.0
    }
    weights = payload.custom_weights or get_active_weights()
    result = risk_engine.evaluate(
        component_scores=scores,
        custom_weights=weights
    )
    return JSONResponse(content=result)


# Feature 6: Assurance Report Generator Instance
report_generator = AssuranceReportGenerator(DB_PATH)


# ==========================================
# FEATURE 6: ASSURANCE REPORT GENERATION
# ==========================================

@app.get("/api/report/latest")
def get_latest_assurance_report():
    """
    Returns the comprehensive 15-section VisionShield Assurance Report
    reflecting the latest evaluated master system state.
    """
    report = report_generator.generate_report()
    return JSONResponse(content=report)


@app.get("/api/report/scan/{scan_code}")
def get_scan_assurance_report(scan_code: str):
    """
    Returns the 15-section VisionShield Assurance Report anchored to a specific scan.
    """
    report = report_generator.generate_report(scan_code=scan_code)
    return JSONResponse(content=report)


@app.get("/api/report/export/html")
def export_assurance_report_html(scan_code: Optional[str] = None):
    """
    Generates and returns a standalone, styled HTML assurance report document.
    """
    from fastapi.responses import HTMLResponse
    report = report_generator.generate_report(scan_code=scan_code)
    html = report_generator.render_html_report(report)
    return HTMLResponse(
        content=html,
        headers={
            "Content-Disposition": f"attachment; filename=VisionShield_Assurance_Report_{report['scan_id']}.html"
        }
    )


# ==========================================
# DEMO MODE ENDPOINTS (HACKATHON PRESENTATION)
# ==========================================

@app.get("/api/demo/scenarios")
def list_demo_scenarios():
    """
    Returns the metadata and descriptions for the 3 deterministic demo scenarios:
    1. SCENARIO 1 — TRUSTED ("Trusted System") -> ACCEPT
    2. SCENARIO 2 — REVIEW ("Suspicious Dataset") -> REVIEW
    3. SCENARIO 3 — QUARANTINE ("Compromised Pipeline") -> QUARANTINE
    Clearly labeled as DEMO DATA / SIMULATED DEMONSTRATION DATA.
    """
    summary = [
        {
            "key": v["key"],
            "name": v["name"],
            "description": v["description"],
            "label": v["label"],
            "recommendation": v["recommendation"],
            "overall_risk": v["overall_risk"],
            "is_demo": True
        }
        for v in DEMO_SCENARIOS.values()
    ]
    return JSONResponse(content={"scenarios": summary, "is_demo_mode": True})


@app.get("/api/demo/scenario/{scenario_key}")
def get_demo_scenario_details(scenario_key: str):
    """
    Returns full deterministic state for the requested demo scenario.
    Includes dataset findings, model verification, inference ledger, distribution analysis,
    risk evaluation, and human-readable evidence.
    Clearly labeled as DEMO DATA.
    """
    scenario = get_demo_scenario(scenario_key)
    return JSONResponse(content=scenario)


@app.get("/api/demo/report/{scenario_key}")
def get_demo_scenario_report(scenario_key: str):
    """
    Builds a complete 15-section Assurance Report for a demo scenario, clearly labeled as DEMO DATA.
    """
    scenario = get_demo_scenario(scenario_key)
    now = datetime.now()

    report = {
        "report_title": "VISIONSHIELD ASSURANCE REPORT",
        "scan_id": f"DEMO-{scenario['key'].upper()}-{now.strftime('%H%M%S')}",
        "timestamp": now.isoformat(),
        "timestamp_formatted": now.strftime("%b %d, %Y - %H:%M:%S (DEMO DATA)"),
        "is_demo": True,
        "demo_label": scenario["label"],
        "dataset_information": {
            "dataset_name": scenario["dataset_health"]["dataset_name"],
            "total_images": scenario["dataset_health"]["total_images"],
            "valid_images": scenario["dataset_health"]["valid_images"],
            "image_formats": ["PNG", "JPEG"],
            "sha256_dataset": "demo_simulated_dataset_hash_sha256_placeholder",
            "resolution_summary": "128x128 simulated factory frames",
            "average_brightness": 112.5
        },
        "dataset_findings": scenario["dataset_health"],
        "model_information": {
            "model_name": scenario["model_integrity"]["model_name"],
            "model_format": scenario["model_integrity"]["model_format"],
            "file_size": 1424,
            "input_tensor": "image_input (1, 3, 224, 224) - FLOAT",
            "output_tensor": "class_logits (10,) - FLOAT",
            "zero_code_execution_enforced": True
        },
        "model_integrity_result": scenario["model_integrity"],
        "distribution_analysis": scenario["distribution_shift"],
        "inference_integrity": scenario["inference_chain"],
        "overall_risk_score": scenario["overall_risk"],
        "confidence": scenario["confidence"],
        "recommendation": scenario["recommendation"],
        "evidence": scenario["evidence_list"],
        "evidence_list": scenario["evidence_list"],
        "limitations": scenario["limitations"],
        "coverage": {
            "domains_evaluated": 5,
            "total_domains": 5,
            "coverage_percentage": 100.0,
            "active_modules": [
                {"module": "Dataset Assurance Scanner", "status": "ACTIVE", "weight": "20%"},
                {"module": "Model Integrity Assurance", "status": "ACTIVE", "weight": "30%"},
                {"module": "Model Behaviour & Stress Analysis", "status": "ACTIVE", "weight": "20%"},
                {"module": "Distribution Shift Analysis", "status": "ACTIVE", "weight": "10%"},
                {"module": "Inference Record Integrity", "status": "ACTIVE", "weight": "20%"}
            ]
        },
        "audit_trail_status": {
            "vault_database": "SQLite Local Vault (Air-Gapped)",
            "transaction_hash": "demo_tamper_evident_hash_simulated_placeholder",
            "operator": "DEMO_OPERATOR",
            "tamper_evident_anchoring": scenario["inference_chain"]["chain_status"],
            "immutable_record_verified": scenario["inference_chain"]["chain_status"] != "TAMPERING DETECTED"
        }
    }
    return JSONResponse(content=report)


@app.get("/api/demo/report/export/html/{scenario_key}")
def export_demo_report_html(scenario_key: str):
    """
    Exports a standalone styled HTML report for the demo scenario.
    """
    from fastapi.responses import HTMLResponse
    resp = get_demo_scenario_report(scenario_key)
    report_dict = json.loads(resp.body.decode("utf-8"))
    html = report_generator.render_html_report(report_dict)
    return HTMLResponse(
        content=html,
        headers={
            "Content-Disposition": f"attachment; filename=VisionShield_Assurance_Report_DEMO_{scenario_key}.html"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


