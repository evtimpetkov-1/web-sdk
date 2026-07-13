<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Container, Text, Rectangle } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { gameTextStyle } from '../game/textStyles';

	type Props = {
		onpress: () => void;
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
</script>

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
		<Text
			text="PRESS ANYWHERE TO CONTINUE"
			anchor={0.5}
			style={{
				...gameTextStyle,
				fontSize: 32,
			}}
		/>
	</Container>
</MainContainer>
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
