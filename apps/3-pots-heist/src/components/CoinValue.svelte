<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { stateBet } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';
	import { coinValueText } from '../game/textStyles';
	import { drawnOrder } from '../i18n/format';

	/**
	 * A Coin's value on its face (Evtim, 2026-11-24: "value will be on top of the coin,
	 * lets try to use the currently provided coin"): what the coin pays at the current
	 * bet, over the crown of C.png. `value` is x bet.
	 * The text is rastered RASTER times its drawn size and scaled down, so the board's
	 * own scale never stretches a small raster; a long amount shrinks to stay on the coin.
	 */
	type Props = { value: number };

	const props: Props = $props();

	const RASTER = 3;
	const SIZE = SYMBOL_SIZE * 0.3;
	// the coin's face, of the cell height
	const ROOM = SYMBOL_SIZE * 0.66;

	const text = $derived(drawnOrder(numberToCurrencyString(props.value * stateBet.betAmount)));
	// the text's width as rastered
	let rasterWidth = $state(0);
	const fit = $derived(Math.min(1, rasterWidth ? (ROOM * RASTER) / rasterWidth : 1));
</script>

<Container scale={fit / RASTER}>
	<Text
		anchor={0.5}
		{text}
		style={coinValueText(SIZE * RASTER)}
		onresize={(sizes) => (rasterWidth = sizes.width)}
	/>
</Container>
