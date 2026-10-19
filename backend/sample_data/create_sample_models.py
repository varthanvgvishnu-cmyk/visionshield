"""
Generate realistic synthetic CV model files (ONNX format) for offline model integrity verification.
"""
from pathlib import Path
import numpy as np
import onnx
from onnx import helper, TensorProto

def generate_sample_models():
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)

    X = helper.make_tensor_value_info('image_input', TensorProto.FLOAT, [1, 3, 64, 64])
    Y = helper.make_tensor_value_info('class_logits', TensorProto.FLOAT, [1, 10])

    weights_data = np.random.randn(10, 3, 3, 3).astype(np.float32)
    W = helper.make_tensor('conv_w', TensorProto.FLOAT, [10, 3, 3, 3], weights_data.flatten())

    conv_node = helper.make_node('Conv', inputs=['image_input', 'conv_w'], outputs=['conv_out'], kernel_shape=[3, 3], pads=[1, 1, 1, 1])
    pool_node = helper.make_node('GlobalAveragePool', inputs=['conv_out'], outputs=['pool_out'])
    squeeze_node = helper.make_node('Squeeze', inputs=['pool_out'], outputs=['class_logits'], axes=[2, 3])

    graph_def = helper.make_graph(
        [conv_node, pool_node, squeeze_node],
        'VisionShield_Defect_Detector',
        [X],
        [Y],
        [W]
    )

    model_def = helper.make_model(graph_def, producer_name='VisionShield_Assurance_Lab')
    model_def.opset_import[0].version = 13

    baseline_path = out_dir / 'YOLOv8x_Defect_Detector.onnx'
    onnx.save(model_def, str(baseline_path))

    copy_path = out_dir / 'Candidate_YOLOv8x_Verified.onnx'
    with open(baseline_path, 'rb') as f_src, open(copy_path, 'wb') as f_dst:
        f_dst.write(f_src.read())

    tampered_path = out_dir / 'Candidate_YOLOv8x_Tampered.onnx'
    with open(baseline_path, 'rb') as f_src:
        content = bytearray(f_src.read())
    content[len(content) // 2] ^= 0xFF
    with open(tampered_path, 'wb') as f_dst:
        f_dst.write(content)

    return {
        "baseline": baseline_path,
        "copy": copy_path,
        "tampered": tampered_path
    }

if __name__ == '__main__':
    generate_sample_models()
