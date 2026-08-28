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
	import { headingGold } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// English draws the baked title art (you_won/free_spins strips); every
	// other locale falls back to headingGold text on the same rows.
	const useArtTitles = (stateUrlDerived.social() || stateUrlDerived.lang() === 'en');

	/**
	 * v4 card layout (2026-08-28, per the mockup): the stone frame is drawn
	 * again — YOU WON / count / FREE SPINS stacked over a row of three feature
	 * badges with one-line-concept captions. All rows in `s` units relative to
	 * the card centre; the card box mirrors FreeSpinAnimation's PLATE basis
	 * (782 x 710 = the 1200x1089 art), whose fitted scale is handed down.
	 * Interior after the stone border is roughly ±300 vertically.
	 */
	const FRAME_W = 782;
	const FRAME_H = 710;
	/**
	 * The frame draws BIGGER than the content basis: the stone card grows
	 * ~7.5% while every row keeps its absolute size, buying interior padding
	 * on all sides (the viewport shares in FreeSpinAnimation are trimmed to
	 * absorb most of the growth).
	 */
	const FRAME_SCALE = 1.075;
	// Rows as a block: content spans -292 (title top) .. ~276 (3-line caption
	// bottom), midpoint ~-8 — centred in the ±300 interior with margin, so no
	// caption can reach the bottom border (the first cut's 4-line bonus
	// caption spilled over it).
	const YOU_WON_Y = -232;
	const YOU_WON_W = 400;
	const YOU_WON_AR = 1060 / 321; // you_won_en.webp
	const FREE_SPINS_Y = 0;
	const FREE_SPINS_W = 480;
	const FREE_SPINS_AR = 1470 / 320; // free_spins_en.webp
	const NUMBER_FONT_SIZE = 115;
	/**
	 * anchor-0.5 ink drop of the winbox bitmap font: Pixi's bounds and its
	 * renderer disagree by baseLineOffset (lineHeight 176 - base 132 = 44), so
	 * glyphs draw 0.125x the font size BELOW the y they are given (derivation
	 * in LineWinLabel.svelte). The count is the only bitmap text left here.
	 */
	const DROP_FRAC = (176 - 132) / 2 / 176;
	/**
	 * -126, not the -112 box midpoint between the titles: YOU WON's arch bows
	 * upward (its box bottom is the arch's low ENDS, the centre ink sits
	 * higher) and a digit's ink underfills its box, so the box-centred count
	 * read visually glued to FREE SPINS. Screenshot-measured correction.
	 */
	const NUMBER_Y = -126 - NUMBER_FONT_SIZE * DROP_FRAC;
	const BADGE_Y = 138;
	const BADGE_X = 220;
	const BADGE_W = 130;
	const BADGE_AR = 223 / 200;
	// 180-wide columns on ±220 centres leave a 40-unit gutter between
	// neighbours — at 215 the captions ran into each other
	const CAPTION_Y = 204;
	const CAPTION_W = 180;

	const BADGES = [
		{ key: 'fsIntroBadgeKraken', x: -BADGE_X, caption: () => i18nDerived.fsIntroKraken() },
		{ key: 'fsIntroBadgeMult', x: 0, caption: () => i18nDerived.fsIntroMult() },
		{ key: 'fsIntroBadgeBonus', x: BADGE_X, caption: () => i18nDerived.fsIntroBonus() },
	];

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	/**
	 * The press-to-continue layer arms only after the intro is actually
	 * READABLE. `freeSpinIntroShow` fires at full cloud coverage and the
	 * FadeContainer mounts its children from the first frame of the 900ms
	 * crossfade — so an unarmed press layer used to be live while the player
	 * still saw nothing but the kraken's cloud. A tap there dismissed an intro
	 * they never saw, and the premature skip raced the trigger attack still
	 * playing on the topper (see KrakenTopper's krakenAttack restart note).
	 */
	let pressArmed = $state(false);
	$effect(() => {
		if (!show) {
			pressArmed = false;
			return;
		}
		const timer = setTimeout(() => (pressArmed = true), 1100);
		return () => clearTimeout(timer);
	});

	/**
	 * Idle breath — the whole card swells ±1.5% on a ~2.6s sine. The loop runs
	 * ONLY while the intro is up (this component lives for the whole session,
	 * and an unconditional rAF writing state 60x/s forever is exactly the trap
	 * SpinMultiplier documents). A transform this small just re-samples the
	 * already-rasterised text on the GPU — nothing re-rasterises.
	 */
	let breath = $state(0);
	$effect(() => {
		if (!show) return;
		let raf: number;
		const start = performance.now();
		const tick = () => {
			breath = Math.sin(((performance.now() - start) / 2600) * Math.PI * 2);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
	const cardScale = $derived(1 + breath * 0.015);

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

	const captionStyle = (s: number) => ({
		fontFamily: 'Inter',
		fontWeight: '700' as const,
		fill: '#ffffff',
		fontSize: Math.max(20 * s, 1),
		lineHeight: 24 * s,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: CAPTION_W * s,
		dropShadow: { color: '#000000', blur: 3 * s, distance: 2 * s, alpha: 0.7 },
	});
</script>

<!-- The intro rides ON the held cloud (see FsCloudTransition): it fades in
     over the frozen smoke, and on dismissal fades out while fsCloudRelease
     lets the burst dissipate underneath -->
<FadeContainer {show} duration={900}>
	<FreeSpinAnimation>
		<!-- `s` is the card's own scale, handed down so nothing drifts off it -->
		{#snippet children({ scale: s })}
			<!-- mirrors FreeSpinAnimation's plateAnchorY — landscape rises to 44.5% -->
			{@const plateCY =
				canvas.height *
					(context.stateLayoutDerived.layoutType() === 'portrait' ? 0.5 : 0.445) +
				20 * s}
			<Container label="FreeSpinIntroCard" x={canvas.width / 2} y={plateCY} scale={cardScale}>
				<Sprite
					key="fsIntroFrame"
					anchor={0.5}
					width={FRAME_W * FRAME_SCALE * s}
					height={FRAME_H * FRAME_SCALE * s}
				/>

				<!-- YOU WON -->
				{#if useArtTitles}
					<Sprite
						key="fsIntroYouWonEn"
						anchor={0.5}
						y={YOU_WON_Y * s}
						width={YOU_WON_W * s}
						height={(YOU_WON_W / YOU_WON_AR) * s}
					/>
				{:else}
					<ResponsiveText
						anchor={0.5}
						y={YOU_WON_Y * s}
						maxWidth={500 * s}
						text={i18nDerived.youWon()}
						style={{ ...headingGold, fontSize: Math.max(56 * s, 1) }}
					/>
				{/if}

				<!-- count — fixed fontSize inside a scaled Container: scaling the
				     TEXT NODE on resize re-rasterised the bitmap to black -->
				<Container y={NUMBER_Y * s} scale={s}>
					<ResponsiveBitmapText
						anchor={0.5}
						maxWidth={300}
						text={`${freeSpinsFromEvent}`}
						style={{
							fontFamily: 'cinzel-bold-gold',
							fontSize: NUMBER_FONT_SIZE,
							align: 'center',
							letterSpacing: 0,
						}}
					/>
				</Container>

				<!-- FREE SPINS -->
				{#if useArtTitles}
					<Sprite
						key="fsIntroFreeSpinsEn"
						anchor={0.5}
						y={FREE_SPINS_Y * s}
						width={FREE_SPINS_W * s}
						height={(FREE_SPINS_W / FREE_SPINS_AR) * s}
					/>
				{:else}
					<ResponsiveText
						anchor={0.5}
						y={FREE_SPINS_Y * s}
						maxWidth={520 * s}
						text={i18nDerived.freeSpins()}
						style={{ ...headingGold, fontSize: Math.max(56 * s, 1) }}
					/>
				{/if}

				<!-- feature badges + captions -->
				{#each BADGES as badge (badge.key)}
					<Sprite
						key={badge.key}
						anchor={0.5}
						x={badge.x * s}
						y={BADGE_Y * s}
						width={BADGE_W * s}
						height={(BADGE_W / BADGE_AR) * s}
					/>
					<ResponsiveText
						anchor={{ x: 0.5, y: 0 }}
						x={badge.x * s}
						y={CAPTION_Y * s}
						maxWidth={CAPTION_W * s}
						text={badge.caption()}
						style={captionStyle(s)}
					/>
				{/each}
			</Container>
		{/snippet}
	</FreeSpinAnimation>

	{#if pressArmed}
		<PressToContinue onpress={() => oncomplete()} />
	{/if}
</FadeContainer>
