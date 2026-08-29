<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { ResponsiveText } from 'components-pixi';
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { headingGold } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		onpress: () => void;
		replay?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	let pulse = $state(1);

	onMount(() => {
		let raf: number;
		const start = performance.now();
		function tick() {
			const t = (performance.now() - start) / 1000;
			// Smooth pulse: alpha oscillates 0.4 → 1.0, scale 0.97 → 1.03
			pulse = Math.sin(t * 2.5) * 0.5 + 0.5; // 0..1
			raf = requestAnimationFrame(tick);
		}
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const textAlpha = $derived(0.4 + pulse * 0.6);
	const textScale = $derived(0.97 + pulse * 0.06);
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// English gets the baked text art; other locales keep the text label.
	const useTextArt = (stateUrlDerived.social() || stateUrlDerived.lang() === 'en');
	const PATC_RATIO = 1971 / 169; // press_anywhere_en.webp (v5 art)

	// Portrait sizes the prompt on its own terms: its main box is only 800 wide,
	// where the shared numbers left the prompt at ~54% of the width and ~14 CSS
	// px tall on a phone — too small for the only call to action on screen. The
	// wider landscape/desktop boxes still read well as they were.
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	// Both halves of the cap are per-layout: the width FRACTION is what actually
	// binds in portrait (0.72 of an 800-wide box is 576, under any sane absolute
	// cap), so raising only the absolute cap moves nothing.
	const patcWidth = $derived(
		isPortrait ? Math.min(700, layout.width * 0.86) : Math.min(430, layout.width * 0.72),
	);
	/**
	 * The v5 art renders at its TRUE aspect ratio.
	 *
	 * Landscape/desktop used to squash it to 0.84 — a correction hand-tuned to
	 * the previous strip's letterforms, which this art replaces. Carrying that
	 * number over would distort new lettering by 16% for no reason, and the
	 * 70px bar has room for the un-squashed height either way (~37px at the
	 * 430px width cap). Set this back to 0.84 if the flattened look is wanted.
	 */
	const PATC_Y_SCALE = 1;
	// the strip grows with the prompt so the padding around it stays in proportion
	const barHeight = $derived(isPortrait ? 104 : 70);
	// same story for the non-English text fallback (ResponsiveText shrinks to fit)
	const fallbackFontSize = $derived(isPortrait ? 54 : 32);
</script>

{#if props.replay}
	<Container
		label="PressToContinueContainer"
		x={canvas.width * 0.5}
		y={canvas.height * 0.6}
		alpha={textAlpha}
		scaleX={textScale}
		scaleY={textScale}
	>
		<ResponsiveText
			text={`▶ ${i18nDerived.replay()}`}
			anchor={0.5}
			maxWidth={canvas.width * 0.85}
			style={{
				...headingGold,
				fontSize: 64,
			}}
		/>
	</Container>
{:else}
	<MainContainer alignVertical="bottom">
		{@const textY = layout.height - 100}
		<!-- dark backing strip -->
		<Rectangle
			x={0}
			y={textY - barHeight / 2}
			width={layout.width}
			height={barHeight}
			backgroundColor={0x000000}
			backgroundAlpha={0.45}
			borderRadius={8}
		/>
		<!-- pulsing text -->
		<Container
			label="PressToContinueContainer"
			x={layout.width * 0.5}
			y={textY}
			alpha={textAlpha}
			scaleX={textScale}
			scaleY={textScale}
		>
			{#if useTextArt}
				<Sprite
					key="pressAnywhereTextEn"
					anchor={0.5}
					width={patcWidth}
					height={(patcWidth / PATC_RATIO) * PATC_Y_SCALE}
				/>
			{:else}
				<ResponsiveText
					text={i18nDerived.pressAnywhere()}
					anchor={0.5}
					maxWidth={layout.width * 0.85}
					style={{
						...headingGold,
						fontSize: fallbackFontSize,
					}}
				/>
			{/if}
		</Container>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
