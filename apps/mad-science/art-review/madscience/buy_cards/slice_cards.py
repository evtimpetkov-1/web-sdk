"""Slice the Photoroom-cut buy-card sheet (3x2 grid) into the shop's card art.

Each cell is cropped to its alpha bbox, then each family (the three Lucky
Draws, the two antes) is centred on its own common canvas (max w x max h), so
a family renders at one scale and the narrow flasks fill their thumbnails.
Usage: python3 slice_cards.py <cut sheet> <out dir> <tight dir>
"""
import sys

import numpy as np
from PIL import Image

NAMES = ['lucky_draw', 'lucky_draw_heavy', 'super_lucky_draw', 'ante_1', 'ante_2', 'ante_2_magnet']
FAMILIES = [NAMES[:3], NAMES[3:5]]
MAX_SIDE = 820

sheet = Image.open(sys.argv[1]).convert('RGBA')
out_dir, tight_dir = sys.argv[2], sys.argv[3]
alpha = sheet.getchannel('A').point(lambda a: 255 if a > 8 else 0)
mask = np.array(alpha) > 0


def split(coverage, nominal, reach=220):
    """the emptiest line within reach of a nominal grid line (the model's
    grid is not exact: a stand base can cross the line by a few pixels)"""
    lo, hi = int(nominal - reach), int(nominal + reach)
    return lo + int(np.argmin(coverage[lo:hi]))


xs = [0] + [split(mask.sum(0), sheet.width * k / 3) for k in (1, 2)] + [sheet.width]

crops = {}
for i, name in enumerate(NAMES):
    col, row = i % 3, i // 3
    # the row split is found per column, inside that column's band only
    y_split = split(mask[:, xs[col]:xs[col + 1]].sum(1), sheet.height / 2)
    box = (xs[col], 0 if row == 0 else y_split, xs[col + 1], y_split if row == 0 else sheet.height)
    bb = alpha.crop(box).getbbox()
    edge = bb[0] == 0 or bb[1] == 0 or bb[2] == box[2] - box[0] or bb[3] == box[3] - box[1]
    crop = sheet.crop(box).crop(bb)
    crops[name] = crop
    a = crop.getchannel('A')
    hist = a.histogram()
    semi = sum(hist[17:239]) / max(1, sum(hist[17:]))
    print(f'{name}: box={box} {crop.size} touches_cell_edge={edge} semi_edge={semi:.3f}')
    crop.save(f'{tight_dir}/{name}.png')

for family in FAMILIES:
    W = max(crops[n].width for n in family)
    H = max(crops[n].height for n in family)
    scale = MAX_SIDE / max(W, H)
    for name in family:
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        c = crops[name]
        canvas.paste(c, ((W - c.width) // 2, (H - c.height) // 2), c)
        canvas = canvas.resize((round(W * scale), round(H * scale)), Image.LANCZOS)
        canvas.save(f'{out_dir}/{name}.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
        print(name, canvas.size)
