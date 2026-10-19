"""
Seed realistic computer vision inference audit chain records:
Camera Frame -> YOLO Model -> Confidence Config -> Defect Predictions
"""
from pathlib import Path
from assurance.inference_chain import InferenceChainManager

def seed_sample_inferences(db_path: Path):
    manager = InferenceChainManager(db_path)

    # Sample Model Hash (YOLOv8x Defect Detector)
    model_hash = "f6c5c5369cd84e476dc3d48e8ce28cfef14703d3fcabcf1ad431652ff9b5afe5"
    model_name = "YOLOv8x_Defect_Detector.onnx"

    inferences = [
        {
            "input_data": "raw_frame_rgb_cam01_timestamp_1726048120_exposure_12ms",
            "input_label": "cam01_frame_001.png",
            "config": {"confidence_threshold": 0.50, "nms_iou": 0.45, "imgsz": [640, 640]},
            "output": {"detections": 0, "defect_flag": False, "inference_latency_ms": 14.2}
        },
        {
            "input_data": "raw_frame_rgb_cam01_timestamp_1726048121_exposure_12ms",
            "input_label": "cam01_frame_002.png",
            "config": {"confidence_threshold": 0.50, "nms_iou": 0.45, "imgsz": [640, 640]},
            "output": {"detections": 1, "defect_flag": True, "defect_class": "crack", "confidence": 0.94, "inference_latency_ms": 15.1}
        },
        {
            "input_data": "raw_frame_rgb_cam02_timestamp_1726048122_thermal_ch",
            "input_label": "thermal_cam02_001.png",
            "config": {"confidence_threshold": 0.60, "nms_iou": 0.40, "imgsz": [640, 640]},
            "output": {"detections": 0, "defect_flag": False, "inference_latency_ms": 13.8}
        },
        {
            "input_data": "raw_frame_rgb_cam01_timestamp_1726048123_exposure_12ms",
            "input_label": "cam01_frame_003.png",
            "config": {"confidence_threshold": 0.50, "nms_iou": 0.45, "imgsz": [640, 640]},
            "output": {"detections": 0, "defect_flag": False, "inference_latency_ms": 14.0}
        },
        # Deliberate Replay / Duplicate Inference to test replay detection
        {
            "input_data": "raw_frame_rgb_cam01_timestamp_1726048120_exposure_12ms", # Identical to frame 1!
            "input_label": "cam01_frame_001_replayed.png",
            "config": {"confidence_threshold": 0.50, "nms_iou": 0.45, "imgsz": [640, 640]},
            "output": {"detections": 0, "defect_flag": False, "inference_latency_ms": 14.2}
        }
    ]

    created = []
    for inf in inferences:
        rec = manager.add_inference_record(
            input_data=inf["input_data"],
            model_hash=model_hash,
            configuration=inf["config"],
            output_data=inf["output"],
            input_label=inf["input_label"],
            model_name=model_name
        )
        created.append(rec)
    return created

if __name__ == "__main__":
    db = Path(__file__).resolve().parent.parent / "vault.db"
    records = seed_sample_inferences(db)
    print(f"Seeded {len(records)} chained inference records.")
