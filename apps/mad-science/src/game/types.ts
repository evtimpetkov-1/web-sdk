import { type CascadingReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
// M_TAKEN: FE-only, the bare plate a collected multiplier leaves behind
export type RawSymbol = {
	name: SymbolName | 'M_TAKEN';
	multiplier?: number;
	scatter?: boolean;
	bomb?: boolean;
	cloner?: boolean;
};
export type BetMode = keyof typeof config.betModes;
// the book's values (reveal.gameType); the presentation flips at the curtains
export type GameType = 'basegame' | 'freegame';

export const SYMBOL_STATES = [
	'static',
	'spin',
	'land',
	'win',
	'postWinStatic',
	'explosion',
	// idle loop while a round is in play (the scatter and the armed bomb have
	// one; the rest show their static plate) — derived in ReelSymbol/TumbleSymbol,
	// never set on the reel state itself
	'idle',
	// scatter anticipation: the Scatters' tension loop while a cascade drops with
	// one Scatter short of a trigger (stateGame.scatterPending) — derived in
	// TumbleSymbol like idle; the rest show their static plate
	'pending',
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
