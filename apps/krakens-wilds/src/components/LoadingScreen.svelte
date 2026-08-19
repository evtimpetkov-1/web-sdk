<script lang="ts">
	import { Container, Sprite, Rectangle } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import type { TextStyleOptions } from 'pixi.js';
	import { onMount } from 'svelte';

	import { stateUrlDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';
	import { getContext } from '../game/context';
	import { i18nDerived } from '../i18n/i18nDerived';
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

	// English gets the baked gold header art (same pattern as the FS intro's
	// title sprites); every other locale falls back to the text labels.
	const useTextArt = stateUrlDerived.lang() === 'en';
	const KRAKEN_SPIN_RATIO = 705 / 100; // kraken_spin_text_en.webp
	const FREE_SPINS_RATIO = 582 / 94; // free_spins_text_en.webp
	// both arts are ~100px tall from the same lettering, so one display height
	// keeps the two headers matched
	const HEADER_H = 40;

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
		<!-- logo_text.webp is 800x282 — height follows the aspect ratio -->
		<Sprite
			key="gameLogo"
			anchor={0.5}
			y={(wide ? -110 : -250) * s}
			width={(wide ? 460 : 435) * s}
			height={((wide ? 460 : 435) * s * 282) / 800}
		/>
	</Container>
</FadeContainer>

<!-- feature panels (after load) -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded && fontsReady}>
	{#if !isReplay}
		{#if wide}
			<!-- WIDE: side by side — Kraken Spin first, Free Spins second -->
			<Container x={cx - 260 * s} y={cy + 55 * s}>
				<!-- kraken_intro.webp is 1536x1024 (3:2) — height follows the aspect ratio.
					y nudged down so the image top stays clear of the logo above -->
				<Sprite key="loadingKraken" anchor={0.5} y={6 * s} width={225 * s} height={150 * s} />
				{#if useTextArt}
					<Sprite key="loadingKrakenSpinTextEn" anchor={{ x: 0.5, y: 0 }} y={78 * s} width={HEADER_H * KRAKEN_SPIN_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.krakenSpin()} anchor={{ x: 0.5, y: 0 }} y={88 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
				<ResponsiveText
					text={i18nDerived.loadingKrakenDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={124 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
			<Container x={cx + 260 * s} y={cy + 55 * s}>
				<Sprite key="s" anchor={0.5} width={130 * s} height={130 * s} />
				{#if useTextArt}
					<Sprite key="loadingFreeSpinsTextEn" anchor={{ x: 0.5, y: 0 }} y={78 * s} width={HEADER_H * FREE_SPINS_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.freeSpins()} anchor={{ x: 0.5, y: 0 }} y={88 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
				<ResponsiveText
					text={i18nDerived.loadingFsDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={124 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
		{:else}
			<!-- TALL: stacked — Kraken Spin first, Free Spins second -->
			<Container x={cx} y={cy - 55 * s}>
				<!-- kraken_intro.webp is 1536x1024 (3:2) — height follows the aspect ratio -->
				<Sprite key="loadingKraken" anchor={0.5} width={270 * s} height={180 * s} />
				{#if useTextArt}
					<Sprite key="loadingKrakenSpinTextEn" anchor={{ x: 0.5, y: 0 }} y={88 * s} width={HEADER_H * KRAKEN_SPIN_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.krakenSpin()} anchor={{ x: 0.5, y: 0 }} y={98 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
				<ResponsiveText
					text={i18nDerived.loadingKrakenDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={134 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
			<Container x={cx} y={cy + 250 * s}>
				<Sprite key="s" anchor={0.5} width={130 * s} height={130 * s} />
				{#if useTextArt}
					<Sprite key="loadingFreeSpinsTextEn" anchor={{ x: 0.5, y: 0 }} y={62 * s} width={HEADER_H * FREE_SPINS_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.freeSpins()} anchor={{ x: 0.5, y: 0 }} y={72 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
				<ResponsiveText
					text={i18nDerived.loadingFsDesc()}
					anchor={{ x: 0.5, y: 0 }}
					y={108 * s}
					maxWidth={380 * s}
					maxHeight={76 * s}
					style={bodyStyle}
				/>
			</Container>
		{/if}
	{/if}

	<!--
		No TransitionAnimation (earthquake) here — the loading screen simply fades
		out (FadeContainer's 400ms) and then hands over; the background crossfades
		to the stage underneath. `onloaded` must wait for the fade: it unmounts
		this whole component (Game.svelte gates it on showLoadingScreen), so
		calling it immediately would hard-cut instead. The earthquake still plays
		where it belongs: the free-spins-end transition (Transition.svelte).
	-->
	<PressToContinue
		onpress={async () => {
			loadingType = 'transition';
			await waitForTimeout(400);
			props.onloaded();
		}}
		replay={isReplay}
	/>
</FadeContainer>
