import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_demo_scenarios_list():
    res = client.get("/api/demo/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert data["is_demo_mode"] is True
    scenarios = {s["key"]: s for s in data["scenarios"]}
    assert "trusted" in scenarios
    assert "review" in scenarios
    assert "quarantine" in scenarios
    assert scenarios["trusted"]["recommendation"] == "ACCEPT"
    assert scenarios["review"]["recommendation"] == "REVIEW"
    assert scenarios["quarantine"]["recommendation"] == "QUARANTINE"

def test_demo_scenario_details():
    for key, expected_rec in [("trusted", "ACCEPT"), ("review", "REVIEW"), ("quarantine", "QUARANTINE")]:
        res = client.get(f"/api/demo/scenario/{key}")
        assert res.status_code == 200
        data = res.json()
        assert data["is_demo"] is True
        assert data["recommendation"] == expected_rec
        assert "DEMO DATA" in data["label"]
        assert len(data["evidence_list"]) > 0
        assert len(data["limitations"]) > 0

def test_demo_scenario_quarantine_integrity():
    res = client.get("/api/demo/scenario/quarantine")
    assert res.status_code == 200
    data = res.json()
    assert data["model_integrity"]["hash_match"] is False
    assert data["inference_chain"]["chain_status"] == "TAMPERING DETECTED"
    assert data["dataset_health"]["recommendation"] == "QUARANTINE"

def test_demo_scenario_report_html():
    res = client.get("/api/demo/report/export/html/review")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "VisionShield Assurance Report" in res.text
    assert "DEMO DATA" in res.text
