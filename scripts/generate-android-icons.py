from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/brand/ratio-orbit-white-white-dot-dark-background.png"
RES = ROOT / "android/app/src/main/res"

if not SOURCE.is_file():
    raise SystemExit(f"Official Ratio launcher PNG is missing: {SOURCE}")

with Image.open(SOURCE) as original:
    image = original.convert("RGBA")

    # Preserve the complete official artwork and its aspect ratio.
    # If the source is not square, place it centered on a square canvas
    # using its corner background color instead of cropping or stretching it.
    side = max(image.width, image.height)
    background = image.getpixel((0, 0))
    square = Image.new("RGBA", (side, side), background)
    fitted = ImageOps.contain(image, (side, side), method=Image.Resampling.LANCZOS)
    offset = ((side - fitted.width) // 2, (side - fitted.height) // 2)
    square.alpha_composite(fitted, dest=offset)

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
        square.resize((size, size), Image.Resampling.LANCZOS).save(destination, format="PNG", optimize=True)
        print(f"Generated {destination.relative_to(ROOT)} ({size}x{size})")
