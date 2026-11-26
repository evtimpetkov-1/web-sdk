/**
 * The bonus shop's offers (GenericShop): one per non-base RGS mode. EMPTY: the game
 * has only its base mode until the math defines the others (2026-11-24), and with no
 * offers the generic bar hides its bonus button.
 * - BUY_OPTIONS: 'buy' modes, one round each, behind a confirmation step (Stake
 *   requires one for modes above 2x).
 * - ANTE_OPTIONS: 'activate' modes that stay on until switched off.
 * When they come: cost and max win from config.betModes (never typed here), titles and
 * pitches read when drawn (translations load after this module); Blast Drop's
 * buyOptions.ts is the pattern.
 */
export type ShopOffer = {
	/** RGS bet mode, uppercase like every mode the FE sends (betModeMeta key) */
	key: string;
	title: () => string;
	/** one-liner under the title */
	description: () => string;
	/** x base bet */
	costMultiplier: number;
	maxWin: number;
	image: string;
};

export const BUY_OPTIONS: ShopOffer[] = [];
export const ANTE_OPTIONS: ShopOffer[] = [];
