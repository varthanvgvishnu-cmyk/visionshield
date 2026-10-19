import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from assurance.model_verifier import ModelVerifier, detect_model_format, extract_safe_metadata, compute_sha256
from sample_data.create_sample_models import generate_sample_models
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_model_verifier_direct():
    paths = generate_sample_models()
    baseline = paths["baseline"]
    copy = paths["copy"]
    tampered = paths["tampered"]

    # 1. Format and metadata inspection
    fmt = detect_model_format(baseline)
    assert fmt == "ONNX"
    meta = extract_safe_metadata(baseline, fmt)
    assert len(meta["inputs"]) > 0, "Should extract ONNX inputs"
    assert len(meta["outputs"]) > 0, "Should extract ONNX outputs"
    assert meta["inputs"][0]["name"] == "image_input"
    assert meta["outputs"][0]["name"] == "class_logits"

    # 2. Exact match
    verifier = ModelVerifier()
    base_hash = compute_sha256(baseline)
    res_match = verifier.verify_model(copy, base_hash, "baseline.onnx")
    assert res_match["integrity_status"] == "VERIFIED"
    assert res_match["recommendation"] == "ACCEPT"
    assert res_match["hash_match"] is True
    assert res_match["risk_score"] == 0.0
    assert len(res_match["evidence"]) > 0
    assert len(res_match["limitations"]) > 0

    # 3. Mismatch
    res_diff = verifier.verify_model(tampered, base_hash, "baseline.onnx")
    assert res_diff["integrity_status"] == "SUSPICIOUS"
    assert res_diff["recommendation"] == "QUARANTINE"
    assert res_diff["hash_match"] is False
    assert res_diff["risk_score"] > 50.0

def test_api_model_endpoints():
    paths = generate_sample_models()
    baseline = paths["baseline"]
    copy = paths["copy"]
    tampered = paths["tampered"]

    # 1. Register model
    with open(baseline, "rb") as f:
        res = client.post("/api/models/register", files={"file": (baseline.name, f, "application/octet-stream")})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "registered"
    assert data["filename"] == baseline.name
    assert "sha256" in data
    registered_id = data["id"]
    registered_hash = data["sha256"]

    # 2. List models
    res_list = client.get("/api/models")
    assert res_list.status_code == 200
    models = res_list.json()
    assert any(m["id"] == registered_id for m in models)

    # 3. Verify matching copy
    with open(copy, "rb") as f:
        res_v1 = client.post(
            "/api/models/verify",
            files={"file": (copy.name, f, "application/octet-stream")},
            data={"trusted_id": registered_id}
        )
    assert res_v1.status_code == 200
    v1_data = res_v1.json()
    assert v1_data["integrity_status"] == "VERIFIED"
    assert v1_data["recommendation"] == "ACCEPT"
    assert v1_data["hash_match"] is True

    # 4. Verify tampered copy
    with open(tampered, "rb") as f:
        res_v2 = client.post(
            "/api/models/verify",
            files={"file": (tampered.name, f, "application/octet-stream")},
            data={"trusted_id": registered_id}
        )
    assert res_v2.status_code == 200
    v2_data = res_v2.json()
    assert v2_data["integrity_status"] == "SUSPICIOUS"
    assert v2_data["recommendation"] == "QUARANTINE"
    assert v2_data["hash_match"] is False

    # 5. Check scans vault contains model scans
    res_scans = client.get("/api/scans")
    scans = res_scans.json()
    model_scans = [s for s in scans if s["target_type"] == "model"]
    assert len(model_scans) >= 2

if __name__ == "__main__":
    test_model_verifier_direct()
    test_api_model_endpoints()
    print("All Model Integrity tests passed successfully!")
