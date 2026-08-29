import { locales } from 'config-lingui';
import { page } from '$app/state';

export type Language = (typeof locales)[number];

export type Key =
	// keys for play
	| 'sessionID'
	| 'rgs_url'
	| 'lang'
	| 'currency'
	| 'device'
	| 'social'
	| 'demo'
	// keys for replay 
	| 'replay'
	| 'amount'
	| 'game'
	| 'mode'
	| 'version'
	| 'event'
	;

const getUrlSearchParam = (key: Key) => page.url.searchParams.get(key) as string;

// params for play
/**
 * The url `lang` is operator-supplied and is NOT guaranteed to be a locale we
 * ship — or even a valid BCP 47 tag. Anything unrecognised resolves to English.
 *
 * This has to be filtered HERE rather than at each reader: an unknown tag used
 * to reach `new Intl.ListFormat(lang)` (paytable / game rules), which throws
 * `RangeError: Invalid language tag` and took the whole game down before it
 * could render. The lingui catalog load has its own fallback, so the crash was
 * the only symptom of a bad tag.
 */
/**
 * Platform spellings that are not the ISO 639-1 code we ship the catalog under.
 * `br` for Brazilian Portuguese was already handled; `po` is what Stake's
 * supported-languages table lists for Polish
 * (stake-engine.com/docs/reference/languages), even though ISO 639-1 Polish is
 * `pl` and their own URL spec calls the parameter an ISO 639-1 code. Accepting
 * both costs nothing and is the difference between a Polish player getting the
 * Polish catalog and getting the English fallback.
 */
const LANG_ALIASES: Record<string, Language> = {
	br: 'pt',
	po: 'pl',
};

const lang = (): Language => {
	const raw = getUrlSearchParam('lang');
	const normalised = LANG_ALIASES[raw] ?? raw;
	return (locales as readonly string[]).includes(normalised) ? (normalised as Language) : 'en';
};
const sessionID = () => getUrlSearchParam('sessionID') || '';
const rgsUrl = () => getUrlSearchParam('rgs_url') || '';
const social = () => getUrlSearchParam('social') === 'true';

// params for replay
const replay = () => getUrlSearchParam('replay') === 'true';
const amount = () => Number(getUrlSearchParam('amount')) || 0;
const game = () => getUrlSearchParam('game') || '';
const version = () => getUrlSearchParam('version') || '';
const mode = () => getUrlSearchParam('mode') || '';
const event = () => getUrlSearchParam('event') || '';

export const stateUrlDerived = {
	// states for play
	lang,
	sessionID,
	rgsUrl,
	social,
	// states for replay
	replay,
	amount,
	game,
	mode,
	version,
	event,
};
