<script lang="ts">
	/**
	 * Debug FPS meter, on only with `?fps=true` in the URL. HTML over the canvas
	 * (no Pixi node, so it never touches the scene's draw order or its cost).
	 * Counts requestAnimationFrame callbacks, the loop the Pixi ticker runs on,
	 * and reports every 500 ms: the average FPS and the longest frame in that
	 * window (a hitch shows there even when the average still reads ~60).
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	const SAMPLE_MS = 500;

	const enabled = page.url.searchParams.get('fps') === 'true';

	let fps = $state(0);
	let worstMs = $state(0);

	onMount(() => {
		if (!enabled) return;
		let raf = 0;
		let frames = 0;
		let windowStart = performance.now();
		let last = windowStart;
		let worst = 0;
		const loop = (now: number) => {
			frames++;
			worst = Math.max(worst, now - last);
			last = now;
			const elapsed = now - windowStart;
			if (elapsed >= SAMPLE_MS) {
				fps = Math.round((frames * 1000) / elapsed);
				worstMs = Math.round(worst);
				frames = 0;
				worst = 0;
				windowStart = now;
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if enabled}
	<div class="fps" class:warn={fps < 50} class:bad={fps < 30}>
		{fps} FPS <span>max {worstMs} ms</span>
	</div>
{/if}

<style>
	.fps {
		position: fixed;
		top: 4px;
		left: 4px;
		z-index: 2147483647;
		padding: 2px 6px;
		font: 600 12px/1.4 ui-monospace, Menlo, Consolas, monospace;
		color: #7dff6a;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 3px;
		pointer-events: none;
		user-select: none;
		white-space: nowrap;
	}
	.fps span {
		opacity: 0.7;
	}
	.warn {
		color: #ffd84a;
	}
	.bad {
		color: #ff5a4a;
	}
</style>
