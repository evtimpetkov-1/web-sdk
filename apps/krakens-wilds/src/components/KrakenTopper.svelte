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
	import { Container, Sprite, SpineProvider, SpineTrack, ParticleEmitter } from 'pixi-svelte';
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
	const SIT_Y = -28; // sitting line: on the frame's top edge (frame sits +10)

	// Kraken enlarged relative to the board (which shrank 20% on
	// desktop/landscape). Desktop/tablet have headroom above the frame, so the
	// kraken gets an extra push there.
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const krakenBoost = $derived(
		layout === 'portrait' ? 1.6 : layout === 'landscape' ? 1.5 : 1.85,
	);
	// Portrait has spare headroom above the frame, so the resting kraken sits
	// larger there. Only the rest size differs — the attack always grows to the
	// full KRAKEN_WIDTH, identical on every layout.
	const IDLE_SCALE = $derived(layout === 'portrait' ? 0.6 : 0.5);

	// 'introTense': the one-shot stir as the loading screen hands over — same
	// animation as 'tense' but played ONCE, completing into the idle loop.
	let mode = $state<'idle' | 'tense' | 'introTense' | 'attack' | 'pregulp' | 'gulp'>('idle');
	let onReelsCovered = $state(() => {});
	const width = new Tween(KRAKEN_WIDTH * IDLE_SCALE, { duration: 450, easing: cubicOut });

	// Winning wilds burst into the kraken's dust (the same puff art as its
	// attack cloud) and the dust streams into its maw — no symbol copy flies.
	// Each collected wild gets its own stationary emitter at its cell, with the
	// spray DIRECTION aimed at the maw and speed/lifetime computed from the
	// distance so the puffs die right as they slide behind the kraken's head.
	type FlyingWild = { id: number; x: number; y: number; emit: boolean; config: object };
	let flying = $state<FlyingWild[]>([]);
	let flyId = 0;
	const MAW = { x: BOARD_SIZES.width / 2, y: SIT_Y - 40 };
	const FLY_MS = 480; // dust reaches the maw at about the old copy's pace
	// longer spawn window = a longer object: particles spawned later trail the
	// leaders by speed * dt, so the window length IS the stream's length
	const EMIT_MS = 340;

	// Coins in flight, plus the running multiplier total shown above the kraken.
	type FlyingCoin = {
		id: number;
		multiplier: number;
		x: Tween<number>;
		y: Tween<number>;
		size: Tween<number>;
	};
	let flyingCoins = $state<FlyingCoin[]>([]);
	// The running total sits below the maw rather than in it, so the coins disappear
	// into the kraken and the tally reads underneath instead of on top of them.
	const TOTAL_AT = { x: MAW.x, y: MAW.y + 58 };
	let coinTotal = $state(0);
	// what the player actually reads: it counts up to `coinTotal` instead of jumping,
	// so a x8 landing on a x14 tally is watched rather than just noticed afterwards
	const coinTotalShown = new Tween(0, { duration: 280, easing: cubicOut });
	let coinTotalScale = new Tween(0, { duration: 220, easing: cubicOut });
	let coinTotalPos = new Tween({ x: TOTAL_AT.x, y: TOTAL_AT.y }, { duration: 500, easing: cubicIn });
	let showCoinTotal = $state(false);
	/**
	 * SOUND — both of these moments were silent.
	 *
	 * The attack had no sound at all: `sfx_wild_explode` is the only percussive burst
	 * in the bank and is otherwise DEAD, since its only trigger is a `wildExplode`
	 * spine event that the v2 wild skeleton does not emit. It fires on the slam, not on
	 * the wind-up, hence the delay.
	 *
	 * The coins flew into the kraken in silence. The three scatter-stop pings are
	 * pitched to rise, so cycling them per swallow makes the tally sound like it is
	 * climbing rather than repeating; the run resets with each collection.
	 *
	 * Both are placeholders from the existing bank — swap the names here when the
	 * custom audio lands.
	 */
	const SFX_ATTACK = 'sfx_wild_explode';
	const SFX_ATTACK_DELAY = 700; // the slam lands ~0.85s into a ~1.55s wind-up
	const SFX_SWALLOW = ['sfx_scatter_stop_1', 'sfx_scatter_stop_2', 'sfx_scatter_stop_3'] as const;
	const SFX_TOTAL_HANDOVER = 'sfx_countup_end';
	let swallowIndex = 0;

	/**
	 * Bumped on every swallow to REPLAY the gulp. Setting `mode` alone cannot: it is
	 * already 'gulp' while the previous one runs, and the animation only restarts when
	 * its name changes. The gulp is 0.75s and coins arrive every ~0.70s, so the second
	 * coin onwards almost always landed mid-gulp and the kraken ignored it.
	 */
	let gulpNonce = $state(0);
	const swallow = () => {
		if (mode !== 'attack') mode = 'gulp';
		gulpNonce += 1;
		context.eventEmitter.broadcast({
			type: 'soundOnce',
			name: SFX_SWALLOW[swallowIndex % SFX_SWALLOW.length],
			forcePlay: true,
		});
		swallowIndex += 1;
	};

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
		// impact: the kraken reacts to THIS coin and the running total ticks up to its
		// new value while the tally punches
		swallow();
		coinTotal += coin.multiplier;
		coinTotalShown.set(coinTotal);
		showCoinTotal = true;
		coinTotalScale.set(1.25, { duration: 120 });
		await coinTotalScale.set(1, { duration: 160 });
	};

	const flyWild = async (pos: { reel: number; row: number }, delay: number) => {
		await waitForTimeout(delay);
		const x = CELL_W * (pos.reel + REEL_PADDING);
		const y = (pos.row - 0.5) * CELL_H;
		const dx = MAW.x - x;
		const dy = MAW.y - y;
		const dist = Math.hypot(dx, dy);
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
		const speed = dist / (FLY_MS / 1000);
		const wild: FlyingWild = {
			id: flyId++,
			x,
			y,
			emit: true,
			// WildLandDust's look (same puff art, lilac -> deep purple), deformed
			// into a LANCE: tight across the flight line (near-zero cone spread +
			// small spawn point + smaller puffs) and stretched along it (long
			// spawn window + wider speed jitter), so the object flies as a
			// narrow, elongated streak rather than a round cloud.
			// emitSpeed 0.001 = real time, see the note in WildLandDust.
			config: {
				alpha: { start: 1, end: 0.3 },
				scale: { start: 0.4, end: 0.22, minimumScaleMultiplier: 0.75 },
				color: { start: '#e2ccff', end: '#7a44cc' },
				speed: { start: speed * 1.1, end: speed * 0.9, minimumSpeedMultiplier: 0.86 },
				acceleration: { x: 0, y: 0 },
				maxSpeed: 0,
				startRotation: { min: angle - 2.5, max: angle + 2.5 },
				noRotation: false,
				rotationSpeed: { min: -60, max: 60 },
				lifetime: { min: (FLY_MS - 40) / 1000, max: (FLY_MS + 60) / 1000 },
				blendMode: 'normal',
				frequency: 0.004,
				emitterLifetime: -1,
				maxParticles: 30,
				pos: { x: 0, y: 0 },
				addAtBack: false,
				spawnType: 'circle',
				spawnCircle: { x: 0, y: 0, r: SYMBOL_SIZE * 0.08 },
			},
		};
		flying = [...flying, wild];
		// mutate through the $state proxy, not the raw object, or emit's flip
		// never reaches the emitter
		const tracked = flying[flying.length - 1];
		// mode mutates from listeners while we await — read it through calls
		// so TS control flow doesn't over-narrow the comparisons
		const modeIs = (...ms: (typeof mode)[]) => ms.includes(mode);
		// the kraken notices the incoming dust: inhale + track it, holding the
		// ready pose the gulp starts from
		if (modeIs('idle', 'tense')) mode = 'pregulp';
		waitForTimeout(EMIT_MS).then(() => (tracked.emit = false));
		await waitForTimeout(FLY_MS);
		// impact: swallow + count it (tier thresholds live on the idle name)
		context.stateGame.krakenCollects += 1;
		if (modeIs('idle', 'tense', 'pregulp')) mode = 'gulp';
		// the tail lives out its lifetime before the emitter unmounts
		await waitForTimeout(FLY_MS + 200);
		flying = flying.filter((f) => f.id !== wild.id);
	};

	context.eventEmitter.subscribeOnMount({
		krakenAttack: async () => {
			// A second attack can be requested while one is still mid-flight (the
			// FS-trigger attack + a fast first free spin). Same-name assignment
			// would NOT restart the animation, and its reelsCovered event may have
			// already fired before this new resolver existed — the await below
			// then hangs the book forever. Remount the track (gulpNonce) so the
			// attack replays from the top and reelsCovered is guaranteed to fire.
			if (mode === 'attack') gulpNonce += 1;
			mode = 'attack';
			width.set(KRAKEN_WIDTH); // grow while it rears up (wind-up is ~0.85s)
			waitForTimeout(SFX_ATTACK_DELAY).then(() =>
				context.eventEmitter.broadcast({ type: 'soundOnce', name: SFX_ATTACK, forcePlay: true }),
			);
			await waitForResolve((resolve) => (onReelsCovered = resolve));
		},
		krakenTense: (emitterEvent) => {
			if (mode !== 'attack') mode = emitterEvent.tense ? 'tense' : 'idle';
		},
		krakenCollect: (emitterEvent) => {
			emitterEvent.positions.forEach((pos, i) => flyWild(pos, i * 180));
		},
		coinCollect: async (emitterEvent) => {
			swallowIndex = 0; // the rising run starts again for each collection
			coinTotal = 0;
			coinTotalShown.set(0, { duration: 0 });
			coinTotalScale.set(0, { duration: 0 });
			coinTotalPos.set({ x: TOTAL_AT.x, y: TOTAL_AT.y }, { duration: 0 });
			if (mode === 'idle' || mode === 'tense') mode = 'pregulp';
			// coins arrive one after another so the total reads as it climbs; each one
			// is swallowed on impact inside flyCoin
			for (const coin of emitterEvent.coins) {
				await flyCoin(coin);
			}
			await waitForTimeout(350);
			// the summed multiplier flies from the kraken toward the winbox
			context.eventEmitter.broadcast({ type: 'soundOnce', name: SFX_TOTAL_HANDOVER });
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
		introTense: 'kraken_tense',
		attack: 'kraken_attack',
		pregulp: 'kraken_pregulp',
		gulp: 'kraken_gulp',
	} as const);

	// The kraken wakes with one tense as the loading screen hands over, then
	// settles into the idle loop (see the complete listener).
	let introPlayed = false;
	$effect(() => {
		if (!context.stateLayout.showLoadingScreen && !introPlayed) {
			introPlayed = true;
			if (mode === 'idle') mode = 'introTense';
		}
	});

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

	// IDLE_SCALE is layout-dependent, so re-target the width on rotation.
	// Never mid-attack: the attack owns the tween until its complete() handler
	// hands the resting size back.
	$effect(() => {
		if (mode !== 'attack') width.set(KRAKEN_WIDTH * IDLE_SCALE);
	});
</script>

<MainContainer label="KrakenTopperContainer">
	<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
		<Container x={bl.x - BOARD_SIZES.width / 2} y={bl.y - BOARD_SIZES.height / 2}>
			<!-- flying coins: the coin face with its multiplier riding along.
			     zIndex 60 keeps them ABOVE the kraken and the running total (50) for
			     their whole flight — mount order can't be trusted for stacking here,
			     since the kraken spine remounts on every gulp ({#key gulpNonce}). -->
			{#each flyingCoins as f (f.id)}
				{@const progress = (f.size.current - COIN_SIZE_TO) / (COIN_SIZE_FROM - COIN_SIZE_TO)}
				<Container x={f.x.current} y={f.y.current} zIndex={60}>
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

			<!-- collected wilds stream dust into the maw; rendered behind the
			     kraken so the puffs vanish into it rather than crossing its face -->
			{#each flying as f (f.id)}
				<Container x={f.x} y={f.y}>
					<ParticleEmitter
						config={f.config}
						key="dust"
						emit={f.emit}
						emitSpeed={0.001}
						spawnChance={f.emit ? 1 : 0}
					/>
				</Container>
			{/each}
			<SpineProvider
				key="kraken"
				x={BOARD_SIZES.width / 2}
				y={SIT_Y}
				width={width.current * krakenBoost}
			>
				<!--
					Keyed on `gulpNonce` so a swallow can REPLAY the gulp. The track only
					restarts when the animation NAME changes, and back-to-back coins arrive
					while it is already 'gulp' — remounting is what makes the kraken react to
					every coin instead of ignoring any that land mid-gulp.
				-->
				{#key gulpNonce}
				<SpineTrack
					trackIndex={0}
					animationName={ANIMATION_NAME[mode]}
					loop={mode !== 'attack' && mode !== 'gulp' && mode !== 'pregulp' && mode !== 'introTense'}
					listener={{
						event: (_, event) => {
							if (event.data?.name === 'reelsCovered') onReelsCovered();
						},
						complete: () => {
							if (mode === 'attack') {
								mode = 'idle';
								width.set(KRAKEN_WIDTH * IDLE_SCALE);
							} else if (mode === 'gulp' || mode === 'introTense') {
								mode = 'idle';
							}
							// pregulp: completes into its held ready pose — the
							// wild's impact flips it to gulp
						},
					}}
				/>
				{/key}
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
						maxWidth={SYMBOL_SIZE * 2.1}
						text={`x${Math.round(coinTotalShown.current)}`}
						style={{
							fontFamily: 'coin-tickup',
							fontSize: SYMBOL_SIZE * 0.62,
							align: 'center',
							letterSpacing: 0,
						}}
					/>
				</Container>
			{/if}
		</Container>
	</Container>
</MainContainer>
