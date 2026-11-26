import type { RawSymbol, SymbolName, SymbolState, BagKey } from './types';
import { FRAME_ART, SYMBOL_ART, BAG_ART } from './heistArt';

// Shown in the paytable and rules footers. 0.x = in development; 1.0.0 = the
// first submission (Kraken's numbering, bumped on each resubmission).
export const GAME_VERSION = '0.1.0';

// 6 reels x 4 rows (the Expand pot's 6x6 board is not built yet)
export const BOARD_DIMENSIONS = { x: 6, y: 4 };

// Cell height (row pitch). Also the unit every size ratio is expressed in.
export const SYMBOL_SIZE = 100;
/** frame-art px per board unit: the art's cell height is one SYMBOL_SIZE */
export const FRAME_UNIT = FRAME_ART.cells.height / BOARD_DIMENSIONS.y / SYMBOL_SIZE;
// the column pitch follows the frame art's own cells (198 x 193 px), so the painted
// grid lines fall between the symbols and nothing is stretched
export const SYMBOL_WIDTH = FRAME_ART.cells.width / BOARD_DIMENSIONS.x / FRAME_UNIT;

export const BOARD_SIZES = {
	width: SYMBOL_WIDTH * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

/** The frame art around the board, board-local units (origin = the cells' top-left). */
export const FRAME_BOX = {
	x: -FRAME_ART.cells.x / FRAME_UNIT,
	y: -FRAME_ART.cells.y / FRAME_UNIT,
	width: FRAME_ART.width / FRAME_UNIT,
	height: FRAME_ART.height / FRAME_UNIT,
};
// How far the steel border covers past the cells, top and bottom (frame.png: steel
// over y 24-59 and 832-865). The board mask reaches this far, so a spinning symbol
// leaves under the steel instead of being cut at the cells' edge.
export const FRAME_COVER = 14;

/**
 * The loot bags stand on the frame's top edge (Evtim's preview). Board-local units.
 * `width`: the empty bag's width; `sink`: how far its ground line sits below the
 * frame's top; `centres`: the three bags along the frame.
 */
const BAG_WIDTH = FRAME_BOX.width * 0.3;
const BAG_SINK = 12;
const BAG_CENTRES: Record<BagKey, number> = { cash: 1 / 6, gem: 1 / 2, gold: 5 / 6 };
const bagLayout = (key: BagKey) => {
	const art = BAG_ART[key];
	const [x0, , x1] = art.bagBox;
	const [width, height] = art.canvas;
	const scale = BAG_WIDTH / (x1 - x0);
	const ground = FRAME_BOX.y + BAG_SINK;
	return {
		key,
		scale,
		// the rig's origin is its canvas centre
		x: FRAME_BOX.x + FRAME_BOX.width * BAG_CENTRES[key] + (width / 2 - (x0 + x1) / 2) * scale,
		y: ground - (art.groundY - height / 2) * scale,
		width: width * scale,
		height: height * scale,
		/** the top of the loot at level 1-5 */
		tops: art.topY.map((topY) => ground - (art.groundY - topY) * scale),
		/** where a pot symbol flies to: the bag's mouth */
		mouth: { x: FRAME_BOX.x + FRAME_BOX.width * BAG_CENTRES[key], y: ground - (art.groundY - art.rimY) * scale },
	};
};
export const BAG_LAYOUT = { cash: bagLayout('cash'), gem: bagLayout('gem'), gold: bagLayout('gold') };
/** the highest any bag's loot reaches (level 5), board-local y: the layout keeps it on screen */
export const BAGS_TOP = Math.min(...Object.values(BAG_LAYOUT).flatMap((bag) => bag.tops));
export const BAG_LEVELS = 5;

// initial board, each reel = [top padding, rows 1-4, bottom padding]. Laid out after
// Evtim's preview (preview_2.png). No win and no Collect + Coin pair that would pay.
const s = (name: SymbolName): RawSymbol => ({ name });
export const INITIAL_BOARD: RawSymbol[][] = [
	[s('L3'), s('H2'), s('L1'), s('L1'), s('L3'), s('H4')],
	[s('H1'), s('L2'), s('H3'), s('H5'), s('P2'), s('L5')],
	[s('L4'), s('H1'), s('L5'), s('L3'), s('H3'), s('L2')],
	[s('H2'), s('W'), s('L5'), s('P1'), s('L5'), s('H5')],
	[s('L1'), s('L4'), s('P3'), s('L4'), s('H2'), s('L3')],
	[s('L2'), s('H1'), s('L2'), s('H4'), s('H4'), s('L1')],
];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// speeds in board units / ms (the shared spinning reel)
const SPIN_OPTIONS_SHARED = {
	reelBounceBackSpeed: 0.15,
	reelSpinSpeedBeforeBounce: 4,
	reelPaddingMultiplierNormal: 1.2,
	reelPaddingMultiplierAnticipated: 10,
	reelSpinDelay: 90,
};
export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 5,
	reelSpinSpeed: 3.2,
	reelBounceSizeMulti: 0.25,
};
export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	reelPreSpinSpeed: 5,
	reelSpinSpeed: 5,
	reelBounceSizeMulti: 0.05,
};

/**
 * Symbol layout. A tiled symbol (royals, thieves) is fitted by its TILE into the tile
 * box, so every tile is one size whatever its canvas holds around it (a thief's head
 * stands out over his tile); an object (Wild, Coin, Collect, the pot symbols) is fitted
 * by its ink into the tile box x its own factor, read off Evtim's preview. The picture
 * is drawn at `sizeRatios` (in SYMBOL_SIZE units) about the cell centre + `offset`.
 * Rigs are built on their static's canvas (1 rig unit = 1 static px), so a static
 * picture and its rig land on the same pixels: no jump when a rig takes over.
 */
// the tile's share of the cell (preview_2.png: about 0.8; the grid shows between tiles)
const TILE_FILL = 0.82;
const TILE_BOX = { width: SYMBOL_WIDTH * TILE_FILL, height: SYMBOL_SIZE * TILE_FILL };
const OBJECT_FIT: Partial<Record<SymbolName, number>> = { W: 1, C: 1.02, CL: 1.16, P1: 1.12, P2: 1.12, P3: 1.1 };

type Art = (typeof SYMBOL_ART)[SymbolName];
const fit = (art: Art, factor = 1) => {
	const [width, height] = art.canvas;
	const [x0, y0, x1, y1] = art.box;
	const k = Math.min((TILE_BOX.width * factor) / (x1 - x0), (TILE_BOX.height * factor) / (y1 - y0));
	return {
		sizeRatios: { width: (width * k) / SYMBOL_SIZE, height: (height * k) / SYMBOL_SIZE },
		offset: { x: (width / 2 - (x0 + x1) / 2) * k, y: (height / 2 - (y0 + y1) / 2) * k },
	};
};

/** the asset key of a symbol's rig (assets.ts) */
export const rigKey = (name: SymbolName) => `phRig${name}`;

type RigAnimation = 'land' | 'win';
const symbolInfo = (name: SymbolName) => {
	const art: Art = SYMBOL_ART[name];
	const layout = fit(art, OBJECT_FIT[name]);
	const still = { type: 'sprite' as const, assetKey: art.file, ...layout };
	const animations: Record<string, number> = 'animations' in art ? art.animations : {};
	const rig = (animationName: RigAnimation) =>
		animationName in animations
			? { type: 'spine' as const, assetKey: rigKey(name), animationName, ...layout }
			: still;
	return {
		static: still,
		spin: still,
		// thieves and the vault have a landing; the royals land still
		land: rig('land'),
		win: rig('win'),
		postWinStatic: still,
	};
};

export const SYMBOL_NAMES = Object.keys(SYMBOL_ART) as SymbolName[];
export const SYMBOL_INFO_MAP = Object.fromEntries(
	SYMBOL_NAMES.map((name) => [name, symbolInfo(name)]),
) as Record<SymbolName, ReturnType<typeof symbolInfo>>;
export type SymbolInfo = ReturnType<typeof symbolInfo>[keyof ReturnType<typeof symbolInfo>];

// Pitch ladders: ONE file replayed at a rising Howler rate (soundOnce `rate`),
// never numbered files.
/** the reel stop, one step per column left to right */
export const REEL_LAND_RATES = [1.0, 1.04, 1.08, 1.12, 1.16, 1.2] as const;
export const ladderRate = (rates: readonly number[], step: number) =>
	rates[Math.max(0, Math.min(step, rates.length - 1))];
