<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container, Rectangle, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		isMega: boolean;
		isTotal?: boolean;
		requestExit?: boolean;
		onexit?: () => void;
		behindSpines?: Snippet;
		/** Receives the fitted spine scale — the amount text must use it to stay put. */
		children: Snippet<[{ scale: number }]>;
	};

	const props: Props = $props();
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// Kraken spine animation state machine
	type KrakenState =
		| 'big_win_in'
		| 'big_win_idle'
		| 'big_win_out'
		| 'big_win_to_mega_transition'
		| 'mega_win_idle'
		| 'mega_win_out'
		| 'total_win_in'
		| 'total_win_idle'
		| 'total_win_out';

	let krakenAnim = $state<KrakenState>(props.isTotal ? 'total_win_in' : 'big_win_in');

	function triggerExit() {
		if (krakenAnim === 'total_win_in' || krakenAnim === 'total_win_idle') {
			krakenAnim = 'total_win_out';
			return;
		}
		const isMegaState =
			krakenAnim === 'mega_win_idle' || krakenAnim === 'big_win_to_mega_transition';
		krakenAnim = isMegaState ? 'mega_win_out' : 'big_win_out';
	}

	// When requestExit changes to true while in idle, trigger exit immediately
	$effect(() => {
		if (props.requestExit) {
			if (krakenAnim === 'big_win_idle' || krakenAnim === 'mega_win_idle' || krakenAnim === 'total_win_idle') {
				triggerExit();
			}
		}
	});

	function onKrakenComplete() {
		// If exit was requested during intro/transition, go straight to out
		if (
			props.requestExit &&
			krakenAnim !== 'big_win_out' &&
			krakenAnim !== 'mega_win_out' &&
			krakenAnim !== 'total_win_out'
		) {
			triggerExit();
			return;
		}

		switch (krakenAnim) {
			case 'big_win_in':
				krakenAnim = 'big_win_idle';
				break;
			case 'big_win_idle':
				if (props.isMega) {
					krakenAnim = 'big_win_to_mega_transition';
				}
				break;
			case 'big_win_to_mega_transition':
				krakenAnim = 'mega_win_idle';
				break;
			case 'total_win_in':
				krakenAnim = 'total_win_idle';
				break;
			case 'big_win_out':
			case 'mega_win_out':
			case 'total_win_out':
				props.onexit?.();
				break;
		}
	}

	// Center everything on canvas, constrain to both dimensions
	const cx = $derived(canvas.width / 2);
	const cy = $derived(canvas.height / 2);

	/**
	 * Fit the win title inside the viewport.
	 *
	 * The scale has to be measured against the SKELETON'S OWN BOX, which bigwin.json
	 * declares as 1500x1300. The old divisors (850x1100) were neither the skeleton
	 * nor the canvas, so the art came out ~1.7x too wide at every size and BIG WIN /
	 * TOTAL WIN ran off both edges of the screen — worst in portrait, where height
	 * never became the binding constraint.
	 *
	 * Read from the loaded skeleton rather than hardcoding, so a re-authored spine
	 * cannot silently break the fit again; the literals are only a fallback for the
	 * frames before the asset resolves.
	 */
	const FIT = 0.92; // margin so the art never touches the canvas edges
	// double cast: LoadedAsset is a union (spine | texture | audio), and only the
	// spine member carries width/height
	const spineData = $derived(
		context.stateApp.loadedAssets?.['bigwin'] as unknown as
			| { width?: number; height?: number }
			| undefined,
	);
	const winScale = $derived(
		Math.min(
			canvas.width / (spineData?.width || 1500),
			canvas.height / (spineData?.height || 1300),
		) * FIT,
	);
	/**
	 * The presentation used to sit on an opaque painted background, which cut the
	 * board out of the picture entirely. It now shades the whole screen instead, so
	 * the reels stay faintly visible underneath and the win reads as something
	 * happening ON the game rather than a slide shown over it.
	 */
	const SHADE_ALPHA = 0.78;
	/**
	 * Purple dust — the same fsFx smoke ring the free-spin intro sits in, stacked.
	 *
	 * One ring only reached across the middle of the screen. Three layers at different
	 * sizes, offsets and drift speeds read as one much larger, denser cloud mass: the
	 * wide pair push the dust out past the edges of the frame, the centre one keeps it
	 * thick behind the kraken, and mirroring the second stops the pair looking like the
	 * same picture twice. `timeScale` desynchronises them so they never drift in step.
	 *
	 * TO REVERT to the single ring, replace DUST_LAYERS with:
	 *   [{ width: 0.95, x: 0, y: 0, alpha: 1, speed: 1, flip: false }]
	 * Nothing else needs touching.
	 *
	 * `width` is a multiple of the long screen edge; `x`/`y` are fractions of the
	 * canvas, measured from the centre.
	 */
	const DUST_LAYERS = [
		{ width: 1.55, x: -0.2, y: 0.07, alpha: 0.8, speed: 0.75, flip: false },
		{ width: 1.55, x: 0.2, y: -0.05, alpha: 0.8, speed: 0.95, flip: true },
		{ width: 1.1, x: 0, y: 0.02, alpha: 1, speed: 1.2, flip: false },
	];
	const longEdge = $derived(Math.max(canvas.width, canvas.height));
</script>

<!-- Layer 1: full-screen shade -->
<Rectangle
	width={canvas.width}
	height={canvas.height}
	backgroundColor={0x000000}
	backgroundAlpha={SHADE_ALPHA}
/>

<!-- Layer 2: purple dust, drifting behind everything -->
{#each DUST_LAYERS as layer, i (i)}
	<Container alpha={layer.alpha}>
		<SpineProvider
			key="fsFx"
			x={cx + layer.x * canvas.width}
			y={cy + layer.y * canvas.height}
			width={longEdge * layer.width}
			scale={layer.flip ? { x: -1, y: 1 } : undefined}
		>
			<SpineTrack trackIndex={0} animationName="smoke_idle" loop timeScale={layer.speed} />
		</SpineProvider>
	</Container>
{/each}

<!-- Layer 3: Content behind spines (coin particles) -->
{@render props.behindSpines?.()}

<!-- Layer 4: Kraken Spine (centered, constrained by both width and height).
     Origin at canvas center keeps the kraken's head on-screen; the text sits
     at +60 world units inside the spine, the amount renders below. -->
<SpineProvider
	key="bigwin"
	scale={winScale}
	x={cx}
	y={cy}
>
	<SpineTrack
		trackIndex={0}
		animationName={krakenAnim}
		loop={krakenAnim === 'big_win_idle' || krakenAnim === 'mega_win_idle' || krakenAnim === 'total_win_idle'}
		listener={{
			complete: () => onKrakenComplete(),
		}}
	/>
</SpineProvider>

<!-- Layer 5: Win amount text (positioned below center, in the spine's own scale) -->
{@render props.children({ scale: winScale })}
