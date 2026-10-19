import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app, SAMPLE_DATA_PATH

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert data["air_gapped"] is True
    print("Health check endpoint passed!")

def test_scan_sample_endpoint():
    res = client.post("/api/scan/sample")
    assert res.status_code == 200
    data = res.json()
    assert data["total_images"] == 6
    assert data["valid_images"] == 6
    assert data["duplicate_count"] >= 1
    assert data["near_duplicate_count"] >= 1
    assert data["anomaly_count"] >= 1
    assert "audit_record" in data
    assert "limitations" in data
    assert "evidence" in data
    print("Scan sample endpoint passed!")

def test_scan_zip_upload():
    assert SAMPLE_DATA_PATH.exists()
    with open(SAMPLE_DATA_PATH, "rb") as f:
        files = {"file": ("uploaded_test.zip", f, "application/zip")}
        res = client.post("/api/scan/dataset", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["total_images"] == 6
    assert "suspicious_samples" in data
    assert data["audit_record"]["target_artifact"] == "uploaded_test.zip"
    print("ZIP upload endpoint passed!")

def test_get_scans():
    res = client.get("/api/scans")
    assert res.status_code == 200
    scans = res.json()
    assert len(scans) >= 2
    assert "scan_code" in scans[0]
    assert "sha256" in scans[0]
    print(f"Get scans endpoint passed with {len(scans)} records!")

if __name__ == "__main__":
    test_health_endpoint()
    test_scan_sample_endpoint()
    test_scan_zip_upload()
    test_get_scans()
