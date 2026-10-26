import config from './config';

/**
 * The feature shop's offers (BuyShop / BuyConfirm) — one per non-base RGS
 * mode of the Game Rules Specification. Cost and max win come from
 * config.betModes, so the shop can never drift from what the RGS charges.
 *
 * - BUY_OPTIONS: Operation / Mutant / Overcharged Free Spins ('buy' modes, one
 *   round each, behind a confirmation step — Stake requires one for modes
 *   above 2x).
 * - ANTE_OPTIONS: Chaos Mode (2x) and Free Spins Boost (1.5x), 'activate' modes
 *   that stay on until switched off. Each has its own switch; there is only
 *   one active mode key, so turning one on turns the other off.
 *
 * Player-facing names are Evtim's (2026-10-24); the RGS mode names stay the
 * math's. Titles and pitches avoid every social-mode restricted word, so they
 * render as-is in both modes.
 */
type RgsMode = keyof typeof config.betModes;

export type ShopOffer = {
	/** RGS bet mode, uppercase like every mode the FE sends (betModeMeta key) */
	key: string;
	title: string;
	/** one-liner under the title */
	description: string;
	/** x base bet */
	costMultiplier: number;
	maxWin: number;
	image: string;
	/** 1-5 radiation trefoils; unset until the math states a volatility per mode */
	volatility?: number;
};

// URL-relative like assets.ts (the static folder is served at the root; a
// root-absolute path breaks under Stake Engine's subpath — see Kraken's notes).
// Each path must be a string LITERAL: Vite rewrites a template-literal
// `new URL` into a glob lookup, which matches nothing here and yields
// 'undefined' (the cards requested /src/game/undefined).
const ART = {
	operation: new URL('../../assets/madscience/buy/operation.webp', import.meta.url).href,
	mutant: new URL('../../assets/madscience/buy/mutant.webp', import.meta.url).href,
	overcharged: new URL('../../assets/madscience/buy/overcharged.webp', import.meta.url).href,
	chaos: new URL('../../assets/madscience/buy/chaos.webp', import.meta.url).href,
	boost: new URL('../../assets/madscience/buy/boost.webp', import.meta.url).href,
};

const offer = (
	mode: RgsMode,
	fields: Pick<ShopOffer, 'title' | 'description' | 'image'>,
): ShopOffer => ({
	key: mode.toUpperCase(),
	costMultiplier: config.betModes[mode].cost,
	maxWin: config.betModes[mode].max_win,
	...fields,
});

export const BUY_OPTIONS: ShopOffer[] = [
	offer('lucky_draw_free_spins', {
		title: 'OPERATION FREE SPINS',
		description: 'Straight into Free Spins. The number of spins is drawn at random: 10, 15 or 20.',
		image: ART.operation,
	}),
	offer('lucky_draw_feature_heavy', {
		title: 'MUTANT FREE SPINS',
		description:
			'Free Spins with far more Multipliers, Cloners and Bombs. 10, 15 or 20 spins at random.',
		image: ART.mutant,
	}),
	offer('super_lucky_draw_free_spins', {
		title: 'OVERCHARGED FREE SPINS',
		description:
			'Free Spins that start with a total multiplier of ×2 to ×100. 10, 15 or 20 spins at random.',
		image: ART.overcharged,
	}),
];

export const ANTE_OPTIONS: ShopOffer[] = [
	offer('ante_1', {
		title: 'CHAOS MODE',
		description: 'Multipliers, Cloners & Bombs appear 2.6× more often.',
		image: ART.chaos,
	}),
	offer('ante_2', {
		title: 'FREE SPINS BOOST',
		description: 'Free Spins trigger 2× more often.',
		image: ART.boost,
	}),
];

export const getBuyOption = (key: string) => BUY_OPTIONS.find((option) => option.key === key);
