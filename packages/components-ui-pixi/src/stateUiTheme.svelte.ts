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
	// desktop -/+: true draws the sheet's minus.png / plus.png (a game with painted
	// buttons) instead of the code-drawn chips above
	stepperSprites: false,
	// desktop -/+ centres: y from the bar's row line, x +/- from the bet column's centre
	stepperY: -26,
	stepperOffset: 100,
	// how big the sheet's button sprites are drawn, as a multiple of each button's box.
	// 1 = the box. A game whose sheet holds bare icons with a margin round them for a
	// soft shadow draws them larger than the box. With any other value the buttons take
	// presses inside their box only (Button `boxHit`): a button's hit area is otherwise
	// its sprite, margin included, and Spin's would swallow Autoplay and Turbo.
	spriteScale: 1,
	// autoplay running: the whole auto.png sprite turns. false keeps it still, for
	// painted buttons whose rim and light must not rotate (the counter still shows)
	autoSpinRotates: true,
	// portrait's button deck (LayoutPortrait): the buttons' container scales, and their
	// centres as units in from the side edges (x) and up from the layout's bottom (y).
	// A game with a bigger deck replaces the whole object.
	portraitDeck: {
		spinScale: 1.6,
		spinY: 400,
		sideScale: 0.8,
		sideY: 280,
		outerX: 140,
		innerX: 290,
	},
});
