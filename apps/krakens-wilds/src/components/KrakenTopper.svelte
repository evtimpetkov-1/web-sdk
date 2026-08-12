<script lang="ts" module>
	export type EmitterEventKraken =
		| { type: 'krakenAttack' } // async: resolves when the dust cloud fully covers the reels
		| { type: 'krakenTense'; tense: boolean };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';
	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';

	const context = getContext();
	const bl = $derived(context.stateGameDerived.boardLayout());

	// Skeleton contract (see tools/spine-slicer/kraken.js): origin = top-center
	// of the reel frame, skeleton 1500 world units wide, dust cloud covers
	// x ±680 / y 0..-900. WIDTH scales it so the cloud fully covers the board.
	const KRAKEN_WIDTH = 660;
	const SIT_Y = -14; // sitting line relative to the board's top edge

	let mode = $state<'idle' | 'tense' | 'attack'>('idle');
	let onReelsCovered = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		krakenAttack: async () => {
			mode = 'attack';
			await waitForResolve((resolve) => (onReelsCovered = resolve));
		},
		krakenTense: (emitterEvent) => {
			if (mode !== 'attack') mode = emitterEvent.tense ? 'tense' : 'idle';
		},
	});

	const ANIMATION_NAME = {
		idle: 'kraken_idle',
		tense: 'kraken_tense',
		attack: 'kraken_attack',
	} as const;
</script>

<MainContainer label="KrakenTopperContainer">
	<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
		<Container x={bl.x - BOARD_SIZES.width / 2} y={bl.y - BOARD_SIZES.height / 2}>
			<SpineProvider key="kraken" x={BOARD_SIZES.width / 2} y={SIT_Y} width={KRAKEN_WIDTH}>
				<SpineTrack
					trackIndex={0}
					animationName={ANIMATION_NAME[mode]}
					loop={mode !== 'attack'}
					listener={{
						event: (_, event) => {
							if (event.data?.name === 'reelsCovered') onReelsCovered();
						},
						complete: () => {
							if (mode === 'attack') mode = 'idle';
						},
					}}
				/>
			</SpineProvider>
		</Container>
	</Container>
</MainContainer>
