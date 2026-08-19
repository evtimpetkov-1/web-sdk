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

	/**
	 * Cover-fit a background to the canvas, measuring the texture instead of trusting
	 * a number typed in here. Each background's native size used to be hardcoded next
	 * to its sprite, so swapping the art for a differently-shaped file silently
	 * stretched it — the FS art went from 1448x1086 to 1536x1024 in one such swap.
	 * The fallbacks are only for the frames before the texture resolves.
	 */
	const cover = (key: string, fallbackWidth: number, fallbackHeight: number) => {
		const texture = context.stateApp.loadedAssets?.[key] as
			| { width?: number; height?: number }
			| undefined;
		const width = texture?.width || fallbackWidth;
		const height = texture?.height || fallbackHeight;
		const scale = Math.max(canvas.width / width, canvas.height / height);
		return { width: width * scale, height: height * scale };
	};
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

<FadeContainer label="BackgroundContainer" show={showBaseBackground} duration={0.4 * SECOND} zIndex={-2} filters={bgFilters}>
	{#if isPortrait}
		<Sprite key="baseGameBgPortrait" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} {...cover('baseGameBgPortrait', 941, 1672)} />
	{:else}
		<Sprite key="baseGameBgDesktop" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} {...cover('baseGameBgDesktop', 1920, 1072)} />
	{/if}
</FadeContainer>

<!-- blurred during loading, same as the base background — covers a refresh
     mid-free-spins, where the loading screen sits on THIS container -->
<FadeContainer label="FeatureBackgroundContainer" show={showFeatureBackground} duration={0.4 * SECOND} zIndex={-1} filters={bgFilters}>
	{#if isPortrait}
		<Sprite key="freeSpinBgPortrait" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} {...cover('freeSpinBgPortrait', 1024, 1536)} />
	{:else}
		<Sprite key="freeSpinBg" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} {...cover('freeSpinBg', 1536, 1024)} />
	{/if}
</FadeContainer>
