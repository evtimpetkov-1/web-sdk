import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position } from './types';

// book events shared with scatter game
type BookEventReveal = {
	index: number;
	type: 'reveal';
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
	/**
	 * Kraken attack on this spin.
	 *
	 * `spinType` is the one to read: the math sets it on every free-spin reveal
	 * ('WILD' or 'COIN') and on base-game special spins, and leaves
	 * `isSpecialSpin` false throughout — so treat the PRESENCE of `spinType` as
	 * the attack flag and `isSpecialSpin` as a legacy fallback.
	 *
	 * Both wilds and coins arrive as REAL symbols in `board` (`wild: true` /
	 * `coin: true` + `multiplier`); the board is authoritative for positions.
	 * `spinType` only says what kind of attack the book intended.
	 */
	isSpecialSpin?: boolean;
	spinType?: 'WILD' | 'COIN';
	/** Convenience copy of the landed coin values; the same data is on `board`. */
	coinMultipliers?: (Position & { multiplier: number })[];
};

type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number;
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
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

type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	winLevel: number;
};

type BookEventFreeSpinRetrigger = {
	index: number;
	type: 'freeSpinRetrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		kind: number;
		win: number;
		positions: Position[];
		meta: {
			/** Payline wins only — the coin win is not on a line. */
			lineIndex?: number;
			multiplier: number;
			winWithoutMult: number;
			globalMult: number;
			lineMultiplier: number;
			/**
			 * Coin win only (`symbol: 'C'`): the value of each landed coin, in the
			 * same order as `positions`. Their sum is the bet multiplier the kraken
			 * hands to the winbox.
			 */
			coinMultipliers?: number[];
		};
	}[];
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
	| BookEventSetTotalWin
	| BookEventFreeSpinTrigger
	| BookEventFreeSpinRetrigger
	| BookEventUpdateFreeSpin
	| BookEventCreateBonusSnapshot
	| BookEventFinalWin
	| BookEventSetWin
	| BookEventFreeSpinEnd;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
