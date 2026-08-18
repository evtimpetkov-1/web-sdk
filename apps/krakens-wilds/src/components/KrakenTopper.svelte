<script lang="ts" module>
	export type EmitterEventKraken =
		| { type: 'krakenAttack' } // async: resolves when the dust cloud fully covers the reels
		| { type: 'krakenTense'; tense: boolean }
		// winning wilds fly from their cells into the kraken (gulp per impact)
		| { type: 'krakenCollect'; positions: { reel: number; row: number }[] }
		// async: coins fly into the kraken one by one, their multipliers summing
		// above it, then the total flies off toward the winbox. Resolves when the
		// total has been handed over, so the caller can start the win count-up.
		| {
				type: 'coinCollect';
				coins: { reel: number; row: number; multiplier: number }[];
		  };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicIn } from 'svelte/easing';

	import { MainContainer } from 'components-layout';
	import { Container, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, CELL_W, CELL_H, REEL_PADDING, SYMBOL_SIZE } from '../game/constants';
	import CoinValue from './CoinValue.svelte';

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

	// Wild copies in flight from their board cell to the kraken's maw.
	// `size` is in WORLD units, not a texture scale factor: the symbol atlas is
	// tagged meta.scale so a raw `scale` would change meaning whenever the art is
	// re-exported at a different resolution (it already did once — 609 -> 121.8).
	const FLY_SIZE_FROM = SYMBOL_SIZE * 0.9516; // the wild at its board size
	const FLY_SIZE_TO = SYMBOL_SIZE * 0.333; // shrinks as it disappears into the maw
	type FlyingWild = { id: number; x: Tween<number>; y: Tween<number>; size: Tween<number> };
	let flying = $state<FlyingWild[]>([]);
	let flyId = 0;
	const MAW = { x: BOARD_SIZES.width / 2, y: SIT_Y - 40 };

	// Coins in flight, plus the running multiplier total shown above the kraken.
	type FlyingCoin = {
		id: number;
		multiplier: number;
		x: Tween<number>;
		y: Tween<number>;
		size: Tween<number>;
	};
	let flyingCoins = $state<FlyingCoin[]>([]);
	let coinTotal = $state(0);
	let coinTotalScale = new Tween(0, { duration: 220, easing: cubicOut });
	let coinTotalPos = new Tween({ x: MAW.x, y: MAW.y }, { duration: 500, easing: cubicIn });
	let showCoinTotal = $state(false);

	const COIN_SIZE_FROM = SYMBOL_SIZE * 0.987; // the coin at its board size
	const COIN_SIZE_TO = SYMBOL_SIZE * 0.35;

	const flyCoin = async (coin: { reel: number; row: number; multiplier: number }) => {
		const c: FlyingCoin = {
			id: flyId++,
			multiplier: coin.multiplier,
			x: new Tween(CELL_W * (coin.reel + REEL_PADDING), { duration: 420, easing: cubicOut }),
			y: new Tween((coin.row - 0.5) * CELL_H, { duration: 420, easing: cubicIn }),
			size: new Tween(COIN_SIZE_FROM, { duration: 420, easing: cubicIn }),
		};
		flyingCoins = [...flyingCoins, c];
		c.x.set(MAW.x);
		c.size.set(COIN_SIZE_TO);
		await c.y.set(MAW.y);
		flyingCoins = flyingCoins.filter((f) => f.id !== c.id);
		// impact: the kraken swallows it and the running total ticks up
		coinTotal += coin.multiplier;
		showCoinTotal = true;
		coinTotalScale.set(1.25, { duration: 120 });
		await coinTotalScale.set(1, { duration: 160 });
	};

	const flyWild = async (pos: { reel: number; row: number }, delay: number) => {
		await waitForTimeout(delay);
		const wild: FlyingWild = {
			id: flyId++,
			// x eases out, y eases in — a light upward arc into the maw
			x: new Tween(CELL_W * (pos.reel + REEL_PADDING), { duration: 550, easing: cubicOut }),
			y: new Tween((pos.row - 0.5) * CELL_H, { duration: 550, easing: cubicIn }),
			size: new Tween(FLY_SIZE_FROM, { duration: 550, easing: cubicIn }),
		};
		flying = [...flying, wild];
		// mode mutates from listeners while we await — read it through calls
		// so TS control flow doesn't over-narrow the comparisons
		const modeIs = (...ms: (typeof mode)[]) => ms.includes(mode);
		// the kraken notices the incoming wild: inhale + track it (0.55s =
		// flight time), holding the ready pose the gulp starts from
		if (modeIs('idle', 'tense')) mode = 'pregulp';
		wild.x.set(MAW.x);
		wild.size.set(FLY_SIZE_TO);
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
		coinCollect: async (emitterEvent) => {
			coinTotal = 0;
			coinTotalScale.set(0, { duration: 0 });
			coinTotalPos.set({ x: MAW.x, y: MAW.y }, { duration: 0 });
			const modeIs = (...ms: (typeof mode)[]) => ms.includes(mode);
			if (modeIs('idle', 'tense')) mode = 'pregulp';
			// coins arrive one after another so the total reads as it climbs
			for (const coin of emitterEvent.coins) {
				await flyCoin(coin);
				if (modeIs('idle', 'tense', 'pregulp')) mode = 'gulp';
			}
			await waitForTimeout(350);
			// the summed multiplier flies from the kraken toward the winbox
			coinTotalScale.set(1.5, { duration: 500 });
			await coinTotalPos.set({ x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 });
			showCoinTotal = false;
			coinTotal = 0;
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
			<!-- flying coins: the coin face with its multiplier riding along -->
			{#each flyingCoins as f (f.id)}
				{@const progress = (f.size.current - COIN_SIZE_TO) / (COIN_SIZE_FROM - COIN_SIZE_TO)}
				<Container x={f.x.current} y={f.y.current}>
					<Sprite key="c" anchor={0.5} width={f.size.current} height={f.size.current} />
					<!--
						The value does NOT shrink with the coin: it is drawn at exactly the size
						ReelSymbol uses on the board, so this copy renders identically to the one
						the player was just looking at.
						Why it has to be exact: coin-tickup's atlas carries BLACK in every
						partially transparent pixel (cinzel-bold-gold carries gold there, which is
						why win amounts never do this). Drawn below the board's ~1:1 scale, the
						sampling pulls that black in and the number goes dark — shrinking it even
						to 80% was still visibly black. Only the plate shrinks; the value fades
						out as the coin disappears into the maw, where the running total above the
						kraken takes over.
					-->
					<Container alpha={Math.min(1, Math.max(0, (progress - 0.5) / 0.3))}>
						<CoinValue multiplier={f.multiplier} size={SYMBOL_SIZE} />
					</Container>
				</Container>
			{/each}

			<!-- flying wilds render behind the kraken so they vanish into its maw -->
			{#each flying as f (f.id)}
				<Sprite
					key="w"
					anchor={0.5}
					x={f.x.current}
					y={f.y.current}
					width={f.size.current}
					height={f.size.current}
				/>
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

			<!-- running multiplier total above the kraken; flies to the winbox at the end -->
			{#if showCoinTotal}
				<Container
					x={coinTotalPos.current.x}
					y={coinTotalPos.current.y}
					scale={coinTotalScale.current}
					zIndex={50}
				>
					<ResponsiveBitmapText
						anchor={0.5}
						maxWidth={SYMBOL_SIZE * 2.4}
						text={`x${coinTotal}`}
						style={{
							fontFamily: 'coin-tickup',
							fontSize: SYMBOL_SIZE * 0.72,
							align: 'center',
							letterSpacing: 0,
						}}
					/>
				</Container>
			{/if}
		</Container>
	</Container>
</MainContainer>
