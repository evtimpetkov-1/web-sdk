<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { devicePixelRatio } from 'svelte/reactivity/window';

	import { getContextApp } from '../context.svelte';
	import { preloadFont } from '../utils.svelte';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContextApp();

	let wrap: HTMLDivElement;
	let initialised = $state(false);

	// Never render below resolution 2: on non-retina (dpr-1) desktops a 1:1
	// canvas minifies every texture harshly and reads rough — rendering at 2x
	// and letting the browser downscale is cheap supersampling (what the old
	// fork's forced-2 effectively did). Above 2, follow the real dpr, capped
	// at 3 for performance.
	const targetResolution = () => {
		const raw = devicePixelRatio.current ?? 1;
		return Math.min(Math.max(raw, 2), 3);
	};

	const initialiseApplication = async () => {
		PIXI.Assets.reset();

		await preloadFont();
		context.stateApp.pixiApplication = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
		await context.stateApp.pixiApplication.init({
			autoDensity: true,
			backgroundAlpha: 0,
			hello: true,
			multiView: false,
			// antialias + resolution restored to upstream StakeEngine values. Our fork
			// had disabled AA on touch devices and clamped resolution to 2, which on a
			// dpr-3 phone rendered the canvas at 2/3 size and let the browser upscale
			// it x1.5 — a mobile-only quality regression. webgl/preferWebGLVersion/
			// useBackBuffer/preserveDrawingBuffer are kept (upstream prefers webgpu).
			antialias: true,
			clearBeforeRender: true,
			preference: 'webgl',
			preferWebGLVersion: 2,
			useBackBuffer: true,
			preserveDrawingBuffer: true,
			powerPreference: 'high-performance',
			resolution: targetResolution(),
			resizeTo: window,
		});

		wrap.appendChild(context.stateApp.pixiApplication.canvas);

		// to prevent that you can't scroll the page with touch on the canvas. https://github.com/pixijs/pixijs/issues/4824
		context.stateApp.pixiApplication.renderer.events.autoPreventDefault = false;
		context.stateApp.pixiApplication.renderer.canvas.style.touchAction = 'auto';
	};

	onMount(async () => {
		try {
			if (!initialised) await initialiseApplication();
			initialised = true;
		} catch (error) {
			console.error(error);
		}
	});

	onDestroy(() => {
		if (context.stateApp.pixiApplication) {
			context.stateApp.pixiApplication.destroy();
		}
	});
</script>

<div bind:this={wrap}>
	{#if initialised}
		{@render props.children()}
	{/if}
</div>
