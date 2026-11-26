import { i18nDerived } from '../i18n/i18nDerived';
import type { BetMode } from './types';

/**
 * The player-facing name of each RGS mode. The rules' mode table and the replay card
 * both read it here, so they cannot drift. The base mode only, until the math defines
 * the others.
 */
const MODE_NAMES: Record<BetMode, () => string> = {
	base: i18nDerived.modeBase,
};

/** `mode` in either case: the math's 'base' or the RGS's 'BASE' */
export const modeName = (mode: string): string | undefined =>
	MODE_NAMES[mode.toLowerCase() as BetMode]?.();
