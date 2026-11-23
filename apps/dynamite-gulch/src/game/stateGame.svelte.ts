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
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_ANTICIPATED,
	INITIAL_SYMBOL_STATE,
	REEL_LAND_RATES,
	BONUS_LAND_RATES,
	ladderRate,
	UI_KIND,
} from './constants';
import type { SoundEffectName } from './sound';

// feature symbols sting over the column thud; paying symbols have no landing
// sound by decision (30 rigs land at once — reel_land / tumble_drop carry it),
// and the Wild never lands: it is made by a bomb (TumbleBoard plays its sting)
const LAND_SFX: Partial<Record<RawSymbol['name'], SoundEffectName>> = {
	M: 'sfx_dg_mult_land',
	B: 'sfx_dg_bomb_land',
	C: 'sfx_dg_cloner_land',
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
			name: 'sfx_dg_bonus_land',
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
				name: 'sfx_dg_reel_land',
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
	/** its cell on the reel board (the padded reel's index, like book positions) */
	reelIndex: number;
	symbolIndex: number;
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
	// Cash Respins in play (Chaos Lab 2): gameType is 'freegame' too (the feature
	// dressing), and the FS counter reads RESPINS LEFT instead of FREE SPINS
	cashRespins: false,
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
	// the spin in progress's cascade win (book units, cumulative per spin): set by
	// updateTumbleWin / boardMultiplierInfo, zeroed by reveal and by setTotalWin,
	// which folds it into stateBet.winBookEventAmount. FreeSpinTotalWin adds the two.
	tumbleWin: 0,
	// bomb feature: set by bombExplode, consumed by the next tumbleBoardExplode
	bombPending: undefined as BombPending | undefined,
	// performance.now() when the fuse loop (sfx_dg_bomb_fuse) last started (Sound.svelte):
	// the armed bombs' heartbeat is phase-locked to it (BombHeartbeatLock)
	bombFuseStartedAt: undefined as number | undefined,
	// cloner feature: goo covers over reel cells and the ghosts flying between them
	cloneFx: {} as Record<string, CloneFx>,
	movingClones: [] as MovingClone[],
});

// The multiplier plaque centred above the reel frame (Dynamite Gulch: a walnut panel in a
// copper rim, art-review/dynamite-gulch/build_plates.py, on the old pipe plate's aspect):
// ~38% of the board width, its bottom rim sunk into the frame's top beam. Board-local coords
// (origin = board top-left), shared by GlobalMultiplier (draws it) and MultiplierBoard
// (flies collected multiplier symbols onto it). Portrait drew it 1.28x until the board
// itself grew there (2026-10-26); the extra size cost the logo its room.
const MULT_PLATE_RATIO = 318 / 146; // mult_plate.webp (954x438)
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
 * its bottom beam just above the shared bottom bar, and the band above the
 * plate holds the logo. The board
 * group (BoardContainer, frame, plate) scales by `scale` about the board
 * centre; board-local units are unchanged. A wide portrait canvas (tablet
 * upright) runs out of height first: the frame narrows to keep a band for the
 * logo. Main-layout units; `top`/`left` are the canvas edges in them.
 */
// frame_resized.png's pipes are opaque over x 5..955, so this lets them touch the edges
const PORTRAIT_FRAME_FILL = FRAME_ART.width / 950;
// components-ui-pixi LayoutPortrait: the buy disc's top sits h - 536 (standard layout)
const PORTRAIT_UI_TOP = 540;
const PORTRAIT_UI_GAP = 12;
// x visible width: the band kept above the plate when the height binds
const PORTRAIT_MIN_TOP = 0.11;
// frame_resized.png row where the bottom pipe ends (only drips below)
const FRAME_PIPE_BOTTOM = 832;

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
 * Desktop and phone landscape (Evtim, 2026-11-20: "increase the slot size ... in desktop
 * and landscape"): the board group (reels, frame, plate, counters) grows until the reels'
 * bottom row stands just above the generic bar and the multiplier plate, when it shows,
 * just under the canvas top. On a 16:9 screen the plate and the bar already took all the
 * height, so on LANDSCAPE the room is the frame's bottom beam, which goes behind the bar.
 * DESKTOP (the same day, his next ask) has the side layout below instead: the plate and
 * counters beside the frame, the whole frame in view. On a window narrower than 16:9 the width caps it (the
 * logo keeps its room beside the frame) and the group is centred in the height.
 * WIDE_GROW = false = the old fixed size (scale 1, centred). The themed bar is not
 * measured here, so it keeps the old size.
 */
const WIDE_GROW = UI_KIND === 'generic';
// the generic bar's top, standard layout units above the canvas bottom
// (components-ui-html GenericUI.svelte: desktop's plate is 96 tall, 12 off the bottom;
// the phone layouts' strip is 124). The replay HUD's rows sit inside the same height.
const WIDE_UI_TOP = { desktop: 108, landscape: 124 };
const WIDE_UI_GAP = 4; // the reel window's bottom to the bar
const WIDE_TOP_MARGIN = 8; // the plate's top to the canvas top
const SIDE_UI_GAP = 10; // desktop side layout: the frame's bottom beam to the bar
const SIDE_TOP_MARGIN = 14; // and its top beam to the canvas top
const WIDE_MAX_FRAME = 0.53; // the frame's share of the visible width, at most (16:9 uses 0.51; wider, and on a 16:10 window Spin clips the bottom-right cell; it also leaves the side columns their room)

/**
 * Desktop side columns (Evtim, 2026-11-20: "for desktop - can you move the multipliers plate
 * to the right side of the slot ... free up space on top, so we can move the reelsboard up,
 * right now its too much into the UI"). Nothing stands above the frame any more: the plate
 * is in a column right of the frame, its top level with the reels' top, the WIN / TOTAL WIN
 * counter under it; the mirror column left of the frame holds the logo and RESPINS LEFT
 * under it; the lanterns hang on the houses in the background (HouseLanterns). So the board
 * group is the frame alone, top beam to bottom beam, fitted between the canvas top and the
 * bar. Board-local units; `left` / `right` are the columns' centres, `y` the counters'
 * label / value line (label above it, value below), `room` a counter's width.
 * DESK_SIDE = false = the plate and counters above the frame, as on landscape.
 */
const DESK_SIDE = true;
const sideLayout = () => WIDE_GROW && DESK_SIDE && stateLayoutDerived.layoutType() === 'desktop';
// frame.webp: the side post's width (right of the window; the left is 69)
const FRAME_SIDE = ((FRAME_ART.width - FRAME_ART.window.x - FRAME_ART.window.width) * BOARD_SIZES.width) / FRAME_ART.window.width;
const SIDE_GAP = 24; // the frame's outer edge to the plate
const SIDE_COUNTER_GAP = 30; // the plate's bottom to the counter's label
const SIDE_LABEL = SYMBOL_SIZE * 0.26; // the counters' LABEL_SIZE
const FRAME_OPAQUE_BOTTOM = 846; // frame.webp: the bottom beam's last row (the art is 879 tall)
const sideColumns = () => {
	const plate = plateSize();
	const reach = FRAME_SIDE + SIDE_GAP + plate.width / 2;
	return {
		left: -reach,
		right: BOARD_SIZES.width + reach,
		y: plate.height + SIDE_COUNTER_GAP + SIDE_LABEL,
		room: plate.width,
	};
};

const wideStage = (layout: 'desktop' | 'landscape') => {
	const main = stateLayoutDerived.mainLayout();
	const canvas = stateLayoutDerived.canvasSizes();
	const visibleWidth = canvas.width / main.scale;
	const top = (main.height - canvas.height / main.scale) / 2;
	const uiTop =
		top +
		(canvas.height - WIDE_UI_TOP[layout] * stateLayoutDerived.mainLayoutStandard().scale) /
			main.scale;
	const side = layout === 'desktop' && sideLayout();
	// at scale 1, above the reel window: the frame's top beam, and the plate over it unless it
	// is in the side column; below it (side layout only): the frame's bottom beam, which then
	// stays in view above the bar instead of going behind it
	const above =
		FRAME_ART.window.y * FRAME_UNIT_Y +
		(side ? 0 : plateSize().height * (1 - MULT_PLATE_OVERLAP));
	const below = side
		? (FRAME_OPAQUE_BOTTOM - FRAME_ART.window.y - FRAME_ART.window.height) * FRAME_UNIT_Y
		: 0;
	const tall = above + BOARD_SIZES.height + below;
	const room = uiTop - (side ? SIDE_UI_GAP : WIDE_UI_GAP) - top - (side ? SIDE_TOP_MARGIN : WIDE_TOP_MARGIN);
	const scale = Math.min(room / tall, (visibleWidth * WIDE_MAX_FRAME) / FRAME_WIDTH);
	const groupTop = top + (side ? SIDE_TOP_MARGIN : WIDE_TOP_MARGIN) + (room - tall * scale) / 2;
	return { scale, uiTop, boardY: groupTop + (above + BOARD_SIZES.height / 2) * scale };
};

const boardLayout = () => {
	const main = stateLayoutDerived.mainLayout();
	const layout = stateLayoutDerived.layoutType();
	const stage =
		layout === 'portrait'
			? portraitStage()
			: WIDE_GROW && (layout === 'desktop' || layout === 'landscape')
				? wideStage(layout)
				: undefined;
	return {
		x: main.width * 0.5,
		y: stage?.boardY ?? main.height * 0.5,
		// width/height stay the board-local BOARD_SIZES; `scale` maps them to main units
		scale: stage?.scale ?? 1,
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

// the plate is centred over the reels on every layout (in portrait it used to
// slide left of the mascot; she left the game on 2026-11-13), except desktop's side
// layout: right of the frame, its top level with the reels' top
const multiplierPlateLayout = () => {
	const { width, height } = plateSize();
	if (sideLayout()) return { x: sideColumns().right, y: height / 2, width, height };
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
 * Portrait counters (Evtim, 2026-10-26: beside the plate they were squeezed on
 * the left): one line each on the frame's
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
// the dark panel's middle, of the plate height from its centre (the plaque's rim
// is the same above and below)
const COUNTER_PLATE_PANEL_Y = 0;
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
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_dg_anticipation_start' });
	eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_dg_anticipation' });
};
export const scatterPendingEnd = () => {
	if (!stateGame.scatterPending) return;
	stateGame.scatterPending = false;
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_dg_anticipation' });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_dg_anticipation_end' });
};

// win levels

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	portraitStage,
	wideStage,
	sideLayout,
	sideColumns,
	boardLayout,
	frameLayout,
	multiplierPlateLayout,
	portraitCounterLayout,
	boardRaw,
	tumbleBoardCombined,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
