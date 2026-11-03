"""The bottom bar's buy button: three state sprites from one piece of art.

    python3 make_buy_button.py [source.png]

Source: src/buy_button.png (Evtim's art, 779x798, 2026-10-24) unless a path is
given. The shared ButtonBuyBonus draws every state into a SQUARE box, so the
art is centred on a transparent square canvas at its native size (no
resizing). States, by the recipe measured off the September set (it rebuilds
those files exactly): active = the art, hover = brightness x1.09, inactive =
colour x0.15 then brightness x0.55. Both filters touch RGB only: PIL's
Brightness on RGBA would scale the alpha too. Written as WebP to
static/assets/sprites/ui/buy_<state>.webp with cwebp q95 -sharp_yuv: plain
lossy WebP subsamples colour and smeared the saturated magenta/green (35 dB
even at display size); sharp YUV holds ~41 dB at 236 KB against 685 KB
lossless. Scored at the largest size the button is drawn (DISPLAY_PX: ~90-170
layout units, at most ~400 device px on a big retina screen); a state under
MIN_PSNR falls back to near-lossless.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
OUT = APP / 'static/assets/sprites/ui'
MIN_PSNR = 40.0
DISPLAY_PX = 400


def square(img):
    side = max(img.size)
    canvas = Image.new('RGBA', (side, side))
    canvas.alpha_composite(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas


def rgb_only(img, fn):
    out = fn(img.convert('RGB'))
    out.putalpha(img.getchannel('A'))
    return out


def psnr(a, b):
    """compared at the largest on-screen size"""
    a, b = (im.resize((DISPLAY_PX, DISPLAY_PX), Image.LANCZOS) for im in (a, b))

    def arr(im):
        x = np.asarray(im.convert('RGBA')).astype(np.float64)
        return np.concatenate([x[..., :3] * (x[..., 3:4] / 255), x[..., 3:4]], axis=2)
    mse = np.mean((arr(a) - arr(b)) ** 2)
    return 99.0 if mse == 0 else 10 * np.log10(255**2 / mse)


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'src/buy_button.png'
    art = square(Image.open(src).convert('RGBA'))
    states = {
        'active': art,
        'hover': rgb_only(art, lambda im: ImageEnhance.Brightness(im).enhance(1.09)),
        'inactive': rgb_only(
            art, lambda im: ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.15)).enhance(0.55)
        ),
    }
    with tempfile.TemporaryDirectory() as tmp:
        for name, img in states.items():
            png, path = Path(tmp) / f'{name}.png', OUT / f'buy_{name}.webp'
            img.save(png)
            mode = 'q95 sharp_yuv'
            subprocess.run(['cwebp', '-quiet', '-q', '95', '-sharp_yuv', '-alpha_q', '100', '-m', '6', str(png), '-o', str(path)], check=True)
            score = psnr(img, Image.open(path))
            if score < MIN_PSNR:
                subprocess.run(['cwebp', '-quiet', '-near_lossless', '40', '-m', '6', str(png), '-o', str(path)], check=True)
                mode = f'near-lossless 40 (q95 was {score:.1f} dB)'
                score = psnr(img, Image.open(path))
            print(f'{path.name}: {img.width}x{img.height}, {path.stat().st_size // 1024} KB, {mode}, {score:.1f} dB at {DISPLAY_PX}px')


if __name__ == '__main__':
    main()
