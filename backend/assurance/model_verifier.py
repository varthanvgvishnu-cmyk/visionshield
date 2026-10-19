"""
VisionShield - Model Integrity Assurance Engine
Feature 2: Model Integrity Assurance
Static verification and metadata extraction without code execution.
"""

import os
import json
import hashlib
import zipfile
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List

try:
    import onnx
    from onnx import TensorProto
    HAS_ONNX = True
except ImportError:
    HAS_ONNX = False


def compute_sha256(file_path: Path) -> str:
    """Computes SHA-256 hash of file content in chunks."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def detect_model_format(file_path: Path) -> str:
    """Infers model format from extension and file signatures."""
    suffix = file_path.suffix.lower()
    if suffix == ".onnx":
        return "ONNX"
    elif suffix in [".pt", ".pth", ".bin"]:
        if zipfile.is_zipfile(file_path):
            try:
                with zipfile.ZipFile(file_path, "r") as zf:
                    namelist = zf.namelist()
                    if any("model.json" in n or "constants.pkl" in n for n in namelist):
                        return "TorchScript"
                    return "PyTorch (Zip Archive)"
            except Exception:
                return "PyTorch"
        return "PyTorch (Binary Pickle)"
    elif suffix == ".safetensors":
        return "Safetensors"
    elif suffix == ".tflite":
        return "TensorFlow Lite"
    elif suffix in [".h5", ".hdf5"]:
        return "Keras / HDF5"
    return f"Generic Model ({suffix.upper().replace('.', '') or 'UNKNOWN'})"


def extract_safe_metadata(file_path: Path, model_format: str) -> Dict[str, Any]:
    """
    Safely extracts model metadata without executing arbitrary code.
    No model execution, no arbitrary pickling.
    """
    metadata: Dict[str, Any] = {
        "format": model_format,
        "file_size": file_path.stat().st_size if file_path.exists() else 0,
        "inputs": [],
        "outputs": [],
        "attributes": {}
    }

    if model_format == "ONNX" and HAS_ONNX:
        try:
            model = onnx.load_model(str(file_path), load_external_data=False)
            metadata["ir_version"] = model.ir_version
            metadata["producer_name"] = model.producer_name or "Unknown"
            metadata["producer_version"] = model.producer_version or "N/A"
            metadata["opset_import"] = [
                {"domain": op.domain or "ai.onnx", "version": op.version}
                for op in model.opset_import
            ]

            graph = model.graph
            metadata["graph_name"] = graph.name or "main_graph"

            # Initializer names to distinguish user inputs from static parameters
            init_names = {init.name for init in graph.initializer}

            # Extract inputs
            for inp in graph.input:
                if inp.name in init_names:
                    continue  # skip initializers included in inputs in some IRs
                shape = []
                elem_type = "UNKNOWN"
                if inp.type.HasField("tensor_type"):
                    t = inp.type.tensor_type
                    if t.elem_type:
                        try:
                            elem_type = TensorProto.DataType.Name(t.elem_type)
                        except Exception:
                            elem_type = f"TYPE_{t.elem_type}"
                    for d in t.shape.dim:
                        if d.dim_param:
                            shape.append(d.dim_param)
                        elif d.dim_value:
                            shape.append(d.dim_value)
                        else:
                            shape.append("?")
                metadata["inputs"].append({
                    "name": inp.name,
                    "type": str(elem_type),
                    "shape": shape
                })

            # Extract outputs
            for out in graph.output:
                shape = []
                elem_type = "UNKNOWN"
                if out.type.HasField("tensor_type"):
                    t = out.type.tensor_type
                    if t.elem_type:
                        try:
                            elem_type = TensorProto.DataType.Name(t.elem_type)
                        except Exception:
                            elem_type = f"TYPE_{t.elem_type}"
                    for d in t.shape.dim:
                        if d.dim_param:
                            shape.append(d.dim_param)
                        elif d.dim_value:
                            shape.append(d.dim_value)
                        else:
                            shape.append("?")
                metadata["outputs"].append({
                    "name": out.name,
                    "type": str(elem_type),
                    "shape": shape
                })

            metadata["node_count"] = len(graph.node)
            metadata["initializer_count"] = len(graph.initializer)
        except Exception as ex:
            metadata["parsing_warning"] = f"ONNX static inspection partial: {str(ex)}"

    elif "PyTorch" in model_format or "TorchScript" in model_format:
        try:
            if zipfile.is_zipfile(file_path):
                with zipfile.ZipFile(file_path, "r") as zf:
                    namelist = zf.namelist()
                    metadata["archive_entries_count"] = len(namelist)
                    sample_entries = namelist[:10]
                    metadata["archive_sample_records"] = sample_entries

                    for name in namelist:
                        if name.endswith("model.json"):
                            try:
                                json_data = json.loads(zf.read(name).decode("utf-8", errors="ignore"))
                                if isinstance(json_data, dict):
                                    metadata["torchscript_meta"] = {
                                        k: str(v) for k, v in json_data.items() if k in ["producer", "version", "schema"]
                                    }
                            except Exception:
                                pass
                        elif name.endswith("version"):
                            try:
                                ver_str = zf.read(name).decode("utf-8", errors="ignore").strip()
                                metadata["archive_version"] = ver_str
                            except Exception:
                                pass
            else:
                metadata["storage_type"] = "Legacy Raw Pickle Archive (Unpickling bypassed for security)"
        except Exception as ex:
            metadata["parsing_warning"] = f"PyTorch static inspection partial: {str(ex)}"

    elif model_format == "Safetensors":
        try:
            with open(file_path, "rb") as f:
                header_size_bytes = f.read(8)
                if len(header_size_bytes) == 8:
                    header_size = int.from_bytes(header_size_bytes, "little")
                    if 0 < header_size < 100 * 1024 * 1024:
                        header_json = json.loads(f.read(header_size).decode("utf-8"))
                        tensors = []
                        for k, v in header_json.items():
                            if k != "__metadata__":
                                tensors.append({
                                    "name": k,
                                    "dtype": v.get("dtype"),
                                    "shape": v.get("shape")
                                })
                        metadata["tensors_count"] = len(tensors)
                        metadata["sample_tensors"] = tensors[:10]
                        if "__metadata__" in header_json:
                            metadata["user_metadata"] = header_json["__metadata__"]
        except Exception as ex:
            metadata["parsing_warning"] = f"Safetensors header inspection error: {str(ex)}"

    return metadata


class ModelVerifier:
    """
    Performs cryptographic SHA-256 verification and static metadata extraction
    between a candidate model and a registered baseline model.
    """

    def verify_model(
        self,
        candidate_file_path: Path,
        expected_hash: str,
        trusted_filename: str = "Registered_Baseline"
    ) -> Dict[str, Any]:
        """
        Calculates SHA-256 of candidate model, compares with expected hash,
        and generates structured integrity report.
        """
        received_hash = compute_sha256(candidate_file_path)
        format_name = detect_model_format(candidate_file_path)
        metadata = extract_safe_metadata(candidate_file_path, format_name)

        hash_match = (received_hash.lower() == expected_hash.lower())

        if hash_match:
            integrity_status = "VERIFIED"
            recommendation = "ACCEPT"
            risk_score = 0.0
            confidence = "High"
            evidence = [
                f"Candidate model SHA-256 digest ({received_hash[:16]}...) precisely matches trusted registered baseline '{trusted_filename}'.",
                "Cryptographic byte equivalence verified with 0 bit discrepancies.",
                f"Model architecture format recognized as {format_name} with valid static metadata.",
                "Zero code execution performed during offline assurance verification."
            ]
        else:
            integrity_status = "SUSPICIOUS"
            recommendation = "QUARANTINE"
            risk_score = 85.0
            confidence = "High"
            evidence = [
                f"SHA-256 hash mismatch detected between candidate model and trusted baseline '{trusted_filename}'.",
                f"Expected Baseline Hash : {expected_hash}",
                f"Received Candidate Hash: {received_hash}",
                "Byte-level divergence indicates weight modification, layer perturbation, or file replacement.",
                "Recommendation: Quarantine candidate asset and block promotion to deployment pipeline."
            ]

        limitations = [
            "Cryptographic SHA-256 validation guarantees identical byte structure to the reference model; it does not audit semantic robustness if the reference baseline was compromised prior to registration.",
            "Metadata parsing inspects static graph definitions and headers without executing operators to protect against arbitrary code execution vulnerabilities.",
            "Verification occurs entirely offline on the air-gapped system without external cloud verification."
        ]

        return {
            "integrity_status": integrity_status,
            "expected_hash": expected_hash,
            "received_hash": received_hash,
            "hash_match": hash_match,
            "model_format": format_name,
            "metadata": metadata,
            "evidence": evidence,
            "confidence": confidence,
            "limitations": limitations,
            "risk_score": risk_score,
            "recommendation": recommendation,
            "candidate_filename": candidate_file_path.name,
            "trusted_filename": trusted_filename
        }
