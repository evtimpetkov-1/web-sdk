import type { TextStyleOptions } from 'pixi.js';

/**
 * Game-wide type system — mirrors the paytable/rules typography:
 * flat warm gold Cinzel for headings/labels, clean white Inter for values.
 * No neon glows, no runtime gradients — celebration text uses the baked
 * gold display art (spine titles + cinzel-bold-gold bitmap) instead.
 */

/** Flat warm-gold heading/label (the rules-h2 recipe, in Pixi). */
export const headingGold = {
	fontFamily: 'Cinzel',
	fontWeight: '700',
	fill: '#FFD700',
	dropShadow: { color: '#000000', blur: 4, distance: 3, alpha: 0.6 },
	letterSpacing: 4,
	align: 'center',
} as const satisfies TextStyleOptions;

/** Clean white value text (amounts, counters) — matches the bottom bar. */
export const uiValue = {
	fontFamily: 'Inter',
	fontWeight: '700',
	fill: '#FFFFFF',
	dropShadow: { color: '#000000', blur: 3, distance: 2, alpha: 0.5 },
	letterSpacing: 1,
	align: 'center',
} as const satisfies TextStyleOptions;

/**
 * Ante/Buy panel display text — white Titan One with a black stroke, matching
 * the panel art direction (the gold BET/BUY words are baked sprites; everything
 * dynamic on the panels uses this). Titan One is latin-only, so non-latin
 * locales fall back to Inter from the family stack.
 */
export const panelText = {
	fontFamily: 'Titan One, Inter, sans-serif',
	fontWeight: '400',
	fill: '#FFFFFF',
	stroke: { color: '#000000', width: 3 },
	align: 'center',
} as const satisfies TextStyleOptions;
