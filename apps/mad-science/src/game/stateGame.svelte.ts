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
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({ rawSymbol }: { rawSymbol: RawSymbol }) => {
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	if (rawSymbol.name === 'M') {
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_multiplier_landing',
		});
	}
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
				name: 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
		},
		onSymbolLand,
	});

	reel.reelState.spinOptions = () =>
		reel.reelState.spinType === 'fast' ? SPIN_OPTIONS_FAST : SPIN_OPTIONS_DEFAULT;

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
export type BombPending = { position: Position; destroyed: Position[] };

// A goo cover over one reel cell (CloneFx in ReelSymbol), keyed by
// `${reel}-${row}` where row is the book's padded index (getCloneFxKey).
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
	// pending loop for as long as this holds — they are "waiting for the cascade".
	roundActive: false,
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

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

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
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
