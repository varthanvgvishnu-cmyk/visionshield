import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from assurance.risk_engine import UnifiedRiskEngine, normalize_weights, map_risk_to_recommendation
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_risk_engine_logic():
    engine = UnifiedRiskEngine()

    # 1. Clean nominal scores -> ACCEPT (<= 30)
    scores_clean = {"dataset": 0.0, "model": 0.0, "behaviour": 10.0, "distribution": 0.0, "inference": 0.0}
    res_clean = engine.evaluate(scores_clean)
    assert res_clean["overall_risk"] <= 30.0
    assert res_clean["recommendation"] == "ACCEPT"

    # 2. Medium risk scores -> REVIEW (31-60)
    scores_med = {"dataset": 40.0, "model": 0.0, "behaviour": 50.0, "distribution": 30.0, "inference": 20.0}
    # 40*0.2 + 0*0.3 + 50*0.2 + 30*0.1 + 20*0.2 = 8 + 0 + 10 + 3 + 4 = 25 -> ACCEPT
    # Let's check with higher:
    scores_rev = {"dataset": 50.0, "model": 50.0, "behaviour": 40.0, "distribution": 20.0, "inference": 30.0}
    # 50*0.2 + 50*0.3 + 40*0.2 + 20*0.1 + 30*0.2 = 10 + 15 + 8 + 2 + 6 = 41.0
    res_rev = engine.evaluate(scores_rev)
    assert 31.0 <= res_rev["overall_risk"] <= 60.0
    assert res_rev["recommendation"] == "REVIEW"

    # 3. High risk scores -> QUARANTINE (61-100)
    scores_quarantine = {"dataset": 50.0, "model": 85.0, "behaviour": 40.0, "distribution": 40.0, "inference": 90.0}
    res_quarantine = engine.evaluate(scores_quarantine)
    assert res_quarantine["overall_risk"] >= 61.0
    assert res_quarantine["recommendation"] == "QUARANTINE"

    # 4. Validate Structured Finding format
    findings = res_quarantine["evidence"]
    assert len(findings) > 0
    for f in findings:
        assert "finding" in f, "Missing finding key"
        assert "severity" in f, "Missing severity key"
        assert "evidence" in f, "Missing evidence key"
        assert "confidence" in f, "Missing confidence key"
        assert "limitation" in f, "Missing limitation key"
        assert f["severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

def test_api_risk_endpoints():
    # 1. GET weights
    res_w = client.get("/api/risk/weights")
    assert res_w.status_code == 200
    weights = res_w.json()
    assert "model" in weights
    assert "dataset" in weights

    # 2. GET evaluate (live vault calculation)
    res_eval = client.get("/api/risk/evaluate")
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    assert "overall_risk" in eval_data
    assert "recommendation" in eval_data
    assert "component_scores" in eval_data
    assert "evidence" in eval_data
    assert "limitations" in eval_data
    assert eval_data["recommendation"] in ["ACCEPT", "REVIEW", "QUARANTINE"]

    # 3. POST evaluate with custom weights
    custom_payload = {
        "custom_weights": {"dataset": 0.1, "model": 0.5, "behaviour": 0.1, "distribution": 0.1, "inference": 0.2},
        "component_scores": {"dataset": 0.0, "model": 85.0, "behaviour": 0.0, "distribution": 0.0, "inference": 0.0}
    }
    res_custom = client.post("/api/risk/evaluate", json=custom_payload)
    assert res_custom.status_code == 200
    custom_data = res_custom.json()
    assert custom_data["overall_risk"] >= 40.0
    assert custom_data["component_scores"]["model"] == 85.0

if __name__ == "__main__":
    test_risk_engine_logic()
    test_api_risk_endpoints()
    print("All Unified Risk Engine tests passed successfully!")
