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
	import { i18nDerived } from '../i18n/i18nDerived';
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

	// Scale factor — match plate scale from FreeSpinAnimation
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const s = $derived(Math.min(canvas.width / (isPortrait ? 700 : 840), canvas.height / 650));

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
		{@const plateCY = canvas.height / 2 + 20 * s}
		<Container
			label="FreeSpinIntroText"
			x={canvas.width / 2}
			y={0}
		>
			<!-- CONGRATULATIONS above the plate -->
			<ResponsiveText
				anchor={0.5}
				y={plateCY - 260 * s}
				maxWidth={700 * s}
				text={i18nDerived.congratulations()}
				style={{
					fontFamily: 'Cinzel',
					fontWeight: '700',
					fill: icyGradient,
					stroke: { color: '#06283B', width: 3 },
					dropShadow: { color: '#000000', alpha: 0.6, blur: 4, distance: 0 },
					letterSpacing: 3,
					align: 'center',
					fontSize: Math.max(56 * s, 1),
				}}
			/>

			<!-- Inside the plate: YOU WON -->
			<ResponsiveText
				anchor={0.5}
				y={plateCY - 85 * s}
				maxWidth={500 * s}
				text={i18nDerived.youWon()}
				style={{
					fontFamily: 'Cinzel',
					fontWeight: '700',
					fill: '#B0C4DE',
					stroke: { color: '#0a1929', width: 2 },
					letterSpacing: 3,
					align: 'center',
					fontSize: Math.max(48 * s, 1),
				}}
			/>

			<!-- Number — fixed fontSize, scaled via Container to avoid black bitmap on resize -->
			<Container y={plateCY - 25 * s} scale={s}>
				<ResponsiveBitmapText
					anchor={0.5}
					maxWidth={300}
					text={`${freeSpinsFromEvent}`}
					style={{
						fontFamily: 'cinzel-bold-gold',
						fontSize: 120,
						align: 'center',
						letterSpacing: 0,
					}}
				/>
			</Container>

			<!-- FREE SPINS -->
			<ResponsiveText
				anchor={0.5}
				y={plateCY + 90 * s}
				maxWidth={500 * s}
				text={i18nDerived.freeSpins()}
				style={{
					fontFamily: 'Cinzel',
					fontWeight: '700',
					fill: '#B0C4DE',
					stroke: { color: '#0a1929', width: 2 },
					letterSpacing: 3,
					align: 'center',
					fontSize: Math.max(48 * s, 1),
				}}
			/>
		</Container>
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
