<script lang="ts">
	import { Container, Sprite, Rectangle, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer, LoadingProgress } from 'components-pixi';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const logoSize = $derived(Math.min(canvas.width, canvas.height) * 0.65);
</script>

<!-- logo and loading progress -->
<FadeContainer show={loadingType === 'start'}>
	<Rectangle width={canvas.width} height={canvas.height} backgroundColor={0x000000} alpha={0.7} />
	<Container label="LoadingScreenContainer" x={canvas.width / 2} y={canvas.height / 2}>
		<Sprite key="gameLogo" anchor={0.5} width={logoSize} height={logoSize} />
		<SpineProvider key="logoOverlay" x={10} y={-26} width={logoSize} height={logoSize}>
			<SpineTrack trackIndex={0} animationName="idle" loop={true} />
		</SpineProvider>
		{#if !context.stateApp.loaded}
			<LoadingProgress y={logoSize * 0.45} width={logoSize * 0.6} height={logoSize * 0.1}>
				{#snippet background(sizes)}
					<Sprite key="progressBarBackground.png" {...sizes} />
				{/snippet}
				{#snippet progress(sizes)}
					<Sprite key="progressBar.png" {...sizes} />
				{/snippet}
				{#snippet frame(sizes)}
					<Sprite key="progressBarFrame.png" {...sizes} />
				{/snippet}
			</LoadingProgress>
		{/if}
	</Container>
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!-- transition between the loading screen and the game -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
