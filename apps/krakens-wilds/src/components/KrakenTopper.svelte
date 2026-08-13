<script lang="ts" module>
	export type EmitterEventKraken =
		| { type: 'krakenAttack' } // async: resolves when the dust cloud fully covers the reels
		| { type: 'krakenTense'; tense: boolean }
		// winning wilds fly from their cells into the kraken (gulp per impact)
		| { type: 'krakenCollect'; positions: { reel: number; row: number }[] };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicIn } from 'svelte/easing';

	import { MainContainer } from 'components-layout';
	import { Container, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, CELL_W, CELL_H, REEL_PADDING } from '../game/constants';

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

	let mode = $state<'idle' | 'tense' | 'attack' | 'pregulp' | 'gulp'>('idle');
	let onReelsCovered = $state(() => {});
	const width = new Tween(KRAKEN_WIDTH * IDLE_SCALE, { duration: 450, easing: cubicOut });

	// wild copies in flight from their board cell to the kraken's maw
	type FlyingWild = { id: number; x: Tween<number>; y: Tween<number>; scale: Tween<number> };
	let flying = $state<FlyingWild[]>([]);
	let flyId = 0;
	const MAW = { x: BOARD_SIZES.width / 2, y: SIT_Y - 40 };

	const flyWild = async (pos: { reel: number; row: number }, delay: number) => {
		await waitForTimeout(delay);
		const wild: FlyingWild = {
			id: flyId++,
			// x eases out, y eases in — a light upward arc into the maw
			x: new Tween(CELL_W * (pos.reel + REEL_PADDING), { duration: 550, easing: cubicOut }),
			y: new Tween((pos.row - 0.5) * CELL_H, { duration: 550, easing: cubicIn }),
			scale: new Tween(0.2, { duration: 550, easing: cubicIn }),
		};
		flying = [...flying, wild];
		// mode mutates from listeners while we await — read it through calls
		// so TS control flow doesn't over-narrow the comparisons
		const modeIs = (...ms: (typeof mode)[]) => ms.includes(mode);
		// the kraken notices the incoming wild: inhale + track it (0.55s =
		// flight time), holding the ready pose the gulp starts from
		if (modeIs('idle', 'tense')) mode = 'pregulp';
		wild.x.set(MAW.x);
		wild.scale.set(0.07);
		await wild.y.set(MAW.y);
		flying = flying.filter((f) => f.id !== wild.id);
		// impact: swallow + count it (tier thresholds live on the idle name)
		context.stateGame.krakenCollects += 1;
		if (modeIs('idle', 'tense', 'pregulp')) mode = 'gulp';
	};

	context.eventEmitter.subscribeOnMount({
		krakenAttack: async () => {
			mode = 'attack';
			width.set(KRAKEN_WIDTH); // grow while it rears up (wind-up is ~0.85s)
			await waitForResolve((resolve) => (onReelsCovered = resolve));
		},
		krakenTense: (emitterEvent) => {
			if (mode !== 'attack') mode = emitterEvent.tense ? 'tense' : 'idle';
		},
		krakenCollect: (emitterEvent) => {
			emitterEvent.positions.forEach((pos, i) => flyWild(pos, i * 180));
		},
	});

	// idle escalates as the kraken is fed: 5+ agitated, 10+ menacing
	const idleAnim = $derived(
		context.stateGame.krakenCollects >= 10
			? 'kraken_idle_3'
			: context.stateGame.krakenCollects >= 5
				? 'kraken_idle_2'
				: 'kraken_idle',
	);
	const ANIMATION_NAME = $derived({
		idle: idleAnim,
		tense: 'kraken_tense',
		attack: 'kraken_attack',
		pregulp: 'kraken_pregulp',
		gulp: 'kraken_gulp',
	} as const);

	// The kraken tenses exactly while reel anticipation runs — same per-reel
	// flag that drives the purple anticipation column, so it never fires when
	// the second scatter lands on the last reel (nothing left to anticipate).
	const anticipating = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);
	$effect(() => {
		if (anticipating && mode === 'idle') mode = 'tense';
		else if (!anticipating && mode === 'tense') mode = 'idle';
	});
</script>

<MainContainer label="KrakenTopperContainer">
	<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
		<Container x={bl.x - BOARD_SIZES.width / 2} y={bl.y - BOARD_SIZES.height / 2}>
			<!-- flying wilds render behind the kraken so they vanish into its maw -->
			{#each flying as f (f.id)}
				<Sprite key="w" anchor={0.5} x={f.x.current} y={f.y.current} scale={f.scale.current} />
			{/each}
			<SpineProvider
				key="kraken"
				x={BOARD_SIZES.width / 2}
				y={SIT_Y}
				width={width.current * krakenBoost}
			>
				<SpineTrack
					trackIndex={0}
					animationName={ANIMATION_NAME[mode]}
					loop={mode !== 'attack' && mode !== 'gulp' && mode !== 'pregulp'}
					listener={{
						event: (_, event) => {
							if (event.data?.name === 'reelsCovered') onReelsCovered();
						},
						complete: () => {
							if (mode === 'attack') {
								mode = 'idle';
								width.set(KRAKEN_WIDTH * IDLE_SCALE);
							} else if (mode === 'gulp') {
								mode = 'idle';
							}
							// pregulp: completes into its held ready pose — the
							// wild's impact flips it to gulp
						},
					}}
				/>
			</SpineProvider>
		</Container>
	</Container>
</MainContainer>
