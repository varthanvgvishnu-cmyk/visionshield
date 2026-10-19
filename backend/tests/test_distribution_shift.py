"""
Unit tests for Feature 5: Distribution Shift Analysis
Tests:
- Extraction of image statistics (brightness, width, height, aspect ratio, file size)
- Detection of distribution shifts on synthetic shifted datasets
- Conservative non-accusatory evidence reporting
- Endpoints: POST /api/shift/sample, POST /api/shift/analyze, GET /api/shift/latest
"""
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from assurance.distribution_shift import DistributionShiftAnalyzer
from main import app

client = TestClient(app)

def test_distribution_shift_analyzer_logic():
    ref_dir = Path(__file__).resolve().parents[1] / "sample_data" / "temp_reference_images"
    op_dir = Path(__file__).resolve().parents[1] / "sample_data" / "temp_operational_images"
    model_path = Path(__file__).resolve().parents[1] / "sample_data" / "YOLOv8x_Defect_Detector.onnx"

    ref_files = list(ref_dir.glob("*.png"))
    op_files = list(op_dir.glob("*.png"))

    assert len(ref_files) > 0, "Reference images must exist"
    assert len(op_files) > 0, "Operational images must exist"

    analyzer = DistributionShiftAnalyzer(model_path=model_path)
    result = analyzer.analyze_shift(ref_files, op_files)

    # 1. Structure check
    assert "distribution_shift_score" in result
    assert "changed_features" in result
    assert "evidence" in result
    assert "confidence" in result
    assert "limitations" in result
    assert "feature_comparisons" in result
    assert "embedding_shift" in result

    # 2. Brightness shifted
    assert "brightness" in result["changed_features"]
    assert result["distribution_shift_score"] > 0

    # 3. Non-accusatory wording verification
    evidence_text = " ".join([e["evidence"] for e in result["evidence"]])
    assert "Potential brightness distribution shift detected" in [e["finding"] for e in result["evidence"]]

    limitations_text = " ".join(result["limitations"])
    assert "does not prove an attack" in limitations_text


def test_api_shift_sample_endpoint():
    response = client.post("/api/shift/sample")
    assert response.status_code == 200
    data = response.json()

    assert "distribution_shift_score" in data
    assert "changed_features" in data
    assert "evidence" in data
    assert len(data["evidence"]) > 0
    assert data["reference_count"] > 0
    assert data["operational_count"] > 0


def test_api_shift_latest_endpoint():
    response = client.get("/api/shift/latest")
    assert response.status_code == 200
    data = response.json()
    assert "distribution_shift_score" in data
    assert "changed_features" in data


def test_api_shift_analyze_empty():
    response = client.post("/api/shift/analyze")
    assert response.status_code == 400