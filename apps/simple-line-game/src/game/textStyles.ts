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

/** Gold style for win amounts and big win displays */
export const winTextStyle = {
	fontFamily: FONT_FAMILY,
	fontWeight: '900',
	fill: '#FFD700',
	stroke: { color: '#4a2800', width: 6 },
	dropShadow: {
		color: '#FF8C00',
		blur: 12,
		distance: 0,
		alpha: 0.5,
	},
	letterSpacing: 2,
	align: 'center',
} as const satisfies TextStyleOptions;
