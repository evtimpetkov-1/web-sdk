import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

// Cell height (row pitch). Also the unit every size ratio is expressed in.
export const SYMBOL_SIZE = 100;

// Delivered symbol art sizes (px). Symbols are drawn at their own aspect, so the
// cell is not square: the column pitch follows the plate art (297x321 for the
// royals, cloner, bomb and the multiplier plate) and the pipe frame is stretched
// to that window instead of the art being stretched to the frame.
const ART = {
	plate: { width: 297, height: 321 }, // A K Q J ten, cloner, bomb
	wild: { width: 301, height: 322 },
	h1: { width: 311, height: 322 },
	h2: { width: 306, height: 323 },
	h3: { width: 304, height: 323 },
	h4: { width: 306, height: 324 },
	bonus: { width: 427, height: 423 }, // bonus.png (operating-theatre disc, 2026-09-08)
	multPlate: { width: 298, height: 322 },
};
export const SYMBOL_WIDTH = (SYMBOL_SIZE * ART.plate.width) / ART.plate.height; // 92.5
// space left between neighbouring plates (the PNGs carry no transparent padding)
export const SYMBOL_GAP = 1;
// the bonus disc is drawn larger than its cell and spills over the neighbours
export const BONUS_SCALE = 1.15;
// vertical headroom the board mask allows beyond the reel window, so an oversized
// bonus on the top/bottom row is hidden by the pipe frame, not cut flat by the mask
export const SYMBOL_OVERFLOW = SYMBOL_SIZE * 0.1;

// reel centre in cells: reels are centred in their column (the sample's 0.53 offset
// left a gap on the left of reel 1 and pushed reel 6 under the frame)
export const REEL_PADDING = 0.5;

// frame_resized.png: 960x879 with a transparent reel window at x 69..892, y 64..770
export const FRAME_ART = {
	width: 960,
	height: 879,
	window: { x: 69, y: 64, width: 824, height: 707 },
};

// initial board (padded top and bottom)
export const INITIAL_BOARD: RawSymbol[][] = [
	// laid out after Evtim's board mockup (2026-09-02): wilds, bonus, cloner, bomb and two
	// multipliers (x5, x10 — placeholders until the math emits them) mixed in;
	// each reel = [top padding, rows 1-5, bottom padding]
	[{ name: 'H2' }, { name: 'W' }, { name: 'H1' }, { name: 'H4' }, { name: 'H2' }, { name: 'W' }, { name: 'L1' }],
	[{ name: 'L3' }, { name: 'H3' }, { name: 'S', scatter: true }, { name: 'L4' }, { name: 'S', scatter: true }, { name: 'L2' }, { name: 'H3' }],
	[{ name: 'H1' }, { name: 'H4' }, { name: 'L4' }, { name: 'B' }, { name: 'H1' }, { name: 'L3' }, { name: 'L2' }],
	[{ name: 'L2' }, { name: 'L1' }, { name: 'C' }, { name: 'L3' }, { name: 'W' }, { name: 'H3' }, { name: 'H4' }],
	[{ name: 'H4' }, { name: 'H2' }, { name: 'H3' }, { name: 'M', multiplier: 5 }, { name: 'S', scatter: true }, { name: 'H5' }, { name: 'L1' }],
	[{ name: 'L2' }, { name: 'W' }, { name: 'M', multiplier: 10 }, { name: 'H5' }, { name: 'H2' }, { name: 'H4' }, { name: 'H1' }],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_WIDTH * BOARD_DIMENSIONS.x,
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

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'H5'];

// Symbols that skip the generic win FX (overload charge): scatters have their own
// trigger celebration, multipliers are collected by the multiplier board.
export const WIN_CHARGE_EXCLUDED: string[] = ['S', 'M'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

const SPIN_OPTIONS_SHARED = {
	reelFallInDelay: 80,
	reelPaddingMultiplierNormal: 1.25,
	reelPaddingMultiplierAnticipated: 18,
	reelFallOutDelay: 145,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 3.5,
	symbolFallInInterval: 30,
	symbolFallInBounceSpeed: 0.15,
	symbolFallInBounceSizeMulti: 0.5,
	symbolFallOutSpeed: 3.5,
	symbolFallOutInterval: 20,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 7,
	symbolFallInInterval: 0,
	symbolFallInBounceSpeed: 0.3,
	symbolFallInBounceSizeMulti: 0.25,
	symbolFallOutSpeed: 7,
	symbolFallOutInterval: 0,
};

export const MOTION_BLUR_VELOCITY = 31;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

// Size ratios are in SYMBOL_SIZE units on both axes. Each symbol keeps the aspect of
// its art: it is fitted inside the cell minus the gap (height-bound for every plate),
// optionally scaled up (bonus). The rigs' skeleton boxes equal the PNG sizes, so a
// static sprite and its spine land on the same pixels — no jump at the swap.
type ArtSize = { width: number; height: number };
const fitSymbol = (art: ArtSize, scale = 1) => {
	const box = { width: SYMBOL_WIDTH - SYMBOL_GAP, height: SYMBOL_SIZE - SYMBOL_GAP };
	const k = Math.min(box.width / art.width, box.height / art.height) * scale;
	return { width: (art.width * k) / SYMBOL_SIZE, height: (art.height * k) / SYMBOL_SIZE };
};
const sprite = (assetKey: string, art: ArtSize, scale = 1) => ({
	type: 'sprite' as const,
	assetKey,
	sizeRatios: fitSymbol(art, scale),
});
const spine = (
	assetKey: string,
	animationName: 'land' | 'prewin' | 'idle',
	art: ArtSize,
	scale = 1,
) => ({
	type: 'spine' as const,
	assetKey,
	animationName,
	sizeRatios: fitSymbol(art, scale),
});
// static plate + land/prewin rig; `idle` is the rig's pending loop where the
// symbol has one (the scatter), the static plate otherwise. `scale` applies to
// sprite and spine alike so the swap never jumps.
const rigged = (
	staticKey: string,
	animKey: string,
	art: ArtSize,
	{ scale = 1, idle = false }: { scale?: number; idle?: boolean } = {},
) => {
	const still = sprite(staticKey, art, scale);
	return {
		explosion: still,
		win: spine(animKey, 'prewin', art, scale),
		postWinStatic: still,
		static: still,
		spin: still,
		land: spine(animKey, 'land', art, scale),
		idle: idle ? spine(animKey, 'idle', art, scale) : still,
	};
};
const allStates = <T>(info: T) => ({
	explosion: info,
	win: info,
	postWinStatic: info,
	static: info,
	spin: info,
	land: info,
	idle: info,
});

export const SYMBOL_INFO_MAP = {
	H1: rigged('h1.png', 'msH1Anim', ART.h1),
	H2: rigged('h2.png', 'msH2Anim', ART.h2),
	H3: rigged('h3.png', 'msH3Anim', ART.h3),
	H4: rigged('h4.png', 'msH4Anim', ART.h4),
	H5: rigged('A.png', 'msAAnim', ART.plate),
	L1: rigged('K.png', 'msKAnim', ART.plate),
	L2: rigged('Q.png', 'msQAnim', ART.plate),
	L3: rigged('J.png', 'msJAnim', ART.plate),
	L4: rigged('ten.png', 'msTenAnim', ART.plate),
	W: allStates(sprite('wild.png', ART.wild)),
	C: rigged('cloner.png', 'msClonerAnim', ART.plate),
	B: rigged('bomb.png', 'msBombAnim', ART.plate),
	// Scatter: the operating-theatre disc, drawn BONUS_SCALE larger than its cell.
	// land = the sign slams in, prewin = the lamp switches on over the table,
	// idle = lamp sway + breathing bulbs while a round waits for its cascades
	// (ReelSymbol/TumbleSymbol derive that state from stateGame.roundActive).
	S: rigged('bonus.png', 'msBonusAnim', ART.bonus, { scale: BONUS_SCALE, idle: true }),
	// Multiplier symbol: riveted plate + the value in the tickup-multipliers
	// bitmap font, composed at runtime (MultiplierSymbolSprite) so any value
	// works. Once collected onto the plate above the reels the cell keeps the
	// bare plate.
	M: allStates({
		type: 'multiplier' as const,
		assetKey: 'mult_symbol_plate.png',
		sizeRatios: fitSymbol(ART.multPlate),
	}),
	M_TAKEN: allStates(sprite('mult_symbol_plate.png', ART.multPlate)),
} as const;


export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
