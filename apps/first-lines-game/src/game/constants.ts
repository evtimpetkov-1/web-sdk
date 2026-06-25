import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

export const SYMBOL_SIZE = 120;

export const REEL_PADDING = 0.53;

// initial board (padded top and bottom — 5 reels × 5 rows, rows 0 and 4 are off-screen padding)
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L2' }, { name: 'H1' }, { name: 'L4' }, { name: 'H3' }, { name: 'L1' }],
	[{ name: 'H2' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L4' }],
	[{ name: 'L3' }, { name: 'L1' }, { name: 'H1' }, { name: 'L2' }, { name: 'L4' }],
	[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }],
	[{ name: 'L1' }, { name: 'L2' }, { name: 'H2' }, { name: 'H1' }, { name: 'L3' }],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
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

const SPIN_OPTIONS_SHARED = {
	reelBounceBackSpeed: 0.15,
	reelSpinSpeedBeforeBounce: 4,
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 10,
	reelSpinDelay: 145,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 2,
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

// Symbol sprite definitions — frame names match symbolsStatic spritesheet
// symbol_0=W, 1-4=H1-H4, 5-8=L1-L4, 9=CASH, 10=COLLECT, 11=DYNAMITE, 12=STONE, 13=MULT
const SYMBOL_SCALE = 0.82;
const sym = (frame: string) => ({ type: 'sprite', assetKey: frame, sizeRatios: { width: SYMBOL_SCALE, height: SYMBOL_SCALE } });

const wSprite = sym('symbol_0.png');
const h1Sprite = sym('symbol_1.png');
const h2Sprite = sym('symbol_2.png');
const h3Sprite = sym('symbol_3.png');
const h4Sprite = sym('symbol_4.png');
const l1Sprite = sym('symbol_5.png');
const l2Sprite = sym('symbol_6.png');
const l3Sprite = sym('symbol_7.png');
const l4Sprite = sym('symbol_8.png');
const cashSprite = sym('symbol_9.png');
const collectSprite = sym('symbol_10.png');
const dynamiteSprite = sym('symbol_11.png');
const stoneSprite = sym('symbol_12.png');
const multSprite = sym('symbol_13.png');

const allStates = (sprite: ReturnType<typeof sym>) => ({
	static: sprite,
	spin: sprite,
	land: sprite,
	win: sprite,
	postWinStatic: sprite,
	explosion: sprite,
});

export const SYMBOL_INFO_MAP = {
	W: allStates(wSprite),
	H1: allStates(h1Sprite),
	H2: allStates(h2Sprite),
	H3: allStates(h3Sprite),
	H4: allStates(h4Sprite),
	L1: allStates(l1Sprite),
	L2: allStates(l2Sprite),
	L3: allStates(l3Sprite),
	L4: allStates(l4Sprite),
	CASH: allStates(cashSprite),
	COLLECT: allStates(collectSprite),
	DYNAMITE: allStates(dynamiteSprite),
	STONE: allStates(stoneSprite),
	MULT: allStates(multSprite),
} as const;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
