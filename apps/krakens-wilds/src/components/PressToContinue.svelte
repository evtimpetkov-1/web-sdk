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
	const useTextArt = stateUrlDerived.lang() === 'en';
	const PATC_RATIO = 1277 / 100; // press_anywhere_en.webp
	// deliberate Y-squash: the art's letterforms are ~4.5% taller than the old
	// version's, so it renders slightly flattened to sit better in the bar
	const PATC_Y_SCALE = 0.84;
	// capped so the sprite never outgrows the backing strip on narrow layouts
	const patcWidth = $derived(Math.min(430, layout.width * 0.72));
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
		{@const barHeight = 70}
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
						fontSize: 32,
					}}
				/>
			{/if}
		</Container>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
