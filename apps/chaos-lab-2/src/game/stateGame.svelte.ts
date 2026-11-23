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
	UI_KIND,
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
	// per cell (getCellKey): the cell is playing its symbol's at-rest `fidget`
	// (set by BoardFidget, cleared by ReelSymbol when the one-shot ends or the
	// cell leaves 'static'). Shared for the same reason as idleHold.
	fidget: {} as Record<string, boolean>,
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
 * Mascot.svelte anchors it. The plate keeps clear of `flaskLeft`, the logo
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

/**
 * Desktop and phone landscape: the SIDE layout (Evtim, 2026-11-20: "move the multiplier
 * plate on the left side of the slot ... leave some empty space on the top, so we can
 * increase the reels board size, but not overlap its bottom reels frame part with the UI
 * black bar"). Nothing stands above the frame any more:
 * - the multiplier plate is in a column LEFT of the frame, under the logo
 *   (multiplierPlateLayout, GameLogo);
 * - the counters (WIN / TOTAL WIN, RESPINS LEFT) are one line each on the frame's bottom
 *   pipe, as in portrait (counterLine);
 * - the board group is the frame alone and grows until its top pipe is just under the
 *   canvas top and its slime drips end at the bar's top. Nothing of the frame is behind
 *   the bar: on desktop the bottom pipe also ends above Spin, which rides higher than the
 *   bar and reaches under the frame's corner;
 * - the mascot stays right of the frame, her boots at the bottom pipe's level (Mascot).
 * Sideways the group needs room for the plate's column and for her. Phone landscape has
 * the bar's button column on the right, so the board is NOT centred there: it sits in the
 * middle of what the column leaves.
 * Generic UI only (the bar's sizes are copied from components-ui-html GenericUI.svelte
 * and must follow it); WIDE_SIDE = false = the old layout: plate and counters above a
 * frame at scale 1, centred. Main-layout units unless a name says board-local.
 */
const WIDE_SIDE = UI_KIND === 'generic';
const sideLayout = () => {
	const type = stateLayoutDerived.layoutType();
	return WIDE_SIDE && (type === 'desktop' || type === 'landscape');
};
// GenericUI.svelte, standard layout units. row (desktop): the plate is 96 tall, 12 off the
// bottom; Spin (150 across, its bottom 10 off the canvas bottom) starts 437 right of the
// centre. side (phone landscape): the strip is 124 tall, the button column 214 wide, 28
// off the main box's right edge
const WIDE_UI = {
	desktop: { bar: 108, spinTop: 160, spinLeft: 437 },
	landscape: { bar: 124, column: 242 },
};
const FRAME_ART_BOTTOM = FRAME_ART.height; // the slime drips reach the art's last row
const SIDE_TOP_MARGIN = 8; // the top pipe to the canvas top
const SIDE_DRIP_GAP = 2; // the drips' ends to the bar
const SIDE_SPIN_GAP = 3; // the bottom pipe to Spin's top
const SIDE_MAX_SCALE = 1.3; // tall desktop windows: the mascot keeps her size, so the frame stops here
const SIDE_GAP = 18; // board-local: the frame's left post to the plate, and the plate to the column's far edge
// right of the frame, for the mascot: orb to coat tail she is ~305 across at this size. Desktop
// keeps her whole (her orb may lap the frame's edge a little); on phone landscape her coat
// runs under the bar's buttons by 40, as it always did there
const SIDE_MASCOT_ROOM = { desktop: 300, landscape: 265 };
const SIDE_MASCOT_TUCK = { desktop: 0, landscape: 40 };
// board-local, from the reel window's left edge / top
const FRAME_UNIT_X = BOARD_SIZES.width / FRAME_ART.window.width;
const FRAME_POST = {
	left: FRAME_ART.window.x * FRAME_UNIT_X,
	right: (FRAME_ART.width - FRAME_ART.window.x - FRAME_ART.window.width) * FRAME_UNIT_X,
};
const sideColumn = () => {
	const plate = plateSize();
	const logoHeight = BOARD_SIZES.height * 0.34; // as on the old desktop layout
	const frameTop = -FRAME_ART.window.y * FRAME_UNIT_Y;
	const logoY = frameTop + 6 + logoHeight / 2;
	return {
		/** board-local: the column's centre line */
		x: -(FRAME_POST.left + SIDE_GAP + plate.width / 2),
		width: plate.width + 2 * SIDE_GAP,
		logo: { y: logoY, height: logoHeight },
		plateY: logoY + logoHeight / 2 + 22 + plate.height / 2,
	};
};

const wideStage = () => {
	const layout = stateLayoutDerived.layoutType() === 'landscape' ? 'landscape' : 'desktop';
	const main = stateLayoutDerived.mainLayout();
	const canvas = stateLayoutDerived.canvasSizes();
	const unit = stateLayoutDerived.mainLayoutStandard().scale / main.scale; // a standard unit in main units
	const visibleWidth = canvas.width / main.scale;
	const visibleHeight = canvas.height / main.scale;
	const top = (main.height - visibleHeight) / 2;
	const left = (main.width - visibleWidth) / 2;
	const bottom = top + visibleHeight;
	const uiTop = bottom - WIDE_UI[layout].bar * unit;
	// the bar's button column is at the MAIN box's right edge, however wide the window
	const freeRight =
		layout === 'landscape' ? main.width - WIDE_UI.landscape.column * unit : left + visibleWidth;
	// board-local heights: above the reel window, and below its top
	const above = FRAME_ART.window.y * FRAME_UNIT_Y;
	const pipe = (FRAME_PIPE_BOTTOM - FRAME_ART.window.y) * FRAME_UNIT_Y;
	const drips = (FRAME_ART_BOTTOM - FRAME_ART.window.y) * FRAME_UNIT_Y;
	const groupTop = top + SIDE_TOP_MARGIN;
	const halfLeft = BOARD_SIZES.width / 2 + FRAME_POST.left;
	const halfRight = BOARD_SIZES.width / 2 + FRAME_POST.right;
	const column = sideColumn().width;
	let scale = Math.min(
		(uiTop - SIDE_DRIP_GAP - groupTop) / (above + drips),
		(freeRight - left - SIDE_MASCOT_ROOM[layout]) / (column + halfLeft + halfRight),
		SIDE_MAX_SCALE,
	);
	// desktop: Spin rises above the bar. A frame wide enough to reach over it ends above it
	let pipeLimit = uiTop - SIDE_DRIP_GAP - (drips - pipe) * scale;
	if (layout === 'desktop') {
		const spinLeft = main.width / 2 + WIDE_UI.desktop.spinLeft * unit;
		const spinTop = bottom - WIDE_UI.desktop.spinTop * unit;
		const clears = (spinLeft - SIDE_SPIN_GAP - main.width / 2) / halfRight; // narrow enough to stand beside Spin
		const over = (spinTop - SIDE_SPIN_GAP - groupTop) / (above + pipe); // or short enough to end above it
		if (scale > clears) {
			scale = Math.min(scale, Math.max(clears, over));
			if (scale > clears) pipeLimit = Math.min(pipeLimit, spinTop - SIDE_SPIN_GAP);
		}
	}
	const x = Math.max(
		left + (column + halfLeft) * scale,
		Math.min(main.width / 2, freeRight - SIDE_MASCOT_ROOM[layout] - halfRight * scale),
	);
	// spare height (a width-bound window): the group is centred in it
	const frameTop = groupTop + Math.max(0, pipeLimit - groupTop - (above + pipe) * scale) / 2;
	return {
		scale,
		x,
		boardY: frameTop + (above + BOARD_SIZES.height / 2) * scale,
		left,
		uiTop,
		/** the furthest right the mascot's coat may reach */
		mascotRight: freeRight + SIDE_MASCOT_TUCK[layout],
		frameRight: x + halfRight * scale,
		pipeBottom: frameTop + (above + pipe) * scale,
	};
};

const boardLayout = () => {
	const main = stateLayoutDerived.mainLayout();
	const portrait = stateLayoutDerived.layoutType() === 'portrait' ? portraitStage() : undefined;
	const side = sideLayout() ? wideStage() : undefined;
	return {
		x: side?.x ?? main.width * 0.5,
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

// portrait: the plate slides left until it clears the mascot's flask, as far as
// his win reaction swings it (Evtim, 2026-10-26: it hid his flask and arm), by
// this gap in board-local units, but no further than the board's left edge (tall
// phones draw the mascot bigger). The counters left the top pipe there
// (portraitCounterLayout), so nothing else needs the room.
const PORTRAIT_PLATE_FLASK_GAP = 8;

// Where the plate is on screen ALL the time, empty until a Multiplier is collected (Evtim,
// 2026-11-20: "show the multiplier plate all the time", for the layouts whose plate had just
// moved beside the frame: in its own column it covers nothing, and a column that is empty
// most of the time read as a hole). Elsewhere it shows only while it holds a value
// (2026-11-17: above the reels the empty plate hid the porthole fan). By layout type; the
// two wide ones only in the side layout.
const PLATE_ALWAYS: Record<string, boolean> = { desktop: true, landscape: true, tablet: false, portrait: false };
const multiplierPlateAlways = () => {
	const type = stateLayoutDerived.layoutType();
	return Boolean(PLATE_ALWAYS[type]) && (sideLayout() || type === 'tablet' || type === 'portrait');
};

const multiplierPlateLayout = () => {
	const { width, height } = plateSize();
	// desktop / phone landscape: in the column left of the frame, under the logo
	if (sideLayout()) {
		const column = sideColumn();
		return { x: column.x, y: column.plateY, width, height };
	}
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
// the counters' one-line layout on the bottom pipe: portrait, and the side layout (desktop /
// phone landscape, where the plate they stood beside has left the top); undefined = the old
// label-over-value pairs either side of the plate (tablet)
const counterLine = () =>
	stateLayoutDerived.layoutType() === 'portrait' || sideLayout() ? portraitCounterLayout() : undefined;

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
	sideLayout,
	sideColumn,
	wideStage,
	counterLine,
	boardLayout,
	frameLayout,
	multiplierPlateLayout,
	multiplierPlateAlways,
	portraitCounterLayout,
	boardRaw,
	tumbleBoardCombined,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
