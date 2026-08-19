<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText, ResponsiveBitmapText } from 'components-pixi';
	import { stateUrlDerived } from 'state-shared';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { i18nDerived } from '../i18n/i18nDerived';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';


	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());


	// English gets the baked teal title art (matches the logo's WILDS
	// lettering); every other locale falls back to the text labels.
	// Source for YOU WON is the 04_54_07 revision (even letter heights —
	// the original teal cut had a taller Y).
	const useTitleArt = stateUrlDerived.lang() === 'en';
	// you_won_en.webp 700x143, free_spins_en.webp 700x137 — both ink-tight, no padding
	const YOU_WON_RATIO = 700 / 143;
	const FREE_SPINS_RATIO = 700 / 137;

	/**
	 * Plate layout, in `s` units relative to the plate centre. The title sprites
	 * sit at a fixed ±120 and the number goes between them.
	 *
	 * Two separate things decide where the number lands, and they were conflated:
	 *
	 * 1. THE GAP. Both title images are mostly glow — the letters occupy only
	 *    y 10..129 of you_won's 143px and y 9..117 of free_spins' 137px — and the
	 *    two are drawn at different widths (430 vs 490). Measuring the letters
	 *    rather than the image boxes puts the visible gap's centre at -3.2, which
	 *    is what GAP_CENTRE computes.
	 *
	 * 2. THE ANCHOR. `anchor 0.5` on a BitmapText centres the LINE BOX, and the
	 *    glyphs do not sit centred in it — our font's base is 0.75 of lineHeight.
	 *    The digits therefore render BELOW the y they are given. That offset is
	 *    what the old hardcoded -40 was silently absorbing, which is why the
	 *    number drifted when the v2 font (different ink-to-box fit) went in.
	 *
	 * ANCHOR_DROP is measured off screenshots rather than derived — solving two
	 * captures gave +22 and +13 units, so it is the midpoint of that bracket. It
	 * is the one value here to nudge if the number still sits off centre; the gap
	 * maths above is exact and should be left alone.
	 */
	const YOU_WON_Y = -120;
	const FREE_SPINS_Y = 120;
	const YOU_WON_INK = { top: 10, bottom: 129, srcH: 143, drawW: 430 };
	const FREE_SPINS_INK = { top: 9, bottom: 117, srcH: 137, drawW: 490 };
	const toUnits = (ink: typeof YOU_WON_INK, srcY: number) =>
		(srcY - ink.srcH / 2) * (ink.drawW / 700);
	const GAP_CENTRE =
		(YOU_WON_Y +
			toUnits(YOU_WON_INK, YOU_WON_INK.bottom) +
			(FREE_SPINS_Y + toUnits(FREE_SPINS_INK, FREE_SPINS_INK.top))) /
		2;
	const ANCHOR_DROP = 18;
	const NUMBER_Y = GAP_CENTRE - ANCHOR_DROP;

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			show = true;
		},
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpinsFromEvent = emitterEvent.totalFreeSpins;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<!-- 900ms fade ≈ the cloud_burst dissipation window, so the intro crossfades
     in exactly while the purple smoke thins away -->
<FadeContainer {show} duration={900}>
	<FreeSpinAnimation blur>
		<!-- `s` is the plate's own scale, handed down so the text cannot drift off it -->
		{#snippet children({ scale: s })}
			<!-- mirrors FreeSpinAnimation's plateAnchorY — landscape rises to 44.5% -->
			{@const plateCY =
				canvas.height *
					(context.stateLayoutDerived.layoutType() === 'portrait' ? 0.5 : 0.445) +
				20 * s}
		<Container
			label="FreeSpinIntroText"
			x={canvas.width / 2}
			y={0}
		>
			<!-- Inside the plate: YOU WON -->
			{#if useTitleArt}
				<Sprite
					key="youWonTextEn"
					anchor={0.5}
					y={plateCY + YOU_WON_Y * s}
					width={430 * s}
					height={(430 * s) / YOU_WON_RATIO}
				/>
			{:else}
				<ResponsiveText
					anchor={0.5}
					y={plateCY + YOU_WON_Y * s}
					maxWidth={500 * s}
					text={i18nDerived.youWon()}
					style={{
						fontFamily: 'Inter',
						fontWeight: '700',
						fill: '#E8E8E8',
						dropShadow: { color: '#000000', blur: 4, distance: 3, alpha: 0.6 },
						letterSpacing: 6,
						align: 'center',
						fontSize: Math.max(58 * s, 1),
					}}
				/>
			{/if}

			<!-- Number — fixed fontSize, scaled via Container to avoid black bitmap on resize -->
			<Container y={plateCY + NUMBER_Y * s} scale={s}>
				<ResponsiveBitmapText
					anchor={0.5}
					maxWidth={300}
					text={`${freeSpinsFromEvent}`}
					style={{
						fontFamily: 'cinzel-bold-gold',
						fontSize: 120,
						align: 'center',
						letterSpacing: 0,
					}}
				/>
			</Container>

			<!-- FREE SPINS -->
			{#if useTitleArt}
				<Sprite
					key="freeSpinsTextEn"
					anchor={0.5}
					y={plateCY + FREE_SPINS_Y * s}
					width={490 * s}
					height={(490 * s) / FREE_SPINS_RATIO}
				/>
			{:else}
				<ResponsiveText
					anchor={0.5}
					y={plateCY + FREE_SPINS_Y * s}
					maxWidth={500 * s}
					text={i18nDerived.freeSpins()}
					style={{
						fontFamily: 'Inter',
						fontWeight: '700',
						fill: '#E8E8E8',
						dropShadow: { color: '#000000', blur: 4, distance: 3, alpha: 0.6 },
						letterSpacing: 6,
						align: 'center',
						fontSize: Math.max(58 * s, 1),
					}}
				/>
			{/if}
		</Container>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
