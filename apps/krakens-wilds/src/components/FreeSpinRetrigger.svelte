<script lang="ts" module>
	export type EmitterEventFreeSpinRetrigger =
		| { type: 'freeSpinRetriggerShow'; extraSpins: number };
</script>

<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { Tween } from 'svelte/motion';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { goldTextStyle } from '../game/textStyles';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	let show = $state(false);
	let extraSpins = $state(0);
	let scale = new Tween(1);

	context.eventEmitter.subscribeOnMount({
		freeSpinRetriggerShow: async (emitterEvent) => {
			extraSpins = emitterEvent.extraSpins;
			scale = new Tween(1);
			show = true;
			await waitForTimeout(800);
			scale.set(0, { duration: 700 });
			await waitForTimeout(700);
			show = false;
		},
	});
</script>

<FadeContainer {show}>
	<Rectangle
		width={canvas.width}
		height={canvas.height}
		backgroundColor={0x000000}
		alpha={0.6}
	/>
	{@const spineScale = canvas.width / 1280}
	<Container
		label="FreeSpinRetriggerText"
		x={canvas.width / 2}
		y={canvas.height / 2}
		scaleX={spineScale * scale.current}
		scaleY={spineScale * scale.current}
	>
		<ResponsiveText
			anchor={0.5}
			y={-20}
			maxWidth={600}
			text={`+${extraSpins}`}
			style={{
				...goldTextStyle,
				fontSize: 160,
			}}
		/>
		<ResponsiveText
			anchor={0.5}
			y={100}
			maxWidth={600}
			text="FREE SPINS"
			style={{
				...goldTextStyle,
				fontSize: 48,
			}}
		/>
	</Container>
</FadeContainer>
