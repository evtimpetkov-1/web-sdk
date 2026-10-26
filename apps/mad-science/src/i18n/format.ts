import { stateUrlDerived } from 'state-shared';

/**
 * Figures in the rules and paytable, formatted in the player's language
 * ("12,962.7×" in en, "12 962,7×" in fr). Social mode is English-only (LoadI18n
 * forces the en catalog), so it formats as en too. English formats as en-GB:
 * same numbers, but its lists drop the US Oxford comma ("500× or 1,000×"),
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

/** Fills a translated sentence's __0__, __1__ ... placeholders. */
export const fill = (text: string, ...values: (string | number)[]) =>
	values.reduce<string>((out, value, i) => out.split(`__${i}__`).join(String(value)), text);
