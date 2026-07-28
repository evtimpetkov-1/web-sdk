<script lang="ts" module>
	export type EmitterEventFreeSpinRetrigger =
		| { type: 'freeSpinRetriggerShow'; extraSpins: number };
</script>

<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import { FadeContainer, ResponsiveBitmapText } from 'components-pixi';
	import { Tween } from 'svelte/motion';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// Scale factor — applied directly to fontSize/positions (no Container scale)
	// Match spine scale so text stays proportional to the frame at all orientations
	const s = $derived(Math.min(canvas.width / 395, canvas.height / 370));

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
	<Container
		label="FreeSpinRetriggerText"
		x={canvas.width / 2}
		y={canvas.height / 2}
		scaleX={scale.current}
		scaleY={scale.current}
	>
		<ResponsiveBitmapText
			anchor={0.5}
			y={-10 * s}
			maxWidth={315 * s}
			text={`+${extraSpins}`}
			style={{
				fontFamily: 'cinzel-bold-gold',
				fontSize: Math.max(84 * s, 1),
				align: 'center',
				letterSpacing: 0,
			}}
		/>
		<ResponsiveBitmapText
			anchor={0.5}
			y={53 * s}
			maxWidth={315 * s}
			text="FREE SPINS"
			style={{
				fontFamily: 'cinzel-bold-gold',
				fontSize: Math.max(25 * s, 1),
				align: 'center',
				letterSpacing: 0,
			}}
		/>
	</Container>
</FadeContainer>
