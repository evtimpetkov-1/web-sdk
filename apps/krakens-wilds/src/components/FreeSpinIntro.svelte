<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { Container, FillGradient } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText, ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const icyGradient = new FillGradient({
		type: 'linear',
		start: { x: 0, y: 0 },
		end: { x: 0, y: 1 },
		textureSpace: 'local',
		colorStops: [
			{ offset: 0.0, color: '#F5FFFF' },
			{ offset: 0.16, color: '#D7FBFF' },
			{ offset: 0.42, color: '#72EEFF' },
			{ offset: 0.65, color: '#44E7FF' },
			{ offset: 0.84, color: '#16BBD9' },
			{ offset: 1.0, color: '#0C9DE0' },
		],
	});

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
				y={-130 * s}
				maxWidth={340 * s}
				text="CONGRATULATIONS!"
				style={{
					fontFamily: 'Cinzel',
					fontWeight: '700',
					fill: icyGradient,
					stroke: { color: '#06283B', width: 2.2 },
					dropShadow: { color: '#000000', alpha: 0.5, blur: 2, distance: 0 },
					letterSpacing: 2,
					align: 'center',
					fontSize: Math.max(30 * s, 1),
				}}
			/>

			<ResponsiveText
				anchor={0.5}
				y={-42 * s}
				maxWidth={280 * s}
				text="YOU WON"
				style={{
					fontFamily: 'Cinzel',
					fontWeight: '700',
					fill: icyGradient,
					stroke: { color: '#06283B', width: 2.2 },
					dropShadow: { color: '#000000', alpha: 0.5, blur: 2, distance: 0 },
					letterSpacing: 2,
					align: 'center',
					fontSize: Math.max(23 * s, 1),
				}}
			/>

			<ResponsiveBitmapText
				anchor={0.5}
				y={-12 * s}
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
					fontFamily: 'Cinzel',
					fontWeight: '700',
					fill: icyGradient,
					stroke: { color: '#06283B', width: 2.2 },
					dropShadow: { color: '#000000', alpha: 0.5, blur: 2, distance: 0 },
					letterSpacing: 2,
					align: 'center',
					fontSize: Math.max(24 * s, 1),
				}}
			/>
		</Container>
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
