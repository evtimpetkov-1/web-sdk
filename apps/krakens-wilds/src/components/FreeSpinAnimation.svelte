<script lang="ts">
	import type { Snippet } from 'svelte';

	import { BlurFilter, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		blur?: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// Background: cover mode for non-square source image
	const bgCover = $derived(Math.max(canvas.width, canvas.height));
	const cx = $derived(canvas.width / 2);
	const cy = $derived(canvas.height / 2);

	// Blur filter for intro overlay (sharp for gameplay)
	const blurFilter = new BlurFilter({ strength: 6, quality: 4 });
	const bgFilters = $derived(props.blur ? [blurFilter] : []);

	// Spine animation: intro -> idle loop
	let spineAnim = $state<'intro' | 'idle'>('intro');
</script>

<!-- Layer 1: FS background (full canvas, cover mode) -->
<Sprite
	key="freeSpinBg"
	anchor={0.5}
	x={cx}
	y={cy}
	width={bgCover}
	height={bgCover}
	filters={bgFilters}
/>

<!-- Layer 2: fsIntro Spine (tentacles + tablet + sparkles + bubbles) -->
<SpineProvider
	key="fsIntro"
	scale={1}
	x={cx}
	y={cy}
>
	<SpineTrack
		trackIndex={0}
		animationName={spineAnim}
		loop={spineAnim === 'idle'}
		listener={{
			complete: () => {
				if (spineAnim === 'intro') {
					spineAnim = 'idle';
				}
			},
		}}
	/>
</SpineProvider>

<!-- Layer 3: Text content (children) -->
{@render props.children()}
