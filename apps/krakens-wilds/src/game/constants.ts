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

// Uniform per-symbol render scales (x === y — art is never deformed).
// Statics are hand-tuned. Spine scales are measured so the spine art matches
// the static art size exactly at the sprite→spine swap:
//   spineScale = (static art px height * static scale) / (spine art height in world units)
// with the spine art heights measured from a rendered setup pose at 1 world unit = 1 px.
const STATIC_SCALE_HIGH = 0.23; // H1-H4
const STATIC_SCALE_SW = 0.2; // S + W
const STATIC_SCALE_LOW = 0.35; // L1-L4

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

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

// yOffset (source-canvas px, scaled at render): the h1/h3/h4 art is not
// vertically centered in its canvas (trim data), so the sprite is lifted to
// center the visible art in the cell — matching the spines, which the slicer
// centers on the skeleton origin.
const h1Static = { type: 'sprite', assetKey: 'h1', scale: STATIC_SCALE_HIGH, yOffset: -26 };
const h2Static = { type: 'sprite', assetKey: 'h2', scale: STATIC_SCALE_HIGH };
const h3Static = { type: 'sprite', assetKey: 'h3', scale: STATIC_SCALE_HIGH, yOffset: -20 };
const h4Static = { type: 'sprite', assetKey: 'h4', scale: STATIC_SCALE_HIGH, yOffset: -37 };
const l1Static = { type: 'sprite', assetKey: 'l1', scale: STATIC_SCALE_LOW };
const l2Static = { type: 'sprite', assetKey: 'l2', scale: STATIC_SCALE_LOW };
const l3Static = { type: 'sprite', assetKey: 'l3', scale: STATIC_SCALE_LOW };
const l4Static = { type: 'sprite', assetKey: 'l4', scale: STATIC_SCALE_LOW };
const sStatic = { type: 'sprite', assetKey: 's', scale: STATIC_SCALE_SW };
const wStatic = { type: 'sprite', assetKey: 'w', scale: STATIC_SCALE_SW };

// Measured spine art (world units): W 876x863, S 875x894
const W_SPINE_SCALE = 0.1388;
const S_SPINE_SCALE = 0.1544;

export const SYMBOL_INFO_MAP = {
	H1: {
		win: {
			type: 'spine',
			assetKey: 'H1',
			animationName: 'h1',
			scale: 0.131, // spine art 873x950 world units; static 541px @ 0.23
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
			scale: 0.1342, // spine art 1018x1001 world units; static 584px @ 0.23
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
			scale: 0.1308, // spine art 865x934 world units; static 531px @ 0.23
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
			scale: 0.1329, // spine art 858x881 world units; static 509px @ 0.23
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
			scale: 0.1399, // spine art 577x568 world units
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
			scale: 0.1398, // spine art 580x566 world units
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
			scale: 0.146, // spine art 530x568 world units
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
			scale: 0.1422, // spine art 442x566 world units
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
		win: { type: 'spine', assetKey: 'W', animationName: 'wild_win', scale: W_SPINE_SCALE },
		land: {
			type: 'spine',
			assetKey: 'W',
			animationName: 'wild_land',
			scale: W_SPINE_SCALE,
		},
		idle: {
			type: 'spine',
			assetKey: 'W',
			animationName: 'wild_idle',
			scale: W_SPINE_SCALE,
		},
	},
	S: {
		postWinStatic: sStatic,
		static: sStatic,
		spin: sStatic,
		win: { type: 'spine', assetKey: 'S', animationName: 'scatter_win', scale: S_SPINE_SCALE },
		land: {
			type: 'spine',
			assetKey: 'S',
			animationName: 'scatter_land',
			scale: S_SPINE_SCALE,
		},
		idle: {
			type: 'spine',
			assetKey: 'S',
			animationName: 'scatter_idle',
			scale: S_SPINE_SCALE,
		},
	},
} as const;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
} as const;
