<script lang="ts" module>
	/**
	 * Where things can wander in one background, in that ART's own pixels. A point is
	 * where the thing touches the ground (its foot).
	 * `zones`: bands of ground, far to near. An `open` band runs the whole width of
	 * the art: something can roll in over its left or right edge. A band that is not
	 * open (the far street between the buildings) has nothing to enter over: what
	 * moves there forms or fades in the distance.
	 * `depth`: the foot rows at which things are their smallest and their largest;
	 * `weed` / `devil` / `hen`: a tumbleweed's diameter, a dust devil's height and a
	 * hen's height at those rows.
	 * The units are the parent's: the art's pixels behind the reels (Ambient), main-layout
	 * units in front of them (GroundRoamers).
	 */
	export type RoamScene = {
		zones: { y: [number, number]; x: [number, number]; open: boolean; weight: number }[];
		depth: [number, number];
		weed: [number, number];
		devil: [number, number];
		hen: [number, number];
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { reducedMotion, windNow } from '../game/wind';
	import { DEVIL_ASPECT, DEVIL_FOOT, DEVIL_FRAMES } from '../game/ambientLife';

	/**
	 * What wanders the ground BEHIND the reels (Evtim, 2026-11-18: "behind the slot we
	 * can also add some smaller thumble weeds and tornados going in random directions,
	 * not in 1 line path as we do now in front of the slot").
	 *
	 * Small tumbleweeds and small dust devils, each on its OWN curved way across the
	 * ground of the painting: slanting over the boardwalk from one side to the other,
	 * coming up the street out of the distance and rolling off to a side (growing as
	 * it nears), or the other way and shrinking into the distance. A dust devil forms
	 * somewhere, drifts a bent path and thins out again. Never two the same way.
	 * And, the same day ("maybe the chicken can also run in random directions behind
	 * the reel, it should simulate 3d effect which means to scale it down when it is
	 * going further away"), by day a HEN now and then: she sprints the same kind of
	 * way, and shrinks as she runs off up the street.
	 *
	 * ON A PHONE the reels span the screen and nothing behind them shows ("on portrait
	 * we are not seeing anything behind the reels, so the effects should be in front of
	 * the reels below it"): there the same component is mounted IN FRONT, over the
	 * ground under the reels (GroundRoamers.svelte), and Ambient's copy is switched off.
	 *
	 * Depth is read off the painting: the lower a foot stands the nearer and larger
	 * the thing is, and the faster it covers ground. The reel frame is drawn over this
	 * layer, so they pass behind it; on a wide screen much of the ground is behind the
	 * reels and they are seen at its sides, coming out from behind the frame or going in.
	 *
	 * The wind (game/wind.ts) drives them like everything else in the street: in a gust
	 * more of them set off and they travel faster. Mounted inside Ambient's container,
	 * so it draws in the art's pixels under the art's cover transform. Sprites: the
	 * dense tumbleweeds (dgAmbient), the loose ones (dgRoam), the dust devil's six frames
	 * (dgLife). Driven by the Pixi ticker; none under prefers-reduced-motion.
	 * `?ambient=fast` sends them off every second or two.
	 */
	type Props = {
		scene: RoamScene;
		/** the edges an open band is entered over: the art's sides, or the screen's */
		left: number;
		right: number;
		night: boolean;
		active: boolean;
	};
	const props: Props = $props();
	const context = getContext();

	const FAST = new URLSearchParams(window.location.search).get('ambient') === 'fast';
	// seconds between two setting off, in a middling wind; fewer in a lull, more in a gust
	const EVERY = FAST ? [0.8, 1.8] : [3.5, 8];
	const MAX = { weed: 3, devil: 1, hen: 1 };
	const DEVIL_CHANCE = 0.3; // of the times something sets off and no devil is about
	const HEN_CHANCE = 0.25; // by day, and no hen about
	const HEN = { speed: [3.6, 4.8], fps: 14, frames: 6, aspect: 204 / 200 }; // heights per second
	const DENSE_ALPHA = 0.8; // weed_a / weed_b: "0.8 opacity ... its very solid"
	// the loose pair and the dense pair alike: small and far off, a loose one is a
	// faint ring of twigs, a dense one a clear ball
	const WEEDS = ['weed_a.png', 'weed_b.png', 'weed_c.png', 'weed_d.png'];
	// (2026-11-18: "the thumbleweed should be faster, at the moment we have some which
	// are very slow": they went 1.3-2.1 diameters a second, down to half of that in a
	// lull, and the far ones crawled because a small diameter is few pixels)
	const WEED = {
		speed: [2.3, 3.3], // diameters per second in a middling wind
		hop: { length: 2.6, height: 0.14 }, // of its diameter
	};
	const DEVIL = {
		speed: [0.3, 0.55], // heights per second
		fps: 9,
		lean: 0.08,
		reach: [1.8, 4], // near-row heights between where it forms and where it thins out (less far off)
	};
	const FADE = 0.7; // seconds to come out of / go into the distance
	const NIGHT_TINT = 0x6f7fae;
	const between = ([min, max]: readonly number[]) => min + Math.random() * (max - min);
	const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

	type Point = { x: number; y: number };
	type Roamer = {
		id: number;
		kind: 'weed' | 'devil' | 'hen';
		key: string;
		// a quadratic curve: from, bent towards, to
		path: [Point, Point, Point];
		t: number; // 0..1 along it
		travelled: number; // art px
		age: number;
		speed: number; // sizes per second
		turn: number; // a weed's rotation
		phase: number;
		fadeIn: boolean;
		fadeOut: boolean;
	};
	type View = {
		id: number;
		kind: 'weed' | 'devil' | 'hen';
		key: string;
		x: number;
		y: number; // the foot
		flip: number;
		size: number;
		lift: number;
		rotation: number;
		stretch: number;
		alpha: number;
	};

	let views = $state<View[]>([]);
	const roamers: Roamer[] = [];
	let nextId = 0;
	let time = 0;
	let next = FAST ? 0.5 : between([1.5, 4]);

	// how near a foot row is: 0 at the far row, 1 at the near one
	const nearness = (y: number) =>
		Math.min(1, Math.max(0, (y - props.scene.depth[0]) / (props.scene.depth[1] - props.scene.depth[0])));
	const sizeAt = (kind: Roamer['kind'], y: number) => {
		const [far, near] = props.scene[kind];
		return lerp(far, near, nearness(y));
	};
	const pickZone = (zones: RoamScene['zones']) => {
		let roll = Math.random() * zones.reduce((sum, zone) => sum + zone.weight, 0);
		return zones.find((zone) => (roll -= zone.weight) < 0) ?? zones[zones.length - 1];
	};
	const inside = (zone: RoamScene['zones'][number], inset = 0): Point => ({
		x: lerp(zone.x[0] + inset, zone.x[1] - inset, Math.random()),
		y: between(zone.y),
	});
	// over the edge of an open band, far enough out that the whole thing is off the art
	const offEdge = (zone: RoamScene['zones'][number], side: -1 | 1, size: number): Point => ({
		x: side < 0 ? props.left - size : props.right + size,
		y: between(zone.y),
	});

	// a tumbleweed or a hen: something that comes in over an edge or out of the distance
	const newRunner = (kind: 'weed' | 'hen'): Roamer | undefined => {
		const open = props.scene.zones.filter((zone) => zone.open);
		const closed = props.scene.zones.filter((zone) => !zone.open);
		if (!open.length) return undefined;
		const side = Math.random() < 0.5 ? -1 : 1;
		const roll = Math.random();
		let path: Roamer['path'];
		let fadeIn = false;
		let fadeOut = false;
		if (closed.length && roll < 0.4) {
			// between the far street and a side of the nearest open band: out of the
			// distance and off to a side, or in from a side and away up the street
			const street = closed[0];
			const band = open[0];
			const far = inside(street, 90);
			far.y = lerp(street.y[0], street.y[1], Math.random() * 0.4);
			// the bend stays between the buildings, so the way down the street does too
			const bend = { x: lerp(street.x[0] + 60, street.x[1] - 60, Math.random()), y: between(band.y) };
			const edge = offEdge(band, side, sizeAt(kind, band.y[1]) * 1.2);
			if (roll < 0.24) {
				path = [far, bend, edge];
				fadeIn = true;
			} else {
				path = [edge, bend, far];
				fadeOut = true;
			}
		} else {
			// slanting across an open band, side to side, bent on the way
			const band = pickZone(open);
			const size = sizeAt(kind, band.y[1]) * 1.2;
			path = [
				offEdge(band, side, size),
				{ x: lerp(props.left, props.right, between([0.25, 0.75])), y: between(band.y) },
				offEdge(band, side < 0 ? 1 : -1, size),
			];
		}
		return {
			id: nextId++,
			kind,
			key: kind === 'weed' ? WEEDS[Math.floor(Math.random() * WEEDS.length)] : '',
			path,
			t: 0,
			travelled: 0,
			age: 0,
			speed: between(kind === 'weed' ? WEED.speed : HEN.speed),
			turn: Math.random() * 6.28,
			phase: Math.random() * 6.28,
			fadeIn,
			fadeOut,
		};
	};

	const newDevil = (): Roamer => {
		const zone = pickZone(props.scene.zones);
		const from = inside(zone, 40);
		// it drifts a bent way and stays in its band
		const reach =
			between(DEVIL.reach) * props.scene.devil[1] * (0.35 + 0.65 * nearness(from.y)) * (Math.random() < 0.5 ? -1 : 1);
		const clampX = (x: number) => Math.min(zone.x[1] - 30, Math.max(zone.x[0] + 30, x));
		const to = { x: clampX(from.x + reach), y: between(zone.y) };
		const bend = { x: clampX((from.x + to.x) / 2 + between([-0.4, 0.4]) * reach), y: between(zone.y) };
		return {
			id: nextId++,
			kind: 'devil',
			key: '',
			path: [from, bend, to],
			t: 0,
			travelled: 0,
			age: 0,
			speed: between(DEVIL.speed),
			turn: 0,
			phase: Math.random() * 6.28,
			fadeIn: true,
			fadeOut: true,
		};
	};

	const at = ([a, b, c]: Roamer['path'], t: number): Point => ({
		x: (1 - t) ** 2 * a.x + 2 * t * (1 - t) * b.x + t ** 2 * c.x,
		y: (1 - t) ** 2 * a.y + 2 * t * (1 - t) * b.y + t ** 2 * c.y,
	});
	const paceAt = ([a, b, c]: Roamer['path'], t: number) =>
		Math.hypot(2 * (1 - t) * (b.x - a.x) + 2 * t * (c.x - b.x), 2 * (1 - t) * (b.y - a.y) + 2 * t * (c.y - b.y));

	const step = (roamer: Roamer, dt: number, gust: number): View | undefined => {
		const here = at(roamer.path, roamer.t);
		const size = sizeAt(roamer.kind, here.y);
		// a weed goes as the wind blows (never slowly); a hen runs her own pace; a dust
		// devil keeps its own slow one, a little uneven
		const pace =
			roamer.kind === 'weed'
				? 0.8 + 0.7 * gust
				: roamer.kind === 'hen'
					? 1
					: 0.75 + 0.35 * gust + 0.3 * Math.sin(1.1 * roamer.age + roamer.phase);
		// what covers ground is measured against a size half way to the near one: by
		// its own small size a far tumbleweed or hen crawled
		const stride = roamer.kind === 'devil' ? size : lerp(size, props.scene[roamer.kind][1], 0.5);
		const moved = roamer.speed * stride * pace * dt;
		const before = here.x;
		roamer.t += moved / Math.max(1, paceAt(roamer.path, roamer.t));
		roamer.travelled += moved;
		roamer.age += dt;
		if (roamer.t >= 1) return undefined;
		const point = at(roamer.path, roamer.t);
		// what is left of the way, roughly (for going out into the distance)
		const left = (1 - roamer.t) * paceAt(roamer.path, roamer.t);
		const alpha = Math.min(
			1,
			roamer.fadeIn ? roamer.age / FADE : 1,
			roamer.fadeOut ? left / (size * (roamer.kind === 'devil' ? 0.9 : 1.4)) : 1,
		);
		if (roamer.kind === 'hen') {
			const step = roamer.age * HEN.fps;
			return {
				id: roamer.id,
				kind: 'hen',
				key: `hen_${Math.floor(step) % HEN.frames}.png`,
				x: point.x,
				y: point.y,
				// the frames face right
				flip: point.x >= before ? 1 : -1,
				size,
				lift: Math.abs(Math.sin((Math.PI * step) / (HEN.frames / 2))) * size * 0.03,
				rotation: 0,
				stretch: 1,
				alpha,
			};
		}
		if (roamer.kind === 'weed') {
			// rolling without slipping, whichever way it heads
			roamer.turn += (Math.sign(point.x - before) * moved) / (size / 2);
			return {
				id: roamer.id,
				kind: 'weed',
				key: roamer.key,
				x: point.x,
				y: point.y,
				flip: 1,
				size,
				lift:
					Math.abs(Math.sin((Math.PI * roamer.travelled) / (WEED.hop.length * size) + roamer.phase)) *
					WEED.hop.height *
					size,
				rotation: roamer.turn,
				stretch: 1,
				alpha: alpha * (roamer.key === 'weed_a.png' || roamer.key === 'weed_b.png' ? DENSE_ALPHA : 1),
			};
		}
		const sway = Math.sin(2.4 * roamer.age + roamer.phase) + 0.5 * Math.sin(5.1 * roamer.age + 2 * roamer.phase);
		return {
			id: roamer.id,
			kind: 'devil',
			key: `devil_${Math.floor(roamer.age * DEVIL.fps) % DEVIL_FRAMES}.png`,
			x: point.x,
			y: point.y,
			flip: 1,
			// it grows as it forms
			size: size * Math.min(1, 0.55 + (0.45 * roamer.age) / FADE),
			lift: 0,
			rotation: DEVIL.lean * 0.66 * sway,
			stretch: 1 + 0.04 * Math.sin(3.3 * roamer.age + roamer.phase),
			alpha: alpha * 0.9,
		};
	};

	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || reducedMotion()) return;
		const tick = () => {
			if (!props.active) return;
			// a stalled tab comes back with one long frame: nothing jumps
			const dt = Math.min(0.1, app.ticker.deltaMS / 1000);
			time += dt;
			const gust = windNow();
			if (time >= next) {
				const count = (kind: Roamer['kind']) => roamers.filter((roamer) => roamer.kind === kind).length;
				const roll = Math.random();
				let fresh: Roamer | undefined;
				if (count('devil') < MAX.devil && roll < DEVIL_CHANCE) fresh = newDevil();
				// hens roost at night
				else if (!props.night && count('hen') < MAX.hen && roll < DEVIL_CHANCE + HEN_CHANCE) fresh = newRunner('hen');
				else if (count('weed') < MAX.weed) fresh = newRunner('weed');
				if (fresh) roamers.push(fresh);
				next = time + between(EVERY) * (1.35 - 0.7 * gust);
			}
			const seen: View[] = [];
			for (let i = roamers.length - 1; i >= 0; i--) {
				const view = step(roamers[i], dt, gust);
				if (view) seen.push(view);
				else roamers.splice(i, 1);
			}
			// in the order they set off (a keyed list that changed its order every frame
			// would be re-mounted for nothing; two of them seldom overlap)
			views = seen.reverse();
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	const tint = $derived(props.night ? NIGHT_TINT : 0xffffff);
</script>

<!-- a container of their own that stays mounted: pixi-svelte appends a newly mounted
     child at the end of its parent, which would put a new roamer over whatever
     Ambient draws after this -->
<Container>
	{#each views as view (view.id)}
		{#if view.kind === 'weed'}
			<Sprite
				key="blob.png"
				anchor={0.5}
				x={view.x}
				y={view.y - view.size * 0.03}
				width={view.size * (1.0 - view.lift / (view.size * 1.6))}
				height={view.size * 0.2}
				alpha={(0.34 - view.lift / (view.size * 1.4)) * view.alpha}
				tint={0x000000}
			/>
			<Sprite
				key={view.key}
				anchor={0.5}
				x={view.x}
				y={view.y - view.size / 2 - view.lift}
				width={view.size}
				height={view.size}
				rotation={view.rotation}
				alpha={view.alpha}
				{tint}
			/>
		{:else if view.kind === 'hen'}
			<Sprite
				key="blob.png"
				anchor={0.5}
				x={view.x}
				y={view.y - view.size * 0.02}
				width={view.size * HEN.aspect * 0.72}
				height={view.size * 0.16}
				alpha={0.38 * view.alpha}
				tint={0x000000}
			/>
			<Container x={view.x} y={view.y - view.lift} scale={{ x: view.flip, y: 1 }}>
				<Sprite key={view.key} anchor={{ x: 0.5, y: 1 }} width={view.size * HEN.aspect} height={view.size} alpha={view.alpha} />
			</Container>
		{:else}
			<Sprite
				key="blob.png"
				anchor={0.5}
				x={view.x}
				y={view.y - view.size * 0.015}
				width={view.size * DEVIL_ASPECT * 0.7}
				height={view.size * 0.1}
				alpha={0.3 * view.alpha}
				tint={0x000000}
			/>
			<!-- it stands on its foot: it sways and stretches from there -->
			<Container x={view.x} y={view.y} rotation={view.rotation} scale={{ x: 1 / view.stretch, y: view.stretch }}>
				<Sprite
					key={view.key}
					anchor={{ x: DEVIL_FOOT, y: 1 }}
					width={view.size * DEVIL_ASPECT}
					height={view.size}
					alpha={view.alpha}
					{tint}
				/>
			</Container>
		{/if}
	{/each}
</Container>
