"""Cut the paytable images out of the shipped symbol sheet.

The HTML paytable/rules modals can't draw from a Pixi spritesheet, so each
frame of static/assets/madscience/symbols/symbols.png is written out as its own
WebP at native size (only un-rotated). Lossy q90 with full-quality alpha: the
modals draw them at ~110 px, and lossless was 1.9 MB against 0.47 MB. The
multiplier plate is bare in the sheet (the game draws the value at runtime,
MultiplierSymbolSprite), so mult.webp gets an example value in the same
tickup-multipliers bitmap font at the same proportions. Rerun after the sheet
or the font is repacked.

    python3 cut_paytable.py
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[3]
SHEET = APP / 'static/assets/madscience/symbols/symbols.json'
OUT = APP / 'static/assets/madscience/paytable'
MULT_FONT = APP / 'static/assets/madscience/tickup-multipliers/tickup-multipliers.xml'
MULT_EXAMPLE = 'x10'
# MultiplierSymbolSprite: glyph row = 55% of the plate height, at most 86% of its width
GLYPH_HEIGHT = 0.55
MAX_ROW = 0.86

# sheet frame -> output name
FRAMES = {
    'h1.png': 'h1',
    'h2.png': 'h2',
    'h3.png': 'h3',
    'h4.png': 'h4',
    'A.png': 'a',
    'K.png': 'k',
    'Q.png': 'q',
    'J.png': 'j',
    'ten.png': 'ten',
    'wild.png': 'wild',
    'bonus.png': 'bonus',
    'bomb.png': 'bomb',
    'cloner.png': 'cloner',
    'mult_symbol_plate.png': 'mult',
}


def draw_multiplier(plate, text):
    """The value row of MultiplierSymbolSprite, centred on the plate by its ink."""
    font = ET.parse(MULT_FONT).getroot()
    size = int(font.find('info').get('size'))
    atlas = Image.open(MULT_FONT.with_name(font.find('pages/page').get('file'))).convert('RGBA')
    chars = {int(c.get('id')): {k: int(v) for k, v in c.attrib.items() if k != 'id'} for c in font.iter('char')}
    scale = plate.height * GLYPH_HEIGHT / size
    width = sum(chars[ord(ch)]['xadvance'] for ch in text) * scale
    scale *= min(1, plate.width * MAX_ROW / width)
    row = Image.new('RGBA', plate.size)
    pen = 0
    for ch in text:
        c = chars[ord(ch)]
        glyph = atlas.crop((c['x'], c['y'], c['x'] + c['width'], c['y'] + c['height']))
        glyph = glyph.resize((round(c['width'] * scale), round(c['height'] * scale)), Image.LANCZOS)
        row.alpha_composite(glyph, (round(pen + c['xoffset'] * scale), round(c['yoffset'] * scale)))
        pen += c['xadvance'] * scale
    ink = row.crop(row.getbbox())
    out = plate.copy()
    out.alpha_composite(ink, ((plate.width - ink.width) // 2, (plate.height - ink.height) // 2))
    return out


def main():
    meta = json.loads(SHEET.read_text())
    sheet = Image.open(SHEET.with_name(meta['meta']['image'])).convert('RGBA')
    OUT.mkdir(exist_ok=True)
    for frame_name, out_name in FRAMES.items():
        entry = meta['frames'][frame_name]
        f = entry['frame']
        if entry.get('rotated'):
            # TexturePacker stores rotated frames turned 90° clockwise, so the
            # sheet region is h x w; turn it back counter-clockwise
            img = sheet.crop((f['x'], f['y'], f['x'] + f['h'], f['y'] + f['w'])).rotate(90, expand=True)
        else:
            img = sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
        assert img.size == (f['w'], f['h']), frame_name
        if out_name == 'mult':
            img = draw_multiplier(img, MULT_EXAMPLE)
        path = OUT / f'{out_name}.webp'
        img.save(path, 'WEBP', quality=90, alpha_quality=100, method=6)
        print(f'{path.name}: {img.size[0]}x{img.size[1]}, {path.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
