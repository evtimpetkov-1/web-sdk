/**
 * Bottom-bar theme (2026-09-03). Every value defaults to what the layouts used
 * to hardcode — the gold Cinzel / white Inter / navy-and-gold stepper look of
 * Kraken's Wilds — so a game that never touches this renders exactly as before.
 * A game restyles the bar by assigning fields at mount (e.g. Mad Science sets
 * Creepster + acid green): `stateUiTheme.labelFont = 'Creepster'`.
 */
export const stateUiTheme = $state({
	// BALANCE / WIN / BET captions
	labelFont: 'Cinzel',
	labelWeight: '700' as '400' | '500' | '600' | '700' | '800' | '900',
	labelFill: 0xffd700,
	labelLetterSpacing: 2,
	// the amounts under them
	valueFont: 'Inter',
	valueFill: 0xffffff,
	// the bar plate
	barFill: 0x000000,
	barAlpha: 0.7,
	// desktop's code-drawn -/+ chips
	stepperFill: 0x0d2c44,
	stepperRim: 0xc8a24a,
	stepperRimHover: 0xffe282,
	stepperGlyph: 0xffd700,
	stepperGlyphHover: 0xffe282,
	// tint over the turbo icon while turbo is persistently on
	turboActiveTint: 0x55ff55,
});
