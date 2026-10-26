import type { TextStyleOptions } from 'pixi.js';

/**
 * Pixi Text styles for the in-game counters and amounts (Evtim's spec,
 * 2026-09-08): Black Ops One (self-hosted, static/fonts), a 3px black stroke
 * and a 7px black outer glow at full opacity — Pixi has no glow, so it is an
 * undisplaced, fully opaque, blurred drop shadow. Sizes are in world units,
 * which is roughly 1:1 with desktop pixels, so the stroke and glow read as
 * specified there and scale with the layout elsewhere.
 */
const OUTLINE = {
	fontFamily: 'Black Ops One',
	align: 'center',
	stroke: { color: '#000000', width: 3 },
	dropShadow: { color: '#000000', alpha: 1, blur: 7, distance: 0, angle: 0 },
} as const satisfies TextStyleOptions;

/** FREE SPINS / TOTAL WIN counters above the reels, label and value alike. */
export const counterText = (fontSize: number): TextStyleOptions => ({
	...OUTLINE,
	fill: '#aaea06',
	fontSize,
});

/**
 * "Press anywhere to continue" (loading screen, free-spins intro/outro, big
 * win): the counters' voice. Black Ops One is Latin-only, so the stack falls
 * back per glyph for Cyrillic, Arabic, Devanagari and CJK.
 */
export const promptText = (fontSize: number): TextStyleOptions => ({
	...OUTLINE,
	fontFamily: ['Black Ops One', 'Inter', 'sans-serif'],
	fill: '#aaea06',
	fontSize,
});

/** The cascade win amounts that float up over the paid symbols. */
export const cascadeWinText = (fontSize: number): TextStyleOptions => ({
	...OUTLINE,
	fill: '#bcdc44',
	fontSize,
});
