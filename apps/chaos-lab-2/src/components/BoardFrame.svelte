<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Container, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';

	const context = getContext();
	// the free-spins frame is the same cut with blood on the pipes; cross-faded on gameType
	const isFreeSpins = $derived(context.stateGame.gameType === 'freegame');
	const FRAMES = [
		{ key: 'msFrame', freeSpins: false },
		{ key: 'msFrameFs', freeSpins: true },
	];
	// Free-spins glow (msReelGlow): a halo hugging the pipes, ripples swelling off
	// them, lit gaps between the plates, spores/glints/bubbles shed off the edges.
	// The rig is authored in the frame image's px, so it takes the frame sprite's
	// own box. zIndex -1 puts it under the board — the fill lights the gaps.
	type AnimationName = 'start' | 'idle' | 'exit';

	let animationName = $state<AnimationName | undefined>(undefined);
	let loop = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			animationName = 'start';
			loop = false;
		},
		boardFrameGlowHide: () => {
			if (animationName) animationName = 'exit';
		},
	});
</script>

{#if animationName}
	<SpineProvider
		zIndex={-1}
		key="msReelGlow"
		x={context.stateGameDerived.frameLayout().x}
		y={context.stateGameDerived.frameLayout().y}
		width={context.stateGameDerived.frameLayout().width}
		height={context.stateGameDerived.frameLayout().height}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			listener={{
				complete: (entry) => {
					if (entry.animation) {
						if (entry.animation.name === 'start') {
							animationName = 'idle';
							loop = true;
						}

						if (entry.animation.name === 'exit') {
							animationName = undefined;
							loop = false;
						}
					}
				},
			}}
		/>
	</SpineProvider>
{/if}

<!-- Mad Science pipe frame, fitted so its transparent window is the board (see
     FRAME_ART / frameLayout). Drawn OVER the board: the oversized bonus and the
     spin fall-in are hidden under the pipes, not cut flat at the board edge.
     The wrapper never unmounts: FadeContainer unmounts the hidden frame, and the
     base/FS swap would otherwise re-add a frame over the multiplier plate. -->
<Container>
	{#each FRAMES as frame (frame.key)}
		<FadeContainer show={frame.freeSpins === isFreeSpins} duration={500}>
			<Sprite
				key={frame.key}
				anchor={0.5}
				x={context.stateGameDerived.frameLayout().x}
				y={context.stateGameDerived.frameLayout().y}
				width={context.stateGameDerived.frameLayout().width}
				height={context.stateGameDerived.frameLayout().height}
			/>
		</FadeContainer>
	{/each}
</Container>
