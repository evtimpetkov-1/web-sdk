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

	// The out states are terminal — their complete event has already fired, so a
	// component reused for another count-up beat (requestExit dropping back to
	// false) could never exit again and the presentation stalled: smoke on
	// screen, book hung. Re-enter the intro instead.
	$effect(() => {
		if (
			!props.requestExit &&
			(krakenAnim === 'big_win_out' || krakenAnim === 'mega_win_out' || krakenAnim === 'total_win_out')
		) {
			krakenAnim = props.isTotal ? 'total_win_in' : 'big_win_in';
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

	const FIT = 0.92; // margin so the art never touches the canvas edges
	// The hand-reworked spine (2026-08-19) authors the art LARGE within its
	// 2246x1169 box — unlike the old slicer build, whose box was mostly glow
	// headroom and needed a big boost (1.265/1.5) to read. Neutral 1.0 now;
	// tune here if the new art needs a nudge per layout.
	const winBoost = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait'
			? // in-game big/mega reads bigger than the outro's total (user-tuned)
				props.isTotal
				? 1.15
				: 1.25
			: 1.0,
	);
	/*
	 * The origin goes at canvas centre, exactly like the old spine: the rig is
	 * unchanged (title letters centred at spine y -40, kraken above). Only the
	 * DECLARED box differs because the reworked art's rays reach higher — do
	 * not "re-centre the box", that pushes the composition down.
	 *
	 * BECAUSE the box is asymmetric around the origin (839 above, 330 below,
	 * ±1149 wide), fitting box-width/box-height to the canvas is wrong for an
	 * origin-at-centre placement: in landscape it let the top 839 overshoot the
	 * upper half of the screen and the whole presentation rendered oversized
	 * and cropped. Fit each EXTENT to its half-canvas instead. Extents come
	 * from the skeleton declaration (x -1149.192, y -330, w 2246.376, h 1169):
	 * update together with the skeleton.
	 */
	const EXTENT_X = 1149.2; // max(|x|, x + width)
	const EXTENT_UP = 839; // y + height
	const EXTENT_DOWN = 330; // |y|
	const winScale = $derived(
		Math.min(
			canvas.width / 2 / EXTENT_X,
			canvas.height / 2 / EXTENT_UP,
			canvas.height / 2 / EXTENT_DOWN,
		) *
			FIT *
			winBoost,
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
