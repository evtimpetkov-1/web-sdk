import config from './config';
import { FREE_SPIN_COUNTS, OVERCHARGED_START_MULTIPLIERS } from './rulesData';
import { i18nDerived } from '../i18n/i18nDerived';
import { fill, formatNumber, formatOrList, formatTimes } from '../i18n/format';

/**
 * The feature shop's offers (BuyShop / BuyConfirm) — one per non-base RGS
 * mode of the Game Rules Specification. Cost and max win come from
 * config.betModes, so the shop can never drift from what the RGS charges.
 * Titles and pitches are read when drawn (translations load after this
 * module), and every figure in them is formatted per locale.
 *
 * - BUY_OPTIONS: Operation / Mutant / Overcharged Free Spins ('buy' modes, one
 *   round each, behind a confirmation step — Stake requires one for modes
 *   above 2x).
 * - ANTE_OPTIONS: Chaos Mode (2x) and Free Spins Boost (2x), 'activate' modes
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
	title: () => string;
	/** one-liner under the title */
	description: () => string;
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

/**
 * The antes' "N× more often" figures (Evtim kept them on the shop cards; the
 * rules show no statistics), from the spec: Chaos Mode lifts Multipliers,
 * Cloners and Bombs and the free spins trigger, Free Spins Boost the trigger.
 */
const CHAOS_FEATURES_FACTOR = 2.7;
const CHAOS_FREE_SPINS_FACTOR = 1.3;
const BOOST_FREE_SPINS_FACTOR = 3.7;

// "10, 15 or 20" in the player's language
const spinCounts = () => formatOrList(FREE_SPIN_COUNTS.map(formatNumber));
// "×2": sign first, as the cards have always read
const times = (value: number) => `×${formatNumber(value)}`;

export const BUY_OPTIONS: ShopOffer[] = [
	offer('lucky_draw_free_spins', {
		title: i18nDerived.offerOperation,
		description: () => fill(i18nDerived.offerOperationText(), spinCounts()),
		image: ART.operation,
	}),
	offer('lucky_draw_feature_heavy', {
		title: i18nDerived.offerMutant,
		description: () => fill(i18nDerived.offerMutantText(), spinCounts()),
		image: ART.mutant,
	}),
	offer('super_lucky_draw_free_spins', {
		title: i18nDerived.offerOvercharged,
		description: () =>
			fill(
				i18nDerived.offerOverchargedText(),
				times(Math.min(...OVERCHARGED_START_MULTIPLIERS)),
				times(Math.max(...OVERCHARGED_START_MULTIPLIERS)),
				spinCounts(),
			),
		image: ART.overcharged,
	}),
];

export const ANTE_OPTIONS: ShopOffer[] = [
	offer('ante_1', {
		title: i18nDerived.offerChaos,
		description: () =>
			fill(
				i18nDerived.offerChaosText(),
				formatTimes(CHAOS_FEATURES_FACTOR),
				formatTimes(CHAOS_FREE_SPINS_FACTOR),
			),
		image: ART.chaos,
	}),
	offer('ante_2', {
		title: i18nDerived.offerBoost,
		description: () => fill(i18nDerived.offerBoostText(), formatTimes(BOOST_FREE_SPINS_FACTOR)),
		image: ART.boost,
	}),
];

export const getBuyOption = (key: string) => BUY_OPTIONS.find((option) => option.key === key);
