import _ from 'lodash';
import type { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, Position, RawSymbol, SymbolState } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
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
	// cloner feature: goo covers over reel cells and the ghosts flying between them
	cloneFx: {} as Record<string, CloneFx>,
	movingClones: [] as MovingClone[],
});

const boardLayout = () => ({
	x: stateLayoutDerived.mainLayout().width * 0.5,
	y: stateLayoutDerived.mainLayout().height * 0.5,
	anchor: { x: 0.5, y: 0.5 },
	pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
	...BOARD_SIZES,
});

// Riveted pipe plate centred above the reel frame (Evtim's mockup, 2026-09-02): ~38% of
// the board width, its bottom pipe sunk into the frame's top pipe. Board-local coords
// (origin = board top-left), shared by GlobalMultiplier (draws it) and MultiplierBoard
// (flies collected multiplier symbols onto it).
const MULT_PLATE_RATIO = 318 / 146; // mult_plate.png
const MULT_PLATE_WIDTH = 0.38; // of board width
const MULT_PLATE_OVERLAP = 0.06; // of plate height, sunk into the frame's top pipe
// Pipe frame sprite (centre anchored, main-layout coords): scaled per axis so its
// transparent window covers the board exactly — the window is not the board's aspect,
// so the pipes deform slightly rather than the symbols.
const frameLayout = () => {
	const board = boardLayout();
	const { window: win } = FRAME_ART;
	const scaleX = board.width / win.width;
	const scaleY = board.height / win.height;
	return {
		x: board.x + (FRAME_ART.width / 2 - (win.x + win.width / 2)) * scaleX,
		y: board.y + (FRAME_ART.height / 2 - (win.y + win.height / 2)) * scaleY,
		width: FRAME_ART.width * scaleX,
		height: FRAME_ART.height * scaleY,
	};
};

const multiplierPlateLayout = () => {
	const board = boardLayout();
	const frame = frameLayout();
	// frame sprite top edge in board-local coords
	const frameTop = frame.y - frame.height / 2 - (board.y - board.height / 2);
	const scale = stateLayoutDerived.isStacked() ? 1.28 : 1;
	const width = board.width * MULT_PLATE_WIDTH * scale;
	const height = width / MULT_PLATE_RATIO;
	return {
		x: board.width * 0.5,
		y: frameTop + height * (MULT_PLATE_OVERLAP - 0.5),
		width,
		height,
	};
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
	boardLayout,
	frameLayout,
	multiplierPlateLayout,
	boardRaw,
	tumbleBoardCombined,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
