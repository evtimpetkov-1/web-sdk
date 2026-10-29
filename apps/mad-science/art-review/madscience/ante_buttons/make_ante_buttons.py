"""The buy slot's ante discs: Chaos Mode / Free Spins Boost, siblings of the cart disc.

    python3 make_ante_buttons.py [chaos=a_chaos_skull] [boost=a_boost_chevrons]

Sources (2026-10-27): two Nano Banana 2.1 2K sheets (src/sheet_{a,b}.png, a 2x2
grid on white, the cart disc + the two ante shop arts as references, 50 CU)
cut by Photoroom HD (src/cut_{a,b}.png, 3 CU each). Grid per sheet:
    chaos_skull   chaos_bomb
    boost_chevrons boost_coins
Every quadrant is cropped to its alpha, centred on a square and written to
candidates/<sheet>_<name>.png (+ candidates/contact.png). The two picks become
static/assets/sprites/ui/ante_<mode>_<state>.webp with the cart disc's recipe
(make_buy_button.py): hover = brightness x1.09, inactive = colour x0.15 then
brightness x0.55, RGB only; cwebp q95 -sharp_yuv. SIDE px square: the slot is
drawn at most ~171 layout units (landscape), ~400 device px on a big retina.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance

HERE = Path(__file__).resolve().parent
APP = HERE.parents[2]
OUT = APP / 'static/assets/sprites/ui'
CANDIDATES = HERE / 'candidates'
SIDE = 512
GRID = [['chaos_skull', 'chaos_bomb'], ['boost_chevrons', 'boost_coins']]
# single-disc renders (Photoroom cuts in src/), e.g. Chaos v2 (2026-10-27, Evtim:
# the skull + cloner + X plates of the shop art): Nano Banana 2.1 2K x2 off
# sheet_a's top-left disc + the Chaos shop art, 26 CU, + Photoroom HD
SINGLES = ['chaos_plates_1', 'chaos_plates_2']
DEFAULT = {'chaos': 'chaos_plates_1', 'boost': 'a_boost_chevrons'}


def square(img):
    img = img.crop(img.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
    side = max(img.size)
    canvas = Image.new('RGBA', (side, side))
    canvas.alpha_composite(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas.resize((SIDE, SIDE), Image.LANCZOS)


def rgb_only(img, fn):
    out = fn(img.convert('RGB'))
    out.putalpha(img.getchannel('A'))
    return out


def slice_sheets():
    CANDIDATES.mkdir(exist_ok=True)
    tiles = []
    for sheet in 'ab':
        cut = Image.open(HERE / f'src/cut_{sheet}.png').convert('RGBA')
        half = cut.width // 2
        for row, names in enumerate(GRID):
            for col, name in enumerate(names):
                tile = square(cut.crop((col * half, row * half, (col + 1) * half, (row + 1) * half)))
                tile.save(CANDIDATES / f'{sheet}_{name}.png')
                tiles.append((f'{sheet}_{name}', tile))
    for name in SINGLES:
        src = HERE / f'src/{name}.png'
        if src.exists():
            tile = square(Image.open(src).convert('RGBA'))
            tile.save(CANDIDATES / f'{name}.png')
            tiles.append((name, tile))
    cell = 260
    rows = (len(tiles) + 3) // 4
    contact = Image.new('RGBA', (cell * 4, (cell + 24) * rows), (34, 38, 34, 255))
    draw = ImageDraw.Draw(contact)
    for i, (label, tile) in enumerate(tiles):
        x, y = (i % 4) * cell, (i // 4) * (cell + 24)
        contact.alpha_composite(tile.resize((cell - 20, cell - 20), Image.LANCZOS), (x + 10, y + 10))
        draw.text((x + 10, y + cell), label, fill=(220, 220, 220, 255))
    contact.save(CANDIDATES / 'contact.png')


def export(mode, pick):
    art = Image.open(CANDIDATES / f'{pick}.png').convert('RGBA')
    states = {
        'active': art,
        'hover': rgb_only(art, lambda im: ImageEnhance.Brightness(im).enhance(1.09)),
        'inactive': rgb_only(
            art, lambda im: ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.15)).enhance(0.55)
        ),
    }
    with tempfile.TemporaryDirectory() as tmp:
        for state, img in states.items():
            png, path = Path(tmp) / f'{state}.png', OUT / f'ante_{mode}_{state}.webp'
            img.save(png)
            subprocess.run(['cwebp', '-quiet', '-q', '95', '-sharp_yuv', '-alpha_q', '100', '-m', '6', str(png), '-o', str(path)], check=True)
            print(f'{path.name}: {pick}, {img.width}x{img.height}, {path.stat().st_size // 1024} KB')


def main():
    picks = dict(DEFAULT)
    for arg in sys.argv[1:]:
        mode, pick = arg.split('=')
        picks[mode] = pick
    slice_sheets()
    for mode, pick in picks.items():
        export(mode, pick)


if __name__ == '__main__':
    main()
