from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/brand/ratio-orbit-white-white-dot-dark-background.png"
RES = ROOT / "android/app/src/main/res"

if not SOURCE.is_file():
    raise SystemExit(f"Official Ratio launcher PNG is missing: {SOURCE}")

with Image.open(SOURCE) as original:
    image = original.convert("RGBA")
    if image.width != image.height:
        raise SystemExit("Official launcher PNG must be square; refusing to crop or distort it.")

    sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in sizes.items():
        destination = RES / folder / "ratio_launcher.png"
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.resize((size, size), Image.Resampling.LANCZOS).save(destination, format="PNG", optimize=True)
        print(f"Generated {destination.relative_to(ROOT)} ({size}x{size})")
