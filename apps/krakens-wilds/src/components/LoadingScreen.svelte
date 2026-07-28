<script lang="ts">
	import { Container, Sprite, Rectangle, Text, FillGradient } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import type { TextStyleOptions } from 'pixi.js';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let fontsReady = $state(false);
	onMount(async () => {
		await Promise.all([
			document.fonts.load('700 20px Cinzel'),
			document.fonts.load('400 20px Cinzel'),
		]);
		fontsReady = true;
	});

	let loadingType = $state<'start' | 'transition'>('start');
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const wide = $derived(canvas.width >= canvas.height);

	// Scale factor — applied directly to each element (no Container scale).
	// This forces PixiJS Text to re-rasterize at the correct resolution on every resize.
	const s = $derived(
		canvas.width < 100
			? 0
			: Math.min(
					(canvas.width * 0.92) / (wide ? 1200 : 420),
					(canvas.height * 0.82) / (wide ? 520 : 850),
				),
	);
	const cx = $derived(canvas.width / 2);
	const cy = $derived(canvas.height * (wide ? 0.47 : 0.46));

	const headerGradient = new FillGradient({
		type: 'linear',
		start: { x: 0, y: 0 },
		end: { x: 0, y: 1 },
		textureSpace: 'local',
		colorStops: [
			{ offset: 0, color: '#00E5FF' },
			{ offset: 0.5, color: '#B2EBF2' },
			{ offset: 1, color: '#00ACC1' },
		],
	});

	// Styles are $derived so fontSize updates with scale → forces text re-rasterization.
	const headerStyle = $derived({
		fontFamily: 'Cinzel',
		fontWeight: '700',
		fill: headerGradient,
		stroke: { color: '#071a2b', width: 3 * s },
		dropShadow: { color: '#00BCD4', blur: 12 * s, distance: 0, alpha: 0.5 },
		letterSpacing: 3 * s,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: 350 * s,
		fontSize: Math.max(30 * s, 1),
	} satisfies TextStyleOptions);

	const bodyStyle = $derived({
		fontFamily: 'Cinzel',
		fontWeight: '400',
		fill: '#B0C4DE',
		stroke: { color: '#0a1929', width: 2 * s },
		letterSpacing: 1 * s,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: 380 * s,
		fontSize: Math.max(19 * s, 1),
	} satisfies TextStyleOptions);
</script>

<!-- overlay + logo (visible during loading) -->
<FadeContainer show={loadingType === 'start'}>
	<Rectangle width={canvas.width} height={canvas.height} backgroundColor={0x000000} alpha={0.7} />
	<Container x={cx} y={cy}>
		<Sprite
			key="gameLogo"
			anchor={0.5}
			y={(wide ? -135 : -260) * s}
			width={(wide ? 280 : 290) * s}
			height={(wide ? 280 : 290) * s}
		/>
	</Container>
</FadeContainer>

<!-- feature panels (after load) -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded && fontsReady}>
	{#if wide}
		<!-- WIDE: side by side -->
		<Container x={cx - 260 * s} y={cy + 55 * s}>
			<Sprite key="s" anchor={0.5} width={130 * s} height={130 * s} />
			<Text text="FREE SPINS" anchor={{ x: 0.5, y: 0 }} y={88 * s} style={headerStyle} />
			<Text
				text="3 or more Bonus symbols anywhere on the reels trigger Free Spins"
				anchor={{ x: 0.5, y: 0 }}
				y={124 * s}
				style={bodyStyle}
			/>
		</Container>
		<Container x={cx + 260 * s} y={cy + 55 * s}>
			<Sprite key="w" anchor={0.5} width={145 * s} height={145 * s} />
			<Text text="RANDOM WILDS" anchor={{ x: 0.5, y: 0 }} y={88 * s} style={headerStyle} />
			<Text
				text="Each Free Spin guarantees 1 to 10 Random Wilds on the reels"
				anchor={{ x: 0.5, y: 0 }}
				y={124 * s}
				style={bodyStyle}
			/>
		</Container>
	{:else}
		<!-- TALL: stacked -->
		<Container x={cx} y={cy - 30 * s}>
			<Sprite key="s" anchor={0.5} width={130 * s} height={130 * s} />
			<Text text="FREE SPINS" anchor={{ x: 0.5, y: 0 }} y={72 * s} style={headerStyle} />
			<Text
				text="3 or more Bonus symbols anywhere on the reels trigger Free Spins"
				anchor={{ x: 0.5, y: 0 }}
				y={108 * s}
				style={bodyStyle}
			/>
		</Container>
		<Container x={cx} y={cy + 260 * s}>
			<Sprite key="w" anchor={0.5} width={145 * s} height={145 * s} />
			<Text text="RANDOM WILDS" anchor={{ x: 0.5, y: 0 }} y={88 * s} style={headerStyle} />
			<Text
				text="Each Free Spin guarantees 1 to 10 Random Wilds on the reels"
				anchor={{ x: 0.5, y: 0 }}
				y={124 * s}
				style={bodyStyle}
			/>
		</Container>
	{/if}

	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!-- transition -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
