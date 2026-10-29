import { stateUrlDerived } from 'state-shared';

/**
 * Figures in the rules and paytable, formatted in the player's language
 * ("12,962.7×" in en, "12 962,7×" in fr). Social mode is English-only (LoadI18n
 * forces the en catalog), so it formats as en too. English formats as en-GB:
 * same numbers, but its lists drop the US Oxford comma ("200× or 500×"),
 * like every list in the rules text. Latin digits in every locale: the rest of
 * the UI never switches numbering system, and ar would otherwise get
 * Arabic-Indic ones.
 */
const locale = () => {
	const lang = stateUrlDerived.social() ? 'en' : stateUrlDerived.lang();
	return `${lang === 'en' ? 'en-GB' : lang}-u-nu-latn`;
};

export const formatNumber = (value: number) =>
	new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(value);

/** "12,962.7×" */
export const formatTimes = (value: number) => `${formatNumber(value)}×`;

/** "96.09%", with exactly `digits` decimals */
export const formatPercent = (value: number, digits: number) =>
	new Intl.NumberFormat(locale(), {
		style: 'percent',
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	}).format(value);

/** "2×, 3× or 5×", with the locale's own "or" */
export const formatOrList = (items: string[]) =>
	new Intl.ListFormat(locale(), { type: 'disjunction' }).format(items);

/**
 * A currency amount for a bidi-aware renderer (Pixi Text, HTML). The SDK keeps
 * a right-to-left symbol in the order it is DRAWN (EGP 'م.ج': laid left to
 * right it reads ج.م), which is right where glyphs go down one after another
 * (the bar's letter-spaced values, the bitmap-font win amounts) and reversed by
 * the Unicode bidi algorithm everywhere else. A left-to-right override around
 * the right-to-left run gives every surface the bar's order (Evtim,
 * 2026-10-28: the reel-top WIN and the cascade amounts read backwards).
 * Strings without right-to-left characters come back unchanged.
 */
const RTL = '֐-ࣿיִ-﷿ﹰ-﻿';
const RTL_RUN = new RegExp(`[${RTL}](?:[${RTL}.\\s]*[${RTL}])?`, 'g');
export const drawnOrder = (text: string) =>
	text.replace(RTL_RUN, (run) => `‭${run}‬`);

/** Fills a translated sentence's __0__, __1__ ... placeholders. */
export const fill = (text: string, ...values: (string | number)[]) =>
	values.reduce<string>((out, value, i) => out.split(`__${i}__`).join(String(value)), text);
