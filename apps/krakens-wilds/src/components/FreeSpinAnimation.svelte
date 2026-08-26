<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { onMount } from 'svelte';

	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		/** Receives the layout scale — everything drawn on the intro must use it. */
		children: Snippet<[{ scale: number }]>;
	};

	const props: Props = $props();
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	const cx = $derived(canvas.width / 2);
	// Landscape/desktop: the text block sat visually low (more dead space above
	// it than below, with the press bar eating the bottom), so its anchor rises
	// to 44.5% of the canvas height there. Portrait keeps the true centre.
	// FreeSpinIntro.svelte's plateCY MUST mirror this — the text rides it.
	const plateAnchorY = $derived(
		canvas.height *
			(context.stateLayoutDerived.layoutType() === 'portrait' ? 0.5 : 0.445),
	);

	/**
	 * 2026-08-26 rework: the intro no longer paints its own backdrop. The
	 * blurred free-spin background and the ornate rectangular plate are gone —
	 * the backdrop is the kraken's own cloud_burst, HELD at full coverage by
	 * FsCloudTransition for as long as the intro is up (see the `hold` flag on
	 * fsCloudBurst). The texts and the press bar sit straight on the smoke.
	 *
	 * What survives from the old layout:
	 * - the SIZE basis. Text sizes and offsets throughout the intro were
	 *   authored in units of the old plate's fitted scale, so that scale is
	 *   still computed from the same box (PLATE_W x PLATE_H fitted to the same
	 *   viewport shares) and handed down unchanged — nothing drifts or needs
	 *   retuning just because the plate art is not drawn any more.
	 * - the drifting smoke_idle layer. Over the FROZEN burst it is what keeps
	 *   the screen alive; without it the held cloud reads as a painted still.
	 */
	const PLATE_W = 782;
	const PLATE_H = PLATE_W / 1.586;
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const MAX_WIDTH = $derived(isPortrait ? 0.88 : 0.6);
	const MAX_HEIGHT = $derived(isPortrait ? 0.4 : 0.5);
	const plateScale = $derived(
		Math.min((canvas.width * MAX_WIDTH) / PLATE_W, (canvas.height * MAX_HEIGHT) / PLATE_H),
	);

	// Entrance — the text block fades in as the cloud settles
	const introAnim = new Tween(0);
	onMount(() => {
		introAnim.set(1, { duration: 500 });
	});
</script>

<!-- Layer 1: living smoke over the frozen cloud backdrop -->
<SpineProvider
	key="fsFx"
	x={cx}
	y={plateAnchorY + 20 * plateScale}
	width={Math.max(canvas.width, canvas.height) * 0.85}
>
	<SpineTrack trackIndex={0} animationName="smoke_idle" loop />
</SpineProvider>

<!-- Layer 2: Text content (children) -->
<Container alpha={introAnim.current}>
	{@render props.children({ scale: plateScale })}
</Container>
