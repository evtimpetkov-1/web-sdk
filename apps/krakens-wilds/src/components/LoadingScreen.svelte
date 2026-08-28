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
			// ante/buy panels — Pixi rasterises Text at first draw, so the face must
			// be resident before the panels mount or they render in the fallback
			document.fonts.load('400 20px "Titan One"'),
		]);
		fontsReady = true;
	});

	let loadingType = $state<'start' | 'transition'>('start');
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const wide = $derived(canvas.width >= canvas.height);

	// English gets the baked gold header art (same pattern as the FS intro's
	// title sprites); every other locale falls back to the text labels.
	const useTextArt = (stateUrlDerived.social() || stateUrlDerived.lang() === 'en');
	const KRAKEN_SPIN_RATIO = 705 / 100; // kraken_spin_text_en.webp
	// v4 art (2026-08-27) is 4:3 — much taller than the old 1.75:1, so both
	// layouts run it narrower to hold the same height budget over the headers
	const KRAKEN_INTRO_RATIO = 1448 / 1086; // kraken_spin_image v4
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
	/**
	 * How far the whole composition rides up from its centred position, in the
	 * same `s`-scaled units as everything else here.
	 *
	 * The LOGO moves with the cards, and has to: both arts are inked edge to edge
	 * (measured — no transparent padding to eat into), and at 1600x900 the logo's
	 * bottom sits 387px down with the first card's art starting at 398. Eleven
	 * pixels. Portrait is roomier at ~40, but not enough to matter either. Lifting
	 * the cards alone by anything worth seeing would just push them into the logo,
	 * so the block travels as one and the gaps inside it are untouched.
	 *
	 * All the freed room comes off the bottom, which had the most to spare — the
	 * press-to-continue prompt sits in the UI's own layout, not this one.
	 */
	const LIFT = $derived(wide ? 40 : 70);

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

</script>

<!-- overlay + logo (visible during loading) -->
<FadeContainer show={loadingType === 'start'}>
	<Rectangle width={canvas.width} height={canvas.height} backgroundColor={0x000000} alpha={0.7} />
	<Container x={cx} y={cy}>
		<!-- logo_text.webp is 800x282 — height follows the aspect ratio -->
		<Sprite
			key="gameLogo"
			anchor={0.5}
			y={((wide ? -110 : -250) - LIFT) * s}
			width={(wide ? 460 : 435) * s}
			height={((wide ? 460 : 435) * s * 282) / 800}
		/>
	</Container>
</FadeContainer>

<!-- feature panels (after load) -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded && fontsReady}>
	{#if !isReplay}
		{#if wide}
			<!-- WIDE: side by side — Kraken Spin first, Free Spins second.
			     Art-led (2026-08-27 rework): the descriptions are gone, so each
			     column is just a big hero with its header as the caption. The
			     old text block reached +200; the enlarged art + header stop at
			     +170, still clear of the logo's -84 bottom above. -->
			<Container x={cx - 260 * s} y={cy + (55 - LIFT) * s}>
				<Sprite key="loadingKraken" anchor={0.5} y={25 * s} width={260 * s} height={(260 / KRAKEN_INTRO_RATIO) * s} />
				{#if useTextArt}
					<Sprite key="loadingKrakenSpinTextEn" anchor={{ x: 0.5, y: 0 }} y={130 * s} width={HEADER_H * KRAKEN_SPIN_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.krakenSpin()} anchor={{ x: 0.5, y: 0 }} y={140 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
			</Container>
			<Container x={cx + 260 * s} y={cy + (55 - LIFT) * s}>
				<Sprite key="s" anchor={0.5} y={25 * s} width={185 * s} height={185 * s} />
				{#if useTextArt}
					<Sprite key="loadingFreeSpinsTextEn" anchor={{ x: 0.5, y: 0 }} y={130 * s} width={HEADER_H * FREE_SPINS_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.freeSpins()} anchor={{ x: 0.5, y: 0 }} y={140 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
			</Container>
		{:else}
			<!-- TALL: stacked — Kraken Spin first, Free Spins second.
			     Art-led (2026-08-27 rework): no descriptions, each card is a
			     big hero with its header as the caption. Budgeted against the
			     REAL fixed edges: the logo's bottom (-243 rel cy) and the press
			     bar's top (~+434 — portrait is width-bound, so the bar sits
			     lower than the 850-unit budget suggests). Rows are absolute
			     (no LIFT on this container). -->
			<Container x={cx} y={cy}>
				<Sprite
					key="loadingKraken"
					anchor={0.5}
					y={-100 * s}
					width={280 * s}
					height={(280 / KRAKEN_INTRO_RATIO) * s}
				/>
				{#if useTextArt}
					<Sprite key="loadingKrakenSpinTextEn" anchor={{ x: 0.5, y: 0 }} y={14 * s} width={HEADER_H * KRAKEN_SPIN_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.krakenSpin()} anchor={{ x: 0.5, y: 0 }} y={14 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
				<Sprite key="s" anchor={0.5} y={200 * s} width={190 * s} height={190 * s} />
				{#if useTextArt}
					<Sprite key="loadingFreeSpinsTextEn" anchor={{ x: 0.5, y: 0 }} y={303 * s} width={HEADER_H * FREE_SPINS_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.freeSpins()} anchor={{ x: 0.5, y: 0 }} y={303 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
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
