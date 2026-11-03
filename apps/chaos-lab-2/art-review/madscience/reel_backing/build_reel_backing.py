"""Mad Science reel backing: what shows inside the frame window when the
symbols are not covering it (the board drops out every spin, cascades open
holes). Three procedural textures, all in BOARD space (555 x 500 world units,
the frame window exactly — frameLayout stretches the frame so its window is
the board), drawn by BoardBacking.svelte under the board:

  panel  a dark lab chamber: green-black, darker toward the edges, low grime,
         faint grooves between the six reels, so an empty board reads as a
         rack rather than a hole into the background
  glow   a soft green light along the window edge, the base game's quieter
         cousin of the free-spins reel-glow fill (that rig lights the gaps on
         top of this one); BoardBacking breathes it
  fog_a/b toxic murk, tileable horizontally with a period of ONE board width,
         drifted sideways as two layers

  python3 build_reel_backing.py <out dir> [preview dir]
"""
import os, sys

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = sys.argv[1]
PREV = sys.argv[2] if len(sys.argv) > 2 else None
BW, BH = 555.0, 500.0          # board, world units
REEL_W = 92.5                  # SYMBOL_WIDTH, the column pitch
PX = 2                         # texture px per world unit (panel, glow)
W, H = int(BW * PX), int(BH * PX)
rng = np.random.default_rng(23)


def fbm(h, w, octaves, base_sigma, wrap_x=False):
    """fractal noise in [0, 1]; wrap_x makes it tile horizontally"""
    acc = np.zeros((h, w))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        n = rng.standard_normal((h, w))
        mode = ('reflect', 'wrap') if wrap_x else 'reflect'
        acc += amp * ndimage.gaussian_filter(n, base_sigma / (2 ** o), mode=mode)
        total += amp
        amp *= 0.55
    acc /= total
    return (acc - acc.min()) / (acc.max() - acc.min())


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


y, x = np.mgrid[0:H, 0:W].astype(np.float64)
u, v = x / W, y / H

# ── panel ──
# elliptical vignette: lit centre, near-black rim
r = np.sqrt(((u - 0.5) / 0.62) ** 2 + ((v - 0.47) / 0.62) ** 2)
light = 1 - smoothstep(0.15, 1.05, r)
grime = fbm(H, W, 5, 60)
lum = 0.30 + 0.70 * light
lum *= 0.88 + 0.24 * grime
# grooves between the reels: a soft dark line with a faint lit lip on its right
gx = (x / PX) % REEL_W
dist = np.minimum(gx, REEL_W - gx)                           # world units to the nearest seam
inner = (x / PX > REEL_W * 0.5) & (x / PX < BW - REEL_W * 0.5)
groove = np.exp(-(dist / 1.6) ** 2) * inner
lip = np.exp(-((gx - 3.0) / 1.4) ** 2) * inner
lum = lum * (1 - 0.55 * groove) + 0.10 * lip
base = np.array([14, 21, 13], np.float64)                     # deep lab green-black
rgb = np.clip(base[None, None, :] * lum[..., None] * 1.25, 0, 255)
panel = np.dstack([rgb, np.full((H, W), 246.0)]).astype(np.uint8)
Image.fromarray(panel).save(f'{OUT}/panel.webp', 'WEBP', quality=88, method=6)

# ── glow ──
d = np.minimum.reduce([x, W - 1 - x, y, H - 1 - y]) / PX      # world units to the window edge
glow_a = 0.34 * np.exp(-d / 18.0) + 0.05 * np.exp(-d / 110.0)
glow_a *= 0.8 + 0.4 * fbm(H, W, 3, 40)
glow = np.zeros((H, W, 4))
glow[..., :3] = np.array([0x79, 0xb5, 0x06])                 # MID green of the FS glow
glow[..., 3] = np.clip(glow_a, 0, 1) * 255
Image.fromarray(glow.astype(np.uint8)).save(f'{OUT}/glow.webp', 'WEBP', quality=90, method=6)

# ── fog ── 1 px per unit, one board width = one period (tiles in x); two
# textures from different noise so the two drifting layers never repeat
FW, FH = int(BW), int(BH)
band = np.exp(-((np.mgrid[0:FH, 0:FW][0] / FH - 0.62) / 0.42) ** 2)   # murk pools low
for name, octaves, sigma in (('fog_a', 4, 38), ('fog_b', 4, 26)):
    wisps = smoothstep(0.5, 0.9, fbm(FH, FW, octaves, sigma, wrap_x=True))
    fog = np.zeros((FH, FW, 4))
    fog[..., :3] = np.array([0x34, 0x52, 0x16])                  # murky, not neon
    fog[..., 3] = np.clip(wisps * (0.25 + 0.75 * band) * 0.6, 0, 1) * 255
    Image.fromarray(fog.astype(np.uint8)).save(f'{OUT}/{name}.webp', 'WEBP', quality=90, method=6)

for name in ('panel', 'glow', 'fog_a', 'fog_b'):
    im = Image.open(f'{OUT}/{name}.webp')
    print(name, im.size, os.path.getsize(f'{OUT}/{name}.webp'), 'bytes')

if PREV:
    # empty board + one with symbols, composited the way the game layers them
    APP = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    S = 2
    bg = Image.open(f'{APP}/static/assets/madscience/bg_v1.png').convert('RGBA')
    frame = Image.open(f'{APP}/static/assets/madscience/frame_resized.png').convert('RGBA')
    fx, fy, fw, fh = 69, 64, 824, 707
    sx, sy = BW * S / fw, BH * S / fh
    FWp, FHp = int(960 * sx), int(879 * sy)
    canvas_w, canvas_h = FWp + 200, FHp + 120
    ox, oy = 100 + int(fx * sx), 60 + int(fy * sy)                 # board origin in the preview
    def scene(with_symbols):
        c = bg.resize((canvas_w, int(canvas_w * bg.height / bg.width))).crop((0, 0, canvas_w, canvas_h))
        layer = Image.new('RGBA', c.size, (0, 0, 0, 0))
        layer.alpha_composite(Image.open(f'{OUT}/panel.webp').convert('RGBA').resize((int(BW * S), int(BH * S))), (ox, oy))
        g = Image.open(f'{OUT}/glow.webp').convert('RGBA').resize((int(BW * S), int(BH * S)))
        g.putalpha(g.getchannel('A').point(lambda a: int(a * 0.8)))
        layer.alpha_composite(g, (ox, oy))
        fo = Image.open(f'{OUT}/fog_a.webp').convert('RGBA').resize((int(BW * S), int(BH * S)))
        fo.putalpha(fo.getchannel('A').point(lambda a: int(a * 0.5)))
        layer.alpha_composite(fo, (ox, oy))
        if with_symbols:
            sym = Image.open(f'{APP}/art-review/static-sources/symbols/raw/K.png').convert('RGBA')
            cw, ch = 92.5 * S, 100 * S
            for col in (2, 4, 5):
                for row in (0, 3, 4):
                    t = sym.resize((int(cw - 2), int(ch - 2)))
                    layer.alpha_composite(t, (ox + int(col * cw) + 1, oy + int(row * ch) + 1))
        c.alpha_composite(layer)
        c.alpha_composite(frame.resize((FWp, FHp)), (100, 60))
        return c
    a, b = scene(False), scene(True)
    out = Image.new('RGB', (a.width * 2 + 20, a.height))
    out.paste(a.convert('RGB'), (0, 0)); out.paste(b.convert('RGB'), (a.width + 20, 0))
    out.thumbnail((1600, 1600)); out.save(f'{PREV}/reel_backing_preview.png')
    print('preview', f'{PREV}/reel_backing_preview.png')
