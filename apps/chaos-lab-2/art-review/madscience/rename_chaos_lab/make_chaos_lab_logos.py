"""The Chaos Lab logos (2026-10-29: Stake already had a "Mad Science", so the
game was renamed; review item 2). Evtim's art, src/logo_cl.png (stacked) and
src/logo_cl_one_row.png, both on the old canvases (1465x1073 / 2172x724).

  logo.webp          the stacked logo TRIMMED to its lettering (+ PAD px). The
                     old logo filled its canvas edge to edge and GameLogo /
                     LoadingScreen size it by height, so a trimmed new one keeps
                     the tuned look (the delivered canvas has a ~100 px empty
                     band on top: it read 12% smaller and sat low).
  logo_one_row.webp  the one-row logo as delivered (GameLogo's ROW_INK = the
                     lettering rows, 123-613 of 724).
  loader_base.webp   the boot loader (logo + acid tube, one painted image): the
                     old MAD SCIENCE lettering and its smoke cleared above the
                     tube, the tube, its emptied glass and the two end glows
                     kept, the trimmed new logo set where the old one sat, its
                     drips on the tube's top rail. Same 1672x941 canvas, so
                     LoaderGame's TUBE rect and loader_fill.webp still fit.

    python3 make_chaos_lab_logos.py            # writes out/ + previews only
    python3 make_chaos_lab_logos.py --install  # and copies out/ into static/

The old files: art-review/static-leftovers/mad_science_name_2026-10-29/.
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
STATIC = APP / 'static/assets/madscience'
OLD = APP / 'art-review/static-leftovers/mad_science_name_2026-10-29'
OUT = HERE / 'out'
PREVIEW = HERE / 'preview'

PAD = 6  # px of transparent margin kept around the trimmed lettering

# loader: everything above CUT_Y belongs to the old logo or its smoke; between
# CUT_Y and RAIL_Y only the band CLEAR_X0..CLEAR_X1 does (the end glows rise
# outside it), faded over FEATHER px. Measured off loader_base.webp.
CUT_Y, RAIL_Y = 600, 712
CLEAR_X0, CLEAR_X1, FEATHER = 385, 1295, 110
# where the new logo's lettering goes: bottom (drip tips) on the rail, the old
# lettering's top, centred on the canvas
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
    stacked = Image.open(HERE / 'src/logo_cl.png').convert('RGBA')
    x0, y0, x1, y1 = ink_box(np.asarray(stacked)[:, :, 3])
    box = (max(0, x0 - PAD), max(0, y0 - PAD), min(stacked.width, x1 + PAD), min(stacked.height, y1 + PAD))
    logo = stacked.crop(box)
    logo.save(OUT / 'logo.png')
    cwebp(OUT / 'logo.png', OUT / 'logo.webp', '-q', '95', '-alpha_q', '100')
    print(f'logo.webp {logo.width}x{logo.height} (lettering {x1 - x0}x{y1 - y0} of {stacked.width}x{stacked.height}) ASPECT {logo.width}/{logo.height}')

    # 2. one-row logo, as delivered
    row = Image.open(HERE / 'src/logo_cl_one_row.png').convert('RGBA')
    rx0, ry0, rx1, ry1 = ink_box(np.asarray(row)[:, :, 3])
    row.save(OUT / 'logo_one_row.png')
    cwebp(OUT / 'logo_one_row.png', OUT / 'logo_one_row.webp', '-q', '95', '-alpha_q', '100')
    print(f'logo_one_row.webp {row.width}x{row.height}, lettering rows {ry0}-{ry1} -> ROW_INK {ry1 - ry0}/{row.height}')

    # 3. loader: clear the old lettering, set the new logo
    old = Image.open(OLD / 'loader_base.webp').convert('RGBA')
    a = np.asarray(old).astype(np.float32)
    keep = np.ones(a.shape[:2], np.float32)
    keep[:CUT_Y, :] = 0
    xs = np.arange(a.shape[1], dtype=np.float32)
    # 0 inside the clear band, ramping back to 1 over FEATHER px outside it
    band = np.clip(np.maximum(CLEAR_X0 - xs, xs - CLEAR_X1) / FEATHER, 0, 1)
    keep[CUT_Y:RAIL_Y, :] = np.minimum(keep[CUT_Y:RAIL_Y, :], band[None, :])
    a[:, :, 3] *= keep
    base = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    base.save(PREVIEW / 'loader_cleared.png')

    lh = LOGO_BOTTOM - LOGO_TOP
    # the trimmed logo's lettering spans its height minus 2*PAD
    scale = lh / (logo.height - 2 * PAD)
    lw = round(logo.width * scale)
    lhh = round(logo.height * scale)
    placed = logo.resize((lw, lhh), Image.LANCZOS)
    left = (base.width - lw) // 2
    top = LOGO_TOP - round(PAD * scale)
    base.alpha_composite(placed, (left, top))
    base.save(OUT / 'loader_base.png')
    cwebp(OUT / 'loader_base.png', OUT / 'loader_base.webp', '-q', '92', '-alpha_q', '100')
    print(f'loader_base.webp {base.width}x{base.height}, logo {lw}x{lhh} at ({left},{top})')

    # previews: on the loader's dark backdrop, and the old one beside it
    preview_on(base, (12, 16, 12), PREVIEW / 'loader_new.png', 0.5)
    preview_on(old, (12, 16, 12), PREVIEW / 'loader_old.png', 0.5)
    preview_on(logo, (12, 16, 12), PREVIEW / 'logo_new.png', 0.4)
    preview_on(row, (12, 16, 12), PREVIEW / 'logo_one_row_new.png', 0.4)

    for f in sorted(OUT.glob('*.webp')):
        print(f'  {f.name}: {f.stat().st_size // 1024} KB')

    if '--install' in sys.argv:
        shutil.copy2(OUT / 'logo.webp', STATIC / 'logo.webp')
        shutil.copy2(OUT / 'logo_one_row.webp', STATIC / 'logo_one_row.webp')
        shutil.copy2(OUT / 'loader_base.webp', STATIC / 'loader/loader_base.webp')
        print('installed into', STATIC)


if __name__ == '__main__':
    main()
