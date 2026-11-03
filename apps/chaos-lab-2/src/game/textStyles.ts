import type { TextStyleOptions } from 'pixi.js';
import { stateUrlDerived } from 'state-shared';

/**
 * The display face (Creepster: intro and shop titles, rules headings, the bar's
 * captions) for the player's language, as a font-family list for Pixi and CSS.
 * Creepster is Latin-only and lacks Polish, Turkish and Vietnamese letters
 * (ą ę ś ż, ğ ş İ, ơ ư ạ ...): a missing glyph falls back on its own, so one
 * word would mix two faces. Those languages take Black Ops One, which has them.
 * Scripts neither face covers (Cyrillic, CJK, Arabic, Devanagari) fall back
 * whole, to Inter or the system sans. Social mode is English.
 */
const BLACK_OPS_LANGUAGES = ['pl', 'tr', 'vi'];
export const displayFont = () =>
	!stateUrlDerived.social() && BLACK_OPS_LANGUAGES.includes(stateUrlDerived.lang())
		? "'Black Ops One', Inter, sans-serif"
		: 'Creepster, Inter, sans-serif';

/**
 * Pixi Text styles for the in-game counters and amounts (Evtim's spec,
 * 2026-09-08): Black Ops One (self-hosted, static/fonts), a 3px black stroke
 * and a 7px black outer glow at full opacity — Pixi has no glow, so it is an
 * undisplaced, fully opaque, blurred drop shadow. Sizes are in world units,
 * which is roughly 1:1 with desktop pixels, so the stroke and glow read as
 * specified there and scale with the layout elsewhere. Black Ops One is
 * Latin-only: the stack falls back per glyph for Cyrillic, Arabic, Devanagari
 * and CJK labels.
 */
// a new list per style: Pixi quotes the names of a fontFamily array in place
const blackOps = () => ['Black Ops One', 'Inter', 'sans-serif'];
const OUTLINE = {
	align: 'center',
	stroke: { color: '#000000', width: 3 },
	dropShadow: { color: '#000000', alpha: 1, blur: 7, distance: 0, angle: 0 },
} as const satisfies TextStyleOptions;

/** FREE SPINS / TOTAL WIN counters above the reels, label and value alike. */
/**
 * Pixi centres a Text's line box (the actual ascent of "|ÉqÅM" to the descent
 * of 'q'), and Black Ops One's capitals sit this share of the font size below
 * that box's middle: subtract size x this to centre caps on a point.
 */
export const BLACK_OPS_CAP_OFFSET = 0.04;

export const counterText = (fontSize: number): TextStyleOptions => ({
	...OUTLINE,
	fontFamily: blackOps(),
	fill: '#aaea06',
	fontSize,
});

/**
 * "Press anywhere to continue" (loading screen, free-spins intro/outro, big
 * win): the counters' voice.
 */
export const promptText = (fontSize: number): TextStyleOptions => ({
	...OUTLINE,
	fontFamily: blackOps(),
	fill: '#aaea06',
	fontSize,
});

/**
 * Baked English title art redrawn as text in the other languages (Kraken's
 * pattern: English and social draw the art): the FS popup's CONGRATULATIONS! /
 * YOU WON / TOTAL WIN (stone letters), the FREE SPINS word (yellow). Black Ops
 * One is the nearest face to the art's riveted block letters; flat fills, as
 * reviewers read gradients as an AI tell.
 */
export const artTitleText = (
	fontSize: number,
	fill: string,
	stroke: string,
): TextStyleOptions => ({
	fontFamily: blackOps(),
	align: 'center',
	fill,
	fontSize,
	stroke: { color: stroke, width: Math.round(fontSize * 0.08) },
	dropShadow: { color: '#000000', alpha: 0.8, blur: 10, distance: 5, angle: Math.PI / 2 },
});
export const ART_STONE = '#ebe4d8';
export const ART_YELLOW = '#ffbe1e';

/** The intro's WIN UP TO banner as text: the art's acid green, in the display face. */
export const winUpToText = (fontSize: number): TextStyleOptions => ({
	fontFamily: displayFont(),
	align: 'center',
	fill: '#abea10',
	fontSize,
	letterSpacing: 1,
	stroke: { color: '#1b0d24', width: Math.round(fontSize * 0.08) },
	dropShadow: { color: '#000000', alpha: 0.8, blur: 8, distance: 4, angle: Math.PI / 2 },
});

/** The cascade win amounts that float up over the paid symbols. */
export const cascadeWinText = (fontSize: number): TextStyleOptions => ({
	...OUTLINE,
	fontFamily: blackOps(),
	fill: '#bcdc44',
	fontSize,
});
