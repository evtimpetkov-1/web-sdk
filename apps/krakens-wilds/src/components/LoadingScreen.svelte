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
	const useTextArt = stateUrlDerived.lang() === 'en';
	const KRAKEN_SPIN_RATIO = 705 / 100; // kraken_spin_text_en.webp
	const KRAKEN_INTRO_RATIO = 1621 / 927; // kraken_intro.webp (2026-08-26 art)
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

	const bodyStyle = $derived({
		fontFamily: 'Cinzel',
		fontWeight: '700',
		fill: '#FFFFFF',
		dropShadow: { color: '#000000', blur: 3 * s, distance: 2 * s, alpha: 0.6 },
		letterSpacing: 1 * s,
		align: 'center' as const,
		wordWrap: true,
		// portrait wraps at the same width ResponsiveText allows — the old shared
		// 380*s bound first on phones and squeezed every line to ~2/3 of the screen
		wordWrapWidth: wide ? 380 * s : canvas.width * 0.9,
		breakWords: true,
		// portrait ran the same 16.5 as desktop and was barely legible on phones
		fontSize: Math.max((wide ? 16.5 : 28) * s, 1),
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
			<!-- WIDE: side by side — Kraken Spin first, Free Spins second -->
			<Container x={cx - 260 * s} y={cy + (55 - LIFT) * s}>
				<!-- height follows the art's aspect so nothing is squashed;
					y nudged down so the image top stays clear of the logo above -->
				<Sprite key="loadingKraken" anchor={0.5} y={6 * s} width={235 * s} height={(235 / KRAKEN_INTRO_RATIO) * s} />
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
			<Container x={cx + 260 * s} y={cy + (55 - LIFT) * s}>
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
			<!-- TALL: stacked — Kraken Spin first, Free Spins second.
			     Budgeted against the REAL fixed edges: the logo's bottom (-243
			     rel cy, LIFT included) and the press bar's top (~+365). Text
			     wraps at 90% of the canvas (bodyStyle matches — see
			     wordWrapWidth) so the EN descriptions hold 3-4 lines at font 28
			     without tripping their maxHeight clamps; wordier locales clamp
			     a few percent instead of a third. Rows are absolute (no LIFT on
			     this container); the wider wrap freed the vertical room the
			     bigger art spends. The press bar's +365 was measured lax:
			     portrait is width-bound, so the bar really sits ~+434 — the
			     rows ride low to spend that slack instead of pooling it all
			     above the bar. -->
			<Container x={cx} y={cy}>
				<Sprite
					key="loadingKraken"
					anchor={0.5}
					y={-150 * s}
					width={215 * s}
					height={(215 / KRAKEN_INTRO_RATIO) * s}
				/>
				{#if useTextArt}
					<Sprite key="loadingKrakenSpinTextEn" anchor={{ x: 0.5, y: 0 }} y={-81 * s} width={HEADER_H * KRAKEN_SPIN_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.krakenSpin()} anchor={{ x: 0.5, y: 0 }} y={-81 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
				<ResponsiveText
					text={i18nDerived.loadingKrakenDesc()}
					anchor={0.5}
					y={22 * s}
					maxWidth={canvas.width * 0.9}
					maxHeight={120 * s}
					style={bodyStyle}
				/>
				<Sprite key="s" anchor={0.5} y={175 * s} width={110 * s} height={110 * s} />
				{#if useTextArt}
					<Sprite key="loadingFreeSpinsTextEn" anchor={{ x: 0.5, y: 0 }} y={237 * s} width={HEADER_H * FREE_SPINS_RATIO * s} height={HEADER_H * s} />
				{:else}
					<ResponsiveText text={i18nDerived.freeSpins()} anchor={{ x: 0.5, y: 0 }} y={237 * s} maxWidth={350 * s} style={headerStyle} />
				{/if}
				<ResponsiveText
					text={i18nDerived.loadingFsDesc()}
					anchor={0.5}
					y={347 * s}
					maxWidth={canvas.width * 0.9}
					maxHeight={132 * s}
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
