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
	 * ('WILD' | 'COIN' | 'SYMBOL') and on base-game kraken spins, and leaves
	 * `isSpecialSpin` false throughout — so treat the PRESENCE of `spinType` as
	 * the attack flag and `isSpecialSpin` as a legacy fallback.
	 *
	 * Wilds and coins arrive as REAL symbols in `board` (`wild: true` /
	 * `coin: true` + `multiplier`); the board is authoritative for positions.
	 * `spinType` only says what kind of attack the book intended.
	 */
	isSpecialSpin?: boolean;
	spinType?: 'WILD' | 'COIN' | 'SYMBOL';
	/**
	 * SYMBOL kraken spins only: the regular paying symbol the kraken chose and
	 * replicated (measured off a real RGS book, 2026-08-24 — the math names the
	 * field `symbol`). The copies are ordinary board symbols, so this field is
	 * the only way to know which symbol the attack stamped — the FE presents
	 * EVERY visible board instance of it as kraken-placed (natural and placed
	 * copies are indistinguishable, which is also how WILD attacks already
	 * read). A SYMBOL reveal without this field plays as a normal spin.
	 */
	symbol?: SymbolName;
	/**
	 * WILD and SYMBOL kraken spins: where the kraken placed its copies. The FE
	 * deliberately IGNORES this and scans the board instead — ReelSymbol hides
	 * board symbols by NAME while the overlay holds one of their kind, so every
	 * visible instance needs an overlay twin, including natural ones this list
	 * does not cover (a real SYMBOL book showed 9 board instances vs 6 listed).
	 */
	positions?: Position[];
	/**
	 * The kraken's win multiplier for THIS spin (free spins in practice; the
	 * math sets it on WILD, COIN and SYMBOL reveals alike), applied to all of
	 * the spin's wins including coin wins. Presentation-only on the FE — the
	 * book's winInfo/setWin amounts already include it (each win's
	 * `meta.multiplier`/`meta.globalMult` mirror it). Absent or 1 = none.
	 */
	globalMult?: number;
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
