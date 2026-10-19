import sys
import zipfile
import tempfile
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from assurance.dataset_scanner import DatasetScanner

def test_dataset_scanner_on_samples():
    scanner = DatasetScanner(near_dup_threshold=6)
    sample_zip = Path(__file__).resolve().parent.parent / "sample_data" / "sample_cv_dataset.zip"
    assert sample_zip.exists(), f"Sample zip not found: {sample_zip}"

    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(sample_zip, "r") as z:
            z.extractall(tmpdir)
        
        extracted_files = list(Path(tmpdir).glob("*.png"))
        assert len(extracted_files) == 6, f"Expected 6 files, got {len(extracted_files)}"

        results = scanner.scan_files(extracted_files)

        # Check required fields
        required_keys = [
            "total_images",
            "valid_images",
            "duplicate_count",
            "near_duplicate_count",
            "anomaly_count",
            "suspicious_samples",
            "dataset_risk_score",
            "confidence",
            "evidence",
            "limitations"
        ]
        for key in required_keys:
            assert key in results, f"Missing required key: {key}"

        assert results["total_images"] == 6
        assert results["valid_images"] == 6
        assert results["duplicate_count"] >= 1, "Should detect exact SHA-256 duplicate"
        assert results["near_duplicate_count"] >= 1, "Should detect near duplicate"
        assert results["anomaly_count"] >= 1, "Should detect statistical brightness anomaly"
        assert len(results["suspicious_samples"]) >= 1

        # Check cautious terminology
        result_text = str(results)
        assert "definitely poisoned" not in result_text.lower()
        
        # Verify status tags
        for s in results["suspicious_samples"]:
            assert s["status"] == "Requires review"
            for flag in s["flags"]:
                assert "Potential anomaly" in flag or "Possible duplicate" in flag or "Requires review" in flag

        # Check image statistics fields in suspicious samples
        sample0 = results["suspicious_samples"][0]
        stats = sample0["statistics"]
        for stat_key in ["width", "height", "aspect_ratio", "brightness", "file_size"]:
            assert stat_key in stats, f"Missing stat key {stat_key}"

        print("Test passed successfully!")

if __name__ == "__main__":
    test_dataset_scanner_on_samples()
