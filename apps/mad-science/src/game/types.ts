import { type CascadingReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
export type RawSymbol = { name: SymbolName; multiplier?: number; scatter?: boolean };
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = [
	'static',
	'spin',
	'land',
	'win',
	'postWinStatic',
	'explosion',
	// pending loop while a round is in play (the scatter and the armed bomb have
	// one; the rest show their static plate) — derived in ReelSymbol/TumbleSymbol,
	// never set on the reel state itself
	'idle',
	// bomb feature (tumble board): the bomb blows itself up, its neighbours keep
	// their plate under a red blast overlay before both are removed
	'explode',
	'blasted',
	// cloner feature (reel board): the original casts its ghosts, a clone's sign
	// grows in under the goo splat, every cloner's sign drains out under the flood
	'cast',
	'in',
	'out',
] as const;

export type SymbolState = CascadingReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};
