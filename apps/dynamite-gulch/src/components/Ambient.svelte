<script lang="ts" module>
	import { HOUSE_LANTERNS, type HouseLantern } from '../game/houseLanterns';
	import { MILLS } from '../game/ambientLife';
	import { DOORS } from '../game/windLife';
	import type { RoamScene } from './Roamers.svelte';

	/**
	 * What moves in each background, in that ART's own pixels (Background lays this
	 * layer over the art with the art's cover transform, so it follows any screen).
	 * Clouds: where each starts, its width, its own height over its width, and its
	 * drift in art px per second in a middling wind (2026-11-17: fast enough to SEE,
	 * a crossing takes a minute or two, and three of them at three depths: the far
	 * one small, high and slow). `occluders`: pieces of the art drawn again OVER
	 * the clouds, at their own place: the building tops a cloud passes behind (cut
	 * out by art-review/dynamite-gulch/build_ambient.py, same rects). Night only:
	 * the stars that twinkle and the two porch lanterns that flicker.
	 * `mill`: the windmill whose fan turns (game/ambientLife.ts). `soarers`: birds of
	 * prey wheeling high up, each on its own flat circle (centre, radii, wingspan,
	 * seconds a round, which way). `flock`: the band of sky a flock of small birds
	 * crosses now and then, and a bird's width. Birds are drawn UNDER the occluders:
	 * they pass behind the buildings like the clouds.
	 * `doors`: the saloon's batwing doors (game/windLife.ts): the doorway is drawn over
	 * the painted doors, then the two leaves, each swung about its hinge.
	 * `roam`: the ground small tumbleweeds and dust devils wander, behind the reels
	 * (Roamers.svelte): the far street between the buildings and the bands in front of
	 * them, read off each painting.
	 */
	export type AmbientScene = {
		width: number;
		height: number;
		night: boolean;
		clouds: { key: string; x: number; y: number; width: number; aspect: number; speed: number }[];
		/** the clouds' colour (the night's are the painting's slate blue) */
		cloudTint?: number;
		occluders: { key: string; x: number; y: number; width: number; height: number }[];
		stars: { x: number; y: number; size: number }[];
		lanterns: { x: number; y: number; size: number }[];
		/** the frame's lanterns hung on the houses (desktop / landscape): HouseLanterns */
		houseLanterns?: HouseLantern[];
		mill?: (typeof MILLS)[keyof typeof MILLS];
		soarers: { x: number; y: number; rx: number; ry: number; size: number; period: number; turn: 1 | -1; phase: number }[];
		flock?: { y: [number, number]; size: [number, number] };
		doors?: (typeof DOORS)[keyof typeof DOORS];
		roam?: RoamScene;
	};

	// The street by day and at night is one drawing. The sand between the saloon's
	// porch (x < 430) and the shed's (x > 1490), from in front of the windmill's and
	// the water tower's feet (y 775) down to the boardwalk; then the boardwalk's
	// planks (y 905..1110), which run the whole width in front of both buildings.
	const STREET_ROAM: RoamScene = {
		zones: [
			{ y: [782, 888], x: [455, 1465], open: false, weight: 1 },
			{ y: [928, 1092], x: [0, 1920], open: true, weight: 3 },
		],
		depth: [782, 1092],
		weed: [32, 96],
		devil: [60, 160],
		hen: [34, 104],
	};

	// each cloud sprite's height over its width (ambient.json: 640 x 158 / 209 / 229).
	// They were all drawn at 0.42, the painted set's shape, which stretched the ink ones
	const CLOUD_ASPECT = { a: 158 / 640, b: 209 / 640, c: 229 / 640 };

	export const AMBIENT_SCENES = {
		// the day street: every cloud keeps above y 345, where only the two building
		// tops stand in the sky. Lower down the windmill does, and it is not cut out.
		day: {
			width: 1920,
			height: 1288,
			night: false,
			clouds: [
				{ key: 'cloud_a.png', x: 260, y: 150, width: 560, aspect: CLOUD_ASPECT.a, speed: 26 },
				{ key: 'cloud_c.png', x: 1180, y: 196, width: 400, aspect: CLOUD_ASPECT.c, speed: 17 },
				{ key: 'cloud_b.png', x: 1560, y: 34, width: 300, aspect: CLOUD_ASPECT.b, speed: 11 },
			],
			occluders: [
				{ key: 'occ_left.png', x: 0, y: 120, width: 470, height: 350 },
				// occ_right2 (dgRoam): the first cut kept a wisp of the painted pink cloud and a
				// strip of sky beside the roof, a hard-edged patch over every passing cloud
				{ key: 'occ_right2.png', x: 1600, y: 260, width: 320, height: 210 },
			],
			stars: [],
			lanterns: [],
			mill: MILLS.day,
			// over the right of the street, where the sky is open beside the reels
			soarers: [
				{ x: 1605, y: 300, rx: 150, ry: 46, size: 96, period: 27, turn: 1, phase: 0.4 },
				{ x: 1745, y: 180, rx: 100, ry: 30, size: 60, period: 36, turn: -1, phase: 2.6 },
			],
			flock: { y: [150, 330], size: [30, 40] },
			doors: DOORS.day,
			houseLanterns: HOUSE_LANTERNS.day,
			roam: STREET_ROAM,
		},
		// the tall art: its sky is open down to y 640, the clouds stay above that
		portrait: {
			width: 1288,
			height: 1920,
			night: false,
			clouds: [
				{ key: 'cloud_a.png', x: 120, y: 150, width: 560, aspect: CLOUD_ASPECT.a, speed: 24 },
				{ key: 'cloud_c.png', x: 820, y: 420, width: 420, aspect: CLOUD_ASPECT.c, speed: 16 },
				{ key: 'cloud_b.png', x: 520, y: 30, width: 320, aspect: CLOUD_ASPECT.b, speed: 10 },
			],
			occluders: [],
			stars: [],
			lanterns: [],
			mill: MILLS.portrait,
			// either side of the plaque, under the logo
			soarers: [
				{ x: 985, y: 335, rx: 115, ry: 34, size: 90, period: 27, turn: 1, phase: 0.4 },
				{ x: 300, y: 385, rx: 85, ry: 26, size: 64, period: 35, turn: -1, phase: 2.6 },
			],
			flock: { y: [250, 470], size: [34, 44] },
			// the tall art: the street between the buildings (in front of the windmill's
			// feet), the boardwalk's planks (y 1205..1345) and the cracked ground under it,
			// which is what a phone shows below the reels
			roam: {
				zones: [
					{ y: [1048, 1185], x: [275, 995], open: false, weight: 1 },
					{ y: [1224, 1334], x: [0, 1288], open: true, weight: 1.5 },
					{ y: [1450, 1880], x: [0, 1288], open: true, weight: 4 },
				],
				depth: [1048, 1880],
				// the nearest row is close to the viewer: kept under the size of the one
				// that crosses in front of the reels (about 105 of this art's px on a phone)
				weed: [28, 84],
				devil: [56, 170],
				hen: [30, 92],
			},
		},
		// the night street: one small slate cloud high up, now and then across the moon
		// (high: the night has no cut-out building tops for a cloud to pass behind)
		night: {
			width: 1920,
			height: 1288,
			night: true,
			clouds: [{ key: 'cloud_b.png', x: 620, y: 22, width: 360, aspect: CLOUD_ASPECT.b, speed: 15 }],
			cloudTint: 0x59628f,
			occluders: [],
			stars: [
				{ x: 165, y: 58, size: 44 },
				{ x: 252, y: 196, size: 34 },
				{ x: 432, y: 300, size: 38 },
				{ x: 790, y: 216, size: 40 },
				{ x: 906, y: 402, size: 30 },
				{ x: 1104, y: 156, size: 36 },
				{ x: 1258, y: 76, size: 42 },
				{ x: 1640, y: 140, size: 40 },
				{ x: 1556, y: 36, size: 32 },
			],
			lanterns: [
				{ x: 316, y: 626, size: 170 },
				{ x: 1660, y: 662, size: 160 },
			],
			mill: MILLS.night,
			doors: DOORS.night,
			houseLanterns: HOUSE_LANTERNS.night,
			roam: STREET_ROAM,
			soarers: [], // birds roost at night
		},
	} satisfies Record<string, AmbientScene>;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { reducedMotion, windNow } from '../game/wind';
	import { SHAKE_PRESETS } from './SceneShake.svelte';
	import Roamers from './Roamers.svelte';
	import HouseLanterns from './HouseLanterns.svelte';

	/**
	 * The living background (Evtim, 2026-11-13: no mascot, "animate the background
	 * ... some other effects also would be nice, but just dont over do it"). Quiet
	 * things that never compete with the reels:
	 *  - by day painted clouds drift across the sky, always, and BEHIND the
	 *    buildings (their tops are drawn again over the clouds);
	 *  - at night the stars twinkle one at a time and the porch lanterns flicker.
	 * More life (Evtim, 2026-11-16: "make the background more lively, now its too
	 * static we only have clouds ... rotate the wheel ... some small tornados"), all
	 * of it one thing, WIND:
	 *  - the windmill's fan turns, always, faster when a gust comes and nearly idle
	 *    in a lull (a code-drawn fan over a patch that paints the painted one out);
	 *  - by day one or two birds of prey wheel slowly high over the street, and now
	 *    and then a small flock crosses the sky, flapping.
	 * 2026-11-17 (the review: "the background is too static"): the clouds drift fast
	 * enough to be seen moving, three by day, and with the wind: they hurry in a gust
	 * and slow in a lull. The wind itself is game/wind.ts, shared with what blows
	 * across the street (SceneWind) and the lanterns on the reel frame (FrameLife).
	 * And the saloon's batwing doors swing: a gust throws them open and they flap
	 * themselves shut, a strong quake of the board does the same (by day the dark
	 * bar shows behind them, at night its lamplight).
	 * The dust devil crosses in front of the reels (Boardwalk.svelte).
	 * 2026-11-18: SMALL tumbleweeds and dust devils also wander the ground behind the
	 * reels, each on its own curved way (Roamers.svelte, `roam` in the scene).
	 * The tumbleweed and the hen are not here: they cross in front of the reels
	 * (Boardwalk.svelte).
	 * Everything is drawn in the art's pixels under the art's cover transform (the
	 * parent passes x / y / scale). Driven by the Pixi ticker, so it pauses with
	 * the renderer; `active` = this background is the one on screen. Motion is off
	 * under prefers-reduced-motion (the clouds then simply stand).
	 */
	type Props = {
		scene: AmbientScene;
		x: number;
		y: number;
		scale: number;
		active: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	// `?ambient=fast` (a look without the wait, as for the tumbleweed): the clouds
	// cross in seconds
	const FAST = new URLSearchParams(window.location.search).get('ambient') === 'fast';
	const CLOUD_PACE = FAST ? 8 : 1;
	// how the wind carries the clouds: x their speed in a lull and in a gust
	const CLOUD_WIND = { lull: 0.55, gust: 1.7 };
	// the fan: radians per second in a lull and in a gust
	const MILL_SPEED = { lull: 0.35, gust: 2.3 };
	// a flock: seconds until the first and between two, birds in it, art px per second,
	// wing beats per second
	const FLOCK = { first: FAST ? [2, 4] : [9, 20], every: FAST ? [5, 8] : [38, 75], birds: [4, 7], speed: [70, 100], beat: 3.1 };
	const between = ([min, max]: number[]) => min + Math.random() * (max - min);
	// the batwing doors: two sprung leaves. `stiff` / `damp`: they swing about once a
	// second and flap four or five times before they hang still; a push (rad/s) in a
	// lull and in a gust, seconds between two pushes in a gust and in a lull; the
	// widest they open. A leaf turned by an angle is drawn cos(angle) as wide.
	const DOOR = { stiff: 42, damp: 1.1, push: [2.2, 7.5], every: { gust: [1.8, 4.5], lull: [5, 9] }, quake: 6, max: 1.15 };

	let time = $state(0);
	let millAngle = $state(0);
	// how far the wind has carried the clouds, in seconds of a middling wind
	let drift = $state(0);
	// the doors: how wide each leaf is drawn (1 = shut), from its angle
	let doorWidth = $state([1, 1]);
	const leaves = [
		{ angle: 0, speed: 0 },
		{ angle: 0, speed: 0 },
	];
	let nextPush = FAST ? 1 : between(DOOR.every.lull);
	// the wind (or a quake) goes through the doorway: both leaves are thrown the same
	// way, one a little harder, and spring back
	const pushDoors = (strength: number) => {
		const way = Math.random() < 0.5 ? -1 : 1;
		leaves.forEach((leaf) => (leaf.speed += way * strength * (0.75 + 0.5 * Math.random())));
	};

	type Flock = {
		start: number;
		direction: 1 | -1;
		y: number;
		speed: number;
		birds: { back: number; side: number; size: number; phase: number }[];
	};
	let flock = $state<Flock>();
	let nextFlock = between(FLOCK.first);
	const newFlock = (band: NonNullable<AmbientScene['flock']>): Flock => {
		const count = Math.round(between(FLOCK.birds));
		const size = between(band.size);
		return {
			start: time,
			direction: Math.random() < 0.5 ? 1 : -1,
			y: between(band.y),
			speed: between(FLOCK.speed),
			// a loose V behind the leader: rank by rank back and out to one side or the other
			birds: Array.from({ length: count }, (_, i) => {
				const rank = Math.ceil(i / 2);
				return {
					back: rank * size * (1.25 + 0.3 * Math.random()),
					side: (i % 2 ? 1 : -1) * rank * size * (0.5 + 0.25 * Math.random()),
					size: size * (0.9 + 0.2 * Math.random()),
					phase: Math.random() * 6.28,
				};
			}),
		};
	};
	const flockSpan = (f: Flock) => props.scene.width + 2 * (f.birds.at(-1)?.back ?? 0) + 200;

	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || reducedMotion()) return;
		const tick = () => {
			if (!props.active) return;
			const dt = app.ticker.deltaMS / 1000;
			time += dt;
			const gust = windNow();
			drift += (CLOUD_WIND.lull + (CLOUD_WIND.gust - CLOUD_WIND.lull) * gust) * dt * CLOUD_PACE;
			millAngle += (MILL_SPEED.lull + (MILL_SPEED.gust - MILL_SPEED.lull) * gust) * dt;
			if (props.scene.doors) {
				if (time >= nextPush) {
					pushDoors(DOOR.push[0] + (DOOR.push[1] - DOOR.push[0]) * gust);
					nextPush = time + between(gust > 0.3 || FAST ? DOOR.every.gust : DOOR.every.lull);
				}
				for (const leaf of leaves) {
					leaf.speed += (-DOOR.stiff * leaf.angle - DOOR.damp * leaf.speed) * dt;
					leaf.angle = Math.max(-DOOR.max, Math.min(DOOR.max, leaf.angle + leaf.speed * dt));
				}
				doorWidth = leaves.map((leaf) => Math.cos(leaf.angle));
			}
			if (flock && (time - flock.start) * flock.speed > flockSpan(flock)) {
				flock = undefined;
				nextFlock = time + between(FLOCK.every);
			}
			if (!flock && props.scene.flock && time >= nextFlock) flock = newFlock(props.scene.flock);
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	// a strong quake of the board throws the doors open too
	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const { trauma = 0 } = SHAKE_PRESETS[preset] as { trauma?: number };
			if (props.active && props.scene.doors && trauma >= 0.5 && !reducedMotion()) pushDoors(DOOR.quake * trauma);
		},
	});

	const cloudX = (cloud: AmbientScene['clouds'][number]) => {
		const span = props.scene.width + cloud.width * 2;
		return ((((cloud.x + cloud.width + cloud.speed * drift) % span) + span) % span) - cloud.width;
	};
	// one star at a time flares: each has its own slow beat, sharpened to a brief peak
	const starAlpha = (index: number) =>
		0.12 + 0.88 * Math.max(0, Math.sin(time * (0.5 + 0.13 * index) + index * 1.9)) ** 8;
	// a soarer on its flat circle: it heads along the path, and reads a little larger
	// on the near (lower) side of the circle
	const soarerAt = (bird: AmbientScene['soarers'][number]) => {
		const a = bird.phase + (bird.turn * 2 * Math.PI * time) / bird.period;
		const vx = -bird.rx * Math.sin(a) * bird.turn;
		const vy = bird.ry * Math.cos(a) * bird.turn;
		return {
			x: bird.x + bird.rx * Math.cos(a),
			y: bird.y + bird.ry * Math.sin(a),
			rotation: Math.atan2(vy, vx) + Math.PI / 2,
			width: bird.size * (1 + 0.12 * Math.sin(a)),
		};
	};
	const flockBird = (f: Flock, bird: Flock['birds'][number]) => {
		const t = time - f.start;
		const travelled = f.speed * t - bird.back - 100;
		return {
			x: f.direction === 1 ? travelled : props.scene.width - travelled,
			y: f.y + bird.side + 3 * Math.sin(1.7 * t + bird.phase),
			key: Math.sin(2 * Math.PI * FLOCK.beat * t + bird.phase) > 0 ? 'bird_up.png' : 'bird_down.png',
		};
	};
	// desktop and landscape: the lanterns hang on the houses (HouseLanterns), not on the frame
	const housed = $derived(['desktop', 'landscape'].includes(context.stateLayoutDerived.layoutType()));
	const lanternAlpha = (index: number) =>
		0.2 + 0.05 * Math.sin(time * 7.3 + index * 2) + 0.04 * Math.sin(time * 12.7 + index) + 0.03 * Math.sin(time * 2.1);
</script>

<Container x={props.x} y={props.y} scale={props.scale} visible={props.active}>
	{#each props.scene.clouds as cloud (cloud.key)}
		<Sprite
			key={cloud.key}
			x={cloudX(cloud)}
			y={cloud.y}
			width={cloud.width}
			height={cloud.width * cloud.aspect}
			alpha={0.9}
			tint={props.scene.cloudTint ?? 0xffffff}
		/>
	{/each}
	<!-- the birds: far off, so behind the buildings too -->
	{#each props.scene.soarers as bird, index (index)}
		{@const at = soarerAt(bird)}
		<!-- seen from below and far away: the circle is flat, and so is the bird on it -->
		<Container x={at.x} y={at.y} scale={{ x: 1, y: 0.78 }}>
			<Sprite key="bird_glide.png" anchor={0.5} rotation={at.rotation} width={at.width} height={at.width * 0.5} alpha={0.85} />
		</Container>
	{/each}
	{#if flock}
		{#each flock.birds as bird, index (index)}
			{@const at = flockBird(flock, bird)}
			<Sprite key={at.key} anchor={0.5} x={at.x} y={at.y} width={bird.size} height={bird.size * (44 / 72)} alpha={0.8} />
		{/each}
	{/if}
	<!-- what stands in front of the sky, over the clouds -->
	{#each props.scene.occluders as occluder (occluder.key)}
		<Sprite
			key={occluder.key}
			x={occluder.x}
			y={occluder.y}
			width={occluder.width}
			height={occluder.height}
		/>
	{/each}

	<!-- the windmill: the painted fan painted out, the turning one on its hub -->
	{#if props.scene.mill}
		{@const mill = props.scene.mill}
		<Sprite key={mill.patch.key} x={mill.patch.x} y={mill.patch.y} width={mill.patch.size} height={mill.patch.size} />
		<Sprite key="rotor.png" anchor={0.5} x={mill.x} y={mill.y} width={mill.size} height={mill.size} rotation={millAngle} tint={mill.tint} />
	{/if}

	<!-- the saloon's batwing doors: the doorway over the painted pair, then each leaf
	     about its own hinge (the left one's left edge, the right one's right edge) -->
	{#if props.scene.doors}
		{@const doors = props.scene.doors}
		<Sprite key={doors.patch.key} x={doors.patch.x} y={doors.patch.y} width={doors.patch.width} height={doors.patch.height} />
		<Sprite
			key={doors.left.key}
			x={doors.left.x}
			y={doors.left.y}
			width={doors.left.width * doorWidth[0]}
			height={doors.left.height}
		/>
		<Sprite
			key={doors.right.key}
			anchor={{ x: 1, y: 0 }}
			x={doors.right.x + doors.right.width}
			y={doors.right.y}
			width={doors.right.width * doorWidth[1]}
			height={doors.right.height}
		/>
	{/if}

	<!-- the frame's lanterns on the houses, desktop and landscape (elsewhere the frame has
	     them and the small painted ones stay) -->
	{#if props.scene.houseLanterns}
		<HouseLanterns lanterns={props.scene.houseLanterns} night={props.scene.night} active={props.active && housed} />
	{/if}

	<!-- small tumbleweeds and dust devils wandering the ground, each its own way
	     (the reel frame is drawn over this layer: they pass behind it) -->
	{#if props.scene.roam}
		<!-- not on a phone: the reels span the screen there and hide this ground; the
		     same wanderers run in front, under the reels (GroundRoamers) -->
		<Roamers
			scene={props.scene.roam}
			left={0}
			right={props.scene.width}
			night={props.scene.night}
			active={props.active && context.stateLayoutDerived.layoutType() !== 'portrait'}
		/>
	{/if}

	{#each props.scene.stars as star, index (index)}
		<Sprite
			key="glint.png"
			anchor={0.5}
			x={star.x}
			y={star.y}
			width={star.size}
			height={star.size}
			alpha={starAlpha(index)}
			blendMode="add"
		/>
	{/each}

	<!-- the painted porch lanterns' flicker at night (where HouseLanterns hangs its own, it
	     brings its own glow) -->
	{#each housed && props.scene.houseLanterns ? [] : props.scene.lanterns as lantern, index (index)}
		<Sprite
			key="blob.png"
			anchor={0.5}
			x={lantern.x}
			y={lantern.y}
			width={lantern.size}
			height={lantern.size}
			alpha={lanternAlpha(index)}
			tint={0xffa838}
			blendMode="add"
		/>
	{/each}
</Container>
