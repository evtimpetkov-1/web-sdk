<script lang="ts">
	import { Rectangle, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// Cover the canvas — use the larger dimension since our BG is square
	const bgSize = $derived(Math.max(canvas.width, canvas.height));
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const bgEffectsScale = $derived(isPortrait ? 0.1 : 0.15);
</script>

<Rectangle label="bgBlack" {...canvas} backgroundColor={0x000000} zIndex={-3} />

<Sprite
	key="backgroundBaseGame"
	label="background"
	anchor={0.5}
	x={canvas.width / 2}
	y={canvas.height / 2}
	width={bgSize}
	height={bgSize}
	zIndex={-2}
/>

{#if context.stateApp.loadedAssets?.['bgEffects']}
	<SpineProvider
		key="bgEffects"
		label="bgEffects"
		scale={bgEffectsScale}
		x={canvas.width / 2}
		y={canvas.height / 2}
		zIndex={-1}
	>
		<SpineTrack trackIndex={0} animationName="idle" loop={true} />
	</SpineProvider>
{/if}
