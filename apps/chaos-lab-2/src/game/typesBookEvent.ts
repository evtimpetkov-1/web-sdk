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

// Bomb (math contract, measured off RGS books 2026-10-23): fires when a step has
// no win; every bomb on the board explodes at once. ALWAYS followed by a normal
// `tumbleBoard` whose explodingSymbols are `cleared` — the bombs are NOT in it,
// each stays in place as a Wild (`wilds` = the bomb cells). The blast is drawn by
// that tumble (TumbleBoard consumes stateGame.bombPending).
type BookEventBombExplode = {
	index: number;
	type: 'bombExplode';
	bombs: Position[];
	/** paying symbols in each bomb's 3x3, clipped to the board */
	cleared: Position[];
	wilds: Position[];
};

// Multipliers (same source): every multiplier on the board is collected before the
// step's wins pay. `totalMultiplier` is the plate's new value; the `tumbleBoard`
// that follows clears the collected cells.
type BookEventCollectMultipliers = {
	index: number;
	type: 'collectMultipliers';
	multipliers: (Position & { multiplier: number })[];
	totalMultiplier: number;
};

// A bought round (Operation / Mutant / Overcharged Free Spins) opens with this instead of a base reveal + freeSpinTrigger
// (MEASURED, betID 274417160, LUCKY_DRAW_FEATURE_HEAVY: { totalFs: 15,
// initialMultiplier: 0 }). initialMultiplier is Overcharged Free Spins' starting
// plate value, 0 when there is none — the Overcharged case is not yet seen in a book.
type BookEventBuyFreeSpins = {
	index: number;
	type: 'buyFreeSpins';
	totalFs: number;
	initialMultiplier: number;
};

// 3+ scatters at the end of a free spin: +5 spins (updateFreeSpin follows)
type BookEventFreeSpinRetrigger = {
	index: number;
	type: 'freeSpinRetrigger';
	totalFs: number;
	positions: Position[];
};

// Cloner (math contract, measured 2026-10-23): fires when a step has no win and
// no bomb. Ghosts fly from `cloner` to the `cloned` paying symbols, those cells
// become cloners, then every cloner (original + cloned) turns into `symbol`. The
// board changes in place (no tumble); winInfo or the spin's end follows.
type BookEventClonerActivate = {
	index: number;
	type: 'clonerActivate';
	cloner: Position;
	cloned: Position[];
	symbol: SymbolName;
};

// Cash Respins (Chaos Lab 2, the Free Spins' replacement). MEASURED off two
// real books (2026-11-03: 3135032 = 4 Scatters, 3964721 = 5 Scatters with 5
// starting frames). Rows are the padded index (1-5) like every position here.
// Values are x bet (a coin "value 2" shows as x2), amounts are book units.
// Per respin with landings: cashRespinLand, then — only when present, in this
// order — cashMultiplierFrames, cashCoinsMultiply, cashClonerActivate,
// cashBombActivate, then cashRespinUpdate. An empty respin sends only
// cashRespinUpdate.
type CashCellValue = Position & {
	/** the value as it landed, x bet */
	value: number;
	/** the frame under it, 0 = none */
	frame: number;
	/** value x frame (or value when there is no frame) */
	total: number;
};

type BookEventCashRespinTrigger = {
	index: number;
	type: 'cashRespinTrigger';
	scatters: number;
	/** 4 / 5 / 6: how the grid starts (empty / 5 frames / 10 frames) */
	variant: number;
	/** the Scatters, on the board as the cascades left it */
	positions: Position[];
};

// A bought round's first event (MEASURED 2026-11-06, Overcharged Respins buy,
// betID 340324515): no base reveal, no trigger; cashRespinStart follows with the
// starting frames (all 30 when allFrames).
type BookEventBuyCashRespins = {
	index: number;
	type: 'buyCashRespins';
	/** 4 / 5 / 6: the Scatter version the grid starts as (Overcharged sent 4) */
	variant: number;
	/** Overcharged Respins: every position starts framed */
	allFrames?: boolean;
};

type BookEventCashRespinStart = {
	index: number;
	type: 'cashRespinStart';
	variant: number;
	respins: number;
	/** the starting multiplier frames (0 / 5 / 10, all 30 in Overcharged Respins) */
	frames: (Position & { multiplier: number })[];
};

type BookEventCashRespinLand = {
	index: number;
	type: 'cashRespinLand';
	multipliers: (Position & { multiplier: number })[];
	coins: (Position & { value: number })[];
	cloners: Position[];
	bombs: Position[];
};

type BookEventCashMultiplierFrames = {
	index: number;
	type: 'cashMultiplierFrames';
	/** `frame` = the cell's frame after this multiplier (they add up, max x150) */
	multipliers: (Position & { multiplier: number; frame: number })[];
};

type BookEventCashCoinsMultiply = {
	index: number;
	type: 'cashCoinsMultiply';
	coins: CashCellValue[];
};

type BookEventCashClonerActivate = {
	index: number;
	type: 'cashClonerActivate';
	/** the cloner itself, turned into a coin */
	cloner: CashCellValue;
	/** the 2-6 coins it spreads onto empty cells anywhere on the grid */
	coins: CashCellValue[];
};

type BookEventCashBombActivate = {
	index: number;
	type: 'cashBombActivate';
	/** the bomb itself, turned into a coin */
	bomb: CashCellValue;
	/** the coins in its 3x3 area: + the bomb's total each */
	boosted: (Position & { add: number; total: number })[];
};

type BookEventCashRespinUpdate = {
	index: number;
	type: 'cashRespinUpdate';
	/** respins played so far, this one included */
	respin: number;
	/** 3 again after a respin where anything landed */
	respinsLeft: number;
	/** the coins on the grid, x bet */
	totalCash: number;
};

type BookEventCashRespinEnd = {
	index: number;
	type: 'cashRespinEnd';
	/** the feature's win, book units */
	amount: number;
	coins: number;
	respinsPlayed: number;
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
	| BookEventBuyFreeSpins
	| BookEventUpdateFreeSpin
	| BookEventUpdateGlobalMult
	| BookEventTumbleBoard
	| BookEventBombExplode
	| BookEventCollectMultipliers
	| BookEventFreeSpinRetrigger
	| BookEventClonerActivate
	| BookEventCreateBonusSnapshot
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd
	| BookEventBuyCashRespins
	| BookEventCashRespinTrigger
	| BookEventCashRespinStart
	| BookEventCashRespinLand
	| BookEventCashMultiplierFrames
	| BookEventCashCoinsMultiply
	| BookEventCashClonerActivate
	| BookEventCashBombActivate
	| BookEventCashRespinUpdate
	| BookEventCashRespinEnd
	// customised
	| BookEventCreateBonusSnapshot;

export type { CashCellValue };

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
