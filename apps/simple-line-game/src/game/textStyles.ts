import type { TextStyleOptions } from 'pixi.js';

const FONT_FAMILY = 'Cinzel';

/** Teal/cyan style for general game UI text (press to continue, labels, etc.) */
export const gameTextStyle = {
	fontFamily: FONT_FAMILY,
	fontWeight: '700',
	fill: '#00E5FF',
	stroke: { color: '#071a2b', width: 5 },
	dropShadow: {
		color: '#00BCD4',
		blur: 10,
		distance: 0,
		alpha: 0.6,
	},
	letterSpacing: 4,
	align: 'center',
} as const satisfies TextStyleOptions;

/** Antique gold style for win amounts and big win displays */
export const winTextStyle = {
	fontFamily: FONT_FAMILY,
	fontWeight: '900',
	fill: '#C9A84C',
	stroke: { color: '#2A1A08', width: 6 },
	dropShadow: {
		color: '#A07828',
		blur: 14,
		distance: 0,
		alpha: 0.6,
	},
	letterSpacing: 2,
	align: 'center',
} as const satisfies TextStyleOptions;
