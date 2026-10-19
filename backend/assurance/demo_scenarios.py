"""
VisionShield - Demo Scenarios Provider
Deterministic, local simulated demonstration data for Hackathon presentation.
Clearly labeled as DEMO DATA / SIMULATED DEMONSTRATION DATA.

Scenarios:
1. SCENARIO 1 — TRUSTED ("Trusted System")
   - Dataset: normal
   - Model: hash matches
   - Inference: chain valid
   - Result: ACCEPT

2. SCENARIO 2 — REVIEW ("Suspicious Dataset")
   - Dataset: some duplicates/anomalies
   - Model: verified
   - Distribution: shift detected
   - Result: REVIEW

3. SCENARIO 3 — QUARANTINE ("Compromised Pipeline")
   - Dataset: suspicious anomalies
   - Model: hash mismatch
   - Inference: tampering detected
   - Result: QUARANTINE
"""

from typing import Dict, Any

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "trusted": {
        "id": "scenario-1-trusted",
        "key": "trusted",
        "name": "Trusted System",
        "description": "Baseline operational integrity. Validated dataset, verified baseline model, unbroken cryptographic audit trail.",
        "label": "DEMO DATA • SIMULATED TRUSTED BASELINE",
        "is_demo": True,
        "recommendation": "ACCEPT",
        "overall_risk": 8.0,
        "confidence": 0.98,
        "component_scores": {
            "dataset": 5.0,
            "model": 0.0,
            "behaviour": 5.0,
            "distribution": 10.0,
            "inference": 0.0
        },
        "dataset_health": {
            "dataset_name": "[DEMO DATA] baseline_factory_qc_v1.zip",
            "total_images": 250,
            "valid_images": 250,
            "duplicate_count": 0,
            "near_duplicate_count": 0,
            "anomaly_count": 0,
            "dataset_risk_score": 5.0,
            "recommendation": "ACCEPT",
            "suspicious_samples": [],
            "evidence": [
                "Scanned 250 factory inspection frames with 0 duplicate SHA-256 hashes.",
                "Perceptual dHash dispersion indicates balanced sample diversity.",
                "Luminance, aspect ratios, and dimensions adhere strictly to nominal standards."
            ],
            "limitations": [
                "[DEMO DATA] Statistical uniformity confirms baseline hygiene but does not guarantee absence of hidden watermarks."
            ]
        },
        "model_integrity": {
            "model_name": "[DEMO DATA] YOLOv8x_Defect_Detector.onnx",
            "model_format": "ONNX",
            "integrity_status": "VERIFIED",
            "hash_match": True,
            "expected_hash": "5e45b0b646ca2e607603f696b0354f4206dffa50fd322b3cb2acfa47bb603f63",
            "received_hash": "5e45b0b646ca2e607603f696b0354f4206dffa50fd322b3cb2acfa47bb603f63",
            "risk_score": 0.0,
            "recommendation": "ACCEPT",
            "evidence": "Candidate model SHA-256 matches verified golden vault baseline perfectly. Zero byte mutations detected.",
            "limitations": "[DEMO DATA] Hash verification guarantees file identity against baseline but does not verify runtime accuracy."
        },
        "inference_chain": {
            "chain_status": "VERIFIED",
            "total_records": 50,
            "verified_records": 50,
            "tampered_records": [],
            "replay_warnings": 0,
            "cryptographic_linkage": "INPUT -> MODEL -> CONFIGURATION -> OUTPUT",
            "evidence": "Cryptographic hash chain validated across all 50 sequential inference records. No tampering or replays detected.",
            "limitations": "[DEMO DATA] Audit chain ensures sequential data integrity; assumes secure ledger storage."
        },
        "distribution_shift": {
            "distribution_shift_score": 10.0,
            "changed_features": [],
            "shift_status": "STABLE",
            "feature_comparisons": {
                "brightness": {"reference": {"mean": 112.5, "std": 1.2}, "operational": {"mean": 114.1, "std": 1.4}, "relative_change_pct": 1.4, "is_shifted": False},
                "width": {"reference": {"mean": 128.0, "std": 0.0}, "operational": {"mean": 128.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "height": {"reference": {"mean": 128.0, "std": 0.0}, "operational": {"mean": 128.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "aspect_ratio": {"reference": {"mean": 1.0, "std": 0.0}, "operational": {"mean": 1.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "file_size": {"reference": {"mean": 402.0, "std": 1.1}, "operational": {"mean": 404.2, "std": 1.3}, "relative_change_pct": 0.5, "is_shifted": False}
            },
            "embedding_shift": {
                "model_name": "YOLOv8x_Defect_Detector.onnx",
                "embedding_dim": 10,
                "cosine_distance": 0.002,
                "significant_latent_drift": False
            },
            "evidence": "All optical feature distributions and latent embeddings remain strictly within nominal reference tolerances.",
            "limitations": "[DEMO DATA] Statistical similarity demonstrates invariant input conditions between cohorts."
        },
        "evidence_list": [
            {
                "finding": "Dataset Baseline Cleanliness",
                "severity": "LOW",
                "evidence": "[DEMO DATA] 250 frames validated. 0 duplicate hashes, 0 perceptual collisions, 0 statistical outliers.",
                "confidence": 0.98,
                "limitation": "Uniformity does not prove complete absence of subtle semantic poisoning."
            },
            {
                "finding": "Cryptographic Model Baseline Match",
                "severity": "LOW",
                "evidence": "[DEMO DATA] Candidate SHA-256 matches trusted vault record 5e45b0... exactly.",
                "confidence": 0.99,
                "limitation": "Verifies byte-level integrity against known registered baseline."
            },
            {
                "finding": "Inference Audit Ledger Unbroken",
                "severity": "LOW",
                "evidence": "[DEMO DATA] 50 consecutive inference records cryptographically linked and intact.",
                "confidence": 0.99,
                "limitation": "Verifies tamper-evident sequencing of historical prediction records."
            }
        ],
        "limitations": [
            "DEMO DATA: This scenario is deterministically generated for live presentation purposes.",
            "All findings, hashes, and metrics are simulated to demonstrate normal operational state.",
            "Demonstration metrics confirm end-to-end evaluation pipeline readiness."
        ]
    },

    "review": {
        "id": "scenario-2-review",
        "key": "review",
        "name": "Suspicious Dataset",
        "description": "Operational anomalies detected. Duplicate images, luminance shift, and distributional drift require human operator review.",
        "label": "DEMO DATA • SIMULATED OPERATIONAL REVIEW",
        "is_demo": True,
        "recommendation": "REVIEW",
        "overall_risk": 44.5,
        "confidence": 0.91,
        "component_scores": {
            "dataset": 45.0,
            "model": 0.0,
            "behaviour": 35.0,
            "distribution": 65.0,
            "inference": 40.0
        },
        "dataset_health": {
            "dataset_name": "[DEMO DATA] twilight_operational_batch_04.zip",
            "total_images": 250,
            "valid_images": 250,
            "duplicate_count": 14,
            "near_duplicate_count": 8,
            "anomaly_count": 12,
            "dataset_risk_score": 45.0,
            "recommendation": "REVIEW",
            "suspicious_samples": [
                {"filename": "twilight_cam02_underexposed.png", "reason": "Potential statistical brightness anomaly (-62% luminance)", "requires_review": True},
                {"filename": "cam01_buffered_duplicate.png", "reason": "Possible exact SHA-256 duplicate (replay frame)", "requires_review": True},
                {"filename": "twilight_noise_speckle.png", "reason": "High-frequency sensor noise statistical outlier", "requires_review": True}
            ],
            "evidence": [
                "Identified 14 exact SHA-256 duplicate image frames indicating possible camera buffer replay.",
                "Perceptual dHash flagged 8 near-duplicate pairs with Hamming distance <= 5.",
                "12 frames identified as extreme statistical luminance outliers (>3 sigma deviation)."
            ],
            "limitations": [
                "[DEMO DATA] Potential anomalies flag statistical variance and do not establish intentional poisoning."
            ]
        },
        "model_integrity": {
            "model_name": "[DEMO DATA] YOLOv8x_Defect_Detector.onnx",
            "model_format": "ONNX",
            "integrity_status": "VERIFIED",
            "hash_match": True,
            "expected_hash": "5e45b0b646ca2e607603f696b0354f4206dffa50fd322b3cb2acfa47bb603f63",
            "received_hash": "5e45b0b646ca2e607603f696b0354f4206dffa50fd322b3cb2acfa47bb603f63",
            "risk_score": 0.0,
            "recommendation": "ACCEPT",
            "evidence": "Candidate model SHA-256 strictly matches registered baseline in SQLite vault. Model weights untampered.",
            "limitations": "[DEMO DATA] Model binary verified; however, downstream inference remains sensitive to input drift."
        },
        "inference_chain": {
            "chain_status": "VERIFIED",
            "total_records": 50,
            "verified_records": 50,
            "tampered_records": [],
            "replay_warnings": 14,
            "cryptographic_linkage": "INPUT -> MODEL -> CONFIGURATION -> OUTPUT",
            "evidence": "Cryptographic chain is unbroken, but 14 repeated input/output hash pairs triggered potential inference replay warnings.",
            "limitations": "[DEMO DATA] Replay warnings indicate duplicate operational queries; could be benign duplicate transmissions."
        },
        "distribution_shift": {
            "distribution_shift_score": 65.0,
            "changed_features": ["brightness", "file_size"],
            "shift_status": "HIGH_SHIFT",
            "feature_comparisons": {
                "brightness": {"reference": {"mean": 112.57, "std": 0.62}, "operational": {"mean": 47.22, "std": 1.68}, "relative_change_pct": -58.1, "ks_statistic": 1.0, "p_value": 0.0079, "is_shifted": True},
                "width": {"reference": {"mean": 128.0, "std": 0.0}, "operational": {"mean": 128.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "height": {"reference": {"mean": 128.0, "std": 0.0}, "operational": {"mean": 128.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "aspect_ratio": {"reference": {"mean": 1.0, "std": 0.0}, "operational": {"mean": 1.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "file_size": {"reference": {"mean": 400.4, "std": 0.8}, "operational": {"mean": 406.8, "std": 0.75}, "relative_change_pct": 1.6, "is_shifted": True}
            },
            "embedding_shift": {
                "model_name": "YOLOv8x_Defect_Detector.onnx",
                "embedding_dim": 10,
                "cosine_distance": 0.182,
                "significant_latent_drift": True
            },
            "evidence": "Potential brightness distribution shift detected: Reference brightness 112.57 -> Operational brightness 47.22 (-58.1% divergence, KS stat 1.0). Local ONNX latent embedding centroid drifted by 18.2%.",
            "limitations": "[DEMO DATA] Distribution shift measures statistical divergence; ambient lighting or weather changes frequently cause benign shift."
        },
        "evidence_list": [
            {
                "finding": "Dataset Variance & Potential Duplicates",
                "severity": "MEDIUM",
                "evidence": "[DEMO DATA] 14 exact duplicate frames and 12 statistical luminance anomalies flagged for manual review.",
                "confidence": 0.91,
                "limitation": "Statistically unusual samples indicate quality divergence but do not prove malicious tampering."
            },
            {
                "finding": "Potential Brightness Distribution Shift Detected",
                "severity": "HIGH",
                "evidence": "[DEMO DATA] Reference brightness mean 112.57 -> Operational mean 47.22 (-58.1% shift, KS p-val: 0.0079). Latent embedding drift: 18.2%.",
                "confidence": 0.92,
                "limitation": "Observed variation reflects twilight environmental conditions; does not prove an adversarial attack."
            },
            {
                "finding": "Inference Replay Warning",
                "severity": "MEDIUM",
                "evidence": "[DEMO DATA] 14 duplicate inference input hashes observed across audit ledger.",
                "confidence": 0.89,
                "limitation": "Duplicate queries may occur in redundant industrial camera failover configurations."
            }
        ],
        "limitations": [
            "DEMO DATA: This scenario is deterministically generated for live presentation purposes.",
            "Demonstrates the REVIEW recommendation boundary where model integrity is intact but operational inputs drift.",
            "Operator intervention is recommended to recalibrate lighting or prune duplicate frames."
        ]
    },

    "quarantine": {
        "id": "scenario-3-quarantine",
        "key": "quarantine",
        "name": "Compromised Pipeline",
        "description": "High-confidence security and integrity failure. Model hash mismatch, inference chain tampering detected, adversarial perturbations.",
        "label": "DEMO DATA • SIMULATED COMPROMISED QUARANTINE",
        "is_demo": True,
        "recommendation": "QUARANTINE",
        "overall_risk": 89.5,
        "confidence": 0.99,
        "component_scores": {
            "dataset": 80.0,
            "model": 95.0,
            "behaviour": 85.0,
            "distribution": 70.0,
            "inference": 95.0
        },
        "dataset_health": {
            "dataset_name": "[DEMO DATA] poisoned_adversarial_transfer.zip",
            "total_images": 250,
            "valid_images": 250,
            "duplicate_count": 38,
            "near_duplicate_count": 42,
            "anomaly_count": 67,
            "dataset_risk_score": 80.0,
            "recommendation": "QUARANTINE",
            "suspicious_samples": [
                {"filename": "adv_patch_corner_trigger.png", "reason": "Potential anomaly: High-contrast corner pixel cluster (adversarial trigger pattern)", "requires_review": True},
                {"filename": "trojan_gaussian_speckle.png", "reason": "High perceptual dHash divergence across identical label class", "requires_review": True},
                {"filename": "corrupted_weight_sample.png", "reason": "Statistical luminance variance exceeding 5 sigma", "requires_review": True}
            ],
            "evidence": [
                "Identified 67 statistical anomaly frames showing high-frequency periodic pixel perturbations.",
                "Perceptual dHash clustering revealed 42 near-duplicate synthetic permutations.",
                "Distribution exhibits heavy bimodal distribution typical of backdoor trigger insertions."
            ],
            "limitations": [
                "[DEMO DATA] High anomaly frequency strongly correlates with synthetic tampering or sensor corruption."
            ]
        },
        "model_integrity": {
            "model_name": "[DEMO DATA] YOLOv8x_Defect_Detector.onnx",
            "model_format": "ONNX",
            "integrity_status": "SUSPICIOUS",
            "hash_match": False,
            "expected_hash": "5e45b0b646ca2e607603f696b0354f4206dffa50fd322b3cb2acfa47bb603f63",
            "received_hash": "a87900b12fe9087c98b671a53920db1a86e7a2b9187340fc29815041a7d65bb2",
            "risk_score": 95.0,
            "recommendation": "QUARANTINE",
            "evidence": "CRITICAL MODEL HASH MISMATCH: Expected SHA-256 differs from candidate model SHA-256. Binary weights altered; possible Trojan or backdoor injection.",
            "limitations": "[DEMO DATA] Cryptographic hash mismatch proves file byte divergence; does not disclose internal semantic intent."
        },
        "inference_chain": {
            "chain_status": "TAMPERING DETECTED",
            "total_records": 50,
            "verified_records": 13,
            "tampered_records": [
                {
                    "record_id": 14,
                    "reason": "Cryptographic chain linkage broken. Recomputed record hash does not match stored block hash.",
                    "timestamp": "2026-09-11T09:44:12"
                }
            ],
            "replay_warnings": 28,
            "cryptographic_linkage": "INPUT -> MODEL -> CONFIGURATION -> OUTPUT",
            "evidence": "TAMPERING DETECTED at audit block #14! Previous record hash linkage violated. Stored output hash modified retroactively.",
            "limitations": "[DEMO DATA] Chain break proves modification of historical audit log records."
        },
        "distribution_shift": {
            "distribution_shift_score": 70.0,
            "changed_features": ["brightness", "aspect_ratio", "file_size"],
            "shift_status": "CRITICAL_SHIFT",
            "feature_comparisons": {
                "brightness": {"reference": {"mean": 112.57, "std": 0.62}, "operational": {"mean": 178.40, "std": 9.30}, "relative_change_pct": 58.5, "is_shifted": True},
                "width": {"reference": {"mean": 128.0, "std": 0.0}, "operational": {"mean": 128.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "height": {"reference": {"mean": 128.0, "std": 0.0}, "operational": {"mean": 128.0, "std": 0.0}, "relative_change_pct": 0.0, "is_shifted": False},
                "aspect_ratio": {"reference": {"mean": 1.0, "std": 0.0}, "operational": {"mean": 1.25, "std": 0.15}, "relative_change_pct": 25.0, "is_shifted": True},
                "file_size": {"reference": {"mean": 400.4, "std": 0.8}, "operational": {"mean": 542.1, "std": 14.2}, "relative_change_pct": 35.4, "is_shifted": True}
            },
            "embedding_shift": {
                "model_name": "YOLOv8x_Defect_Detector.onnx",
                "embedding_dim": 10,
                "cosine_distance": 0.435,
                "significant_latent_drift": True
            },
            "evidence": "Extreme distribution divergence and latent embedding dislocation (+43.5% cosine distance). Input feature geometry abnormal.",
            "limitations": "[DEMO DATA] Significant multi-feature shift concurrent with model mismatch indicates compromised sensor or asset stream."
        },
        "evidence_list": [
            {
                "finding": "Model Integrity Mismatch",
                "severity": "CRITICAL",
                "evidence": "[DEMO DATA] Candidate SHA-256 (a87900...) does not match golden baseline (5e45b0...). Model binary altered.",
                "confidence": 0.99,
                "limitation": "Hash mismatch proves binary divergence; indicates model supply-chain tampering."
            },
            {
                "finding": "Inference Chain Tampering Detected",
                "severity": "CRITICAL",
                "evidence": "[DEMO DATA] TAMPERING DETECTED at audit record #14. Output hashes altered retroactively.",
                "confidence": 0.99,
                "limitation": "Cryptographic proof of retroactive record alteration."
            },
            {
                "finding": "High Anomaly Concentration in Dataset",
                "severity": "HIGH",
                "evidence": "[DEMO DATA] 67 statistical anomalies and 42 near-duplicate synthetic permutations detected.",
                "confidence": 0.95,
                "limitation": "Strong statistical evidence of synthetic data perturbation or injection."
            }
        ],
        "limitations": [
            "DEMO DATA: This scenario is deterministically generated for live presentation purposes.",
            "Demonstrates the QUARANTINE fail-safe trigger across multiple independent cryptographic and statistical checkpoints.",
            "Automated fail-safe: All downstream inferences should be halted immediately."
        ]
    }
}

def get_demo_scenario(scenario_key: str) -> Dict[str, Any]:
    clean_key = scenario_key.lower().strip()
    if clean_key in ["1", "trusted", "trusted system", "scenario_1"]:
        return SCENARIOS["trusted"]
    elif clean_key in ["2", "review", "suspicious dataset", "scenario_2"]:
        return SCENARIOS["review"]
    elif clean_key in ["3", "quarantine", "compromised pipeline", "scenario_3"]:
        return SCENARIOS["quarantine"]
    return SCENARIOS["trusted"]
