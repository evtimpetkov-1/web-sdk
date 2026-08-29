<script lang="ts">
	import { BitmapText, Container, type BitmapTextProps } from 'pixi-svelte';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import { CELL_W, CELL_H } from '../game/constants';

	type Props = {
		/** book amount (100 = 1x total bet) */
		amount: number;
	};

	const props: Props = $props();

	/**
	 * One winline's payout, struck at the foot of one of its symbols.
	 *
	 * Bare text, no plate behind it — gold over a lit, animating symbol, so it
	 * lives or dies on the art underneath. If it proves unreadable over the
	 * brighter symbols, the answer is a backing plate (a Rectangle at anchor 0.5,
	 * sized off `textSizes.width`), not a bigger font.
	 */
	const FONT_SIZE = 18;
	const MAX_TEXT_WIDTH = CELL_W * 0.74;
	/**
	 * Text centre, as a fraction of the cell — as low as the figure can sit while
	 * staying inside the cell (half-height 68.5), so it clears as much of the
	 * symbol art as possible.
	 */
	const Y_OFFSET = CELL_H * 0.4;

	/**
	 * Metrics of the winbox atlas, read from
	 * static/assets/fonts/winFont/v2/cinzel-bold-gold.xml. Needed because Pixi
	 * cannot be asked where a BitmapText's ink actually lands — see Y_INK_CENTRE.
	 */
	const FONT_LINE_HEIGHT = 176;
	const FONT_BASE = 132;
	/** what Pixi calls baseLineOffset; bitmapFontXMLParser sets it to lineHeight - base */
	const FONT_BASELINE_OFFSET = FONT_LINE_HEIGHT - FONT_BASE;

	/**
	 * Where the drawn glyphs sit for a text anchored at y 0, as a multiple of the
	 * font size — and why this is a constant rather than a measurement.
	 *
	 * Pixi's BitmapText bounds and its renderer disagree whenever a font has a
	 * non-zero baseLineOffset (this atlas: 176 - 132 = 44). BitmapText.updateBounds
	 * lays the box out as
	 *   minY = -anchor.y * (height + offset);  maxY = minY + height
	 * while BitmapTextPipe._updateContext translates by that same
	 * -anchor.y * (height + offset) and then draws each glyph at
	 *   y = baseLineOffset + charYOffset
	 * so at anchor 0.5 the bounds claim [-110, +66] font units while the ink is
	 * really at [-66, +110] — mirrored. `anchor: 0.5` therefore draws the figure
	 * baseLineOffset/2 too LOW, and centring off the reported height (which comes
	 * from those same bounds) drops it further still.
	 *
	 * The ink is placed from the metrics instead: anchored at y 0 the glyph box
	 * spans baseLineOffset .. baseLineOffset + lineHeight, so its centre sits at
	 * (baseLineOffset + lineHeight / 2) / lineHeight of the font size. Shifting up
	 * by that lands the ink centre exactly on the origin.
	 *
	 * Centring the box centres what the player sees, because the glyph art fills
	 * its box and is centred in it (measured across the currency strings: within
	 * +/-0.5 of 176 units on both axes, 98% fill).
	 *
	 * If the atlas is ever rebuilt, update the three metrics above — nothing here
	 * is a tuned-by-eye number.
	 */
	const Y_INK_CENTRE = (FONT_BASELINE_OFFSET + FONT_LINE_HEIGHT / 2) / FONT_LINE_HEIGHT;

	const text = $derived(bookEventAmountToWinCurrencyString(props.amount));
	const style: BitmapTextProps['style'] = {
		fontFamily: 'cinzel-bold-gold',
		fontSize: FONT_SIZE,
		align: 'center',
		letterSpacing: 0,
	};

	// Measured off a hidden copy at natural size, exactly like ResponsiveBitmapText:
	// a BitmapText only reports its size once it has laid the glyphs out. Only the
	// WIDTH is used — the reported height is the unreliable half (see above).
	let textSizes = $state({ width: 0, height: 0 });
	const textScale = $derived(Math.min(1, MAX_TEXT_WIDTH / (textSizes.width || 1)));
	// `y` is in the parent's space, so the node's own scale is folded in by hand
	const textY = $derived(-Y_INK_CENTRE * FONT_SIZE * textScale);
</script>

<Container visible={false}>
	<BitmapText {text} {style} onresize={(sizes) => (textSizes = sizes)} />
</Container>

<Container y={Y_OFFSET}>
	<BitmapText anchor={{ x: 0.5, y: 0 }} y={textY} {text} {style} scale={textScale} />
</Container>
