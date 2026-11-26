<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BACKGROUND_ART } from '../game/heistArt';

	/**
	 * The vault corridor (background/background.png), cover-fitted to the canvas about
	 * its centre. One painting for every shape and for free spins too: there is no
	 * portrait cut and no free-spins scene yet. On an upright phone the cover fit
	 * keeps only the painting's middle third (the wall behind the reels).
	 */
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const cover = $derived.by(() => {
		const scale = Math.max(canvas.width / BACKGROUND_ART.width, canvas.height / BACKGROUND_ART.height);
		return { width: BACKGROUND_ART.width * scale, height: BACKGROUND_ART.height * scale };
	});
</script>

<Rectangle {...canvas} backgroundColor={0x000000} zIndex={-3} />
<Sprite key="phBg" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} {...cover} zIndex={-2} />
