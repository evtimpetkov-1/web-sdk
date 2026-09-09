<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';

	import { SYMBOL_SIZE } from '../game/constants';
	import type { getSymbolInfo } from '../game/utils';

	/**
	 * Multiplier symbol: the riveted plate from the packed sheet with the value
	 * ("x" + digits) drawn in the tickup-multipliers bitmap font centred on it.
	 * Any value works. Completes on mount like SymbolSprite, so win/land states
	 * never stall on it.
	 */
	type Props = {
		x?: number;
		y?: number;
		multiplier: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// glyph row = 55% of the plate height; the "x" is a shorter glyph so it reads small
	const GLYPH_HEIGHT = 0.55;
	const MAX_ROW = 0.86; // of plate width, before the row scales down to fit

	const plate = $derived({
		width: SYMBOL_SIZE * props.symbolInfo.sizeRatios.width,
		height: SYMBOL_SIZE * props.symbolInfo.sizeRatios.height,
	});

	onMount(() => {
		props.oncomplete?.();
	});

	$effect(() => {
		props.symbolInfo;
		props.oncomplete?.();
	});
</script>

<Container x={props.x} y={props.y}>
	<Sprite key={props.symbolInfo.assetKey} anchor={0.5} width={plate.width} height={plate.height} />
	<ResponsiveBitmapText
		anchor={0.5}
		text={`x${Math.round(props.multiplier)}`}
		maxWidth={plate.width * MAX_ROW}
		style={{ fontFamily: 'tickup-multipliers', fontSize: plate.height * GLYPH_HEIGHT }}
	/>
</Container>
