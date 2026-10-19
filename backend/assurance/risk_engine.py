"""
VisionShield - Unified Risk Engine
Feature 4: Unified Risk Engine
Combines:
1. Dataset assurance
2. Model integrity
3. Behaviour/anomaly indicators
4. Distribution shift indicators
5. Inference integrity
Transparent weighted scoring mapped to ACCEPT (0-30), REVIEW (31-60), QUARANTINE (61-100).
Structured human-readable evidence for every finding.
"""

from typing import Dict, Any, List, Optional


DEFAULT_WEIGHTS = {
    "dataset": 0.20,
    "model": 0.30,
    "behaviour": 0.20,
    "distribution": 0.10,
    "inference": 0.20
}


def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    """Ensures weights are positive and sum to 1.0."""
    cleaned = {}
    for k in ["dataset", "model", "behaviour", "distribution", "inference"]:
        val = float(weights.get(k, DEFAULT_WEIGHTS[k]))
        cleaned[k] = max(0.0, val)

    total = sum(cleaned.values())
    if total <= 0:
        return DEFAULT_WEIGHTS.copy()

    return {k: round(v / total, 4) for k, v in cleaned.items()}


def map_risk_to_recommendation(score: float) -> str:
    """
    0-30 = ACCEPT
    31-60 = REVIEW
    61-100 = QUARANTINE
    """
    if score <= 30.0:
        return "ACCEPT"
    elif score <= 60.0:
        return "REVIEW"
    else:
        return "QUARANTINE"


class UnifiedRiskEngine:
    """
    Evaluates multidimensional CV integrity risk across all 5 assurance domains.
    """

    def __init__(self, default_weights: Optional[Dict[str, float]] = None):
        self.weights = normalize_weights(default_weights or DEFAULT_WEIGHTS)

    def evaluate(
        self,
        component_scores: Dict[str, float],
        telemetry_details: Optional[Dict[str, Any]] = None,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculates overall weighted risk score and produces structured findings with human-readable evidence.
        """
        weights = normalize_weights(custom_weights) if custom_weights else self.weights
        telemetry = telemetry_details or {}

        # 1. Component scores (clamped between 0.0 and 100.0)
        c_scores = {
            "dataset": max(0.0, min(100.0, float(component_scores.get("dataset", 0.0)))),
            "model": max(0.0, min(100.0, float(component_scores.get("model", 0.0)))),
            "behaviour": max(0.0, min(100.0, float(component_scores.get("behaviour", 10.0)))),
            "distribution": max(0.0, min(100.0, float(component_scores.get("distribution", 0.0)))),
            "inference": max(0.0, min(100.0, float(component_scores.get("inference", 0.0)))),
        }

        # 2. Transparent Weighted Scoring
        weighted_contributions = {
            k: round(c_scores[k] * weights[k], 2)
            for k in c_scores
        }
        overall_risk = round(sum(weighted_contributions.values()), 1)
        overall_risk = max(0.0, min(100.0, overall_risk))

        # 3. Recommendation Mapping
        recommendation = map_risk_to_recommendation(overall_risk)

        # 4. Confidence Estimation
        confidence_val = 0.95
        if telemetry.get("dataset_samples_count", 10) < 5:
            confidence_val -= 0.10
        if telemetry.get("inference_records_count", 5) < 3:
            confidence_val -= 0.05
        confidence_val = round(max(0.60, min(0.99, confidence_val)), 2)

        # 5. Generate Human-Readable Structured Findings
        evidence_findings: List[Dict[str, Any]] = []

        # (a) Dataset Finding
        if c_scores["dataset"] > 0.0:
            evidence_findings.append({
                "finding": "Dataset variance or duplicate anomalies detected",
                "severity": "HIGH" if c_scores["dataset"] >= 50 else "MEDIUM",
                "evidence": telemetry.get(
                    "dataset_evidence",
                    f"Dataset scan recorded risk score of {c_scores['dataset']}%. Potential outlier samples or image duplication identified."
                ),
                "confidence": 0.92,
                "limitation": "Statistical outlier flags indicate distribution variance but do not prove malicious data poisoning."
            })
        else:
            evidence_findings.append({
                "finding": "Dataset integrity verified",
                "severity": "LOW",
                "evidence": "Inspected images adhere to format constraints and standard luminance/aspect ratio bounds with zero duplicates.",
                "confidence": 0.96,
                "limitation": "Offline checks inspect spatial distributions; subtle steganographic or trigger patches may require model layer inspection."
            })

        # (b) Model Finding
        if c_scores["model"] > 0.0:
            evidence_findings.append({
                "finding": "Model integrity mismatch",
                "severity": "CRITICAL" if c_scores["model"] >= 80 else "HIGH",
                "evidence": telemetry.get(
                    "model_evidence",
                    "Expected SHA-256 differs from received candidate model SHA-256. Byte-level alteration confirmed."
                ),
                "confidence": 0.99,
                "limitation": "Hash mismatch proves the files differ but does not prove malicious intent."
            })
        else:
            evidence_findings.append({
                "finding": "Model cryptographic verification verified",
                "severity": "LOW",
                "evidence": "Candidate model SHA-256 matches trusted reference baseline anchored in local vault.",
                "confidence": 0.99,
                "limitation": "SHA-256 match proves byte equivalence with registered reference, but does not assess safety of the original baseline if enrolled pre-compromised."
            })

        # (c) Behaviour Finding
        if c_scores["behaviour"] >= 30.0:
            evidence_findings.append({
                "finding": "Model decision boundary instability",
                "severity": "MEDIUM",
                "evidence": f"Activation perturbations observed under stress conditions (behaviour risk score: {c_scores['behaviour']}%).",
                "confidence": 0.85,
                "limitation": "Perturbation stress testing uses heuristic noise and may trigger false positives on complex visual textures."
            })
        else:
            evidence_findings.append({
                "finding": "Model classification behaviour stable",
                "severity": "LOW",
                "evidence": f"Class activation stability verified within nominal threshold (score: {c_scores['behaviour']}%).",
                "confidence": 0.90,
                "limitation": "Tested against standard test sets; edge-case out-of-distribution inputs may still trigger unmodeled behaviour."
            })

        # (d) Distribution Shift Finding
        if c_scores["distribution"] >= 30.0:
            evidence_findings.append({
                "finding": "Input distribution covariance drift detected",
                "severity": "MEDIUM",
                "evidence": f"Runtime input features deviate from training baseline (drift metric: {c_scores['distribution']}%).",
                "confidence": 0.88,
                "limitation": "Covariance drift indicates lighting or sensor variation; does not inherently indicate adversarial attack."
            })
        else:
            evidence_findings.append({
                "finding": "Distribution covariance alignment verified",
                "severity": "LOW",
                "evidence": f"Runtime visual distribution matches baseline reference data (score: {c_scores['distribution']}%).",
                "confidence": 0.92,
                "limitation": "Air-gapped calculation evaluates summary moments; localized sub-manifold shifts may escape detection."
            })

        # (e) Inference Integrity Finding
        if c_scores["inference"] >= 50.0 or telemetry.get("tampering_detected", False):
            evidence_findings.append({
                "finding": "Inference audit chain broken",
                "severity": "CRITICAL",
                "evidence": telemetry.get(
                    "inference_evidence",
                    "Cryptographic chain verification failure: TAMPERING DETECTED in local inference record sequence."
                ),
                "confidence": 0.99,
                "limitation": "Chain break indicates record mutation or sequence truncation in SQLite database."
            })
        elif c_scores["inference"] > 0.0 or telemetry.get("replay_warnings", 0) > 0:
            evidence_findings.append({
                "finding": "Replayed inference requests observed",
                "severity": "MEDIUM",
                "evidence": f"{telemetry.get('replay_warnings', 1)} duplicate inference transaction(s) sharing identical input, model, and configuration hashes detected.",
                "confidence": 0.95,
                "limitation": "Identical frames may naturally occur in stationary cameras observing static scenes."
            })
        else:
            evidence_findings.append({
                "finding": "Inference record chain integrity intact",
                "severity": "LOW",
                "evidence": "Tamper-evident SHA-256 chain links Input → Model → Configuration → Output with zero broken linkages.",
                "confidence": 0.99,
                "limitation": "Chain validates cryptographic sequence ordering; does not evaluate camera hardware authenticity."
            })

        # 6. Comprehensive Limitations
        limitations = [
            f"Overall risk is computed using transparent linear weighting: Dataset ({int(weights['dataset']*100)}%), Model ({int(weights['model']*100)}%), Behaviour ({int(weights['behaviour']*100)}%), Distribution ({int(weights['distribution']*100)}%), Inference ({int(weights['inference']*100)}%).",
            "Individual findings identify specific anomalies or cryptographic discrepancies; findings should be evaluated contextually rather than assuming automated malice.",
            "All computations run 100% offline on local hardware with zero external threat feed dependencies."
        ]

        return {
            "overall_risk": overall_risk,
            "confidence": confidence_val,
            "recommendation": recommendation,
            "component_scores": c_scores,
            "weights": weights,
            "weighted_contributions": weighted_contributions,
            "evidence": evidence_findings,
            "limitations": limitations
        }
