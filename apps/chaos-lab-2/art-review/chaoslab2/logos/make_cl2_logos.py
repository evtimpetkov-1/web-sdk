"""The Chaos Lab 2 logos (2026-11-03). Evtim's art from iCloud
MyDrive/chaos lab 2/static/ (logo.png 1536x1024 stacked, logo_one_row.png
2209x701), copied to src/. Same treatment as Chaos Lab's rename
(art-review/madscience/rename_chaos_lab/make_chaos_lab_logos.py):

  logo.webp          the stacked logo TRIMMED to its lettering (+ PAD px):
                     GameLogo / LoadingScreen size it by height, so the trim
                     keeps the tuned look. Its ratio = their ASPECT/LOGO_RATIO.
  logo_one_row.webp  as delivered; GameLogo's ROW_ASPECT/ROW_INK are printed.
  loader_base.webp   the boot loader (logo + acid tube, one painted image),
                     rebuilt from the ORIGINAL Mad Science loader with the same
                     clear + placement as the Chaos Lab one, the CL2 logo above
                     the tube. Same 1672x941 canvas, so LoaderGame's TUBE rect
                     and loader_fill.webp still fit.

    python3 make_cl2_logos.py            # writes out/ + previews only
    python3 make_cl2_logos.py --install  # and copies out/ into static/assets/chaoslab2/

Encoding: cwebp -sharp_yuv (plain lossy WebP smears saturated green/purple).
"""
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
STATIC = APP / 'static/assets/chaoslab2'
OLD_LOADER = APP / 'art-review/static-leftovers/mad_science_name_2026-10-29/loader_base.webp'
OUT = HERE / 'out'
PREVIEW = HERE / 'preview'

PAD = 6  # px of transparent margin kept around the trimmed lettering

# loader (the Chaos Lab values, measured off the original loader_base.webp):
# everything above CUT_Y belongs to the old logo or its smoke; between CUT_Y and
# RAIL_Y only the band CLEAR_X0..CLEAR_X1 does, faded over FEATHER px
CUT_Y, RAIL_Y = 600, 712
CLEAR_X0, CLEAR_X1, FEATHER = 385, 1295, 110
# the new lettering: drip tips on the rail, top where the old lettering's was
LOGO_TOP, LOGO_BOTTOM = 55, 708


def ink_box(alpha, threshold=16):
    rows = np.where((alpha > threshold).any(axis=1))[0]
    cols = np.where((alpha > threshold).any(axis=0))[0]
    return cols[0], rows[0], cols[-1] + 1, rows[-1] + 1


def cwebp(png, webp, *args):
    subprocess.run(['cwebp', '-quiet', '-m', '6', '-sharp_yuv', *args, str(png), '-o', str(webp)], check=True)


def preview_on(im, bg_rgb, path, scale=1.0):
    bg = Image.new('RGBA', im.size, bg_rgb + (255,))
    bg.alpha_composite(im)
    if scale != 1.0:
        bg = bg.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    bg.convert('RGB').save(path)


def main():
    OUT.mkdir(exist_ok=True)
    PREVIEW.mkdir(exist_ok=True)

    # 1. stacked logo, trimmed
    stacked = Image.open(HERE / 'src/logo_cl2.png').convert('RGBA')
    x0, y0, x1, y1 = ink_box(np.asarray(stacked)[:, :, 3])
    box = (max(0, x0 - PAD), max(0, y0 - PAD), min(stacked.width, x1 + PAD), min(stacked.height, y1 + PAD))
    logo = stacked.crop(box)
    logo.save(OUT / 'logo.png')
    cwebp(OUT / 'logo.png', OUT / 'logo.webp', '-q', '95', '-alpha_q', '100')
    print(f'logo.webp {logo.width}x{logo.height} (lettering {x1 - x0}x{y1 - y0} of {stacked.width}x{stacked.height}) ASPECT {logo.width}/{logo.height}')

    # 2. one-row logo, as delivered
    row = Image.open(HERE / 'src/logo_cl2_one_row.png').convert('RGBA')
    rx0, ry0, rx1, ry1 = ink_box(np.asarray(row)[:, :, 3])
    row.save(OUT / 'logo_one_row.png')
    cwebp(OUT / 'logo_one_row.png', OUT / 'logo_one_row.webp', '-q', '95', '-alpha_q', '100')
    print(f'logo_one_row.webp {row.width}x{row.height}, lettering rows {ry0}-{ry1} -> ROW_ASPECT {row.width}/{row.height}, ROW_INK {ry1 - ry0}/{row.height}')

    # 3. loader: clear the old lettering, set the new logo
    old = Image.open(OLD_LOADER).convert('RGBA')
    a = np.asarray(old).astype(np.float32)
    keep = np.ones(a.shape[:2], np.float32)
    keep[:CUT_Y, :] = 0
    xs = np.arange(a.shape[1], dtype=np.float32)
    band = np.clip(np.maximum(CLEAR_X0 - xs, xs - CLEAR_X1) / FEATHER, 0, 1)
    keep[CUT_Y:RAIL_Y, :] = np.minimum(keep[CUT_Y:RAIL_Y, :], band[None, :])
    a[:, :, 3] *= keep
    base = Image.fromarray(a.clip(0, 255).astype(np.uint8))

    lh = LOGO_BOTTOM - LOGO_TOP
    scale = lh / (logo.height - 2 * PAD)
    lw, lhh = round(logo.width * scale), round(logo.height * scale)
    placed = logo.resize((lw, lhh), Image.LANCZOS)
    left = (base.width - lw) // 2
    top = LOGO_TOP - round(PAD * scale)
    base.alpha_composite(placed, (left, top))
    base.save(OUT / 'loader_base.png')
    cwebp(OUT / 'loader_base.png', OUT / 'loader_base.webp', '-q', '92', '-alpha_q', '100')
    print(f'loader_base.webp {base.width}x{base.height}, logo {lw}x{lhh} at ({left},{top})')

    preview_on(base, (12, 16, 12), PREVIEW / 'loader_new.png', 0.5)
    preview_on(logo, (12, 16, 12), PREVIEW / 'logo_new.png', 0.4)
    preview_on(row, (12, 16, 12), PREVIEW / 'logo_one_row_new.png', 0.4)

    for f in sorted(OUT.glob('*.webp')):
        print(f'  {f.name}: {f.stat().st_size // 1024} KB')

    if '--install' in sys.argv:
        (STATIC / 'loader').mkdir(parents=True, exist_ok=True)
        shutil.copy2(OUT / 'logo.webp', STATIC / 'logo.webp')
        shutil.copy2(OUT / 'logo_one_row.webp', STATIC / 'logo_one_row.webp')
        shutil.copy2(OUT / 'loader_base.webp', STATIC / 'loader/loader_base.webp')
        print('installed into', STATIC)


if __name__ == '__main__':
    main()
