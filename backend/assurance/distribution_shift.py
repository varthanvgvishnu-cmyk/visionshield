"""
VisionShield Feature 5: Basic Distribution Shift Analysis
Compares a reference dataset against a new operational dataset.
Computes image-level statistics (brightness, width, height, aspect ratio, file size),
statistical drift metrics, and local ONNX image embeddings.
Everything operates 100% offline.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from PIL import Image
from scipy import stats
import onnx
from onnx.reference import ReferenceEvaluator

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}

class DistributionShiftAnalyzer:
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path
        self._evaluator = None
        if model_path and model_path.exists():
            try:
                onnx_model = onnx.load(str(model_path))
                self._evaluator = ReferenceEvaluator(onnx_model)
            except Exception as e:
                print(f"[WARN] Failed to initialize local ONNX evaluator: {e}")
                self._evaluator = None

    def extract_image_features(self, path: Path) -> Optional[Dict[str, Any]]:
        """Extracts simple image-level statistics and optional ONNX embedding."""
        if not path.exists() or path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            return None

        try:
            file_size = path.stat().st_size
            with Image.open(path) as img:
                width, height = img.size
                aspect_ratio = round(width / height, 4) if height > 0 else 0.0

                # Compute mean brightness in grayscale [0, 255]
                gray = img.convert("L")
                gray_arr = np.asarray(gray, dtype=np.float32)
                brightness = round(float(np.mean(gray_arr)), 2)

                # Prepare for embedding extraction if evaluator available
                embedding = None
                if self._evaluator is not None:
                    try:
                        # Resize to standard 224x224 and normalize to [0, 1] RGB NCHW
                        rgb = img.convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
                        rgb_arr = np.asarray(rgb, dtype=np.float32) / 255.0
                        rgb_nchw = np.transpose(rgb_arr, (2, 0, 1))
                        rgb_input = np.expand_dims(rgb_nchw, axis=0)

                        # Run local reference evaluator
                        outputs = self._evaluator.run(None, {"image_input": rgb_input})
                        if outputs and len(outputs) > 0:
                            emb = outputs[0]
                            if isinstance(emb, np.ndarray):
                                embedding = emb.flatten().tolist()
                    except Exception as emb_err:
                        print(f"[WARN] Embedding extraction error for {path.name}: {emb_err}")

            return {
                "filename": path.name,
                "brightness": brightness,
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio,
                "file_size": file_size,
                "embedding": embedding
            }
        except Exception as ex:
            print(f"[WARN] Failed to process image {path.name}: {ex}")
            return None

    def extract_dataset_features(self, file_paths: List[Path]) -> List[Dict[str, Any]]:
        """Extracts features for all images in a dataset."""
        features = []
        for p in file_paths:
            feat = self.extract_image_features(p)
            if feat is not None:
                features.append(feat)
        return features

    def compute_feature_distribution(self, values: List[float]) -> Dict[str, float]:
        """Calculates mean, std, median, min, max for a feature array."""
        if not values:
            return {"mean": 0.0, "std": 0.0, "median": 0.0, "min": 0.0, "max": 0.0, "count": 0}
        arr = np.array(values, dtype=np.float64)
        return {
            "mean": round(float(np.mean(arr)), 2),
            "std": round(float(np.std(arr)), 2),
            "median": round(float(np.median(arr)), 2),
            "min": round(float(np.min(arr)), 2),
            "max": round(float(np.max(arr)), 2),
            "count": len(values)
        }

    def analyze_shift(
        self,
        reference_files: List[Path],
        operational_files: List[Path]
    ) -> Dict[str, Any]:
        """
        Compares reference dataset against operational dataset.
        Returns:
            - distribution_shift_score (0 - 100)
            - changed_features (list of flagged features)
            - evidence (list of structured findings)
            - confidence (float)
            - limitations (list of strings)
        """
        ref_data = self.extract_dataset_features(reference_files)
        op_data = self.extract_dataset_features(operational_files)

        if len(ref_data) == 0 or len(op_data) == 0:
            return {
                "distribution_shift_score": 0.0,
                "changed_features": [],
                "evidence": [{
                    "finding": "Insufficient dataset samples",
                    "severity": "LOW",
                    "evidence": f"Reference images: {len(ref_data)}, Operational images: {len(op_data)}. Minimum 1 valid image required.",
                    "confidence": 0.50,
                    "limitation": "Statistical distribution comparison requires at least one valid image per partition."
                }],
                "confidence": 0.50,
                "limitations": [
                    "Analysis requires valid images in both reference and operational datasets.",
                    "Distribution shift does not prove an adversarial attack."
                ],
                "feature_comparisons": {},
                "reference_count": len(ref_data),
                "operational_count": len(op_data),
                "embedding_shift": None
            }

        tracked_features = ["brightness", "width", "height", "aspect_ratio", "file_size"]
        feature_comparisons: Dict[str, Any] = {}
        changed_features: List[str] = []
        evidence_list: List[Dict[str, Any]] = []

        total_shift_impact = 0.0
        max_possible_impact = 0.0

        feature_weights = {
            "brightness": 25.0,
            "width": 15.0,
            "height": 15.0,
            "aspect_ratio": 15.0,
            "file_size": 15.0
        }

        for feat in tracked_features:
            ref_vals = [d[feat] for d in ref_data]
            op_vals = [d[feat] for d in op_data]

            ref_dist = self.compute_feature_distribution(ref_vals)
            op_dist = self.compute_feature_distribution(op_vals)

            # Compute relative mean shift percentage
            ref_mean = ref_dist["mean"]
            op_mean = op_dist["mean"]
            
            denom = abs(ref_mean) if abs(ref_mean) > 1e-4 else 1.0
            mean_diff = op_mean - ref_mean
            rel_change_pct = round((mean_diff / denom) * 100.0, 1)

            # Perform 2-sample Kolmogorov-Smirnov test if enough samples
            p_value = 1.0
            ks_stat = 0.0
            if len(ref_vals) >= 2 and len(op_vals) >= 2:
                try:
                    ks_res = stats.ks_2samp(ref_vals, op_vals)
                    ks_stat = round(float(ks_res.statistic), 4)
                    p_value = round(float(ks_res.pvalue), 4)
                except Exception:
                    p_value = 1.0

            weight = feature_weights[feat]
            max_possible_impact += weight

            # Significant shift if relative change > 25% or (ks_stat >= 0.5 and p_value < 0.05)
            is_shifted = abs(rel_change_pct) >= 25.0 or (ks_stat >= 0.5 and p_value < 0.05)

            if is_shifted:
                changed_features.append(feat)
                severity = "HIGH" if abs(rel_change_pct) >= 50.0 else "MEDIUM"
                shift_contrib = weight * min(1.0, abs(rel_change_pct) / 60.0)
                total_shift_impact += shift_contrib

                evidence_list.append({
                    "finding": f"Potential {feat} distribution shift detected",
                    "severity": severity,
                    "evidence": (
                        f"Reference {feat} mean: {ref_mean} (std: {ref_dist['std']}) -> "
                        f"Operational {feat} mean: {op_mean} (std: {op_dist['std']}). "
                        f"Relative divergence: {rel_change_pct:+.1f}% (KS statistic: {ks_stat}, p-value: {p_value})."
                    ),
                    "confidence": round(min(0.98, 0.70 + (0.28 * min(1.0, len(ref_vals) / 10.0))), 2),
                    "limitation": f"Observed {feat} variation reflects operational/environmental changes and does not prove malicious manipulation."
                })
            else:
                total_shift_impact += (abs(rel_change_pct) / 25.0) * (weight * 0.2)

            feature_comparisons[feat] = {
                "reference": ref_dist,
                "operational": op_dist,
                "relative_change_pct": rel_change_pct,
                "ks_statistic": ks_stat,
                "p_value": p_value,
                "is_shifted": is_shifted
            }

        # Embedding comparison (latent visual drift)
        embedding_shift = None
        ref_embs = [d["embedding"] for d in ref_data if d["embedding"] is not None]
        op_embs = [d["embedding"] for d in op_data if d["embedding"] is not None]

        if ref_embs and op_embs:
            ref_centroid = np.mean(np.array(ref_embs, dtype=np.float32), axis=0)
            op_centroid = np.mean(np.array(op_embs, dtype=np.float32), axis=0)

            norm_ref = np.linalg.norm(ref_centroid)
            norm_op = np.linalg.norm(op_centroid)
            if norm_ref > 1e-6 and norm_op > 1e-6:
                cosine_sim = float(np.dot(ref_centroid, op_centroid) / (norm_ref * norm_op))
                cosine_dist = round(float(1.0 - cosine_sim), 4)
            else:
                cosine_dist = 0.0

            max_possible_impact += 15.0
            is_emb_shifted = cosine_dist > 0.15
            embedding_shift = {
                "model_name": self.model_path.name if self.model_path else "Local ONNX Model",
                "embedding_dim": len(ref_centroid),
                "cosine_distance": cosine_dist,
                "significant_latent_drift": is_emb_shifted
            }

            if is_emb_shifted:
                changed_features.append("latent_embeddings")
                emb_contrib = 15.0 * min(1.0, (cosine_dist - 0.15) / 0.35)
                total_shift_impact += emb_contrib
                evidence_list.append({
                    "finding": "Potential latent embedding representation shift detected",
                    "severity": "MEDIUM",
                    "evidence": f"Local model ({self.model_path.name if self.model_path else 'ONNX'}) feature representations drifted by cosine distance: {cosine_dist}.",
                    "confidence": 0.88,
                    "limitation": "Embedding drift captures semantic/feature divergence; lighting and camera position shifts can also induce representation drift."
                })
        else:
            embedding_shift = {
                "model_name": "N/A (ReferenceEvaluator not invoked)",
                "embedding_dim": 0,
                "cosine_distance": 0.0,
                "significant_latent_drift": False
            }

        distribution_shift_score = round(min(100.0, (total_shift_impact / max(1.0, max_possible_impact)) * 100.0), 1)

        min_samples = min(len(ref_data), len(op_data))
        if min_samples >= 10:
            confidence = 0.95
        elif min_samples >= 5:
            confidence = 0.88
        elif min_samples >= 2:
            confidence = 0.78
        else:
            confidence = 0.65

        if not changed_features:
            evidence_list.append({
                "finding": "Distribution stability verified across all tracked features",
                "severity": "LOW",
                "evidence": f"Operational dataset characteristics closely track reference baseline across {len(tracked_features)} image statistics.",
                "confidence": confidence,
                "limitation": "Subtle localized trigger patches or high-frequency watermark perturbations may not register on summary statistics."
            })

        limitations = [
            "Distribution shift measures statistical divergence between reference and operational cohorts.",
            "Distribution shift does not prove an attack or malicious data poisoning; ambient lighting, camera repositioning, or seasonal factors frequently cause benign distribution shifts.",
            "All metrics computed 100% offline without remote cloud telemetry."
        ]

        return {
            "distribution_shift_score": distribution_shift_score,
            "changed_features": changed_features,
            "feature_comparisons": feature_comparisons,
            "embedding_shift": embedding_shift,
            "reference_count": len(ref_data),
            "operational_count": len(op_data),
            "evidence": evidence_list,
            "confidence": confidence,
            "limitations": limitations
        }