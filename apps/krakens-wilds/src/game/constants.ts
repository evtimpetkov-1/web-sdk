import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

export const SYMBOL_SIZE = 128;
// Grid pitch (cell spacing) — wider than the symbol display size so the 5x3
// grid fills the frame opening with real gaps between symbols.
export const CELL_W = 131;
export const CELL_H = 137;

export const REEL_PADDING = 0.53;

// initial board (padded top and bottom)
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'H3' }, { name: 'L3' }],
	[{ name: 'H2' }, { name: 'L2' }, { name: 'W' }, { name: 'L4' }, { name: 'H4' }],
	[{ name: 'L4' }, { name: 'H4' }, { name: 'S' }, { name: 'H1' }, { name: 'L1' }],
	[{ name: 'H3' }, { name: 'L3' }, { name: 'H2' }, { name: 'L2' }, { name: 'H1' }],
	[{ name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'H4' }, { name: 'L3' }],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: CELL_W * BOARD_DIMENSIONS.x,
	height: CELL_H * BOARD_DIMENSIONS.y,
};

export const BACKGROUND_RATIO = 2039 / 1000;
export const PORTRAIT_BACKGROUND_RATIO = 1242 / 2208;
const PORTRAIT_RATIO = 800 / 1422;
const LANDSCAPE_RATIO = 1600 / 900;
const DESKTOP_RATIO = 1422 / 800;

const DESKTOP_HEIGHT = 800;
const LANDSCAPE_HEIGHT = 900;
const PORTRAIT_HEIGHT = 1422;
export const DESKTOP_MAIN_SIZES = { width: DESKTOP_HEIGHT * DESKTOP_RATIO, height: DESKTOP_HEIGHT };
export const LANDSCAPE_MAIN_SIZES = {
	width: LANDSCAPE_HEIGHT * LANDSCAPE_RATIO,
	height: LANDSCAPE_HEIGHT,
};
export const PORTRAIT_MAIN_SIZES = {
	width: PORTRAIT_HEIGHT * PORTRAIT_RATIO,
	height: PORTRAIT_HEIGHT,
};

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// Symbol sizing follows the reference games (lines/ways/cluster/scatter):
// `sizeRatios` are fractions of SYMBOL_SIZE and are applied as absolute
// width/height, NOT as a scale factor. This decouples display size from asset
// resolution — re-export the art at any pixel size and nothing on screen moves.
// (The previous `scale` field multiplied the source canvas size, so resizing the
// art silently resized every symbol.)
//
// Statics use the art's own aspect so nothing is deformed. Spine ratios are
// square because every symbol skeleton is a uniform 1400x1400 box; they are
// measured so the spine matches the static footprint at the sprite→spine swap.
// Derived directly from the art. symbols.json is authored at 2.43x logical size
// and tagged `meta.scale: "2.43"`, so Pixi reports each texture's logical size as
// sourceSize/2.43 and the sprite's own scale comes out exactly 1.0.
//
// Why 2.43: that is the most device pixels per world unit the board is ever drawn
// at (desktop 1920 @dpr2 — portrait needs only 1.47, mobile landscape 1.52). Art
// sized to the maximum is never magnified, and minified as little as possible
// everywhere else. Anything larger is wasted pixels that get thrown away at draw
// time, which is what chews up symbol edges.
//
// Regenerating: keep every symbol at the same multiple of its logical size, set
// meta.scale to that multiple, and recompute these four lines.
const staticRatios = {
	high: { width: 1.0609568, height: 1.1574074 }, // 330x360 art / 2.43
	low: { width: 1.3278035, height: 1.3374486 }, // 413x416 / 2.43
	s: { width: 1.0513117, height: 1.0770319 }, // 327x335 / 2.43
	c: { width: 0.9870113, height: 1.0063014 }, // 307x313 / 2.43 (coin plate matches H plates)
	w: { width: 0.9516461, height: 0.935571 }, // 296x291 / 2.43
} as const;

const spineRatio = (r: number) => ({ width: r, height: r });

const SPIN_OPTIONS_SHARED = {
	reelBounceBackSpeed: 0.15,
	reelSpinSpeedBeforeBounce: 4,
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 10,
	reelSpinDelay: 100,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 5,
	reelSpinSpeed: 3,
	reelBounceSizeMulti: 0.3,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 5,
	reelSpinSpeed: 5,
	reelBounceSizeMulti: 0.05,
};

export const MOTION_BLUR_VELOCITY = 31;

/**
 * Every value a Coin symbol can carry, as a multiple of the total bet (spec v2).
 * The paytable and the rules quote the range off this list rather than repeating
 * the numbers in prose.
 */
export const COIN_MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50, 100] as const;

// Win frame (spines/payframe) sizing, derived from the CELL PITCH so the frame
// tiles with the grid.
//
// SpineProvider scales per axis (scale = prop / skeletonData.<dim>) against the
// skeleton's nominal 220x220 box. Passing BOTH width and height is required: with
// width alone the scale is uniform, which cannot fit a square-ish frame onto a
// non-square cell (CELL_W 131 x CELL_H 137).
//
// What has to land on the cell pitch is the BRIGHT LINE the eye reads as the frame
// edge — not the art's bounding box, which also contains the soft outer glow. That
// line belongs to the `1x1_frame` attachment and is measured, not guessed:
//
//   quad         215 x 199 skeleton units (attachment width/height)
//   trimmed art  211 x 197 inside it, centred (atlas offsets 2,1)
//   bright line  centres at x 9..201 and y 3..193 of that art
//                => spans of 193 x 191 art units, symmetric about the origin
//   main_atc     scaleY 0.98 -> the vertical span is 191 * 0.98 on screen
//
// Aligning the line CENTRES to the pitch means two neighbouring winning cells draw
// their shared edge as one line of normal thickness, and diagonal neighbours meet
// exactly at the corner. The pulsing `1x1_frame_2`/`_3` attachments (235x233 and
// 251x249) sit outside the line by design and are meant to bleed past the cell.
//
// The previous numbers took the spans from the art's trim box (207x195) and then
// biased the axes (x 1.08, y 0.97). That left the vertical edge ~5% short of the
// pitch while x overlapped, so diagonal corners missed each other.
const WIN_FRAME_LINE_X = 193;
const WIN_FRAME_LINE_Y = 191 * 0.98; // main_atc scaleY
// 1 = the bright line sits exactly on the cell pitch. The only knob to touch.
const WIN_FRAME_FILL = 1;
export const WIN_FRAME_WIDTH = (220 / WIN_FRAME_LINE_X) * CELL_W * WIN_FRAME_FILL;
export const WIN_FRAME_HEIGHT = (220 / WIN_FRAME_LINE_Y) * CELL_H * WIN_FRAME_FILL;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

// yOffset is in WORLD units (added straight to y): the h1/h3/h4 art is not
// vertically centered in its canvas (trim data), so the sprite is lifted to
// center the visible art in the cell — matching the spines, which the slicer
// centers on the skeleton origin.
const h1Static = { type: 'sprite', assetKey: 'h1', sizeRatios: staticRatios.high, yOffset: -5.98 };
const h2Static = { type: 'sprite', assetKey: 'h2', sizeRatios: staticRatios.high };
const h3Static = { type: 'sprite', assetKey: 'h3', sizeRatios: staticRatios.high, yOffset: -4.6 };
const h4Static = { type: 'sprite', assetKey: 'h4', sizeRatios: staticRatios.high, yOffset: -8.51 };
const l1Static = { type: 'sprite', assetKey: 'l1', sizeRatios: staticRatios.low };
const l2Static = { type: 'sprite', assetKey: 'l2', sizeRatios: staticRatios.low };
const l3Static = { type: 'sprite', assetKey: 'l3', sizeRatios: staticRatios.low };
const l4Static = { type: 'sprite', assetKey: 'l4', sizeRatios: staticRatios.low };
const sStatic = { type: 'sprite', assetKey: 's', sizeRatios: staticRatios.s };
const wStatic = { type: 'sprite', assetKey: 'w', sizeRatios: staticRatios.w };

const cStatic = { type: 'sprite', assetKey: 'c', sizeRatios: staticRatios.c };

const W_SPINE_RATIOS = spineRatio(1.5181);
// measured so the spine's coin_art (879 skeleton units) lands on the static's
// 121.6-world-unit plate, same method as the other symbols
const C_SPINE_RATIOS = spineRatio(1.513);
const S_SPINE_RATIOS = spineRatio(1.6888);

export const SYMBOL_INFO_MAP = {
	H1: {
		win: {
			type: 'spine',
			assetKey: 'H1',
			animationName: 'h1',
			sizeRatios: spineRatio(1.4328), // spine art 873x950 world units
		},
		postWinStatic: h1Static,
		static: h1Static,
		spin: h1Static,
		land: h1Static,
	},
	H2: {
		win: {
			type: 'spine',
			assetKey: 'H2',
			animationName: 'h2',
			sizeRatios: spineRatio(1.4678), // spine art 1018x1001 world units
		},
		postWinStatic: h2Static,
		static: h2Static,
		spin: h2Static,
		land: h2Static,
	},
	H3: {
		win: {
			type: 'spine',
			assetKey: 'H3',
			animationName: 'h3',
			sizeRatios: spineRatio(1.4306), // spine art 865x934 world units
		},
		postWinStatic: h3Static,
		static: h3Static,
		spin: h3Static,
		land: h3Static,
	},
	H4: {
		win: {
			type: 'spine',
			assetKey: 'H4',
			animationName: 'h4',
			sizeRatios: spineRatio(1.4536), // spine art 858x881 world units
		},
		postWinStatic: h4Static,
		static: h4Static,
		spin: h4Static,
		land: h4Static,
	},
	L1: {
		win: {
			type: 'spine',
			assetKey: 'L1',
			animationName: 'l1',
			sizeRatios: spineRatio(1.5302), // spine art 577x568 world units
		},
		postWinStatic: l1Static,
		static: l1Static,
		spin: l1Static,
		land: l1Static,
	},
	L2: {
		win: {
			type: 'spine',
			assetKey: 'L2',
			animationName: 'l2',
			sizeRatios: spineRatio(1.5291), // spine art 580x566 world units
		},
		postWinStatic: l2Static,
		static: l2Static,
		spin: l2Static,
		land: l2Static,
	},
	L3: {
		win: {
			type: 'spine',
			assetKey: 'L3',
			animationName: 'l3',
			sizeRatios: spineRatio(1.5969), // spine art 530x568 world units
		},
		postWinStatic: l3Static,
		static: l3Static,
		spin: l3Static,
		land: l3Static,
	},
	L4: {
		win: {
			type: 'spine',
			assetKey: 'L4',
			animationName: 'l4',
			sizeRatios: spineRatio(1.5553), // spine art 442x566 world units
		},
		postWinStatic: l4Static,
		static: l4Static,
		spin: l4Static,
		land: l4Static,
	},
	W: {
		postWinStatic: wStatic,
		static: wStatic,
		spin: wStatic,
		win: { type: 'spine', assetKey: 'W', animationName: 'wild_win', sizeRatios: W_SPINE_RATIOS },
		land: {
			type: 'spine',
			assetKey: 'W',
			animationName: 'wild_land',
			sizeRatios: W_SPINE_RATIOS,
		},
		idle: {
			type: 'spine',
			assetKey: 'W',
			animationName: 'wild_idle',
			sizeRatios: W_SPINE_RATIOS,
		},
	},
	S: {
		postWinStatic: sStatic,
		static: sStatic,
		spin: sStatic,
		win: { type: 'spine', assetKey: 'S', animationName: 'scatter_win', sizeRatios: S_SPINE_RATIOS },
		land: {
			type: 'spine',
			assetKey: 'S',
			animationName: 'scatter_land',
			sizeRatios: S_SPINE_RATIOS,
		},
		idle: {
			type: 'spine',
			assetKey: 'S',
			animationName: 'scatter_idle',
			sizeRatios: S_SPINE_RATIOS,
		},
	},
	C: {
		postWinStatic: cStatic,
		static: cStatic,
		spin: cStatic,
		win: { type: 'spine', assetKey: 'C', animationName: 'coin_win', sizeRatios: C_SPINE_RATIOS },
		land: { type: 'spine', assetKey: 'C', animationName: 'coin_land', sizeRatios: C_SPINE_RATIOS },
		idle: { type: 'spine', assetKey: 'C', animationName: 'coin_idle', sizeRatios: C_SPINE_RATIOS },
	},
} as const;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
} as const;
