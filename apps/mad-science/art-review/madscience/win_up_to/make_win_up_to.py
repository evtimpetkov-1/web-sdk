"""The intro's "WIN UP TO 22 924 X" banner (LoadingScreen, between the panels
and the prompt). 22,924x = Overcharged Free Spins' top win on the Stake
dashboard for the rebalanced math (2026-10-28).

    python3 make_win_up_to.py

Source: src/win_up_to.png (Evtim, iCloud MyDrive/Mad Science/static, 2152x731,
transparent). Its alpha carries cut-out speckle (alpha <= SPECKLE) out to the
edges: cleared, then the art is cropped to its letters + PAD px. Encoded with
cwebp -sharp_yuv (plain lossy WebP smears saturated green; see the cart disc,
make_buy_button.py), alpha at full quality. Full resolution is kept: the
banner is drawn up to ~1000 CSS px wide on a 1440p desktop, x2 on retina.
"""

import subprocess
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
SRC = HERE / 'src' / 'win_up_to.png'
OUT = HERE.parents[2] / 'static' / 'assets' / 'madscience' / 'win_up_to.webp'
SPECKLE = 2
PAD = 6
QUALITY = 92


def main():
    im = Image.open(SRC).convert('RGBA')
    alpha = im.getchannel('A').point(lambda v: 0 if v <= SPECKLE else v)
    im.putalpha(alpha)
    left, top, right, bottom = alpha.getbbox()
    box = (
        max(0, left - PAD),
        max(0, top - PAD),
        min(im.width, right + PAD),
        min(im.height, bottom + PAD),
    )
    cropped = im.crop(box)
    tmp = HERE / 'win_up_to_cropped.png'
    cropped.save(tmp)
    subprocess.run(
        ['cwebp', '-q', str(QUALITY), '-sharp_yuv', '-alpha_q', '100', '-m', '6',
         '-quiet', str(tmp), '-o', str(OUT)],
        check=True,
    )
    print(f'{OUT.name}: {cropped.width}x{cropped.height}, {OUT.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
