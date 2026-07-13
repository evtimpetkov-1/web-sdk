<script lang="ts">
	import { onMount } from 'svelte';
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { playEarthquake } from '../game/earthquake';

	type Props = {
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	let overlayAlpha = $state(0.7);

	onMount(async () => {
		const app = context.stateApp.pixiApplication;
		if (!app) {
			props.oncomplete();
			return;
		}

		// Start earthquake and fade out the dark overlay simultaneously
		const earthquakePromise = playEarthquake(app, 'short');

		// Fade out the overlay during the shake
		const fadeStart = performance.now();
		const fadeDuration = 400;
		function fadeOut() {
			const elapsed = performance.now() - fadeStart;
			const t = Math.min(1, elapsed / fadeDuration);
			overlayAlpha = 0.7 * (1 - t * t);
			if (t < 1) requestAnimationFrame(fadeOut);
		}
		requestAnimationFrame(fadeOut);

		await earthquakePromise;
		props.oncomplete();
	});
</script>

<Rectangle
	width={canvas.width}
	height={canvas.height}
	backgroundColor={0x000000}
	backgroundAlpha={overlayAlpha}
/>
