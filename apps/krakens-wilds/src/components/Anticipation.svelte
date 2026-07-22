<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { REEL_PADDING, SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	type AnimationName = 'anticipation_intro' | 'anticipation_loop';

	let animationName = $state<AnimationName>('anticipation_intro');
	let show = $state(true);

	$effect(() => {
		if (props.reel.reelState.motion === 'stopped') {
			show = false;
		}
	});
</script>

<FadeContainer {show} duration={300} oncomplete={() => { if (!show) props.oncomplete(); }}>
	<SpineProvider
		key="anticipation"
		width={SYMBOL_SIZE * 2}
		x={(props.reel.reelIndex + REEL_PADDING) * SYMBOL_SIZE}
		y={BOARD_SIZES.height / 2 - 10}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			loop={animationName === 'anticipation_loop'}
			timeScale={stateBetDerived.timeScale()}
			listener={{
				complete: () => {
					if (animationName === 'anticipation_intro') {
						animationName = 'anticipation_loop';
					}
				},
			}}
		/>
	</SpineProvider>
</FadeContainer>
