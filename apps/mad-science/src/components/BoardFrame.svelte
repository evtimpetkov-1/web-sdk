<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';

	const context = getContext();
	// the free-spins frame is the same cut with blood on the pipes; cross-faded on gameType
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	const FRAMES = [
		{ key: 'msFrame', freeSpins: false },
		{ key: 'msFrameFs', freeSpins: true },
	];
	const SPINE_SCALE = { width: 0.59, height: 0.62 };
	const SPRITE_SCALE = { width: 1.07, height: 1 };
	const BG_RATIO = 937 / 806;
	const POSITION_ADJUSTMENT = 1.01;

	type AnimationName = 'reelhouse_glow_start' | 'reelhouse_glow_idle' | 'reelhouse_glow_exit';

	let animationName = $state<AnimationName | undefined>(undefined);
	let loop = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			animationName = 'reelhouse_glow_start';
			loop = false;
		},
		boardFrameGlowHide: () => {
			if (animationName) animationName = 'reelhouse_glow_exit';
		},
	});
</script>

{#if animationName}
	<SpineProvider
		zIndex={-1}
		key="reelhouse"
		x={context.stateGameDerived.boardLayout().x * POSITION_ADJUSTMENT}
		y={context.stateGameDerived.boardLayout().y * POSITION_ADJUSTMENT}
		width={context.stateGameDerived.boardLayout().width * SPINE_SCALE.width}
		height={context.stateGameDerived.boardLayout().height * SPINE_SCALE.height}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			listener={{
				complete: (entry) => {
					if (entry.animation) {
						if (entry.animation.name === 'reelhouse_glow_start') {
							animationName = 'reelhouse_glow_idle';
							loop = true;
						}

						if (entry.animation.name === 'reelhouse_glow_exit') {
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
     spin fall-in are hidden under the pipes, not cut flat at the board edge. -->
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
