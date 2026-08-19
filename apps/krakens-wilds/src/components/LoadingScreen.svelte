<script lang="ts">
	import { Container, Sprite, Rectangle } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import type { TextStyleOptions } from 'pixi.js';
	import { onMount } from 'svelte';

	import { stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { i18nDerived } from '../i18n/i18nDerived';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	const isReplay = stateUrlDerived.replay();

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
			document.fonts.load('400 20px "Bebas Neue"'),
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

	// Styles are $derived so fontSize updates with scale → forces text re-rasterization.
	const headerStyle = $derived({
		fontFamily: 'Cinzel',
		fontWeight: '700',
		fill: '#FFD700',
		dropShadow: { color: '#000000', blur: 4 * s, distance: 3 * s, alpha: 0.6 },
		letterSpacing: 3 * s,
		align: 'center' as const,
		fontSize: Math.max(30 * s, 1),
	} satisfies TextStyleOptions);

	const bodyStyle = $derived({
		fontFamily: 'Cinzel',
		fontWeight: '700',
		fill: '#E8E8E8',
		dropShadow: { color: '#000000', blur: 3 * s, distance: 2 * s, alpha: 0.5 },
		letterSpacing: 1 * s,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: 380 * s,
		breakWords: true,
		fontSize: Math.max(16.5 * s, 1),
	} satisfies TextStyleOptions);
</script>

<!-- overlay + logo (visible during loading) -->
<FadeContainer show={loadingType === 'start'}>
	<Rectangle width={canvas.width} height={canvas.height} backgroundColor={0x000000} alpha={0.7} />
	<Container x={cx} y={cy}>
		<!-- logo_kraken.webp is 999x639 — height follows the aspect ratio -->
		<Sprite
			key="gameLogoKraken"
			anchor={0.5}
			y={(wide ? -135 : -260) * s}
			width={(wide ? 420 : 435) * s}
			height={((wide ? 420 : 435) * s * 639) / 999}
		/>
	</Container>
</FadeContainer>

<!-- feature panels (after load) -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded && fontsReady}>
	{#if !isReplay}
		{#if wide}
			<!-- WIDE: side by side -->
			<Container x={cx - 260 * s} y={cy + 55 * s}>
				<Sprite key="s" anchor={0.5} width={130 * s} height={130 * s} />
				<ResponsiveText text={i18nDerived.freeSpins()} anchor={{ x: 0.5, y: 0 }} y={88 * s} maxWidth={350 * s} style={headerStyle} />
				<ResponsiveText
					text={i18nDerived.loadingFsDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={124 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
			<Container x={cx + 260 * s} y={cy + 55 * s}>
				<!--
					The Special Spin drops either kind, so the panel shows both. Each is 124
					wide, so the offset has to clear 62 before there is any gap at all — at
					the original 46 the coin sat on top of the wild's edge.
				-->
				<Sprite key="w" anchor={0.5} x={-70 * s} width={124 * s} height={124 * s} />
				<Sprite key="c" anchor={0.5} x={70 * s} width={124 * s} height={124 * s} />
				<ResponsiveText text={i18nDerived.specialSpin()} anchor={{ x: 0.5, y: 0 }} y={88 * s} maxWidth={350 * s} style={headerStyle} />
				<ResponsiveText
					text={i18nDerived.loadingSpecialDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={124 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
		{:else}
			<!-- TALL: stacked -->
			<Container x={cx} y={cy - 30 * s}>
				<Sprite key="s" anchor={0.5} width={130 * s} height={130 * s} />
				<ResponsiveText text={i18nDerived.freeSpins()} anchor={{ x: 0.5, y: 0 }} y={72 * s} maxWidth={350 * s} style={headerStyle} />
				<ResponsiveText
					text={i18nDerived.loadingFsDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={108 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
			<Container x={cx} y={cy + 240 * s}>
				<!--
					The Special Spin drops either kind, so the panel shows both. Each is 124
					wide, so the offset has to clear 62 before there is any gap at all — at
					the original 46 the coin sat on top of the wild's edge.
				-->
				<Sprite key="w" anchor={0.5} x={-70 * s} width={124 * s} height={124 * s} />
				<Sprite key="c" anchor={0.5} x={70 * s} width={124 * s} height={124 * s} />
				<ResponsiveText text={i18nDerived.specialSpin()} anchor={{ x: 0.5, y: 0 }} y={88 * s} maxWidth={350 * s} style={headerStyle} />
				<ResponsiveText
					text={i18nDerived.loadingSpecialDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={124 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
		{/if}
	{/if}

	<PressToContinue onpress={() => (loadingType = 'transition')} replay={isReplay} />
</FadeContainer>

<!-- transition -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
