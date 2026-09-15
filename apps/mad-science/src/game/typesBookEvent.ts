import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

type BookEventReveal = {
	index: number;
	type: 'reveal';
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		win: number;
		positions: Position[];
		meta: {
			globalMult: number;
			clusterMult: number;
			winWithoutMult: number;
			overlay: Position;
		};
	}[];
};

type BookEventSetTumbleWin = {
	index: number;
	type: 'updateTumbleWin';
	amount: number;
};

type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number;
};

type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	amount: number;
	total: number;
};

type BookEventUpdateGlobalMult = {
	index: number;
	type: 'updateGlobalMult';
	globalMult: number;
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

type BookEventBoardMultiplierInfo = {
	index: number;
	type: 'boardMultiplierInfo';
	multInfo: {
		positions: (Position & { multiplier: number })[];
	};
	/** plate value after collecting (proposed Mad Science contract) */
	globalMult?: number;
	/** sample-math shape: multiplier applied to the whole cascade win at the end */
	winInfo?: {
		tumbleWin: number;
		boardMult: number;
		totalWin: number;
	};
};

type BookEventTumbleBoard = {
	index: number;
	type: 'tumbleBoard';
	explodingSymbols: Position[];
	newSymbols: RawSymbol[][];
};

// Bomb (proposed Mad Science contract, 2026-09-09): runs after the cascade chain
// has settled. ALWAYS followed by a normal `tumbleBoard` whose explodingSymbols
// are `destroyed` plus `position` and whose newSymbols refill the holes — the
// blast is drawn by that tumble (TumbleBoard consumes stateGame.bombPending).
type BookEventBombExplode = {
	index: number;
	type: 'bombExplode';
	position: Position;
	/** the 3x3 ring around the bomb, clipped to the board */
	destroyed: Position[];
};

// Cloner (same contract): ghosts fly from the cloner to `clones`, those cells
// become cloners, then every cloner (original + clones) turns into `symbol`.
// Reel board raw symbols equal the math's board afterwards; winInfo/tumbles follow.
type BookEventClonerTransform = {
	index: number;
	type: 'clonerTransform';
	position: Position;
	clones: Position[];
	symbol: SymbolName;
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	amount: number;
};

type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	winLevel: number;
};

// customised
type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

export type BookEvent =
	| BookEventReveal
	| BookEventWinInfo
	| BookEventBoardMultiplierInfo
	| BookEventSetTumbleWin
	| BookEventSetTotalWin
	| BookEventFreeSpinTrigger
	| BookEventUpdateFreeSpin
	| BookEventUpdateGlobalMult
	| BookEventTumbleBoard
	| BookEventBombExplode
	| BookEventClonerTransform
	| BookEventCreateBonusSnapshot
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	// customised
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
