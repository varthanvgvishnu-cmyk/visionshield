"""
Generate realistic synthetic CV image dataset for offline assurance testing.
Includes:
- Normal images
- Exact SHA-256 duplicate pair
- Perceptual near-duplicate
- Statistical anomaly (extreme luminance outlier)
"""
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw

def generate_sample_dataset(output_zip: Path):
    temp_dir = output_zip.parent / "temp_images"
    temp_dir.mkdir(parents=True, exist_ok=True)

    # 1. Normal image 1 (blueish geometric pattern)
    img1 = Image.new("RGB", (128, 128), color=(70, 90, 120))
    d1 = ImageDraw.Draw(img1)
    d1.rectangle([(20, 20), (100, 100)], fill=(90, 110, 140), outline=(150, 180, 210))
    img1_path = temp_dir / "frame_cam01_001.png"
    img1.save(img1_path)

    # 2. Normal image 2
    img2 = Image.new("RGB", (128, 128), color=(75, 95, 125))
    d2 = ImageDraw.Draw(img2)
    d2.ellipse([(30, 30), (98, 98)], fill=(85, 105, 135), outline=(140, 170, 200))
    img2_path = temp_dir / "frame_cam01_002.png"
    img2.save(img2_path)

    # 3. Exact Duplicate Base
    img3 = Image.new("RGB", (128, 128), color=(80, 80, 90))
    d3 = ImageDraw.Draw(img3)
    d3.line([(10, 10), (118, 118)], fill=(200, 200, 220), width=3)
    img3_path = temp_dir / "frame_defect_raw.png"
    img3.save(img3_path)

    # 4. Exact Duplicate (exact same bytes)
    img4_path = temp_dir / "frame_defect_copy.png"
    with open(img3_path, "rb") as src, open(img4_path, "wb") as dst:
        dst.write(src.read())

    # 5. Near duplicate of img1 (slight contrast shift, dHash distance <= 4)
    img5 = Image.new("RGB", (128, 128), color=(71, 91, 121))
    d5 = ImageDraw.Draw(img5)
    d5.rectangle([(20, 20), (100, 100)], fill=(91, 111, 141), outline=(151, 181, 211))
    img5_path = temp_dir / "frame_cam01_001_recompressed.png"
    img5.save(img5_path)

    # 6. Statistical anomaly (extreme bright outlier: ~255 luminance vs ~90 baseline)
    img6 = Image.new("RGB", (128, 128), color=(252, 252, 252))
    img6_path = temp_dir / "frame_overexposed_anomaly.png"
    img6.save(img6_path)

    # Pack into zip
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
        for f in temp_dir.glob("*.png"):
            zipf.write(f, arcname=f.name)

    print(f"Created sample dataset zip with 6 images at: {output_zip}")

if __name__ == "__main__":
    zip_target = Path(__file__).resolve().parent / "sample_cv_dataset.zip"
    generate_sample_dataset(zip_target)
