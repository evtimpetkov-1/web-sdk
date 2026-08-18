<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

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
	// Background is 2048x2048 (square) — use cover mode
	const bgCover = $derived(Math.max(canvas.width, canvas.height));
</script>

<!-- Layer 1: Static background (full canvas, aspect-ratio preserved) -->
<Sprite
	key="bigwinBg"
	anchor={0.5}
	x={cx}
	y={cy}
	width={bgCover}
	height={bgCover}
/>

<!-- Layer 2: Content behind spines (coin particles) -->
{@render props.behindSpines?.()}

<!-- Layer 3: Kraken Spine (centered, constrained by both width and height).
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

<!-- Layer 4: Win amount text (positioned below center, in the spine's own scale) -->
{@render props.children({ scale: winScale })}
