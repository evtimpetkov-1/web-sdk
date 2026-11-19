import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

// Shown in the paytable and rules footers. 1.0.0 = first submission (Kraken's
// numbering: it submitted as 1.0.0 and bumped on each resubmission); 1.0.1 =
// the resubmission after the 2026-10-29 review.
export const GAME_VERSION = '1.0.0';

/**
 * Which UI the game wears (Evtim, 2026-11-18: "ditch this customized UI and use one
 * generic for all games").
 * - 'generic': the shared HTML bar, bonus shop and single info page of
 *   components-ui-html (src/generic). No game art, fonts or colours in it; a change
 *   there changes every game that uses it.
 * - 'themed': this game's own painted bar as it was reviewed (BarStrip, the Pixi
 *   UI with the bs/ui button sheet, BuySlot, BuyShop / BuyConfirm, separate
 *   paytable and rules popups). Everything it needs is still in the app.
 */
export const UI_KIND: 'generic' | 'themed' = 'generic';

// Cell height (row pitch). Also the unit every size ratio is expressed in.
export const SYMBOL_SIZE = 100;

// Delivered symbol art sizes (px). Symbols are drawn at their own aspect, so the
// cell is not square: the column pitch follows the plate art (297x321 for the
// royals, cloner, bomb and the multiplier plate) and the pipe frame is stretched
// to that window instead of the art being stretched to the frame.
const ART = {
	// Blast Shaft: every symbol is built on one 297x321 canvas (art-review/blast-shaft/
	// build_statics.py), the Scatter too since 2026-11-13 (a carved gold nugget on the
	// feature tile; it was a free token on Chaos Lab's 427x423, drawn 1.15x its cell)
	plate: { width: 297, height: 321 }, // A K Q J ten, cloner, bomb
	wild: { width: 297, height: 321 },
	h1: { width: 297, height: 321 },
	h2: { width: 297, height: 321 },
	h3: { width: 297, height: 321 },
	h4: { width: 297, height: 321 },
	bonus: { width: 297, height: 321 },
	multPlate: { width: 297, height: 321 },
};
export const SYMBOL_WIDTH = (SYMBOL_SIZE * ART.plate.width) / ART.plate.height; // 92.5
// space left between neighbouring plates (the PNGs carry no transparent padding)
export const SYMBOL_GAP = 1;
// the Scatter is a tile like the rest and fills exactly its cell (Chaos Lab's bonus
// disc was drawn 1.15x and spilled over the neighbours)
export const BONUS_SCALE = 1;
// vertical headroom the board mask allows beyond the reel window, so an oversized
// bonus on the top/bottom row is hidden by the pipe frame, not cut flat by the mask
export const SYMBOL_OVERFLOW = SYMBOL_SIZE * 0.1;

// reel centre in cells: reels are centred in their column (the sample's 0.53 offset
// left a gap on the left of reel 1 and pushed reel 6 under the frame)
export const REEL_PADDING = 0.5;

// frame_resized.png: the timber scaffold from its top beam to the bottom of its
// sill, 1335x1291 with a transparent reel window at x 114..1223, y 84..1083
// (2 px per board unit; printed by art-review/blast-shaft/build_app_assets.py)
export const FRAME_ART = {
	width: 1335,
	height: 1291,
	window: { x: 114, y: 84, width: 1110, height: 1000 },
};
// frame_legs.webp: the scaffold's cross-braced legs, drawn under the frame at its
// x and width, so the structure stands on the tunnel floor instead of floating
export const FRAME_LEGS = { width: 1335, height: 461 };

// initial board (padded top and bottom)
export const INITIAL_BOARD: RawSymbol[][] = [
	// laid out after Evtim's board mockup (2026-09-02): 3 Scatters (one short of a
	// trigger), a Cloner, a Bomb and two multipliers (x5, x10) mixed in. NO Wilds:
	// the rules say a Wild only comes from a Bomb, so a reviewer would read one
	// here as a mismatch (the mockup's four were swapped for paying symbols,
	// 2026-10-24). No paying symbol shows more than 3 times, far from a win (8).
	// each reel = [top padding, rows 1-5, bottom padding]
	[{ name: 'H2' }, { name: 'L3' }, { name: 'H1' }, { name: 'H4' }, { name: 'H2' }, { name: 'L1' }, { name: 'L2' }],
	[{ name: 'L4' }, { name: 'H3' }, { name: 'S', scatter: true }, { name: 'L5' }, { name: 'S', scatter: true }, { name: 'L3' }, { name: 'H3' }],
	[{ name: 'H1' }, { name: 'H4' }, { name: 'L5' }, { name: 'B' }, { name: 'H1' }, { name: 'L4' }, { name: 'L3' }],
	[{ name: 'L3' }, { name: 'L2' }, { name: 'C' }, { name: 'L4' }, { name: 'H1' }, { name: 'H3' }, { name: 'H4' }],
	[{ name: 'H4' }, { name: 'H2' }, { name: 'H3' }, { name: 'M', multiplier: 5 }, { name: 'S', scatter: true }, { name: 'L1' }, { name: 'L2' }],
	[{ name: 'L3' }, { name: 'L4' }, { name: 'M', multiplier: 10 }, { name: 'L1' }, { name: 'H2' }, { name: 'H4' }, { name: 'H1' }],
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
// art-review/madscience/symbol_layers/build_rigs_v2.py, keyed to sfx_bs_bomb_fuse,
// 2026-10-26): the loop period (= the sound's) and the sound time at the rig's
// t = 0. BombHeartbeatLock enters every armed bomb's loop at the sound's point of
// it, so they beat together. Keep in step with the rig.
export const BOMB_HEARTBEAT = {
	assetKey: 'msBombAnim',
	animation: 'idle',
	period: 2.25,
	offset: 0.52,
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
const SYMBOL_RIGS: boolean = true;
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
type RigAnimation =
	| 'land'
	| 'prewin'
	| 'idle'
	| 'glint'
	| 'pending'
	| 'explode'
	| 'explode_wild'
	| 'cast'
	| 'in'
	| 'out';
const spine = (assetKey: string, animationName: RigAnimation, art: ArtSize, scale = 1) => ({
	type: 'spine' as const,
	assetKey,
	animationName,
	sizeRatios: fitSymbol(art, scale),
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
	art: ArtSize,
	{
		scale = 1,
		idle = false,
		glint = false,
		pending = false,
		explode = false,
		transform = false,
	}: {
		scale?: number;
		idle?: boolean;
		glint?: boolean;
		pending?: boolean;
		explode?: boolean;
		transform?: boolean;
	} = {},
) => {
	const still = sprite(staticKey, art, scale);
	// the game's own rigs (spines/bsSymbols, build_symbol_rigs3.py: layered highs + Wild). SYMBOL_RIGS off
	// draws the static tile in every state (it completes at once), for debugging.
	const anim = (name: RigAnimation) => (SYMBOL_RIGS ? spine(animKey, name, art, scale) : still);
	return {
		explosion: still,
		win: anim('prewin'),
		postWinStatic: still,
		static: still,
		spin: still,
		land: anim('land'),
		idle: idle ? anim('idle') : still,
		// one pass of idle life on a resting board (SymbolGlints picks the cells)
		glint: glint ? anim('glint') : still,
		pending: pending ? anim('pending') : still,
		explode: explode ? anim('explode') : still,
		explodeWild: explode ? anim('explode_wild') : still,
		blasted: still,
		cast: transform ? anim('cast') : still,
		in: transform ? anim('in') : still,
		out: transform ? anim('out') : still,
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
	glint: info,
	pending: info,
	explode: info,
	explodeWild: info,
	blasted: info,
	cast: info,
	in: info,
	out: info,
});

export const SYMBOL_INFO_MAP = {
	// math codes: H1-H4 = the four lab symbols, L1-L5 = the royals A K Q J 10
	H1: rigged('h1.png', 'msH1Anim', ART.h1, { glint: true }),
	H2: rigged('h2.png', 'msH2Anim', ART.h2, { glint: true }),
	H3: rigged('h3.png', 'msH3Anim', ART.h3, { glint: true }),
	H4: rigged('h4.png', 'msH4Anim', ART.h4, { glint: true }),
	L1: rigged('A.png', 'msAAnim', ART.plate, { glint: true }),
	L2: rigged('K.png', 'msKAnim', ART.plate, { glint: true }),
	L3: rigged('Q.png', 'msQAnim', ART.plate, { glint: true }),
	L4: rigged('J.png', 'msJAnim', ART.plate, { glint: true }),
	L5: rigged('ten.png', 'msTenAnim', ART.plate, { glint: true }),
	// the Wild lands and wins like the others; the bomb's explode_wild ends on it
	W: rigged('wild.png', 'msWildAnim', ART.wild, { glint: true }),
	// Cloner: cast = the sign flares and its ghosts peel off towards the cells
	// they turn into cloners, in = a fresh clone's sign grows in, out = the sign
	// drains away (plate intact) before the flood swaps in the paying symbol.
	C: rigged('cloner.png', 'msClonerAnim', ART.plate, { transform: true }),
	// Bomb: armed idle loop while a round waits for its cascades (same rule as the
	// scatter), explode = the bomb blows itself up and ends empty; the tumble
	// board then drops the cell like any exploded symbol.
	B: rigged('bomb.png', 'msBombAnim', ART.plate, { idle: true, explode: true }),
	// Scatter: a carved gold nugget on the feature tile. land = the lump thrown down,
	// prewin = two beats and a turn in a blaze, idle = it breathes and a glint runs
	// its edge while a round waits for its cascades (ReelSymbol/TumbleSymbol derive
	// that state from stateGame.roundActive), pending = lifted off its tile in front
	// of a starburst while a cascade drops one Scatter short of a trigger.
	S: rigged('bonus.png', 'msBonusAnim', ART.bonus, { scale: BONUS_SCALE, idle: true, pending: true }),
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


// Pitch ladders: ONE file replayed at a rising Howler rate (soundOnce `rate`),
// never numbered files — five generations would never share a timbre.
/** sfx_bs_reel_land, one step per column left to right */
export const REEL_LAND_RATES = [1.0, 1.04, 1.08, 1.12, 1.16, 1.2] as const;
/** sfx_bs_bonus_land, rising with each bonus landed this spin (the 4th triggers) */
export const BONUS_LAND_RATES = [1.0, 1.08, 1.16, 1.26, 1.36, 1.46] as const;
/** sfx_bs_cascade_step, rising with each cascade win of a spin */
export const CASCADE_STEP_RATES = [1.0, 1.06, 1.12, 1.19, 1.26, 1.33, 1.41, 1.5] as const;
export const ladderRate = (rates: readonly number[], step: number) =>
	rates[Math.max(0, Math.min(step, rates.length - 1))];
