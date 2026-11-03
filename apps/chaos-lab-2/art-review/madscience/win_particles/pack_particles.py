"""Slice the Photoroom-cut win-particle sheet (3x3) and pack the shower's sheet.

Cells: coin front / 35deg / 65deg / edge-on / back, test vial, round flask, goo
blob, goo drop. Every crop is scaled by ONE factor that makes the coin 487 px
across — the template coin's size, so the shared fountain + LEVEL_PARTICLE_COIN_MAP
configs (particle scale 0.3-0.4) draw ours at the same world size — and the
sheet is written at meta scale 2 like the template's.

The emitter picks a texture per particle uniformly from the sheet's frames, so
the coin frames are listed twice (same rects): ~70% coins, vials and goo as
accents. Usage: python3 pack_particles.py <cut sheet> <out dir> <tight dir>
"""
import json, sys

import numpy as np
from PIL import Image

NAMES = ['coin_front', 'coin_35', 'coin_65', 'coin_edge', 'coin_back', 'vial', 'flask', 'goo', 'drop']
COINS = NAMES[:5]
COIN_PX = 487
PAD = 4
SHEET_W = 2048

sheet = Image.open(sys.argv[1]).convert('RGBA')
out_dir, tight_dir = sys.argv[2], sys.argv[3]
mask = np.array(sheet.getchannel('A')) > 8


def split(coverage, nominal, reach=260):
    """the emptiest line near a nominal grid line (the model's grid is not exact)"""
    lo, hi = int(nominal - reach), int(nominal + reach)
    return lo + int(np.argmin(coverage[lo:hi]))


xs = [0] + [split(mask.sum(0), sheet.width * k / 3) for k in (1, 2)] + [sheet.width]
crops = {}
for i, name in enumerate(NAMES):
    col, row = i % 3, i // 3
    band = mask[:, xs[col]:xs[col + 1]].sum(1)
    ys = [0] + [split(band, sheet.height * k / 3) for k in (1, 2)] + [sheet.height]
    box = (xs[col], ys[row], xs[col + 1], ys[row + 1])
    cell = sheet.crop(box)
    bb = cell.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    crops[name] = cell.crop(bb)
    crops[name].save(f'{tight_dir}/{name}.png')
    print(f'{name}: box={box} crop={crops[name].size}')

scale = COIN_PX / crops['coin_front'].width
frames = []
for name in NAMES:
    c = crops[name]
    size = (max(1, round(c.width * scale)), max(1, round(c.height * scale)))
    # premultiplied resample: straight-alpha resizing darkens the antialiased rim
    frames.append((name, c.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')))

# shelf pack
x = y = PAD
shelf = 0
placed = []
for name, img in frames:
    if x + img.width + PAD > SHEET_W:
        x, y, shelf = PAD, y + shelf + PAD, 0
    placed.append((name, img, x, y))
    x += img.width + PAD
    shelf = max(shelf, img.height)
height = y + shelf + PAD
atlas = Image.new('RGBA', (SHEET_W, height), (0, 0, 0, 0))
data = {}
for name, img, px, py in placed:
    atlas.paste(img, (px, py))
    entry = {
        'frame': {'x': px, 'y': py, 'w': img.width, 'h': img.height},
        'rotated': False,
        'trimmed': False,
        'spriteSourceSize': {'x': 0, 'y': 0, 'w': img.width, 'h': img.height},
        'sourceSize': {'w': img.width, 'h': img.height},
    }
    data[f'{name}.png'] = entry
    if name in COINS:
        data[f'{name}_b.png'] = entry  # weighting: coins twice as likely
# lossless WebP: not premultiplied, so no PMA concern; ~half the PNG
atlas.save(f'{out_dir}/particles.webp', 'WEBP', lossless=True, quality=100, method=6)
json.dump({
    'frames': data,
    'meta': {'image': 'particles.webp', 'format': 'RGBA8888', 'size': {'w': SHEET_W, 'h': height}, 'scale': '2'},
}, open(f'{out_dir}/particles.json', 'w'), indent='\t')
print('atlas', atlas.size, 'frames', len(data), 'scale', round(scale, 4))
