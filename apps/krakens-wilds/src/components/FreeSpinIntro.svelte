<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText, ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { gameTextStyle } from '../game/textStyles';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// Scale factor for text — applied directly to fontSize/positions (no Container scale)
	// Match spine scale so text stays proportional to the frame at all orientations
	const s = $derived(Math.min(canvas.width / 395, canvas.height / 370));

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpinsFromEvent = emitterEvent.totalFreeSpins;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<FreeSpinAnimation blur>
		<Container
			label="FreeSpinIntroText"
			x={canvas.width / 2}
			y={canvas.height / 2}
		>
			<ResponsiveText
				anchor={0.5}
				y={-135 * s}
				maxWidth={340 * s}
				text="CONGRATULATIONS!"
				style={{
					...gameTextStyle,
					fontSize: Math.max(26 * s, 1),
				}}
			/>

			<ResponsiveText
				anchor={0.5}
				y={-50 * s}
				maxWidth={280 * s}
				text="YOU WON"
				style={{
					...gameTextStyle,
					fontSize: Math.max(20 * s, 1),
				}}
			/>

			<ResponsiveBitmapText
				anchor={0.5}
				y={-2 * s}
				maxWidth={230 * s}
				text={`${freeSpinsFromEvent}`}
				style={{
					fontFamily: 'cinzel-bold-gold',
					fontSize: Math.max(68 * s, 1),
					align: 'center',
					letterSpacing: 0,
				}}
			/>

			<ResponsiveText
				anchor={0.5}
				y={50 * s}
				maxWidth={280 * s}
				text="FREE SPINS"
				style={{
					...gameTextStyle,
					fontSize: Math.max(24 * s, 1),
				}}
			/>
		</Container>
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
