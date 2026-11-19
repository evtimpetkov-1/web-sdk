<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SHAKE_PRESETS } from './SceneShake.svelte';
	import { FRAME_ART, PORTRAIT_DECK, SYMBOL_SIZE } from '../game/constants';
	import { DEVIL_ASPECT, DEVIL_FOOT, DEVIL_FRAMES } from '../game/ambientLife';

	/**
	 * What crosses the boardwalk IN FRONT of the reels, one thing at a time, every
	 * EVERY seconds (Evtim, 2026-11-13: "some tumble weed going from right to left
	 * or from left to right from time to time", "move the tumble weed in front of
	 * the slot", then "add some chicken also running in front of the slot"):
	 *  - a TUMBLEWEED blown across by a gust: it rolls without slipping (the turn
	 *    follows the distance), with small hops, its shadow under it;
	 *  - a HEN sprinting across, by day only (hens roost at night) and never two
	 *    crossings running: a six-frame run cycle, twice as fast as the weed;
	 *  - a DUST DEVIL (Evtim, 2026-11-16: "some small tornados"): a little whirlwind
	 *    that wanders across, weaving and leaning, six drawn frames of its spin.
	 * All raise DUST (Evtim: "it is going through dust in the wild west after
	 * all"): puffs are left on the ground where it passed, swell, lift a little
	 * and thin out behind it.
	 * Either way, left to right or right to left, along the frame's base: it covers
	 * the frame's bottom beam and the feet of the bottom row for the two or three
	 * seconds it takes to pass the reels. In portrait the reels stand on bare
	 * ground with nothing in front of them, so the lane drops below the frame
	 * (PORTRAIT_DROP): on the frame's base the weed looked hung on the beam. Main-layout units, so it keeps its place
	 * at the frame on every screen; drawn over the board layers and under the bar,
	 * the win titles and the popups (Game.svelte). Tinted for moonlight during
	 * Cash Respins. Driven by the Pixi ticker; none under prefers-reduced-motion.
	 */
	const context = getContext();

	// `?ambient=fast` (a look at it without the wait, like `?fps=true`): a crossing
	// every few seconds, weed and hen in turn
	const FAST = new URLSearchParams(window.location.search).get('ambient') === 'fast';
	// (2026-11-17, the review's "background is too static": a crossing every 16-30 s,
	// it was 26-48)
	const FIRST = FAST ? [1, 2] : [5, 9]; // s until the first crossing, then:
	const EVERY = FAST ? [2, 4] : [16, 30];
	const HEN_CHANCE = 0.3; // of the day's crossings
	const WEED = {
		size: 0.82, // its diameter, of a symbol cell
		speed: [2.3, 3.0], // diameters per second
		hop: { length: 2.6, height: 0.16 }, // of its diameter (0.28 kept it in the air: it drags along)
		// the dense pair and the loose pair (weed_c / weed_d, 2026-11-18: "one more
		// variation ... not so solid this time, like a loose circle-ish" one)
		keys: ['weed_a.png', 'weed_b.png', 'weed_c.png', 'weed_d.png'],
		// the dense pair is drawn a little see-through (Evtim, 2026-11-18: "can we do
		// 0.8 opacity to it, its very solid at the moment")
		denseAlpha: 0.8,
	};
	const DEVIL_CHANCE = 0.3; // of all crossings, never two running
	const DEVIL = {
		height: 1.3, // of a symbol cell
		speed: [1.25, 1.7], // heights per second
		fps: 9, // drawn frames a second ("on twos": it is a comic)
		weave: 0.45, // how unevenly it advances (0 = steadily; below 1 it never turns back)
		lean: 0.09, // radians it sways about its foot
	};
	const HEN = {
		height: 0.8, // of a symbol cell (the frame canvas, wings up)
		aspect: 204 / 200, // the frame canvas
		speed: [5.2, 6.2], // heights per second
		fps: 14,
		frames: 6,
	};
	// frame.webp: the row its bottom beam ends on (the frame stands there), a
	// little past it so the crossing passes in front of the beam, not on it
	const FRAME_BASE = 850 / FRAME_ART.height;
	// portrait: how far under the frame's base the ground line is, of a symbol cell.
	// The plank deck (BarStrip `deck`) starts right under the frame and is drawn over
	// this layer, so with it the crossing runs along the deck's top rail (0.08); with
	// the see-through shade (PortraitShade, drawn UNDER this layer) it keeps its lane
	// on the ground (0.62) and passes over the shading, behind the buttons
	const PORTRAIT_DROP = PORTRAIT_DECK === 'planks' ? 0.08 : 0.62;
	// dust: a puff every STEP of travel (of the crosser's size), living LIFE seconds
	// (uneven: the next puff rises after 0.6 to 1.4 steps, or they line up like beads)
	const DUST = { step: 0.5, life: 1.7, max: 16 };
	// a quake's dust: at most this many puffs alive at once
	const QUAKE_DUST = { max: 26 };
	const NIGHT_TINT = 0x6f7fae;
	const between = ([min, max]: number[]) => min + Math.random() * (max - min);

	const night = $derived(context.stateGame.gameType === 'freegame');
	const lane = $derived.by(() => {
		const main = context.stateLayoutDerived.mainLayout();
		const canvas = context.stateLayoutDerived.canvasSizes();
		const board = context.stateGameDerived.boardLayout();
		const frame = context.stateGameDerived.frameLayout();
		// the canvas in main units: a crossing enters and leaves at its edges
		const visibleWidth = canvas.width / main.scale;
		const cell = SYMBOL_SIZE * board.scale;
		const portrait = context.stateLayoutDerived.layoutType() === 'portrait';
		return {
			left: (main.width - visibleWidth) / 2,
			width: visibleWidth,
			cell,
			ground: frame.y + frame.height * (FRAME_BASE - 0.5) + (portrait ? cell * PORTRAIT_DROP : 0),
		};
	});

	let time = $state(0);
	type Crossing = {
		kind: 'weed' | 'hen' | 'devil';
		start: number;
		direction: 1 | -1;
		speed: number;
		key: string;
		phase: number;
	};
	let crossing = $state<Crossing>();
	let next = between(FIRST);
	// the dust left behind: each puff stays where it rose (its look is a function of its age)
	type Puff = { id: number; x: number; born: number; size: number; drift: number; turn: number; lift: number };
	let puffs = $state<Puff[]>([]);
	let puffId = 0;
	let dustedAt = 0; // the crossing's distance at the last puff
	let dustGap = 1; // steps until the next one
	let lastKind: Crossing['kind'] = 'hen'; // so the first one is a tumbleweed
	let ticking = false; // the clock runs (not under prefers-reduced-motion): puffs age

	// what crosses next: mostly a tumbleweed; never the same guest twice running. The
	// fast preview takes them in turn
	const pickKind = (): Crossing['kind'] => {
		if (FAST) return lastKind === 'weed' ? 'devil' : lastKind === 'devil' && !night ? 'hen' : 'weed';
		const roll = Math.random();
		if (lastKind !== 'devil' && roll < DEVIL_CHANCE) return 'devil';
		if (!night && lastKind !== 'hen' && roll < DEVIL_CHANCE + HEN_CHANCE) return 'hen';
		return 'weed';
	};

	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		ticking = true;
		const tick = () => {
			time += app.ticker.deltaMS / 1000;
			raiseDust();
			if (crossing || time < next) return;
			dustedAt = 0;
			lastKind = pickKind();
			crossing = {
				kind: lastKind,
				start: time,
				direction: Math.random() < 0.5 ? 1 : -1,
				speed: between(lastKind === 'hen' ? HEN.speed : lastKind === 'devil' ? DEVIL.speed : WEED.speed),
				key: WEED.keys[Math.floor(Math.random() * WEED.keys.length)],
				phase: Math.random() * 6,
			};
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	// a strong quake (a bomb, the cloners' burst, the feature's trigger, the big-win
	// titles) throws dust up off the ground along the reels' base and out to the
	// sides, the street's answer to Blast Shaft's dust falling from the mine's roof
	// (Evtim 2026-11-16: the same earthshake behaviour as the blast game)
	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const { trauma = 0 } = SHAKE_PRESETS[preset] as { trauma?: number };
			if (!ticking || trauma < 0.5) return;
			const live = puffs.filter((puff) => time - puff.born < DUST.life);
			const count = Math.min(QUAKE_DUST.max - Math.min(live.length, QUAKE_DUST.max), Math.round(4 + 8 * trauma));
			puffs = [
				...live,
				...Array.from({ length: count }, (_, i) => {
					const side = i % 2 ? 1 : -1;
					return {
						id: puffId++,
						x: lane.left + lane.width * (0.5 + side * (0.04 + 0.46 * Math.random())),
						born: time + Math.random() * 0.12,
						size: lane.cell * (0.9 + Math.random() * 1.1) * (0.7 + 0.5 * trauma),
						lift: 0.35 + Math.random() * 0.6,
						drift: side * (0.15 + Math.random() * 0.35),
						turn: (Math.random() - 0.5) * 1.6,
					};
				}),
			];
		},
	});

	// a puff where the crosser touches the ground, every DUST.step of its size
	// travelled; the spent ones go with the next that rises
	const raiseDust = () => {
		const mover = weed ?? hen ?? devil;
		if (!mover || !crossing) return;
		const size = 'size' in mover ? mover.size : mover.height;
		if (mover.distance - dustedAt < size * DUST.step * dustGap) return;
		dustedAt = mover.distance;
		dustGap = 0.6 + Math.random() * 0.8;
		const live = puffs.filter((puff) => time - puff.born < DUST.life);
		if (live.length >= DUST.max) return;
		puffs = [
			...live,
			{
				id: puffId++,
				// a little behind it, where it just was
				x: mover.x - crossing.direction * size * 0.35,
				born: time,
				size: size * (0.6 + Math.random() * 0.85) * ('size' in mover ? 1 : 0.65),
				lift: 0.2 + Math.random() * 0.4,
				drift: -crossing.direction * (0.25 + Math.random() * 0.3),
				turn: (Math.random() - 0.5) * 1.6,
			},
		];
	};
	// a puff's look at its age: a billow that swells, rises off the ground, drifts
	// back and thins out (each one separate: laid closer they merge into a streak)
	const puffAt = (puff: Puff) => {
		const u = Math.min(1, Math.max(0, (time - puff.born) / DUST.life));
		const grown = puff.size * (0.85 + 1.0 * u ** 0.6);
		return {
			x: puff.x + puff.drift * puff.size * u,
			y: lane.ground - grown * 0.28 - puff.size * puff.lift * u,
			size: grown,
			rotation: puff.turn * (1 + u),
			alpha: (night ? 0.4 : 0.8) * Math.min(1, u / 0.1) * (1 - u),
		};
	};

	// where it is: from just off one edge of the screen to just off the other
	const at = (distance: number, size: number, direction: 1 | -1) =>
		direction === 1 ? lane.left - size + distance : lane.left + lane.width + size - distance;

	const weed = $derived.by(() => {
		if (crossing?.kind !== 'weed') return undefined;
		const size = lane.cell * WEED.size;
		const t = time - crossing.start;
		// the gust breathes, so the pace is uneven
		const distance =
			crossing.speed * size * (t + 0.22 * Math.sin(1.3 * t + crossing.phase) - 0.22 * Math.sin(crossing.phase));
		if (distance > lane.width + size * 2) return undefined;
		const hop = Math.abs(Math.sin((Math.PI * distance) / (WEED.hop.length * size) + crossing.phase));
		return {
			key: crossing.key,
			direction: crossing.direction,
			distance,
			x: at(distance, size, crossing.direction),
			lift: hop * WEED.hop.height * size,
			// rolling without slipping: one turn per circumference
			rotation: (crossing.direction * distance) / (size / 2),
			size,
		};
	});

	const hen = $derived.by(() => {
		if (crossing?.kind !== 'hen') return undefined;
		const height = lane.cell * HEN.height;
		const width = height * HEN.aspect;
		const t = time - crossing.start;
		const distance = crossing.speed * height * t;
		if (distance > lane.width + width * 2) return undefined;
		const step = t * HEN.fps;
		return {
			key: `hen_${Math.floor(step) % HEN.frames}.png`,
			direction: crossing.direction,
			distance,
			x: at(distance, width, crossing.direction),
			// two footfalls a cycle: a small bob on top of the frames' own
			bob: Math.abs(Math.sin((Math.PI * step) / (HEN.frames / 2))) * height * 0.03,
			width,
			height,
		};
	});

	const devil = $derived.by(() => {
		if (crossing?.kind !== 'devil') return undefined;
		const height = lane.cell * DEVIL.height;
		const width = height * DEVIL_ASPECT;
		const t = time - crossing.start;
		// it wanders: it hurries, lingers, hurries on (never back)
		const distance =
			crossing.speed *
			height *
			(t + DEVIL.weave * (Math.sin(1.1 * t + crossing.phase) - Math.sin(crossing.phase)) / 1.1);
		if (distance > lane.width + width * 2) return undefined;
		const sway = Math.sin(2.4 * t + crossing.phase) + 0.5 * Math.sin(5.1 * t + 2 * crossing.phase);
		return {
			key: `devil_${Math.floor(t * DEVIL.fps) % DEVIL_FRAMES}.png`,
			direction: crossing.direction,
			distance,
			x: at(distance, width, crossing.direction),
			// it leans into its way and sways about its foot, and breathes a little
			rotation: crossing.direction * 0.05 + DEVIL.lean * 0.66 * sway,
			stretch: 1 + 0.04 * Math.sin(3.3 * t + crossing.phase),
			width,
			height,
		};
	});

	// the crossing is over once it has left the screen: the next is some way off
	$effect(() => {
		if (crossing && !weed && !hen && !devil) {
			crossing = undefined;
			next = time + between(EVERY);
		}
	});
</script>

<!-- the container stays mounted: pixi-svelte appends a (re)mounted child at the
     end of its parent, and a MainContainer mounted with each crossing would land
     over the bar and the popups -->
<MainContainer>
	<!-- the dust it leaves on the ground, behind and under it -->
	{#each puffs as puff (puff.id)}
		{@const look = puffAt(puff)}
		<Sprite
			key="puff.png"
			anchor={0.5}
			x={look.x}
			y={look.y}
			width={look.size}
			height={look.size}
			rotation={look.rotation}
			alpha={look.alpha}
			tint={night ? NIGHT_TINT : 0xffffff}
		/>
	{/each}
	{#if weed}
		<!-- its shadow stays on the ground and thins as it hops -->
		<Sprite
			key="blob.png"
			anchor={0.5}
			x={weed.x}
			y={lane.ground - weed.size * 0.03}
			width={weed.size * (1.05 - weed.lift / (weed.size * 1.6))}
			height={weed.size * 0.2}
			alpha={0.46 - weed.lift / (weed.size * 1.1)}
			tint={0x000000}
		/>
		<Sprite
			key={weed.key}
			anchor={0.5}
			x={weed.x}
			y={lane.ground - weed.size / 2 - weed.lift}
			width={weed.size}
			height={weed.size}
			rotation={weed.rotation}
			alpha={weed.key === 'weed_a.png' || weed.key === 'weed_b.png' ? WEED.denseAlpha : 1}
			tint={night ? NIGHT_TINT : 0xffffff}
		/>
	{/if}
	{#if devil}
		<Sprite
			key="blob.png"
			anchor={0.5}
			x={devil.x}
			y={lane.ground - devil.height * 0.015}
			width={devil.width * 0.7}
			height={devil.height * 0.1}
			alpha={0.36}
			tint={0x000000}
		/>
		<!-- it stands on its foot: it sways and stretches from there -->
		<Container x={devil.x} y={lane.ground} rotation={devil.rotation} scale={{ x: 1 / devil.stretch, y: devil.stretch }}>
			<Sprite
				key={devil.key}
				anchor={{ x: DEVIL_FOOT, y: 1 }}
				width={devil.width}
				height={devil.height}
				alpha={0.95}
				tint={night ? NIGHT_TINT : 0xffffff}
			/>
		</Container>
	{/if}
	{#if hen}
		<!-- her shadow -->
		<Sprite
			key="blob.png"
			anchor={0.5}
			x={hen.x - hen.direction * hen.width * 0.05}
			y={lane.ground - hen.height * 0.02}
			width={hen.width * 0.72}
			height={hen.height * 0.16}
			alpha={0.42}
			tint={0x000000}
		/>
		<!-- the frames face right: mirrored for a run to the left -->
		<Container x={hen.x} y={lane.ground - hen.bob} scale={{ x: hen.direction, y: 1 }}>
			<Sprite key={hen.key} anchor={{ x: 0.5, y: 1 }} width={hen.width} height={hen.height} />
		</Container>
	{/if}
</MainContainer>
