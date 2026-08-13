<script lang="ts" module>
	export type EmitterEventKraken =
		| { type: 'krakenAttack' } // async: resolves when the dust cloud fully covers the reels
		| { type: 'krakenTense'; tense: boolean };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

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
	// At rest the kraken sits HALF SIZE so it barely intrudes on the board;
	// it grows to full size during the attack wind-up (rears up + grows),
	// then shrinks back once the attack completes. Scale pivots on the
	// skeleton origin (the sitting line), so the tentacle tips stay put.
	const KRAKEN_WIDTH = 660;
	const IDLE_SCALE = 0.5;
	const SIT_Y = -28; // sitting line: on the frame's top edge (frame sits +10)

	// Kraken enlarged relative to the board (which shrank 20% on
	// desktop/landscape). Desktop/tablet have headroom above the frame, so the
	// kraken gets an extra push there.
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const krakenBoost = $derived(
		layout === 'portrait' ? 1.6 : layout === 'landscape' ? 1.5 : 1.85,
	);

	let mode = $state<'idle' | 'tense' | 'attack'>('idle');
	let onReelsCovered = $state(() => {});
	const width = new Tween(KRAKEN_WIDTH * IDLE_SCALE, { duration: 450, easing: cubicOut });

	context.eventEmitter.subscribeOnMount({
		krakenAttack: async () => {
			mode = 'attack';
			width.set(KRAKEN_WIDTH); // grow while it rears up (wind-up is ~0.85s)
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
			<SpineProvider
				key="kraken"
				x={BOARD_SIZES.width / 2}
				y={SIT_Y}
				width={width.current * krakenBoost}
			>
				<SpineTrack
					trackIndex={0}
					animationName={ANIMATION_NAME[mode]}
					loop={mode !== 'attack'}
					listener={{
						event: (_, event) => {
							if (event.data?.name === 'reelsCovered') onReelsCovered();
						},
						complete: () => {
							if (mode === 'attack') {
								mode = 'idle';
								width.set(KRAKEN_WIDTH * IDLE_SCALE);
							}
						},
					}}
				/>
			</SpineProvider>
		</Container>
	</Container>
</MainContainer>
