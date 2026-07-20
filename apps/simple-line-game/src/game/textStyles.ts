import { FillGradient, type TextStyleOptions } from 'pixi.js';

const FONT_FAMILY = 'Cinzel';
const WIN_FONT_FAMILY = 'Bebas Neue';

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

/** Gold gradient for win counter */
const winGoldGradient = new FillGradient({
	type: 'linear',
	start: { x: 0, y: 0 },
	end: { x: 0, y: 1 },
	textureSpace: 'local',
	colorStops: [
		{ offset: 0, color: '#FFF8D0' },
		{ offset: 0.2, color: '#FFD870' },
		{ offset: 0.45, color: '#C89830' },
		{ offset: 0.55, color: '#FFD060' },
		{ offset: 0.8, color: '#A07020' },
		{ offset: 1, color: '#FFE090' },
	],
});

/** Gold style for win amounts — Bebas Neue (equal-width digits, no jiggle) */
export const winTextStyle = {
	fontFamily: WIN_FONT_FAMILY,
	fontWeight: '400',
	fill: winGoldGradient,
	stroke: { color: '#2A1508', width: 4 },
	dropShadow: {
		color: '#FFB830',
		blur: 15,
		distance: 0,
		alpha: 0.4,
	},
	letterSpacing: 4,
	align: 'center',
} satisfies TextStyleOptions;
