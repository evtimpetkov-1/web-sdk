<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');

	// logo.png is 1465x1074
	const LOGO_WIDTH = 420;
	const LOGO_HEIGHT = (LOGO_WIDTH * 1074) / 1465;
</script>

<!-- logo. The asset load itself is shown by the HTML boot loader (LoaderGame),
     which stays up until stateApp.loaded — by the time this is visible there
     is nothing left to load, so no progress bar here. -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
		>
			<Sprite key="msLogo" anchor={0.5} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
		</Container>
	</MainContainer>
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!-- transition between the loading screen and the game -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
