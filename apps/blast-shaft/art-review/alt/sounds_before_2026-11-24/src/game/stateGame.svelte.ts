import _ from 'lodash';
import type { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, Position, RawSymbol, SymbolState } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import { BLACK_OPS_CAP_OFFSET } from './textStyles';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	FRAME_ART,
	UI_KIND,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_ANTICIPATED,
	INITIAL_SYMBOL_STATE,
	REEL_LAND_RATES,
	BONUS_LAND_RATES,
	ladderRate,
} from './constants';
import type { SoundEffectName } from './sound';

// feature symbols sting over the column thud; paying symbols have no landing
// sound by decision (30 rigs land at once — reel_land / tumble_drop carry it),
// and the Wild never lands: it is made by a bomb (TumbleBoard plays its sting)
const LAND_SFX: Partial<Record<RawSymbol['name'], SoundEffectName>> = {
	M: 'sfx_bs_mult_land',
	B: 'sfx_bs_bomb_land',
	C: 'sfx_bs_cloner_land',
};

// symbolIndex: the padded strip index when a reel lands it (the tumble board only
// lands visible cells and passes none). The padding cells above and below the
// window land with their reel but are never seen: no scatter sound or count.
const onSymbolLand = ({ rawSymbol, symbolIndex }: { rawSymbol: RawSymbol; symbolIndex?: number }) => {
	if (symbolIndex !== undefined && (symbolIndex === 0 || symbolIndex > BOARD_DIMENSIONS.y)) return;

	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_bs_bonus_land',
			forcePlay: true,
			rate: ladderRate(BONUS_LAND_RATES, stateGame.scatterCounter - 1),
		});
	}
	const landSfx = LAND_SFX[rawSymbol.name];
	if (landSfx) eventEmitter.broadcast({ type: 'soundOnce', name: landSfx, forcePlay: true });
};

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForCascading({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_bs_reel_land',
				forcePlay: !stateBet.isTurbo,
				rate: ladderRate(REEL_LAND_RATES, reelIndex),
			});
			// the next column is anticipated: the landed Scatters start their
			// pending loop (ended by the reveal handler once the spin has landed)
			if (stateGame.spinAnticipation[reelIndex + 1]) scatterPendingStart();
		},
		onSymbolLand,
	});

	reel.reelState.spinOptions = () => {
		if (reel.reelState.spinType === 'fast') return SPIN_OPTIONS_FAST;
		if (reel.reelState.spinType === 'anticipated') return SPIN_OPTIONS_ANTICIPATED;
		return SPIN_OPTIONS_DEFAULT;
	};

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export type TumbleSymbol = {
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
	/** 'blasted' only: ms (at 1x) after the tumble starts before the blast ring reaches this cell */
	blastDelay?: number;
};

// bombExplode parked until the tumbleBoard that always follows draws it
export type BombPending = { bombs: Position[]; wilds: Position[] };

// A goo cover over one reel cell (CloneFx in ReelSymbol), keyed by
// `${reel}-${row}` where row is the book's padded index (getCellKey).
// `onSwap` fires on the rig's `swap` event — the cell is fully covered, exchange
// the symbol underneath; `oncomplete` when the cover has drained away.
export type CloneFx = {
	kind: 'splat' | 'flood';
	onSwap: () => void;
	oncomplete: () => void;
};

// a cloner ghost in flight (MovingClones), board-local coords
export type MovingClone = {
	id: number;
	x: Tween<number>;
	y: Tween<number>;
	scale: Tween<number>;
};

export type MultiplierSymbol = {
	initX: number;
	initY: number;
	symbolX: Tween<number>;
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export const stateGame = $state({
	// value shown on the multiplier plate; base for the boardMultiplierInfo fallback arithmetic
	globalMultiplier: 1,
	board,
	gameType: 'basegame' as GameType,
	tumbleBoardAdding: [] as TumbleSymbol[][],
	tumbleBoardBase: [] as TumbleSymbol[][],
	multiplierBoard: [] as (MultiplierSymbol | undefined)[][],
	scatterCounter: 0,
	// true while a bet's book is playing (playBet). Landed scatters run their
	// idle loop for as long as this holds — they are "waiting for the cascade".
	roundActive: false,
	// true while a spin's anticipated columns fall in, or a tumble drops, one
	// Scatter short of a trigger: the Scatters switch from idle to their
	// `pending` loop (scatterPendingStart / scatterPendingEnd)
	scatterPending: false,
	// the spin in progress's anticipated columns (1 = anticipated), set by the
	// reveal handler; onReelStopping starts the pending loop off it
	spinAnticipation: [] as number[],
	// a cascade under anticipation: per column, the visible rows its cleared
	// symbols left empty, set by the tumbleBoard handler once they are removed
	// and emptied column by column as TumbleBoard lands each drop.
	// AnticipationField electrifies exactly those cells (the spin's columns come
	// from spinAnticipation and each reel's motion)
	tumbleAnticipation: [] as number[][],
	// per cell (getCellKey): a landed idle rig keeps looping past the round's end
	// until its next loop boundary. Shared state, not a ReelSymbol local: every cell
	// is mounted in both board layers and only the drawing layer hears the loop end.
	idleHold: {} as Record<string, boolean>,
	// per cell (getCellKey): performance.now() when SymbolGlints started a `glint` on a
	// resting cell (0 = none). ReelSymbol draws the rig while it is set and clears it
	// when the pass ends or the cell stops resting.
	glints: {} as Record<string, number>,
	// the spin in progress's cascade win (book units, cumulative per spin): set by
	// updateTumbleWin / boardMultiplierInfo, zeroed by reveal and by setTotalWin,
	// which folds it into stateBet.winBookEventAmount. FreeSpinTotalWin adds the two.
	tumbleWin: 0,
	// bomb feature: set by bombExplode, consumed by the next tumbleBoardExplode
	bombPending: undefined as BombPending | undefined,
	// performance.now() when the fuse loop (sfx_bs_bomb_fuse) last started (Sound.svelte):
	// the armed bombs' heartbeat is phase-locked to it (BombHeartbeatLock)
	bombFuseStartedAt: undefined as number | undefined,
	// cloner feature: goo covers over reel cells and the ghosts flying between them
	cloneFx: {} as Record<string, CloneFx>,
	movingClones: [] as MovingClone[],
});

// Riveted pipe plate centred above the reel frame (Evtim's mockup, 2026-09-02): ~38% of
// the board width, its bottom pipe sunk into the frame's top pipe. Board-local coords
// (origin = board top-left), shared by GlobalMultiplier (draws it) and MultiplierBoard
// (flies collected multiplier symbols onto it). Portrait drew it 1.28x until the board
// itself grew there (2026-10-26); the extra size cost the logo its room.
const MULT_PLATE_RATIO = 318 / 146; // mult_plate.png
const MULT_PLATE_WIDTH = 0.38; // of board width
const MULT_PLATE_OVERLAP = 0.06; // of plate height, sunk into the frame's top pipe
const plateSize = () => {
	const width = BOARD_SIZES.width * MULT_PLATE_WIDTH;
	return { width, height: width / MULT_PLATE_RATIO };
};
// board-local units per frame-art px, vertically (the window maps onto the board)
const FRAME_UNIT_Y = BOARD_SIZES.height / FRAME_ART.window.height;
const FRAME_WIDTH = (BOARD_SIZES.width / FRAME_ART.window.width) * FRAME_ART.width;

/**
 * Portrait stage (Evtim, 2026-10-26): the reel frame spans the canvas width,
 * its bottom pipe just above the shared bottom bar, and the band above the
 * plate holds the logo and the mascot, who stands behind the board. The board
 * group (BoardContainer, frame, plate) scales by `scale` about the board
 * centre; board-local units are unchanged. A wide portrait canvas (tablet
 * upright) runs out of height first: the frame narrows to keep a band for the
 * logo. Main-layout units; `top`/`left` are the canvas edges in them.
 */
// frame_resized.png's posts are opaque over x 22..1308, so this lets them touch the edges
const PORTRAIT_FRAME_FILL = FRAME_ART.width / 1286;
// components-ui-pixi LayoutPortrait: the buy disc's top sits h - 536 (standard layout)
const PORTRAIT_UI_TOP = 540;
const PORTRAIT_UI_GAP = 12;
// x visible width: the band kept above the plate when the height binds
const PORTRAIT_MIN_TOP = 0.11;
// frame_resized.png row where the sill ends: the art's last row (the legs are a
// separate sprite and run behind the bottom bar)
const FRAME_PIPE_BOTTOM = FRAME_ART.height;

const portraitStage = () => {
	const main = stateLayoutDerived.mainLayout();
	const canvas = stateLayoutDerived.canvasSizes();
	const visibleWidth = canvas.width / main.scale;
	const visibleHeight = canvas.height / main.scale;
	const top = (main.height - visibleHeight) / 2;
	const left = (main.width - visibleWidth) / 2;
	const uiTop =
		top +
		(canvas.height - PORTRAIT_UI_TOP * stateLayoutDerived.mainLayoutStandard().scale) / main.scale;
	// at scale 1: frame top -> end of its bottom pipe, and the plate's height above the frame top
	const below = FRAME_PIPE_BOTTOM * FRAME_UNIT_Y;
	const above = plateSize().height * (1 - MULT_PLATE_OVERLAP);
	const scale = Math.min(
		(visibleWidth * PORTRAIT_FRAME_FILL) / FRAME_WIDTH,
		(uiTop - PORTRAIT_UI_GAP - top - visibleWidth * PORTRAIT_MIN_TOP) / (below + above),
	);
	const frameTop = uiTop - PORTRAIT_UI_GAP - below * scale;
	const { window: win } = FRAME_ART;
	return {
		scale,
		top,
		left,
		visibleWidth,
		frameTop,
		plateTop: frameTop - above * scale,
		boardY: frameTop + (win.y + win.height / 2) * FRAME_UNIT_Y * scale,
	};
};

/**
 * Side stage (Evtim, 2026-11-20: "for desktop / landscape can you move the
 * multiplier plate on the right of the slot. The idea here is to leave some empty
 * space on the top, so we can increase the reels board size, but not overlap its
 * bottom reels frame part with the UI black bar"). With the generic UI on desktop
 * and landscape the board group grows until the frame's top beam is SIDE_TOP
 * under the screen's top or the beam under the reels (frame art rows 1084-1216)
 * ends SIDE_UI_GAP over the UI, whichever comes first. The lower sill and the
 * legs below that beam may run behind the bar (Evtim, same day: "the reels can
 * be increased further ... it is fine that the legs of the reelsboard are behind
 * the UI"). The logo stands left of the frame at its old size (its top level
 * with the beam), the multiplier plate right of it, level with the logo, and the
 * FREE SPINS counter under the logo. WIN / TOTAL WIN is one line on the beam
 * under the reels (winBeamLayout; it stood under the plate until Evtim moved it
 * there the same day). The board is centred on the screen
 * when all of that fits, else pushed aside.
 * Desktop: Spin rises over the bar and the cat's button over its left end, so
 * the beam under the reels may come down to the bar only where the frame keeps
 * clear of them: three placements are tried (down to the bar between the cat
 * and Spin; down to the cat's head left of Spin; above Spin anywhere) and the
 * one with the largest board wins. Landscape (phones, Stake's popouts): the
 * buttons are a column on the right, the plate keeps clear of it.
 * Main-layout units; plate and counters board-local. undefined on the other
 * layouts and with the themed bar.
 */
// GenericUI.svelte, measured in the browser: standard units (1920x1080), x from
// the canvas centre, y up from the canvas bottom (catTop: his crown, with room
// for his tilt). Re-measure if the bar changes.
const GENERIC_UI = {
	desktop: { barTop: 108, catRight: -552, catTop: 140, spinLeft: 436, spinTop: 160 },
	landscape: { stripTop: 124, columnLeft: 718 },
};
const SIDE_TOP = 8; // the screen's top -> the frame's top beam
const SIDE_UI_GAP = 6; // the beam under the reels -> the UI
const SIDE_GAP = 14; // a frame post -> the logo / the plate; desktop: the frame -> the cat / Spin
const SIDE_EDGE = 16; // the logo -> the screen's edge; the plate -> the button column / the edge
const SIDE_MAX_SCALE = 1.6;
// the stacked logo (GameLogo, msLogo): its height at board scale 1 and its art's
// aspect. It does not grow past that with the board (the room goes to the reels).
const LOGO_HEIGHT = BOARD_SIZES.height * 0.34;
export const LOGO_ASPECT = 1393 / 957;
// the logo's centre under the board's top edge, of its height (its top level with the beam)
const LOGO_DROP = 0.18;
// under the lower of the logo and the plate, to the counters' label/value line
const SIDE_COUNTER_DROP = SYMBOL_SIZE * 0.42;
// frame_resized.png: the last row of the beam under the reels (the lower sill below it)
const FRAME_BEAM_BOTTOM = 1216;
// board-local: the frame beyond the board on each side
const FRAME_UNIT_X = BOARD_SIZES.width / FRAME_ART.window.width;
const FRAME_LEFT = FRAME_ART.window.x * FRAME_UNIT_X;
const FRAME_RIGHT = (FRAME_ART.width - FRAME_ART.window.x - FRAME_ART.window.width) * FRAME_UNIT_X;
const FRAME_TOP = FRAME_ART.window.y * FRAME_UNIT_Y;
const FRAME_TO_BEAM = FRAME_BEAM_BOTTOM * FRAME_UNIT_Y;

const sideStage = () => {
	const type = stateLayoutDerived.layoutType();
	if (UI_KIND !== 'generic' || (type !== 'desktop' && type !== 'landscape')) return undefined;
	const main = stateLayoutDerived.mainLayout();
	const canvas = stateLayoutDerived.canvasSizes();
	// main units per standard unit
	const k = stateLayoutDerived.mainLayoutStandard().scale / main.scale;
	const visibleWidth = canvas.width / main.scale;
	const visibleHeight = canvas.height / main.scale;
	const top = (main.height - visibleHeight) / 2;
	const left = (main.width - visibleWidth) / 2;
	const centre = main.width / 2;
	const bottom = top + visibleHeight;
	const plate = plateSize();
	const frameWidth1 = FRAME_LEFT + BOARD_SIZES.width + FRAME_RIGHT;
	const logoScale = (scale: number) => Math.min(scale, 1);
	const minX = left + SIDE_EDGE;
	const ui = GENERIC_UI.desktop;
	// where the beam may come down to (standard units over the bottom) and the band
	// the frame must then keep to
	const placements =
		type === 'desktop'
			? [
					{ clear: ui.barTop, min: centre + ui.catRight * k + SIDE_GAP, max: centre + ui.spinLeft * k - SIDE_GAP },
					{ clear: ui.catTop, min: -Infinity, max: centre + ui.spinLeft * k - SIDE_GAP },
					{ clear: ui.spinTop, min: -Infinity, max: Infinity },
				]
			: [{ clear: GENERIC_UI.landscape.stripTop, min: -Infinity, max: Infinity }];
	const maxX = type === 'desktop' ? left + visibleWidth - SIDE_EDGE : centre + GENERIC_UI.landscape.columnLeft * k - SIDE_EDGE;
	// the frame's left edge may run from `lo` to `hi` at this scale (lo > hi: no room)
	const span = (scale: number, place: (typeof placements)[number]) => ({
		lo: Math.max(place.min, minX + LOGO_HEIGHT * LOGO_ASPECT * logoScale(scale) + SIDE_GAP),
		hi: Math.min(place.max, maxX - SIDE_GAP - plate.width * scale) - frameWidth1 * scale,
	});
	// the largest board, but a board pushed off the middle must be clearly larger
	// than a centred one to win (1600x900: 1.111 against the side of Spin vs 1.098 centred)
	const centredLeft = (scale: number) => centre - (FRAME_LEFT + BOARD_SIZES.width / 2) * scale;
	const offCentre = (scale: number, place: (typeof placements)[number]) => {
		const { lo, hi } = span(scale, place);
		return Math.abs(Math.max(lo, Math.min(hi, centredLeft(scale))) - centredLeft(scale)) > 1;
	};
	const OFF_CENTRE_COST = 0.97;
	let best = { scale: 0, place: placements[0], score: 0 };
	for (const place of placements) {
		let high = Math.min(SIDE_MAX_SCALE, (bottom - place.clear * k - SIDE_UI_GAP - top - SIDE_TOP) / FRAME_TO_BEAM);
		let low = 0.5;
		const fits = (scale: number) => {
			const { lo, hi } = span(scale, place);
			return lo <= hi;
		};
		if (fits(high)) low = high;
		else for (let i = 0; i < 24; i++) {
			const mid = (low + high) / 2;
			if (fits(mid)) low = mid;
			else high = mid;
		}
		const score = low * (offCentre(low, place) ? OFF_CENTRE_COST : 1);
		if (score > best.score) best = { scale: low, place, score };
	}
	const { scale } = best;
	const logo = { width: LOGO_HEIGHT * LOGO_ASPECT * logoScale(scale), height: LOGO_HEIGHT * logoScale(scale) };
	// the board centred, kept inside its span
	const { lo, hi } = span(scale, best.place);
	const frameLeft = Math.max(lo, Math.min(hi, centredLeft(scale)));
	const boardLeft = frameLeft + FRAME_LEFT * scale;
	const boardTop = top + SIDE_TOP + FRAME_TOP * scale;
	// board-local
	const logoX = (frameLeft - SIDE_GAP - logo.width / 2 - boardLeft) / scale;
	const logoY = (LOGO_DROP * logo.height) / scale;
	const plateX = BOARD_SIZES.width + FRAME_RIGHT + SIDE_GAP / scale + plate.width / 2;
	const counterY = Math.max(logoY + logo.height / 2 / scale, logoY + plate.height / 2) + SIDE_COUNTER_DROP;
	return {
		scale,
		boardX: boardLeft + (BOARD_SIZES.width / 2) * scale,
		boardY: boardTop + (BOARD_SIZES.height / 2) * scale,
		/** main units, centre */
		logo: { x: boardLeft + logoX * scale, y: boardTop + logoY * scale, ...logo },
		plate: { x: plateX, y: logoY },
		counters: {
			left: { x: logoX, y: counterY, room: logo.width / scale },
			// unused here: the win is on the beam (winBeamLayout)
			right: { x: plateX, y: counterY, room: plate.width },
		},
	};
};

const boardLayout = () => {
	const main = stateLayoutDerived.mainLayout();
	const portrait = stateLayoutDerived.layoutType() === 'portrait' ? portraitStage() : undefined;
	const side = portrait ? undefined : sideStage();
	return {
		x: side?.boardX ?? main.width * 0.5,
		y: portrait?.boardY ?? side?.boardY ?? main.height * 0.5,
		// width/height stay the board-local BOARD_SIZES; `scale` maps them to main units
		scale: portrait?.scale ?? side?.scale ?? 1,
		anchor: { x: 0.5, y: 0.5 },
		pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
		...BOARD_SIZES,
	};
};

// Pipe frame sprite (centre anchored, main-layout coords): scaled per axis so its
// transparent window covers the board exactly — the window is not the board's aspect,
// so the pipes deform slightly rather than the symbols.
const frameLayout = () => {
	const board = boardLayout();
	const { window: win } = FRAME_ART;
	const scaleX = (board.width * board.scale) / win.width;
	const scaleY = (board.height * board.scale) / win.height;
	return {
		x: board.x + (FRAME_ART.width / 2 - (win.x + win.width / 2)) * scaleX,
		y: board.y + (FRAME_ART.height / 2 - (win.y + win.height / 2)) * scaleY,
		width: FRAME_ART.width * scaleX,
		height: FRAME_ART.height * scaleY,
	};
};

// The plate sits in the middle of the frame's top beam on portrait and tablet (with no
// mascot behind the board, 2026-11-13, nothing in portrait needs it to step aside), and
// right of the frame on desktop and landscape (sideStage, 2026-11-20).
const multiplierPlateLayout = () => {
	const { width, height } = plateSize();
	const side = sideStage();
	if (side) return { ...side.plate, width, height };
	// frame sprite top edge in board-local coords
	const frameTop = -FRAME_ART.window.y * FRAME_UNIT_Y;
	return {
		x: BOARD_SIZES.width * 0.5,
		y: frameTop + height * (MULT_PLATE_OVERLAP - 0.5),
		width,
		height,
	};
};

/**
 * Where the two counters stand off portrait, board-local: FREE SPINS (`left`) and
 * WIN / TOTAL WIN (`right`), label over value about `y`, `room` = the width they
 * may take. Either side of the plate on the frame's top beam (tablet, the themed
 * bar), or under the logo and under the plate (sideStage). Portrait has its own
 * one-line counters (portraitCounterLayout).
 */
const counterSpots = () => {
	const side = sideStage();
	if (side) return side.counters;
	const plate = multiplierPlateLayout();
	const leftRoom = plate.x - plate.width / 2;
	const rightRoom = BOARD_SIZES.width - (plate.x + plate.width / 2);
	return {
		left: { x: leftRoom / 2, y: plate.y, room: leftRoom },
		right: { x: BOARD_SIZES.width - rightRoom / 2, y: plate.y, room: rightRoom },
	};
};
export type CounterSpot = ReturnType<typeof counterSpots>['left'];

/**
 * Portrait counters (Evtim, 2026-10-26: beside the plate they were squeezed on
 * the left and sat over the mascot on the right): one line each on the frame's
 * BOTTOM pipe, FREE SPINS centred in the left half, TOTAL WIN (the base game's
 * WIN) in the right half, each on a long pipe plate (msCounterPlate, the
 * multiplier plate's style) so it reads over the pipe. The plates hang from
 * the reel window's bottom edge (centred on the pipe they covered the bottom
 * row), and the text is centred on the plate's dark panel. Board-local coords:
 * `y` = the plates' centre, `textY` = the lines'; `size` is the font size, and
 * a line wider than `maxWidth` shrinks to fit.
 */
const PORTRAIT_COUNTER_SIZE = SYMBOL_SIZE * 0.28;
const COUNTER_PLATE_RATIO = 1200 / 267; // counter_plate.webp
// between the two plates (half of it to the window's sides)
const COUNTER_PLATE_GAP = 16;
// the text's room, of the plate width: inside the side pipes and corner bolts
const COUNTER_PLATE_INNER = 0.86;
// the dark panel's middle (rows 30-229 of 267: the bottom pipe is the thicker),
// of the plate height from its centre
const COUNTER_PLATE_PANEL_Y = -0.015;
const portraitCounterLayout = () => {
	const half = BOARD_SIZES.width / 2;
	const plateWidth = half - COUNTER_PLATE_GAP;
	const plateHeight = plateWidth / COUNTER_PLATE_RATIO;
	const y = BOARD_SIZES.height + plateHeight / 2;
	return {
		y,
		textY: y + plateHeight * COUNTER_PLATE_PANEL_Y - PORTRAIT_COUNTER_SIZE * BLACK_OPS_CAP_OFFSET,
		left: half / 2,
		right: half * 1.5,
		maxWidth: plateWidth * COUNTER_PLATE_INNER,
		size: PORTRAIT_COUNTER_SIZE,
		plate: { width: plateWidth, height: plateHeight },
	};
};
export type PortraitCounterLayout = ReturnType<typeof portraitCounterLayout>;

/**
 * The WIN / TOTAL WIN counter as one line on a counter plate on the beam under the
 * reels (portraitCounterLayout's plate and line): portrait since 2026-10-26, and
 * desktop / landscape with the generic UI since 2026-11-20 (Evtim: "I think there
 * is plenty of space in desktop / landscape to put the win which right now is below
 * the multiplier plate on the reels frame bottom"). Portrait shares the beam with
 * FREE SPINS in free spins, so TOTAL WIN takes its right half there; desktop /
 * landscape keep FREE SPINS under the logo and the win in the middle. `x` is the
 * line's centre, board-local. undefined on the other layouts (tablet, themed bar).
 */
const winBeamLayout = (freegame: boolean) => {
	const portrait = stateLayoutDerived.layoutType() === 'portrait';
	if (!portrait && !sideStage()) return undefined;
	const line = portraitCounterLayout();
	return { ...line, x: portrait && freegame ? line.right : BOARD_SIZES.width / 2 };
};

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const tumbleBoardCombined = () => {
	const tumbleBoardCombined = stateGame.tumbleBoardBase.map((tumbleReelBase, reelIndex) => {
		const tumbleReelAdding = stateGame.tumbleBoardAdding[reelIndex] ?? [];
		return [...tumbleReelAdding, ...tumbleReelBase];
	});

	return tumbleBoardCombined;
};
const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

/**
 * The Scatters' anticipation, one short of a trigger: their `pending` loop
 * under the anticipation sound. Started by a cascade (tumbleBoard handler) or
 * by the spin's first anticipated column (onReelStopping); ended once the drop
 * has landed. Both are no-ops when already in that state.
 */
export const scatterPendingStart = () => {
	if (stateGame.scatterPending) return;
	stateGame.scatterPending = true;
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_anticipation_start' });
	eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bs_anticipation' });
};
export const scatterPendingEnd = () => {
	if (!stateGame.scatterPending) return;
	stateGame.scatterPending = false;
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bs_anticipation' });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_anticipation_end' });
};

// win levels

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	portraitStage,
	sideStage,
	boardLayout,
	frameLayout,
	multiplierPlateLayout,
	counterSpots,
	portraitCounterLayout,
	winBeamLayout,
	boardRaw,
	tumbleBoardCombined,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
