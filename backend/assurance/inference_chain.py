"""
VisionShield - Inference Record Integrity Engine
Feature 3: Inference Record Integrity
Tamper-Evident SHA-256 Hash Chain: INPUT -> MODEL -> CONFIGURATION -> OUTPUT
"""

import hashlib
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

GENESIS_PREVIOUS_HASH = "0" * 64


def sha256_str(data: str) -> str:
    """Computes SHA-256 hash of a string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def compute_record_hash(
    record_id: str,
    input_hash: str,
    model_hash: str,
    configuration_hash: str,
    output_hash: str,
    timestamp: str,
    previous_record_hash: str
) -> str:
    """
    Computes the tamper-evident hash for a record:
    hash_i = SHA256(record_id || input_hash || model_hash || configuration_hash || output_hash || timestamp || previous_record_hash)
    """
    raw_payload = f"{record_id}|{input_hash}|{model_hash}|{configuration_hash}|{output_hash}|{timestamp}|{previous_record_hash}"
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()


class InferenceChainManager:
    """
    Manages the local cryptographic inference ledger and tamper-evident audit chain.
    """

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_table()

    def _init_table(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS inference_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_id TEXT NOT NULL UNIQUE,
                input_hash TEXT NOT NULL,
                model_hash TEXT NOT NULL,
                configuration_hash TEXT NOT NULL,
                output_hash TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                previous_record_hash TEXT NOT NULL,
                record_hash TEXT NOT NULL,
                metadata_json TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()

    def get_latest_record(self) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM inference_records ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_all_records(self) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM inference_records ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()

        records = []
        for r in rows:
            item = dict(r)
            try:
                item["metadata"] = json.loads(item["metadata_json"])
            except Exception:
                item["metadata"] = {}
            records.append(item)
        return records

    def add_inference_record(
        self,
        input_data: str,
        model_hash: str,
        configuration: dict,
        output_data: dict,
        input_label: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates and cryptographically chains a new inference record:
        INPUT -> MODEL -> CONFIGURATION -> OUTPUT
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Determine previous record hash
        cursor.execute("SELECT record_hash, id FROM inference_records ORDER BY id DESC LIMIT 1")
        latest = cursor.fetchone()
        if latest:
            previous_record_hash = latest["record_hash"]
            next_idx = latest["id"] + 1
        else:
            previous_record_hash = GENESIS_PREVIOUS_HASH
            next_idx = 1

        record_id = f"INF-REC-{1000 + next_idx}"
        timestamp = datetime.now().isoformat()

        # 2. Compute individual component hashes
        input_hash = sha256_str(input_data)
        config_str = json.dumps(configuration, sort_keys=True)
        configuration_hash = sha256_str(config_str)
        output_str = json.dumps(output_data, sort_keys=True)
        output_hash = sha256_str(output_str)

        # 3. Compute chained record hash
        record_hash = compute_record_hash(
            record_id=record_id,
            input_hash=input_hash,
            model_hash=model_hash,
            configuration_hash=configuration_hash,
            output_hash=output_hash,
            timestamp=timestamp,
            previous_record_hash=previous_record_hash
        )

        metadata = {
            "input_label": input_label or "frame_input.png",
            "model_name": model_name or "YOLOv8x_Defect_Detector.onnx",
            "configuration": configuration,
            "output_preview": output_data
        }

        cursor.execute("""
            INSERT INTO inference_records (
                record_id, input_hash, model_hash, configuration_hash, output_hash,
                timestamp, previous_record_hash, record_hash, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record_id, input_hash, model_hash, configuration_hash, output_hash,
            timestamp, previous_record_hash, record_hash, json.dumps(metadata)
        ))
        conn.commit()
        inserted_id = cursor.lastrowid
        conn.close()

        return {
            "id": inserted_id,
            "record_id": record_id,
            "input_hash": input_hash,
            "model_hash": model_hash,
            "configuration_hash": configuration_hash,
            "output_hash": output_hash,
            "timestamp": timestamp,
            "previous_record_hash": previous_record_hash,
            "record_hash": record_hash,
            "metadata": metadata
        }

    def verify_chain(self) -> Dict[str, Any]:
        """
        Audits the entire hash chain from record 1 to N.
        Detects tampering and replayed/duplicate inference records.
        """
        records = self.get_all_records()
        total_records = len(records)

        if total_records == 0:
            return {
                "total_records": 0,
                "verified_records": 0,
                "tampered_records": [],
                "replay_warnings": 0,
                "replayed_record_ids": [],
                "chain_status": "EMPTY CHAIN",
                "details": "No inference records in local ledger."
            }

        verified_count = 0
        tampered_records = []
        expected_prev_hash = GENESIS_PREVIOUS_HASH

        # Track seen tuples for replay detection: (input_hash, model_hash, configuration_hash)
        seen_inferences: Dict[Tuple[str, str, str], str] = {}
        replayed_records = []

        for idx, rec in enumerate(records):
            rec_id = rec["record_id"]
            stored_prev = rec["previous_record_hash"]
            stored_hash = rec["record_hash"]

            # Recompute hash for this record
            recomputed_hash = compute_record_hash(
                record_id=rec_id,
                input_hash=rec["input_hash"],
                model_hash=rec["model_hash"],
                configuration_hash=rec["configuration_hash"],
                output_hash=rec["output_hash"],
                timestamp=rec["timestamp"],
                previous_record_hash=stored_prev
            )

            is_tampered = False
            discrepancy_reasons = []

            # 1. Check internal hash integrity
            if recomputed_hash != stored_hash:
                is_tampered = True
                discrepancy_reasons.append(
                    f"Record payload hash mismatch (computed {recomputed_hash[:12]}... vs stored {stored_hash[:12]}...)"
                )

            # 2. Check chain linkage to predecessor
            if stored_prev != expected_prev_hash:
                is_tampered = True
                discrepancy_reasons.append(
                    f"Broken linkage with predecessor (stored prev {stored_prev[:12]}... != expected {expected_prev_hash[:12]}...)"
                )

            if is_tampered:
                tampered_records.append({
                    "record_id": rec_id,
                    "index": idx + 1,
                    "reasons": discrepancy_reasons,
                    "stored_hash": stored_hash,
                    "recomputed_hash": recomputed_hash
                })
            else:
                verified_count += 1

            # Update expected predecessor for the next record
            expected_prev_hash = stored_hash

            # 3. Check for replay/duplicate inference event
            key = (rec["input_hash"], rec["model_hash"], rec["configuration_hash"])
            if key in seen_inferences:
                replayed_records.append({
                    "record_id": rec_id,
                    "original_record_id": seen_inferences[key],
                    "reason": "Identical input, model, and configuration hashes (duplicate inference invocation)"
                })
            else:
                seen_inferences[key] = rec_id

        if len(tampered_records) > 0:
            chain_status = "TAMPERING DETECTED"
        else:
            chain_status = "VERIFIED"

        return {
            "total_records": total_records,
            "verified_records": verified_count,
            "tampered_records": tampered_records,
            "tampered_count": len(tampered_records),
            "replay_warnings": len(replayed_records),
            "replayed_records": replayed_records,
            "chain_status": chain_status,
            "records": records
        }

    def tamper_record_for_test(self, record_id: str) -> bool:
        """
        Simulates an adversarial tampering event by mutating the stored output or input
        without updating the chain hash. Used to demonstrate real-time tamper detection.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT output_hash FROM inference_records WHERE record_id = ?", (record_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False

        # Flip the output hash
        tampered_hash = sha256_str(row[0] + "_MALICIOUS_INJECTION")
        cursor.execute(
            "UPDATE inference_records SET output_hash = ? WHERE record_id = ?",
            (tampered_hash, record_id)
        )
        conn.commit()
        conn.close()
        return True

    def repair_chain(self) -> int:
        """
        Recomputes and re-links the hash chain cleanly.
        """
        records = self.get_all_records()
        if not records:
            return 0

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        prev_hash = GENESIS_PREVIOUS_HASH

        for rec in records:
            rec_id = rec["record_id"]
            new_hash = compute_record_hash(
                record_id=rec_id,
                input_hash=rec["input_hash"],
                model_hash=rec["model_hash"],
                configuration_hash=rec["configuration_hash"],
                output_hash=rec["output_hash"],
                timestamp=rec["timestamp"],
                previous_record_hash=prev_hash
            )
            cursor.execute("""
                UPDATE inference_records
                SET previous_record_hash = ?, record_hash = ?
                WHERE record_id = ?
            """, (prev_hash, new_hash, rec_id))
            prev_hash = new_hash

        conn.commit()
        conn.close()
        return len(records)
