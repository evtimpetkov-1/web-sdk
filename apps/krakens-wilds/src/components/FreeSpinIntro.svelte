<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText, ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { i18nDerived } from '../i18n/i18nDerived';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';


	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// Scale factor — match plate scale from FreeSpinAnimation
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const s = $derived(Math.min(canvas.width / (isPortrait ? 700 : 840), canvas.height / 650));

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});
	let titleAnim = $state<'fs_in' | 'fs_idle'>('fs_in');

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			titleAnim = 'fs_in';
			show = true;
		},
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
			<!-- FREE SPINS title art above the plate -->
			<SpineProvider key="fsText" y={plateCY - 250 * s} width={760 * s}>
				<SpineTrack
					trackIndex={0}
					animationName={titleAnim}
					loop={titleAnim === 'fs_idle'}
					listener={{
						complete: () => {
							if (titleAnim === 'fs_in') titleAnim = 'fs_idle';
						},
					}}
				/>
			</SpineProvider>

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
