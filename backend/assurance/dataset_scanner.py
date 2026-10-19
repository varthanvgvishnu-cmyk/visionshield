"""
VisionShield - Dataset Assurance Scanner
Offline Computer Vision Integrity & Quality Assurance Engine
Feature 1: Dataset Assurance Scanner
"""

import hashlib
import os
import math
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
from PIL import Image
import imagehash
import numpy as np


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".tif"}


def compute_sha256(file_path: Path) -> str:
    """Computes SHA-256 hash of file content in chunks."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


class DatasetScanner:
    """
    Scans a collection of image files for integrity, exact duplicates (SHA-256),
    near duplicates (perceptual hashing), and statistical anomalies.
    """

    def __init__(self, near_dup_threshold: int = 6):
        self.near_dup_threshold = near_dup_threshold

    def scan_files(self, file_paths: List[Path]) -> Dict[str, Any]:
        """
        Executes complete offline assurance scan across the supplied image file paths.
        """
        total_images = len(file_paths)
        valid_images_data: List[Dict[str, Any]] = []
        invalid_files: List[Dict[str, Any]] = []

        # 1. Inspect supported files and compute hashes & stats
        for path in file_paths:
            ext = path.suffix.lower()
            file_size = path.stat().st_size if path.exists() else 0

            if ext not in SUPPORTED_EXTENSIONS:
                invalid_files.append({
                    "filename": path.name,
                    "reason": f"Unsupported format '{ext}' (supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))})",
                    "file_size": file_size
                })
                continue

            try:
                sha256_hash = compute_sha256(path)
                with Image.open(path) as img:
                    img_format = img.format or ext.replace(".", "").upper()
                    width, height = img.size
                    aspect_ratio = round(width / height, 4) if height > 0 else 0.0

                    # Convert to grayscale to compute mean brightness
                    gray = img.convert("L")
                    gray_arr = np.asarray(gray, dtype=np.float32)
                    brightness = round(float(np.mean(gray_arr)), 2)

                    # Compute perceptual hash (dHash)
                    phash_val = str(imagehash.dhash(img))

                valid_images_data.append({
                    "filename": path.name,
                    "path": str(path),
                    "sha256": sha256_hash,
                    "phash": phash_val,
                    "format": img_format,
                    "width": width,
                    "height": height,
                    "aspect_ratio": aspect_ratio,
                    "brightness": brightness,
                    "file_size": file_size,
                    "flags": [],
                    "status": "ACCEPT",
                    "requires_review": False
                })
            except Exception as ex:
                invalid_files.append({
                    "filename": path.name,
                    "reason": f"Corrupted or unreadable image: {str(ex)}",
                    "file_size": file_size
                })

        valid_count = len(valid_images_data)

        # 2. Exact duplicate detection using SHA-256
        sha_groups: Dict[str, List[Dict[str, Any]]] = {}
        for item in valid_images_data:
            sha_groups.setdefault(item["sha256"], []).append(item)

        exact_duplicate_files: set = set()
        for h, group in sha_groups.items():
            if len(group) > 1:
                first_name = group[0]["filename"]
                for idx, g in enumerate(group):
                    if idx > 0:
                        exact_duplicate_files.add(g["filename"])
                        g["flags"].append(f"Possible duplicate: Exact SHA-256 match with {first_name}")
                        g["requires_review"] = True
                        g["status"] = "Requires review"

        # 3. Near duplicate detection using Perceptual Hash
        near_duplicate_pairs: List[Dict[str, Any]] = []
        near_duplicate_files: set = set()
        for i in range(valid_count):
            for j in range(i + 1, valid_count):
                item_a = valid_images_data[i]
                item_b = valid_images_data[j]

                # Skip if already identified as exact duplicate
                if item_a["sha256"] == item_b["sha256"]:
                    continue

                try:
                    hash_a = imagehash.hex_to_hash(item_a["phash"])
                    hash_b = imagehash.hex_to_hash(item_b["phash"])
                    dist = int(hash_a - hash_b)
                    if dist <= self.near_dup_threshold:
                        near_duplicate_pairs.append({
                            "image_a": item_a["filename"],
                            "image_b": item_b["filename"],
                            "hamming_distance": dist,
                            "threshold": self.near_dup_threshold
                        })
                        item_b["flags"].append(
                            f"Possible duplicate: Near-duplicate perceptual match with {item_a['filename']} (Hamming distance: {dist})"
                        )
                        item_b["requires_review"] = True
                        item_b["status"] = "Requires review"
                        near_duplicate_files.add(item_b["filename"])
                except Exception:
                    pass

        # 4. Statistical anomaly detection
        anomaly_files: set = set()
        metric_keys = ["brightness", "aspect_ratio", "file_size", "width", "height"]
        stats_summary: Dict[str, Dict[str, float]] = {}

        if valid_count >= 3:
            for key in metric_keys:
                vals = [float(item[key]) for item in valid_images_data]
                mean_val = float(np.mean(vals))
                std_val = float(np.std(vals))
                min_val = float(np.min(vals))
                max_val = float(np.max(vals))
                stats_summary[key] = {
                    "mean": round(mean_val, 2),
                    "std": round(std_val, 2),
                    "min": round(min_val, 2),
                    "max": round(max_val, 2)
                }

                # Flag entries with |z| >= 2.2 if std > 1e-4
                if std_val > 1e-4:
                    for item in valid_images_data:
                        val = float(item[key])
                        z_score = abs(val - mean_val) / std_val
                        if z_score >= 2.2:
                            anomaly_files.add(item["filename"])
                            item["flags"].append(
                                f"Potential anomaly: Unusual {key.replace('_', ' ')} ({val} vs dataset mean {round(mean_val, 2)}, z={round(z_score, 2)})"
                            )
                            item["requires_review"] = True
                            item["status"] = "Requires review"
        elif valid_count > 0:
            for key in metric_keys:
                vals = [float(item[key]) for item in valid_images_data]
                stats_summary[key] = {
                    "mean": round(float(np.mean(vals)), 2),
                    "std": round(float(np.std(vals)), 2),
                    "min": round(float(np.min(vals)), 2),
                    "max": round(float(np.max(vals)), 2)
                }

        # 5. Compile suspicious samples
        suspicious_samples = []
        for item in valid_images_data:
            if item["requires_review"]:
                suspicious_samples.append({
                    "filename": item["filename"],
                    "sha256": item["sha256"],
                    "status": "Requires review",
                    "flags": item["flags"],
                    "statistics": {
                        "width": item["width"],
                        "height": item["height"],
                        "aspect_ratio": item["aspect_ratio"],
                        "brightness": item["brightness"],
                        "file_size": item["file_size"]
                    }
                })

        for inv in invalid_files:
            suspicious_samples.append({
                "filename": inv["filename"],
                "sha256": "N/A",
                "status": "Requires review",
                "flags": [f"Potential anomaly: {inv['reason']}"],
                "statistics": {
                    "width": 0,
                    "height": 0,
                    "aspect_ratio": 0.0,
                    "brightness": 0.0,
                    "file_size": inv["file_size"]
                }
            })

        # 6. Calculate dataset risk score (0.0 to 100.0)
        duplicate_count = len(exact_duplicate_files)
        near_duplicate_count = len(near_duplicate_files)
        anomaly_count = len(anomaly_files) + len(invalid_files)

        if valid_count > 0:
            dup_ratio = duplicate_count / valid_count
            near_dup_ratio = near_duplicate_count / valid_count
            anomaly_ratio = len(anomaly_files) / valid_count
            invalid_ratio = len(invalid_files) / total_images if total_images > 0 else 0.0

            raw_score = (dup_ratio * 30.0) + (near_dup_ratio * 25.0) + (anomaly_ratio * 35.0) + (invalid_ratio * 40.0)
            dataset_risk_score = round(min(100.0, raw_score * 100 / 50.0), 1)
        else:
            dataset_risk_score = 100.0 if total_images > 0 else 0.0

        # Confidence level
        if valid_count >= 30:
            confidence = "High"
        elif valid_count >= 10:
            confidence = "Moderate"
        elif valid_count >= 3:
            confidence = "Low"
        else:
            confidence = "Preliminary (insufficient sample size)"

        # Evidence accumulation
        evidence: List[str] = []
        if duplicate_count > 0:
            evidence.append(f"Identified {duplicate_count} exact duplicate image(s) sharing identical SHA-256 cryptographic digests.")
        else:
            evidence.append("Zero exact SHA-256 duplicate images found across inspected set.")

        if near_duplicate_count > 0:
            evidence.append(
                f"Identified {near_duplicate_count} near-duplicate image(s) with perceptual dHash Hamming distance <= {self.near_dup_threshold}."
            )
        else:
            evidence.append("No near-duplicate images detected within perceptual threshold.")

        if len(anomaly_files) > 0:
            evidence.append(
                f"Flagged {len(anomaly_files)} potential statistical anomaly image(s) exhibiting >= 2.2 standard deviations in brightness, dimensions, or aspect ratio."
            )
        else:
            evidence.append("All valid images reside within standard statistical distribution bounds.")

        if len(invalid_files) > 0:
            evidence.append(f"Encountered {len(invalid_files)} invalid or unsupported file(s) in upload package.")

        evidence.append(f"Baseline statistics computed: mean brightness {stats_summary.get('brightness', {}).get('mean', 0.0)}, mean aspect ratio {stats_summary.get('aspect_ratio', {}).get('mean', 0.0)}.")

        # Limitations statement
        limitations: List[str] = [
            "Statistical anomaly detection highlights variance in pixel luminance, aspect ratio, and resolution; a flagged 'Potential anomaly' requires review and does not constitute definitive proof of data poisoning or adversarial tampering.",
            f"Perceptual hash near-duplicate detection uses dHash with threshold Hamming distance <= {self.near_dup_threshold}; extreme crops, heavy rotation, or non-linear geometric warping may avoid detection.",
            "All computations run 100% locally and offline without external threat intelligence lookups or network transmission.",
            "Datasets with fewer than 10 images have reduced statistical power for distribution anomaly estimation."
        ]

        overall_recommendation = "ACCEPT"
        if dataset_risk_score >= 50.0 or len(invalid_files) > 0:
            overall_recommendation = "QUARANTINE"
        elif dataset_risk_score > 0.0 or duplicate_count > 0 or near_duplicate_count > 0 or anomaly_count > 0:
            overall_recommendation = "REVIEW"

        return {
            "total_images": total_images,
            "valid_images": valid_count,
            "duplicate_count": duplicate_count,
            "near_duplicate_count": near_duplicate_count,
            "anomaly_count": anomaly_count,
            "suspicious_samples": suspicious_samples,
            "dataset_risk_score": dataset_risk_score,
            "confidence": confidence,
            "evidence": evidence,
            "limitations": limitations,
            "overall_recommendation": overall_recommendation,
            "statistics_summary": stats_summary,
            "all_samples": [
                {
                    "filename": item["filename"],
                    "sha256": item["sha256"],
                    "status": item["status"],
                    "flags": item["flags"],
                    "width": item["width"],
                    "height": item["height"],
                    "aspect_ratio": item["aspect_ratio"],
                    "brightness": item["brightness"],
                    "file_size": item["file_size"]
                }
                for item in valid_images_data
            ]
        }
