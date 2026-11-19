<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';

	import { SYMBOL_SIZE } from '../game/constants';
	import type { getSymbolInfo } from '../game/utils';

	/**
	 * Multiplier symbol: a monitor tile from the packed sheet (2026-11-16; it was a
	 * bare black plate) with the value ("x" + digits) drawn in the
	 * tickup-multipliers bitmap font on its screen. The screen is dark in the art;
	 * its lit self (mult_symbol_glow.png) is laid over it additively and flickers
	 * like a tube, so the value reads as what the monitor shows. Any value works.
	 * Completes on mount like SymbolSprite, so win/land states never stall on it.
	 */
	type Props = {
		x?: number;
		y?: number;
		multiplier: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** false = the value alone (the collect flight: the plate stays in its cell) */
		plate?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// glyph row = 50% of the plate height; the "x" is a shorter glyph so it reads small
	const GLYPH_HEIGHT = 0.5;
	const MAX_ROW = 0.72; // of plate width (the screen is 62% of it), before the row scales down to fit

	// the tube's flicker: a new brightness about 11 times a second, mostly steady
	let glow = $state(0.3);

	const plate = $derived({
		width: SYMBOL_SIZE * props.symbolInfo.sizeRatios.width,
		height: SYMBOL_SIZE * props.symbolInfo.sizeRatios.height,
	});

	onMount(() => {
		props.oncomplete?.();
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		const timer = setInterval(() => {
			glow = Math.random() < 0.12 ? 0.12 + Math.random() * 0.12 : 0.26 + Math.random() * 0.12;
		}, 90);
		return () => clearInterval(timer);
	});

	$effect(() => {
		props.symbolInfo;
		props.oncomplete?.();
	});
</script>

<Container x={props.x} y={props.y}>
	{#if props.plate !== false}
		<Sprite key={props.symbolInfo.assetKey} anchor={0.5} width={plate.width} height={plate.height} />
		<Sprite
			key="mult_symbol_glow.png"
			anchor={0.5}
			width={plate.width}
			height={plate.height}
			blendMode="add"
			alpha={glow}
		/>
	{/if}
	<ResponsiveBitmapText
		anchor={0.5}
		text={`x${Math.round(props.multiplier)}`}
		maxWidth={plate.width * MAX_ROW}
		style={{ fontFamily: 'tickup-multipliers', fontSize: plate.height * GLYPH_HEIGHT, fill: 0xffffff }}
	/>
</Container>
