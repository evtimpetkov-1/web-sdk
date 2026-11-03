import config from './config';

/**
 * Values the Game Rules and Paytable list, from the Game Rules Specification
 * (iCloud MyDrive/Mad Science/Mad Science — Game Rules Specification.docx,
 * rebalanced math 2026-10-27). Mode cost, RTP and
 * max win are not repeated here: the rules read them off config.betModes, the
 * entries the shop and the RGS bet modes use. Every value is formatted per
 * locale at render time and no translation carries one.
 *
 * NO MATH STATISTICS (Evtim, 2026-10-24): the player-facing text shows RTP and
 * max win only — never a probability, a percentage, a frequency or an odds
 * table. Only the values a feature can produce are listed (Stake asks for every
 * obtainable value), never how likely each one is.
 */

export type RgsMode = keyof typeof config.betModes;

/** Every value a Multiplier symbol can carry. */
export const MULTIPLIER_VALUES = [2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 30, 50, 100, 200, 500];

/** The free-spins counts a bought mode can draw. */
export const FREE_SPIN_COUNTS = [10, 15, 20];

/** The total multiplier Overcharged Free Spins can start with. */
export const OVERCHARGED_START_MULTIPLIERS = [
	2, 3, 5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 300, 500,
];
