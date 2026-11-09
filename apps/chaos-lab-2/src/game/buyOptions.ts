import config from './config';
import {
	CASH_MUTANT_START_FRAMES,
	CASH_OVERCHARGED_FRAME_VALUES,
	CASH_START_FRAME_VALUES,
} from './rulesData';
import { i18nDerived } from '../i18n/i18nDerived';
import { fill, formatNumber, formatTimes } from '../i18n/format';

/**
 * The feature shop's offers (BuyShop / BuyConfirm) — one per non-base RGS
 * mode of the Game Rules Specification. Cost and max win come from
 * config.betModes, so the shop can never drift from what the RGS charges.
 * Titles and pitches are read when drawn (translations load after this
 * module), and every figure in them is formatted per locale.
 *
 * - BUY_OPTIONS: Operation / Mutant / Overcharged Respins ('buy' modes, one
 *   round each, behind a confirmation step — Stake requires one for modes
 *   above 2x). Chaos Lab 2 (2026-11-03): each buys Cash Respins.
 * - ANTE_OPTIONS: Chaos Mode (2x) and Bonus Boost (2x), 'activate' modes
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
// The three buys' cards are Chaos Lab 2's own, Evtim's v3 set for Cash Respins
// (2026-11-09: stake-engine/art-review/chaoslab2/buy_cards/make_buy_cards.py);
// the two antes keep Chaos Lab's art (still true: more features / more triggers).
const ART = {
	operation: new URL('../../assets/chaoslab2/buy/operation.webp', import.meta.url).href,
	mutant: new URL('../../assets/chaoslab2/buy/mutant.webp', import.meta.url).href,
	overcharged: new URL('../../assets/chaoslab2/buy/overcharged.webp', import.meta.url).href,
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
 * Cloners and Bombs and the Cash Respins trigger, Bonus Boost the trigger.
 * The buys' cards carry no figures but the values a round can produce.
 */
const CHAOS_FEATURES_FACTOR = 2.7;
const CHAOS_RESPINS_FACTOR = 1.3;
const BOOST_RESPINS_FACTOR = 3.7;

// "×2": sign first, as the cards have always read (a multiplier frame's value)
const times = (value: number) => `×${formatNumber(value)}`;

export const BUY_OPTIONS: ShopOffer[] = [
	offer('lucky_draw_free_spins', {
		title: i18nDerived.offerOperation,
		description: i18nDerived.offerOperationText,
		image: ART.operation,
	}),
	offer('lucky_draw_feature_heavy', {
		title: i18nDerived.offerMutant,
		description: () =>
			fill(
				i18nDerived.offerMutantText(),
				formatNumber(CASH_MUTANT_START_FRAMES),
				times(Math.min(...CASH_START_FRAME_VALUES)),
				times(Math.max(...CASH_START_FRAME_VALUES)),
			),
		image: ART.mutant,
	}),
	offer('super_lucky_draw_free_spins', {
		title: i18nDerived.offerOvercharged,
		description: () =>
			fill(
				i18nDerived.offerOverchargedText(),
				times(Math.min(...CASH_OVERCHARGED_FRAME_VALUES)),
				times(Math.max(...CASH_OVERCHARGED_FRAME_VALUES)),
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
				formatTimes(CHAOS_RESPINS_FACTOR),
			),
		image: ART.chaos,
	}),
	offer('ante_2', {
		title: i18nDerived.offerBoost,
		description: () => fill(i18nDerived.offerBoostText(), formatTimes(BOOST_RESPINS_FACTOR)),
		image: ART.boost,
	}),
];

export const getBuyOption = (key: string) => BUY_OPTIONS.find((option) => option.key === key);
