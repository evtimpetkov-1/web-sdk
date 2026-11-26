import { type SpinningReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
/**
 * A symbol as the book sends it. `multiplier` is a Coin's value (x total bet): the
 * math SDK's own attribute name, ASSUMED until the math's first book shows what it
 * sends (the one place that reads it is coinValue in utils.ts).
 */
export type RawSymbol = {
	name: SymbolName;
	multiplier?: number;
};
export type BetMode = keyof typeof config.betModes;
// the book's values (reveal.gameType); the presentation flips at the curtains
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = ['static', 'spin', 'land', 'win', 'postWinStatic'] as const;

export type SymbolState = SpinningReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};

/** the three loot bags over the reels: P1 fills cash, P2 gems, P3 gold */
export const BAG_KEYS = ['cash', 'gem', 'gold'] as const;
export type BagKey = (typeof BAG_KEYS)[number];
