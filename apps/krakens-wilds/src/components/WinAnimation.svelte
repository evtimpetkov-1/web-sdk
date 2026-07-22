<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		isMega: boolean;
		isTotal?: boolean;
		requestExit?: boolean;
		onexit?: () => void;
		children: Snippet;
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

	// Shower animation runs in parallel
	type ShowerState =
		| 'shower_big_in'
		| 'shower_big_idle'
		| 'shower_big_out'
		| 'shower_mega_in'
		| 'shower_mega_idle'
		| 'shower_mega_out';

	let showerAnim = $state<ShowerState>(props.isTotal ? 'shower_mega_in' : 'shower_big_in');

	function triggerExit() {
		if (krakenAnim === 'total_win_in' || krakenAnim === 'total_win_idle') {
			krakenAnim = 'total_win_out';
			showerAnim = 'shower_mega_out';
			return;
		}
		const isMegaState =
			krakenAnim === 'mega_win_idle' || krakenAnim === 'big_win_to_mega_transition';
		krakenAnim = isMegaState ? 'mega_win_out' : 'big_win_out';
		showerAnim = isMegaState ? 'shower_mega_out' : 'shower_big_out';
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
				showerAnim = 'shower_big_idle';
				break;
			case 'big_win_idle':
				if (props.isMega) {
					krakenAnim = 'big_win_to_mega_transition';
					showerAnim = 'shower_mega_in';
				}
				break;
			case 'big_win_to_mega_transition':
				krakenAnim = 'mega_win_idle';
				showerAnim = 'shower_mega_idle';
				break;
			case 'total_win_in':
				krakenAnim = 'total_win_idle';
				showerAnim = 'shower_mega_idle';
				break;
			case 'big_win_out':
			case 'mega_win_out':
			case 'total_win_out':
				props.onexit?.();
				break;
		}
	}

	// Center everything on canvas, scale to fill screen width
	const cx = $derived(canvas.width / 2);
	const cy = $derived(canvas.height / 2);
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

<!-- Layer 2: Kraken Spine (centered on canvas, fills screen width) -->
<SpineProvider
	key="bigwin"
	width={canvas.width}
	x={cx}
	y={cy - 100}
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

<!-- Layer 3: Treasure Shower Spine (centered on canvas, same scale as kraken) -->
<SpineProvider
	key="shower"
	width={canvas.width}
	x={cx}
	y={cy - 100}
>
	<SpineTrack
		trackIndex={0}
		animationName={showerAnim}
		loop={showerAnim === 'shower_big_idle' || showerAnim === 'shower_mega_idle'}
	/>
</SpineProvider>

<!-- Layer 4: Win amount text (positioned below center) -->
{@render props.children()}
