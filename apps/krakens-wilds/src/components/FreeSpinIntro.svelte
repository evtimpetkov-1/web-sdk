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

	// Scale factor — match plate scale from FreeSpinAnimation
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const s = $derived(Math.min(canvas.width / (isPortrait ? 700 : 840), canvas.height / 650));

	// English gets the baked teal title art (matches the logo's WILDS
	// lettering); every other locale falls back to the text labels.
	// Source for YOU WON is the 04_54_07 revision (even letter heights —
	// the original teal cut had a taller Y).
	const useTitleArt = stateUrlDerived.lang() === 'en';
	// you_won_en.webp 700x143, free_spins_en.webp 700x137
	const YOU_WON_RATIO = 700 / 143;
	const FREE_SPINS_RATIO = 700 / 137;

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
		{@const plateCY = canvas.height / 2 + 20 * s}
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
					y={plateCY - 120 * s}
					width={430 * s}
					height={(430 * s) / YOU_WON_RATIO}
				/>
			{:else}
				<ResponsiveText
					anchor={0.5}
					y={plateCY - 120 * s}
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
			<Container y={plateCY - 40 * s} scale={s}>
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
					y={plateCY + 120 * s}
					width={490 * s}
					height={(490 * s) / FREE_SPINS_RATIO}
				/>
			{:else}
				<ResponsiveText
					anchor={0.5}
					y={plateCY + 120 * s}
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
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
