import config from './config';

/**
 * Values the Game Rules, Paytable and shop list, from Chaos Lab 2's Game Rules
 * Specification (iCloud MyDrive/chaos lab 2/Mad Science 2 — Game Rules
 * Specification.docx, 2026-11-04). Mode cost, RTP and max win are not repeated
 * here: the rules read them off config.betModes, the entries the shop and the
 * RGS bet modes use. Every value is formatted per locale at render time and no
 * translation carries one.
 *
 * NO MATH STATISTICS (Evtim, 2026-10-24): the player-facing text shows RTP and
 * max win only — never a probability, a percentage, a frequency or an odds
 * table. Only the values a feature can produce are listed (Stake asks for every
 * obtainable value), never how likely each one is.
 */

export type RgsMode = keyof typeof config.betModes;

/** Every value a base-game Multiplier symbol can carry ("the same as in Mad Science"). */
export const MULTIPLIER_VALUES = [2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 30, 50, 100, 200, 500];

// Cash Respins
/** respins at the start, and after every respin where a symbol lands */
export const CASH_RESPINS = 3;
/** the grid's positions: a full grid of coins ends the feature */
export const CASH_POSITIONS = 30;
/** positions that start with a multiplier frame, by the Scatters that triggered */
export const CASH_START_FRAMES = { five: 5, sixOrMore: 10 };
/** the values a starting frame (5 or 6+ Scatters, Mutant Respins) can have */
export const CASH_START_FRAME_VALUES = [2, 3, 5, 10, 15, 25, 50];
/** positions Mutant Respins always start framed (values: CASH_START_FRAME_VALUES) */
export const CASH_MUTANT_START_FRAMES = 10;
/** the values Overcharged Respins' 30 starting frames can have */
export const CASH_OVERCHARGED_FRAME_VALUES = [2, 3, 5, 10, 15, 25, 50, 100];
/** a Coin's values, x the base bet */
export const CASH_COIN_VALUES = [1, 2, 3, 4, 5, 8, 10, 15, 20, 25, 50, 100, 250];
/** a respin Multiplier's values */
export const CASH_MULTIPLIER_VALUES = [2, 3, 4, 5, 10, 25, 50, 100];
/** frame values add up to at most this */
export const CASH_FRAME_MAX = 150;
/** a Bomb's values, x the base bet (before its frame) */
export const CASH_BOMB_VALUES = [1, 2, 3, 5, 10, 25];
/** Overcharged Respins' Bombs can also be worth this */
export const CASH_OVERCHARGED_BOMB_MAX = 50;
/** how many coins a Cloner spreads */
export const CASH_CLONER_COINS = { min: 2, max: 6 };
