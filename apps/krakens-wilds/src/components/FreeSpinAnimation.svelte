<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { onMount } from 'svelte';

	import { BlurFilter, Container, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

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

	// Plate scale — proportional to viewport, larger in portrait
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const plateScale = $derived(Math.min(canvas.width / (isPortrait ? 700 : 840), canvas.height / 650));
	const PLATE_W = 782;
	const PLATE_H = PLATE_W / 1.586; // fs_intro_plate 1443x910

	// Blur filter for intro overlay (sharp for gameplay)
	const blurFilter = new BlurFilter({ strength: 6, quality: 4 });
	const bgFilters = $derived(props.blur ? [blurFilter] : []);

	// Entrance animation — plate scales up from 0
	const plateAnim = new Tween(0);
	// Subtle continuous pulse
	let pulseAngle = $state(0);
	let pulseRaf: number;
	const pulseScale = $derived(1 + Math.sin(pulseAngle) * 0.015);

	onMount(() => {
		plateAnim.set(1, { duration: 500, easing: (t) => {
			// Elastic ease-out
			const c4 = (2 * Math.PI) / 3;
			return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
		}});

		function tick() {
			pulseAngle += 0.03;
			pulseRaf = requestAnimationFrame(tick);
		}
		pulseRaf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(pulseRaf);
	});

	const finalPlateScale = $derived(plateAnim.current * pulseScale);
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

<!-- Layer 1.5: purple smoke drifting behind the plate -->
<SpineProvider
	key="fsFx"
	x={cx}
	y={cy + 20 * plateScale}
	width={Math.max(canvas.width, canvas.height) * 0.85}
>
	<SpineTrack trackIndex={0} animationName="smoke_idle" loop />
</SpineProvider>

<!-- Layer 2: Counter plate as frame (animated) -->
<Container x={cx} y={cy + 20 * plateScale} scale={finalPlateScale}>
	<Sprite
		key="fsIntroPlate"
		anchor={0.5}
		width={PLATE_W * plateScale}
		height={PLATE_H * plateScale}
	/>
</Container>

<!-- Layer 3: Text content (children) -->
<Container alpha={plateAnim.current}>
	{@render props.children()}
</Container>
