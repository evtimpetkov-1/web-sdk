"""Evtim's curtains_v2.png (2026-10-23, src/) cut into the two halves the game's
curtain (Transition.svelte) tiles across the screen.

The art is a 1024x1536 hospital curtain: a rod with finials and rings across
the top, two halves meeting over a dark backing strip. Each half is cropped
from the top of its rings to below the hem, WITHOUT the rod's finials, so its
crop carries a plain stretch of rod: halves tiled side by side read as one
continuous rod at any screen width. Nothing is repainted or resized; the cut
only drops the finials, the backing strip and the outer flare of the hem.

  python3 cut_curtain.py <out dir> [preview dir]
"""
import os, sys
from PIL import Image

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'curtains_v2.png')
OUT = sys.argv[1]
PREV = sys.argv[2] if len(sys.argv) > 2 else None
Y0, Y1 = 70, 1440                 # ring tops .. just under the hem
LEFT = (83, 516)                  # top of the fabric .. the backing strip
RIGHT = (544, 961)                # after the backing strip .. before the right finial

art = Image.open(SRC).convert('RGBA')
halves = {'left': art.crop((LEFT[0], Y0, LEFT[1], Y1)), 'right': art.crop((RIGHT[0], Y0, RIGHT[1], Y1))}
for name, im in halves.items():
    p = f'{OUT}/curtain_{name}.webp'
    im.save(p, 'WEBP', lossless=True, quality=100, method=6)
    print(name, im.size, os.path.getsize(p) // 1024, 'KB')

if PREV:
    # the closed pose as Transition.svelte lays it out, on a landscape and a portrait canvas
    def closed(cw, ch):
        c = Image.new('RGBA', (cw, ch), (0, 0, 0, 255))
        s = ch * 1.03 / (Y1 - Y0)
        L = halves['left'].resize((round(halves['left'].width * s), round(halves['left'].height * s)), Image.LANCZOS)
        R = halves['right'].resize((round(halves['right'].width * s), round(halves['right'].height * s)), Image.LANCZOS)
        Lm, Rm = L.transpose(Image.FLIP_LEFT_RIGHT), R.transpose(Image.FLIP_LEFT_RIGHT)
        OVER = round(6 * s); CENTER = round(10 * s)
        top = round(-ch * 0.01)
        for side in ('left', 'right'):
            edge = cw / 2 + (CENTER / 2 if side == 'left' else -CENTER / 2)
            panels = []
            x = edge; i = 0
            while (side == 'left' and x > -10) or (side == 'right' and x < cw + 10):
                tex = (L if side == 'left' else R) if i % 2 == 0 else (Rm if side == 'left' else Lm)
                panels.append((tex, round(x - tex.width) if side == 'left' else round(x)))
                x = x - tex.width + OVER if side == 'left' else x + tex.width - OVER
                i += 1
            for tex, px in reversed(panels):       # outer first, inner on top
                c.alpha_composite(tex, (px, top))
        return c
    land, port = closed(1600, 900), closed(390, 844)
    out = Image.new('RGB', (1600 + 20 + int(390 * 900 / 844), 900), (30, 30, 30))
    out.paste(land.convert('RGB'), (0, 0))
    out.paste(port.convert('RGB').resize((int(390 * 900 / 844), 900)), (1620, 0))
    out.thumbnail((1800, 1800)); out.save(f'{PREV}/curtain_v2_closed.png')
    print('preview', f'{PREV}/curtain_v2_closed.png')
