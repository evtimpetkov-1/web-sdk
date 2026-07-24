<script lang="ts">
	import { BlurFilter, Rectangle, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const bgKey = $derived(isPortrait ? 'baseGameBgPortrait' : 'baseGameBgDesktop');
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	// Overlay spine covers the background — scale to fill canvas
	const overlayScale = $derived(Math.max(canvas.width, canvas.height) * 0.5);

	const blurFilter = new BlurFilter({ strength: 8, quality: 4 });
	const bgFilters = $derived(context.stateLayout.showLoadingScreen ? [blurFilter] : []);
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

<FadeContainer label="BackgroundContainer" show={showBaseBackground} duration={SECOND} zIndex={-2} filters={bgFilters}>
	<Sprite key={bgKey} anchor={0.5} x={canvas.width / 2 + 91} y={canvas.height / 2} />
	<SpineProvider
		key="reelsOverlay"
		x={canvas.width / 2 }
		y={canvas.height / 2}
		width={overlayScale}
		height={overlayScale}
	>
		<SpineTrack trackIndex={0} animationName="idle" loop={true} />
	</SpineProvider>
</FadeContainer>

<FadeContainer label="FeatureBackgroundContainer" show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	{@const bgCover = Math.max(canvas.width, canvas.height)}
	<Sprite key="freeSpinBg" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} width={bgCover} height={bgCover} />
	<SpineProvider
		key="reelsOverlay"
		x={canvas.width / 2}
		y={canvas.height / 2}
		width={overlayScale}
		height={overlayScale}
	>
		<SpineTrack trackIndex={0} animationName="idle" loop={true} />
	</SpineProvider>
</FadeContainer>
