import { FillGradient } from 'pixi-svelte';
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

/** Gold gradient for win amounts, counters, retrigger, and labels */
const goldGradient = new FillGradient({
	type: 'linear',
	start: { x: 0, y: 0 },
	end: { x: 0, y: 1 },
	textureSpace: 'local',
	colorStops: [
		{ offset: 0.0, color: '#6B3200' },
		{ offset: 0.08, color: '#C87500' },
		{ offset: 0.22, color: '#FFF1A1' },
		{ offset: 0.4, color: '#FFD63D' },
		{ offset: 0.62, color: '#FFF7B0' },
		{ offset: 0.8, color: '#E5A515' },
		{ offset: 0.93, color: '#A65300' },
		{ offset: 1.0, color: '#5B2300' },
	],
});

export const goldTextStyle = {
	fontFamily: FONT_FAMILY,
	fontWeight: '700',
	fill: goldGradient,
	stroke: { color: '#351500', width: 3, join: 'round' },
	dropShadow: {
		color: '#000000',
		blur: 3,
		distance: 2,
		angle: Math.PI / 2,
		alpha: 0.7,
	},
	letterSpacing: 2,
	align: 'center',
	padding: 4,
} as const satisfies TextStyleOptions;
