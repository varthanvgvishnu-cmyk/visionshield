import sys
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from assurance.inference_chain import InferenceChainManager, compute_record_hash, GENESIS_PREVIOUS_HASH
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_inference_chain_direct():
    with tempfile.TemporaryDirectory() as tmpdir:
        test_db = Path(tmpdir) / "test_chain.db"
        mgr = InferenceChainManager(test_db)

        # 1. Add record 1
        rec1 = mgr.add_inference_record(
            input_data="frame_pixel_data_1",
            model_hash="aaaa1111",
            configuration={"threshold": 0.5},
            output_data={"class": "car", "confidence": 0.95},
            input_label="cam01_f1.png"
        )
        assert rec1["previous_record_hash"] == GENESIS_PREVIOUS_HASH
        assert rec1["record_hash"] != ""

        # 2. Add record 2 (should chain to rec1)
        rec2 = mgr.add_inference_record(
            input_data="frame_pixel_data_2",
            model_hash="aaaa1111",
            configuration={"threshold": 0.5},
            output_data={"class": "truck", "confidence": 0.88},
            input_label="cam01_f2.png"
        )
        assert rec2["previous_record_hash"] == rec1["record_hash"], "Record 2 must link to Record 1 hash"

        # 3. Add record 3 - identical input/model/config as record 1 (replay test)
        rec3 = mgr.add_inference_record(
            input_data="frame_pixel_data_1",
            model_hash="aaaa1111",
            configuration={"threshold": 0.5},
            output_data={"class": "car", "confidence": 0.95},
            input_label="cam01_f1_replayed.png"
        )
        assert rec3["previous_record_hash"] == rec2["record_hash"]

        # 4. Verify chain before tampering
        audit = mgr.verify_chain()
        assert audit["chain_status"] == "VERIFIED"
        assert audit["total_records"] == 3
        assert audit["verified_records"] == 3
        assert len(audit["tampered_records"]) == 0
        assert audit["replay_warnings"] == 1, "Should detect replayed inference record"

        # 5. Simulate Tampering on record 1
        tampered = mgr.tamper_record_for_test(rec1["record_id"])
        assert tampered is True

        # 6. Verify chain after tampering -> must report TAMPERING DETECTED
        audit_tampered = mgr.verify_chain()
        assert audit_tampered["chain_status"] == "TAMPERING DETECTED"
        assert len(audit_tampered["tampered_records"]) >= 1
        tampered_ids = [t["record_id"] for t in audit_tampered["tampered_records"]]
        assert rec1["record_id"] in tampered_ids, "Record 1 must be flagged as tampered"

        # 7. Repair chain
        repaired = mgr.repair_chain()
        assert repaired == 3
        audit_restored = mgr.verify_chain()
        assert audit_restored["chain_status"] == "VERIFIED"

def test_api_inference_endpoints():
    # 1. Seed sample
    res_seed = client.post("/api/inference/seed-sample")
    assert res_seed.status_code == 200
    assert res_seed.json()["status"] == "seeded"

    # 2. Get records
    res_recs = client.get("/api/inference/records")
    assert res_recs.status_code == 200
    recs = res_recs.json()
    assert len(recs) >= 5

    # 3. Verify chain
    res_v = client.get("/api/inference/verify")
    assert res_v.status_code == 200
    v_data = res_v.json()
    assert "chain_status" in v_data
    assert "total_records" in v_data
    assert "replay_warnings" in v_data

    # 4. Tamper test API
    res_tamper = client.post("/api/inference/tamper-test")
    assert res_tamper.status_code == 200
    assert res_tamper.json()["status"] == "tampered"

    # 5. Verify after tamper API -> must show TAMPERING DETECTED
    res_v_tampered = client.get("/api/inference/verify")
    assert res_v_tampered.status_code == 200
    assert res_v_tampered.json()["chain_status"] == "TAMPERING DETECTED"

    # 6. Repair API
    res_repair = client.post("/api/inference/repair")
    assert res_repair.status_code == 200
    assert res_repair.json()["status"] == "repaired"

    # 7. Re-verify -> should be back to VERIFIED
    res_v_clean = client.get("/api/inference/verify")
    assert res_v_clean.status_code == 200
    assert res_v_clean.json()["chain_status"] == "VERIFIED"

if __name__ == "__main__":
    test_inference_chain_direct()
    test_api_inference_endpoints()
    print("All Inference Chain tests passed successfully!")
