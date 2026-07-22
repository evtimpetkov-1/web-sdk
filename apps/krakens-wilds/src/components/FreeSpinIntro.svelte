<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { gameTextStyle, winTextStyle } from '../game/textStyles';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

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
		{@const spineScale = canvas.width / 1280}
		<Container
			label="FreeSpinIntroText"
			x={canvas.width / 2}
			y={canvas.height / 2}
			scaleX={spineScale}
			scaleY={spineScale}
		>
			<!-- CONGRATULATIONS! -->
			<ResponsiveText
				anchor={0.5}
				y={-80}
				maxWidth={500}
				text="CONGRATULATIONS!"
				style={{
					...gameTextStyle,
					fontSize: 44,
				}}
			/>

			<!-- Number of free spins (large, gold) -->
			<ResponsiveText
				anchor={0.5}
				y={0}
				maxWidth={400}
				text={`${freeSpinsFromEvent}`}
				style={{
					...winTextStyle,
					fontSize: 86,
				}}
			/>

			<!-- FREE SPINS label -->
			<ResponsiveText
				anchor={0.5}
				y={70}
				maxWidth={500}
				text="FREE SPINS"
				style={{
					...gameTextStyle,
					fontSize: 48,
				}}
			/>
		</Container>
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
