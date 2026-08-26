<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
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


	// English renders the titles in the winbox bitmap font (cinzel-bold-gold),
	// replacing the old baked teal art (2026-08-26). The atlas is A-Z + digits
	// only, so every other locale falls back to a Pixi Text in headingGold —
	// the same flat-gold Cinzel the rules and paytable headings use, which is
	// as close as live text gets to the baked glyphs.
	const useBitmapTitles = stateUrlDerived.lang() === 'en';

	/**
	 * Layout, in `s` units relative to the plate centre. Titles at a fixed
	 * ±120, the number in the gap between them.
	 *
	 * The one trap in centring this font is that `anchor: 0.5` on a BitmapText
	 * does NOT centre the ink: Pixi's bounds and its renderer disagree by the
	 * font's baseLineOffset (lineHeight 176 - base 132 = 44), so the glyphs
	 * draw baseLineOffset/2 — 0.125x the font size — BELOW the y they are
	 * given (full derivation in LineWinLabel.svelte). Both titles share the
	 * drop, so their spacing is untouched; the number runs at a different size,
	 * so its slot is solved for the same ink-gap centre instead of reusing the
	 * titles' offset. The glyph boxes are fully inked (174 of 176 units), so
	 * ink half-height is fontSize / 2 to within a unit.
	 */
	const YOU_WON_Y = -120;
	const FREE_SPINS_Y = 120;
	// matches the old art's measured letter height (~73-75 units), so the
	// rework does not resize the titles on screen
	const TITLE_FONT_SIZE = 74;
	const NUMBER_FONT_SIZE = 120;
	/** anchor-0.5 ink drop: (lineHeight - base) / 2 / lineHeight of the size */
	const DROP_FRAC = (176 - 132) / 2 / 176;
	const titleDrop = TITLE_FONT_SIZE * DROP_FRAC;
	// ink edges facing the gap, drops included
	const GAP_CENTRE =
		(YOU_WON_Y + titleDrop + TITLE_FONT_SIZE / 2 +
			(FREE_SPINS_Y + titleDrop - TITLE_FONT_SIZE / 2)) /
		2;
	const NUMBER_Y = GAP_CENTRE - NUMBER_FONT_SIZE * DROP_FRAC;

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

<!-- The intro rides ON the held cloud (see FsCloudTransition): it fades in
     over the frozen smoke, and on dismissal fades out while fsCloudRelease
     lets the burst dissipate underneath -->
<FadeContainer {show} duration={900}>
	<FreeSpinAnimation>
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
			<!-- YOU WON -->
			{#if useBitmapTitles}
				<!-- fixed fontSize inside a scaled Container, same as the number:
				     scaling the TEXT NODE on resize re-rasterised to black -->
				<Container y={plateCY + YOU_WON_Y * s} scale={s}>
					<ResponsiveBitmapText
						anchor={0.5}
						maxWidth={520}
						text={i18nDerived.youWon()}
						style={{
							fontFamily: 'cinzel-bold-gold',
							fontSize: TITLE_FONT_SIZE,
							align: 'center',
							letterSpacing: 0,
						}}
					/>
				</Container>
			{:else}
				<ResponsiveText
					anchor={0.5}
					y={plateCY + YOU_WON_Y * s}
					maxWidth={500 * s}
					text={i18nDerived.youWon()}
					style={{ ...headingGold, fontSize: Math.max(58 * s, 1) }}
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
						fontSize: NUMBER_FONT_SIZE,
						align: 'center',
						letterSpacing: 0,
					}}
				/>
			</Container>

			<!-- FREE SPINS -->
			{#if useBitmapTitles}
				<Container y={plateCY + FREE_SPINS_Y * s} scale={s}>
					<ResponsiveBitmapText
						anchor={0.5}
						maxWidth={520}
						text={i18nDerived.freeSpins()}
						style={{
							fontFamily: 'cinzel-bold-gold',
							fontSize: TITLE_FONT_SIZE,
							align: 'center',
							letterSpacing: 0,
						}}
					/>
				</Container>
			{:else}
				<ResponsiveText
					anchor={0.5}
					y={plateCY + FREE_SPINS_Y * s}
					maxWidth={500 * s}
					text={i18nDerived.freeSpins()}
					style={{ ...headingGold, fontSize: Math.max(58 * s, 1) }}
				/>
			{/if}
		</Container>
		{/snippet}
	</FreeSpinAnimation>

	{#if pressArmed}
		<PressToContinue onpress={() => oncomplete()} />
	{/if}
</FadeContainer>
