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
	MASCOT_CLIP,
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
	M: 'sfx_ms_mult_land',
	B: 'sfx_ms_bomb_land',
	C: 'sfx_ms_cloner_land',
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
			name: 'sfx_ms_bonus_land',
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
				name: 'sfx_ms_reel_land',
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
	// the spin in progress's cascade win (book units, cumulative per spin): set by
	// updateTumbleWin / boardMultiplierInfo, zeroed by reveal and by setTotalWin,
	// which folds it into stateBet.winBookEventAmount. FreeSpinTotalWin adds the two.
	tumbleWin: 0,
	// bomb feature: set by bombExplode, consumed by the next tumbleBoardExplode
	bombPending: undefined as BombPending | undefined,
	// performance.now() when the fuse loop (sfx_ms_bomb_fuse) last started (Sound.svelte):
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
 * Portrait mascot (Evtim, 2026-10-26): he stands BEHIND the board, right of the
 * plate, upper body above the frame's top pipe. Sized so his hair sits just
 * under the canvas top and his waist just under the pipe (the smoke runs off
 * the top). Main-layout units; x/y = the clip's bottom centre, as
 * StackedAlphaVideo anchors it. The plate keeps clear of `flaskLeft`, the logo
 * of `headLeft`.
 */
// main units: hair below the canvas top; board-local units: waist below the frame top
const PORTRAIT_MASCOT_TOP_MARGIN = 16;
const PORTRAIT_MASCOT_WAIST_TUCK = 20;
// head centre, a share of the visible width
const PORTRAIT_MASCOT_HEAD_POS = 0.79;
// tall phones: the clip stops growing at this x the (scaled) board height and
// sinks behind the frame instead (the 1104-px source starts to soften)
const PORTRAIT_MASCOT_MAX_HEIGHT = 1.8;

const portraitMascot = () => {
	const stage = portraitStage();
	const clip = MASCOT_CLIP;
	const waistY = stage.frameTop + PORTRAIT_MASCOT_WAIST_TUCK * stage.scale;
	const targetHeight = Math.min(
		((waistY - stage.top - PORTRAIT_MASCOT_TOP_MARGIN) * clip.height) / (clip.waist - clip.headTop),
		PORTRAIT_MASCOT_MAX_HEIGHT * BOARD_SIZES.height * stage.scale,
	);
	const width = (targetHeight * clip.width) / clip.height;
	const headX = stage.left + stage.visibleWidth * PORTRAIT_MASCOT_HEAD_POS;
	// a clip column -> main x
	const at = (clipX: number) => headX + ((clipX - clip.headX) / clip.width) * width;
	return {
		targetHeight,
		x: at(clip.width / 2),
		y: waistY + (1 - clip.waist / clip.height) * targetHeight,
		headLeft: at(clip.headX - clip.headHalfWidth),
		flaskLeft: at(clip.flaskLeft),
	};
};

const boardLayout = () => {
	const main = stateLayoutDerived.mainLayout();
	const portrait = stateLayoutDerived.layoutType() === 'portrait' ? portraitStage() : undefined;
	return {
		x: main.width * 0.5,
		y: portrait?.boardY ?? main.height * 0.5,
		// width/height stay the board-local BOARD_SIZES; `scale` maps them to main units
		scale: portrait?.scale ?? 1,
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

// portrait: the plate slides left until it clears the mascot's flask, as far as
// his win reaction swings it (Evtim, 2026-10-26: it hid his flask and arm), by
// this gap in board-local units, but no further than the board's left edge (tall
// phones draw the mascot bigger). The counters left the top pipe there
// (portraitCounterLayout), so nothing else needs the room.
const PORTRAIT_PLATE_FLASK_GAP = 8;

const multiplierPlateLayout = () => {
	const { width, height } = plateSize();
	// frame sprite top edge in board-local coords
	const frameTop = -FRAME_ART.window.y * FRAME_UNIT_Y;
	let x = BOARD_SIZES.width * 0.5;
	if (stateLayoutDerived.layoutType() === 'portrait') {
		const board = boardLayout();
		const flask = (portraitMascot().flaskLeft - board.x) / board.scale + board.pivot.x;
		x = Math.max(width / 2, Math.min(x, flask - PORTRAIT_PLATE_FLASK_GAP - width / 2));
	}
	return {
		x,
		y: frameTop + height * (MULT_PLATE_OVERLAP - 0.5),
		width,
		height,
	};
};

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
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_anticipation_start' });
	eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_ms_anticipation' });
};
export const scatterPendingEnd = () => {
	if (!stateGame.scatterPending) return;
	stateGame.scatterPending = false;
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_ms_anticipation' });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_anticipation_end' });
};

// win levels

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	portraitStage,
	portraitMascot,
	boardLayout,
	frameLayout,
	multiplierPlateLayout,
	portraitCounterLayout,
	boardRaw,
	tumbleBoardCombined,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
