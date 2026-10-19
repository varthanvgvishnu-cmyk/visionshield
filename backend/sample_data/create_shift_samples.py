"""
Generate realistic synthetic reference and operational datasets for Feature 5.
- Reference Dataset: standard factory lighting (brightness ~95, 128x128)
- Operational Dataset (Shifted): night-shift twilight lighting (brightness ~45, 128x128, lower contrast)
"""
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw

def generate_shift_datasets():
    base_dir = Path(__file__).resolve().parent
    ref_dir = base_dir / "temp_reference_images"
    op_dir = base_dir / "temp_operational_images"
    ref_dir.mkdir(parents=True, exist_ok=True)
    op_dir.mkdir(parents=True, exist_ok=True)

    # 1. Reference images (Daytime factory inspection)
    for i in range(1, 6):
        img = Image.new("RGB", (128, 128), color=(90 + i*2, 100 + i*2, 120 + i*2))
        d = ImageDraw.Draw(img)
        d.rectangle([(20 + i*3, 20 + i*3), (100 - i*2, 100 - i*2)], fill=(120, 130, 150), outline=(180, 190, 210))
        img.save(ref_dir / f"ref_daylight_frame_{i:03d}.png")

    ref_zip = base_dir / "reference_baseline_dataset.zip"
    with zipfile.ZipFile(ref_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in ref_dir.glob("*.png"):
            zf.write(f, arcname=f.name)

    # 2. Operational images (Night shift / low-light underexposed inspection)
    for i in range(1, 6):
        # Substantially darker brightness (~35-45) and slightly larger dimensions for subtle resolution shift
        img = Image.new("RGB", (128, 128), color=(35 + i*2, 40 + i*2, 48 + i*2))
        d = ImageDraw.Draw(img)
        d.rectangle([(20 + i*3, 20 + i*3), (100 - i*2, 100 - i*2)], fill=(45, 52, 60), outline=(70, 80, 95))
        img.save(op_dir / f"op_nightshift_frame_{i:03d}.png")

    op_zip = base_dir / "operational_shifted_dataset.zip"
    with zipfile.ZipFile(op_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in op_dir.glob("*.png"):
            zf.write(f, arcname=f.name)

    print(f"Generated Reference dataset: {ref_zip}")
    print(f"Generated Operational dataset: {op_zip}")

if __name__ == "__main__":
    generate_shift_datasets()