import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';
import { TILE_ART } from './symbolTiles';

// Shown in the paytable and rules footers. Chaos Lab 2's first submission is
// 1.0.0 (the studio's numbering: bump on each resubmission; Chaos Lab, which
// this app was copied from, had reached 1.0.1).
export const GAME_VERSION = '1.0.2';

/**
 * Which UI the game wears (Evtim, 2026-11-18: one generic UI for all games; "apply the
 * same UI in the chaos lab 2 and the dynamite games").
 * - 'generic': the shared HTML bar, bonus shop and single info page of
 *   components-ui-html (src/generic). No game art, fonts or colours in it; a change
 *   there changes every game that uses it.
 * - 'themed': its own steel bar (BarStrip, the Pixi UI with the bare-icon sheet, BuySlot, BuyShop / BuyConfirm, separate paytable and rules popups). Everything it needs is still in the app.
 */
export const UI_KIND: 'generic' | 'themed' = 'generic';

// Cell height (row pitch). Also the unit every size ratio is expressed in.
export const SYMBOL_SIZE = 100;

// Delivered symbol art sizes (px). Symbols are drawn at their own aspect, so the
// cell is not square: the column pitch follows the plate art (297x321 for the
// royals, cloner, bomb and the multiplier plate) and the pipe frame is stretched
// to that window instead of the art being stretched to the frame.
const ART = {
	plate: { width: 297, height: 321 }, // A K Q J ten, cloner, bomb
	multPlate: { width: 298, height: 322 },
};
export const SYMBOL_WIDTH = (SYMBOL_SIZE * ART.plate.width) / ART.plate.height; // 92.5
// space left between neighbouring plates (the PNGs carry no transparent padding)
export const SYMBOL_GAP = 1;
// vertical headroom the board mask allows beyond the reel window: what a symbol's
// animation throws past its cell on the top/bottom row (the Scatter's pop, a hand's
// fingers) is hidden by the pipe frame, not cut flat by the mask. (It was made for the
// BONUS disc, drawn 1.15x its cell until 2026-11-20; the Scatter is a tile now.)
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

// The mascot frame (Chaos Lab 2's still, static/assets/chaoslab2/mascot/
// mascot.webp at 2x, and her clips, one stacked half each): Chaos Lab's
// video-clip framing, 832x1104 units, her hair top on row 204 and her boots on
// row 1067 like the Chemist's. Landmarks in those units (build_static_mascot.py
// prints them): hair top and belt rows, the face's centre and the hair's half
// width, and the orb glass's leftmost edge (`flaskLeft`, the name kept from the
// Chemist's flask). flaskLeft is the WIN reactions' reach, like Chaos Lab's:
// win_2 swings the orb to 144 (win_1 178; the idles and the still sit at ~213),
// so the portrait plate stays clear of it all through a win.
export const MASCOT_CLIP = {
	width: 832,
	height: 1104,
	headTop: 204,
	waist: 531,
	headX: 430,
	headHalfWidth: 66,
	flaskLeft: 144,
};

// initial board (padded top and bottom)
export const INITIAL_BOARD: RawSymbol[][] = [
	// laid out after Evtim's board mockup (2026-09-02): 3 Scatters (one short of a
	// trigger), a Cloner, a Bomb and two multipliers (x5, x10) mixed in. NO Wilds:
	// the rules say a Wild only comes from a Bomb, so a reviewer would read one
	// here as a mismatch (the mockup's four were swapped for paying symbols,
	// 2026-10-24). No paying symbol shows more than 3 times, far from a win (8).
	// each reel = [top padding, rows 1-5, bottom padding]
	[
		{ name: 'H2' },
		{ name: 'L3' },
		{ name: 'H1' },
		{ name: 'H4' },
		{ name: 'H2' },
		{ name: 'L1' },
		{ name: 'L2' },
	],
	[
		{ name: 'L4' },
		{ name: 'H3' },
		{ name: 'S', scatter: true },
		{ name: 'L5' },
		{ name: 'S', scatter: true },
		{ name: 'L3' },
		{ name: 'H3' },
	],
	[
		{ name: 'H1' },
		{ name: 'H4' },
		{ name: 'L5' },
		{ name: 'B' },
		{ name: 'H1' },
		{ name: 'L4' },
		{ name: 'L3' },
	],
	[
		{ name: 'L3' },
		{ name: 'L2' },
		{ name: 'C' },
		{ name: 'L4' },
		{ name: 'H1' },
		{ name: 'H3' },
		{ name: 'H4' },
	],
	[
		{ name: 'H4' },
		{ name: 'H2' },
		{ name: 'H3' },
		{ name: 'M', multiplier: 5 },
		{ name: 'S', scatter: true },
		{ name: 'L1' },
		{ name: 'L2' },
	],
	[
		{ name: 'L3' },
		{ name: 'L4' },
		{ name: 'M', multiplier: 10 },
		{ name: 'L1' },
		{ name: 'H2' },
		{ name: 'H4' },
		{ name: 'H1' },
	],
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

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4'];

// Symbols that skip the generic win FX (overload charge): scatters have their own
// trigger celebration, multipliers are collected by the multiplier board.
export const WIN_CHARGE_EXCLUDED: string[] = ['S', 'M'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

const SPIN_OPTIONS_SHARED = {
	reelFallInDelay: 80,
	reelPaddingMultiplierNormal: 1.25,
	// an anticipated column waits reelFallInDelay x this before it falls in (the
	// shared reel's padding maths): 12 = ~1s per column on top of its slow fall
	reelPaddingMultiplierAnticipated: 12,
	reelFallOutDelay: 145,
};

// Scatter anticipation (Evtim, 2026-10-24), one Scatter short of a trigger (4
// trigger in the base game, 3 retrigger in free spins), the Scatters playing
// their `pending` loop under the anticipation sound:
// - on the spin: the columns that fall in after that point are anticipated
//   (SPIN_OPTIONS_ANTICIPATED; the math sends no anticipation, the reveal
//   handler counts it); turbo skips it;
// - in a cascade: the refilling columns drop one by one and slower. Durations
//   at 1x; turbo halves them (stateBetDerived.timeScale).
export const SCATTERS_TO_TRIGGER = { basegame: 4, freegame: 3 } as const;

// Turbo free spins drop every column at once (no per-reel stagger), so a board
// with no win was gone the moment it landed (Evtim, 2026-10-26). The next free
// spin waits until the last board has been up this long; a win's presentation
// already takes longer, so only non-winning boards are held.
export const TURBO_FS_MIN_BOARD_MS = 450;

// The armed bomb's idle loop is the fuse sound's heartbeat (rig_bomb idle in
// art-review/madscience/symbol_layers/build_rigs_v2.py, keyed to sfx_ms_bomb_fuse,
// 2026-10-26): the loop period (= the sound's), the sound time at the rig's t = 0,
// and the rig's rest points between beats (s). BombHeartbeatLock starts every armed
// bomb from one of them, in phase with the sound. Keep in step with the rig.
export const BOMB_HEARTBEAT = {
	assetKey: 'msBombAnim',
	animation: 'idle',
	period: 2.25,
	offset: 0.52,
	quiet: [0, 0.6, 1.2],
} as const;
export const TUMBLE_DROP_MS = 200;
export const ANTICIPATION_DROP_MS = 550;
export const ANTICIPATION_REEL_STAGGER_MS = 260;

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 3.5,
	symbolFallInInterval: 30,
	symbolFallInBounceSpeed: 0.15,
	symbolFallInBounceSizeMulti: 0.5,
	symbolFallOutSpeed: 3.5,
	symbolFallOutInterval: 20,
};

// a column that falls in under scatter anticipation (spinType 'anticipated'):
// its symbols drop at half speed and further apart, so the column comes in
// slowly, one symbol after another
export const SPIN_OPTIONS_ANTICIPATED = {
	...SPIN_OPTIONS_DEFAULT,
	symbolFallInSpeed: 1.75,
	symbolFallInInterval: 60,
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
// The four highs and the Wild (symbols v4, 2026-11-20: built from Evtim's layered PSD): their
// pictures are the tile's own edge plus a few px of margin (src/game/symbolTiles.ts, written
// by the builder). They are drawn so that the tile's VISIBLE edge is exactly a royal plate's:
// the plate art's ink is 296 x 320 of its 297 x 321 picture. (Fitted like the other pictures
// they came out about 1% narrower and 3% shorter than the royals: Evtim, "make them the same
// size as the royals".) The 1% of stretch this takes is the tile's, on both axes within a pixel.
const PLATE_INK = { width: 296 / 297, height: 320 / 321 };
type TileArt = { sizeRatios: { width: number; height: number } };
const tileArt = (tile: (typeof TILE_ART)[keyof typeof TILE_ART]): TileArt => {
	const plate = fitSymbol(ART.plate);
	return {
		sizeRatios: {
			width: (plate.width * PLATE_INK.width * tile.frame.width) / tile.ink.width,
			height: (plate.height * PLATE_INK.height * tile.frame.height) / tile.ink.height,
		},
	};
};
const sizeOf = (art: ArtSize | TileArt, scale = 1) =>
	'sizeRatios' in art ? art.sizeRatios : fitSymbol(art, scale);
const sprite = (assetKey: string, art: ArtSize | TileArt, scale = 1) => ({
	type: 'sprite' as const,
	assetKey,
	sizeRatios: sizeOf(art, scale),
});
type RigAnimation =
	| 'land'
	| 'prewin'
	| 'idle'
	| 'pending'
	| 'explode'
	| 'explode_wild'
	| 'cast'
	| 'in'
	| 'out'
	| 'fidget';
const spine = (assetKey: string, animationName: RigAnimation, art: ArtSize | TileArt, scale = 1) => ({
	type: 'spine' as const,
	assetKey,
	animationName,
	sizeRatios: sizeOf(art, scale),
});
// static plate + land/prewin rig; `idle` is the rig's in-round loop where the
// symbol has one (scatter, bomb), the static plate otherwise; `pending` is the
// scatter's anticipation loop (one short of a trigger); `explode` is the
// bomb's self-destruct (ends empty), `explodeWild` the same with the Wild forming
// in its cell (ends on the W at rest); `transform` maps the cloner's cast/in/out.
// Every other state falls back to the static plate — `blasted` always does, the
// red burst over a bomb's neighbour is a separate overlay (BlastBurst). `scale`
// applies to sprite and spine alike so the swap never jumps.
const rigged = (
	staticKey: string,
	animKey: string,
	art: ArtSize | TileArt,
	{
		scale = 1,
		idle = false,
		pending = false,
		explode = false,
		transform = false,
		fidget = false,
	}: {
		scale?: number;
		idle?: boolean;
		pending?: boolean;
		explode?: boolean;
		transform?: boolean;
		/** true = the rig's own `fidget`; a name = that animation doubles as the at-rest one-shot */
		fidget?: boolean | RigAnimation;
	} = {},
) => {
	const still = sprite(staticKey, art, scale);
	const anim = (name: RigAnimation) => spine(animKey, name, art, scale);
	return {
		explosion: still,
		win: anim('prewin'),
		postWinStatic: still,
		static: still,
		spin: still,
		land: anim('land'),
		idle: idle ? anim('idle') : still,
		pending: pending ? anim('pending') : still,
		explode: explode ? anim('explode') : still,
		explodeWild: explode ? anim('explode_wild') : still,
		blasted: still,
		cast: transform ? anim('cast') : still,
		in: transform ? anim('in') : still,
		out: transform ? anim('out') : still,
		fidget: fidget ? anim(fidget === true ? 'fidget' : fidget) : still,
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
	pending: info,
	explode: info,
	explodeWild: info,
	blasted: info,
	cast: info,
	in: info,
	out: info,
	fidget: info,
});

export const SYMBOL_INFO_MAP = {
	// math codes: H1-H4 = the four lab symbols, L1-L5 = the royals A K Q J 10.
	// Rigs v4 (2026-11-20, art-review/chaoslab2/symbols_v4): the same acting as v3 (the
	// heart pumps, the eye turns, the fingers curl; `fidget` = their at-rest one-shot) on
	// the clean tile + subject layers of Evtim's PSD, meshes that follow each outline
	H1: rigged('h1.png', 'msH1Anim', tileArt(TILE_ART.h1), { fidget: true }),
	H2: rigged('h2.png', 'msH2Anim', tileArt(TILE_ART.h2), { fidget: true }),
	H3: rigged('h3.png', 'msH3Anim', tileArt(TILE_ART.h3), { fidget: true }),
	H4: rigged('h4.png', 'msH4Anim', tileArt(TILE_ART.h4), { fidget: true }),
	L1: rigged('A.png', 'msAAnim', ART.plate, { fidget: true }),
	L2: rigged('K.png', 'msKAnim', ART.plate, { fidget: true }),
	L3: rigged('Q.png', 'msQAnim', ART.plate, { fidget: true }),
	L4: rigged('J.png', 'msJAnim', ART.plate, { fidget: true }),
	L5: rigged('ten.png', 'msTenAnim', ART.plate, { fidget: true }),
	// Wild: its own rig since 2026-11-16 (it was a plain picture): land, prewin
	// (rears back and slams on the zap) and a fidget; rebuilt 2026-11-20 on the PSD's plate
	// and W layers (symbols_v4), the static picture = its rest pose. A bomb still forms it
	// with its own `explode_wild`, which ends on the same picture (symbols_v4/patch_bomb.py
	// keeps the bomb rig's copy of the Wild in step).
	W: rigged('wild.png', 'msWildAnim', tileArt(TILE_ART.wild), { fidget: true }),
	// Cloner: cast = the sign winds up and fires on the frame its ghosts leave
	// (MovingClones, 0.2 s; rigs v3 dropped the rig's own two stray copies), in = a fresh clone's sign grows in, out = the sign
	// drains away (plate intact) before the flood swaps in the paying symbol.
	C: rigged('cloner.png', 'msClonerAnim', ART.plate, { transform: true, fidget: true }),
	// Bomb: armed idle loop while a round waits for its cascades (same rule as the
	// scatter), explode = the bomb blows itself up and ends empty; the tumble
	// board then drops the cell like any exploded symbol.
	B: rigged('bomb.png', 'msBombAnim', ART.plate, { idle: true, explode: true }),
	// Scatter: the BONUS warning sign, a TILE the size of every other since 2026-11-20 (the
	// PSD's Bonus group; rig built by art-review/chaoslab2/symbols_v4 build_bonus). Before
	// that it was Chaos Lab 1's yellow disc, drawn 1.15x its cell (an orb and a serum flask
	// were tried on 2026-11-16 and dropped). The lamp, the table and each letter of the word
	// are their own parts. land = the sign slams in and the letters hop; prewin = the lamp
	// switches on at 0.40 s and B O N U S slam in one by one; idle = the lamp swings with its
	// beam, a wave runs through the word, while a round waits for its cascades
	// (ReelSymbol/TumbleSymbol derive that state from stateGame.roundActive); pending = the
	// alarm on the heartbeat (the tile thumps and flushes, the word turns red) while a cascade
	// drops one Scatter short of a trigger. At rest it joins the fidgets with one pass of its idle.
	S: rigged('bonus.png', 'msBonusAnim', tileArt(TILE_ART.bonus), {
		idle: true,
		pending: true,
		fidget: 'idle',
	}),
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

// The board at rest (BoardFidget): the first random resting cell plays its
// symbol's `fidget` the moment the board settles, a second FIDGET_SECOND_MS
// later, then one every FIDGET_EVERY_MS, at most FIDGET_MAX at a time. Between
// autoplay rounds nothing starts for FIDGET_AUTOPLAY_WAIT_MS. Highs are picked
// more often than royals (their acting is the richer one).
export const FIDGET_EVERY_MS = [450, 1100] as const;
export const FIDGET_SECOND_MS = 220;
export const FIDGET_AUTOPLAY_WAIT_MS = 900;
export const FIDGET_MAX = 4;
export const FIDGET_HIGH_WEIGHT = 2.2;

// Pitch ladders: ONE file replayed at a rising Howler rate (soundOnce `rate`),
// never numbered files — five generations would never share a timbre.
/** sfx_ms_reel_land, one step per column left to right */
export const REEL_LAND_RATES = [1.0, 1.04, 1.08, 1.12, 1.16, 1.2] as const;
/** sfx_ms_bonus_land, rising with each bonus landed this spin (the 4th triggers) */
export const BONUS_LAND_RATES = [1.0, 1.08, 1.16, 1.26, 1.36, 1.46] as const;
/** sfx_ms_cascade_step, rising with each cascade win of a spin */
export const CASCADE_STEP_RATES = [1.0, 1.06, 1.12, 1.19, 1.26, 1.33, 1.41, 1.5] as const;
export const ladderRate = (rates: readonly number[], step: number) =>
	rates[Math.max(0, Math.min(step, rates.length - 1))];
