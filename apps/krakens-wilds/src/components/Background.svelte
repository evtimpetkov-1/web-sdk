<script lang="ts">
	import { BlurFilter, Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	const blurFilter = new BlurFilter({ strength: 8, quality: 4 });
	const bgFilters = $derived(context.stateLayout.showLoadingScreen ? [blurFilter] : []);
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

<FadeContainer label="BackgroundContainer" show={showBaseBackground} duration={SECOND} zIndex={-2} filters={bgFilters}>
	{#if isPortrait}
		{@const scale = Math.max(canvas.width / 941, canvas.height / 1672)}
		<Sprite key="baseGameBgPortrait" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} width={941 * scale} height={1672 * scale} />
	{:else}
		{@const scale = Math.max(canvas.width / 1920, canvas.height / 1072)}
		<Sprite key="baseGameBgDesktop" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} width={1920 * scale} height={1072 * scale} />
	{/if}
</FadeContainer>

<FadeContainer label="FeatureBackgroundContainer" show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	{#if isPortrait}
		{@const scale = Math.max(canvas.width / 941, canvas.height / 1672)}
		<Sprite key="freeSpinBgPortrait" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} width={941 * scale} height={1672 * scale} />
	{:else}
		{@const scale = Math.max(canvas.width / 1448, canvas.height / 1086)}
		<Sprite key="freeSpinBg" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} width={1448 * scale} height={1086 * scale} />
	{/if}
</FadeContainer>
