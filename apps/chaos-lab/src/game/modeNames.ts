import { i18nDerived } from '../i18n/i18nDerived';
import type { RgsMode } from './rulesData';

/**
 * The player-facing name of each RGS mode (Evtim, 2026-10-24). The rules'
 * mode table and the replay card both read it here, so they cannot drift.
 */
const MODE_NAMES: Record<RgsMode, () => string> = {
	base: i18nDerived.modeBase,
	ante_1: i18nDerived.modeChaos,
	ante_2: i18nDerived.modeBoost,
	lucky_draw_free_spins: i18nDerived.modeOperation,
	lucky_draw_feature_heavy: i18nDerived.modeMutant,
	super_lucky_draw_free_spins: i18nDerived.modeOvercharged,
};

/** `mode` in either case: the math's 'ante_1' or the RGS's 'ANTE_1' */
export const modeName = (mode: string): string | undefined =>
	MODE_NAMES[mode.toLowerCase() as RgsMode]?.();
