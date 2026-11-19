<script lang="ts" module>
	/**
	 * One background painting's floor, in that ART's own pixels: `floor` = the rows
	 * where the floor meets the far wall and where it leaves the picture (a lower row
	 * is nearer, so what is there is larger), `gob` a falling slime ball's width at
	 * those rows, `trail` a slime trail's width at them, `top` the row a far and a
	 * near ball start to fall from, `sides` the share of the width either side that a
	 * wide screen shows beside the reels (more is sent there).
	 */
	export type LabFloor = {
		width: number;
		floor: [number, number];
		gob: [number, number];
		trail: [number, number];
		top: [number, number];
		sides: number;
	};
	export const LAB_FLOORS: Record<'base' | 'portrait', LabFloor> = {
		// the basement lab: the furniture's feet reach y 650, the open floor starts under them
		base: { width: 1536, floor: [660, 1000], gob: [34, 76], trail: [100, 230], top: [70, -70], sides: 0.27 },
		// the tall cut: a phone shows this floor under the reels
		portrait: { width: 1024, floor: [840, 1500], gob: [32, 84], trail: [90, 250], top: [80, -80], sides: 0.5 },
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { GOB_FRAMES } from '../game/labLife';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	/**
	 * LAB LIFE: slime on the move, behind the reels (SceneLife is light and particles;
	 * this is drawn slime, the game's own painted win burst).
	 *
	 *  - GOO falls from the ceiling: a ball of slime drops, stretching as it falls,
	 *    and bursts on the floor (the burst flattened onto the floor), leaving a splat
	 *    that fades. A hard shake of the board (a bomb, a big win) brings several down.
	 *  - A SLIME TRAIL draws itself across the floor now and then, smear after smear,
	 *    as if something unseen dragged itself along, and fades behind.
	 *
	 * History (Evtim, 2026-11-18): rats and a goo creature (a slime slug) were built
	 * here the same day and REMOVED at his word: "remove walking goo and rat from
	 * chaos lab 2 ... I like the walking goo trail, you can play it on random, maybe
	 * with a bit more opacity so it is more visible". The trail is what the creature
	 * left behind. Their art and builder stay in the workspace
	 * (art-review/chaoslab2/lab_life), not in the game.
	 *
	 * Depth is read off the painting (LAB_FLOORS): the lower on the floor, the nearer
	 * and larger. Drawn in the art's pixels in a container that cover-fits like the
	 * background (Background.svelte mounts it over SceneLife). Not in Cash Respins
	 * (another room). Driven by the Pixi ticker; never mounted under
	 * prefers-reduced-motion. `?scene=fast` sends things off every second or two.
	 */
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const portrait = $derived(canvas.height > canvas.width);
	const art = $derived(portrait ? LAB_FLOORS.portrait : LAB_FLOORS.base);
	const artHeight = $derived(portrait ? 1536 : 1024);
	const scale = $derived(Math.max(canvas.width / art.width, canvas.height / artHeight));
	const shown = $derived(context.stateGame.gameType !== 'freegame');

	const FAST = new URLSearchParams(window.location.search).get('scene') === 'fast';
	const GOBS = { max: 3, every: FAST ? [0.8, 2] : [4.5, 10], first: FAST ? [0.3, 0.8] : [2, 5] };
	const FALL = { gravity: 2600, start: 120 }; // art px / s², and the speed it lets go at
	const SPLASH = { time: 0.55, flat: 0.34, size: 3.4 }; // seconds; height over width on the floor; x the ball's width
	const SPLAT = { time: [7, 12], alpha: 0.55 };
	// a trail: seconds between two, smears in one, seconds between its smears, how far
	// apart they are laid (of a smear's width), a smear's height over its width, how
	// long one stays and how strongly it is drawn (0.4 while a creature drew it:
	// "a bit more opacity so it is more visible")
	const TRAILS = { max: 2, every: FAST ? [1.5, 3] : [9, 20], first: FAST ? [0.5, 1] : [4, 9] };
	const TRAIL = { smears: [4, 9], beat: [0.55, 0.8], step: 0.42, flat: 0.2, life: 12, alpha: 0.7 };
	const between = ([min, max]: readonly number[]) => min + Math.random() * (max - min);
	const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

	type Gob = {
		id: number;
		x: number;
		y: number;
		floor: number;
		speed: number;
		size: number;
		hang: number; // seconds it still hangs and swells before it lets go
		landed: number; // seconds since it hit the floor (-1: falling)
		life: number;
	};
	type Trail = { x: number; y: number; dir: 1 | -1; width: number; left: number; wait: number; beat: number };
	type Smear = { id: number; x: number; y: number; width: number; age: number };
	type View = { id: string; key: string; x: number; y: number; width: number; height: number; alpha: number };

	let views = $state<View[]>([]);
	const gobs: Gob[] = [];
	const trails: Trail[] = [];
	const smears: Smear[] = [];
	let nextId = 0;
	let time = 0;
	let nextGob = between(GOBS.first);
	let nextTrail = between(TRAILS.first);

	const nearness = (y: number) => Math.min(1, Math.max(0, (y - art.floor[0]) / (art.floor[1] - art.floor[0])));
	// somewhere across the room, more often at the sides (where a wide screen shows the floor)
	const acrossX = () => {
		const side = art.width * art.sides;
		const roll = Math.random();
		if (roll < 0.36) return Math.random() * side;
		if (roll < 0.72) return art.width - Math.random() * side;
		return Math.random() * art.width;
	};
	const floorY = () => lerp(art.floor[0], art.floor[1], Math.random() ** 0.8);

	const newTrail = (): Trail => {
		const y = floorY();
		const width = lerp(art.trail[0], art.trail[1], nearness(y));
		const x = acrossX();
		return {
			x,
			y,
			// towards the middle more often than not: more of it stays in the picture
			dir: (x < art.width / 2) === Math.random() < 0.7 ? 1 : -1,
			width,
			left: Math.round(between(TRAIL.smears)),
			wait: 0,
			beat: between(TRAIL.beat),
		};
	};
	const newGob = (): Gob => {
		const floor = floorY();
		const near = nearness(floor);
		return {
			id: nextId++,
			x: acrossX(),
			y: lerp(art.top[0], art.top[1], near),
			floor,
			speed: FALL.start,
			size: lerp(art.gob[0], art.gob[1], near),
			hang: between([0.25, 0.7]),
			landed: -1,
			life: between(SPLAT.time),
		};
	};
	const stepGob = (gob: Gob, dt: number, out: View[]): boolean => {
		if (gob.landed < 0) {
			if (gob.hang > 0) {
				// it swells where it hangs, then lets go
				gob.hang -= dt;
				const grown = 1 - Math.max(0, gob.hang) / 0.7;
				out.push({ id: `g${gob.id}`, key: 'gob_0.png', x: gob.x, y: gob.y, width: gob.size * (0.5 + 0.5 * grown), height: gob.size * (0.6 + 0.9 * grown), alpha: 1 });
				return true;
			}
			gob.speed += FALL.gravity * dt;
			gob.y += gob.speed * dt;
			if (gob.y < gob.floor) {
				// longer and thinner the faster it falls
				const stretch = Math.min(2.4, 1 + gob.speed / 900);
				out.push({ id: `g${gob.id}`, key: 'gob_0.png', x: gob.x, y: gob.y - (gob.size * stretch) / 2, width: gob.size / Math.sqrt(stretch), height: gob.size * stretch, alpha: 1 });
				return true;
			}
			gob.landed = 0;
		}
		gob.landed += dt;
		if (gob.landed > gob.life) return false;
		const wide = gob.size * SPLASH.size;
		// what stays on the floor: the burst's open ring, fading for a long time
		const gone = gob.landed / gob.life;
		out.push({ id: `p${gob.id}`, key: 'gob_4.png', x: gob.x, y: gob.floor, width: wide * 0.8, height: wide * 0.8 * SPLASH.flat, alpha: SPLAT.alpha * Math.min(1, gob.landed / 0.25) * (1 - gone) ** 1.5 });
		if (gob.landed < SPLASH.time) {
			// the burst itself, flat on the floor and standing a little up out of it
			const u = gob.landed / SPLASH.time;
			const frame = 1 + Math.min(GOB_FRAMES - 2, Math.floor(u * (GOB_FRAMES - 1)));
			out.push({ id: `s${gob.id}`, key: `gob_${frame}.png`, x: gob.x, y: gob.floor - wide * 0.1, width: wide, height: wide * (SPLASH.flat + 0.22 * (1 - u)), alpha: 1 });
		}
		return true;
	};

	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		const tick = () => {
			if (!shown) {
				if (views.length) views = [];
				return;
			}
			const dt = Math.min(0.1, app.ticker.deltaMS / 1000);
			time += dt;
			if (time >= nextGob) {
				if (gobs.filter((gob) => gob.landed < 0).length < GOBS.max) gobs.push(newGob());
				nextGob = time + between(GOBS.every);
			}
			if (time >= nextTrail) {
				if (trails.length < TRAILS.max) trails.push(newTrail());
				nextTrail = time + between(TRAILS.every);
			}
			// a trail lays its next smear, a step further on
			for (let i = trails.length - 1; i >= 0; i--) {
				const trail = trails[i];
				trail.wait -= dt;
				if (trail.wait > 0) continue;
				smears.push({ id: nextId++, x: trail.x, y: trail.y + between([-0.03, 0.03]) * trail.width, width: trail.width * between([0.9, 1.15]), age: 0 });
				trail.x += trail.dir * trail.width * TRAIL.step;
				trail.wait = trail.beat;
				if (--trail.left <= 0) trails.splice(i, 1);
			}
			const out: View[] = [];
			// what lies on the floor first (the trails, the splats), then what falls
			for (let i = smears.length - 1; i >= 0; i--) {
				const smear = smears[i];
				smear.age += dt;
				if (smear.age > TRAIL.life) smears.splice(i, 1);
				else {
					const u = smear.age / TRAIL.life;
					out.push({ id: `m${smear.id}`, key: 'gob_5.png', x: smear.x, y: smear.y, width: smear.width, height: smear.width * TRAIL.flat, alpha: TRAIL.alpha * Math.min(1, smear.age / 0.5) * (1 - u) ** 1.4 });
				}
			}
			for (let i = gobs.length - 1; i >= 0; i--) if (!stepGob(gobs[i], dt, out)) gobs.splice(i, 1);
			views = out;
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	// a hard shake of the board: slime comes off the ceiling
	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const { trauma = 0 } = SHAKE_PRESETS[preset] as { trauma?: number };
			if (!shown || trauma < 0.5) return;
			const count = 2 + Math.round(2 * trauma);
			for (let i = 0; i < count && gobs.length < 9; i++) gobs.push({ ...newGob(), hang: Math.random() * 0.25 });
		},
	});
</script>

<!-- over the paintings and SceneLife's light, under the board, the mascot and the bar -->
<Container
	x={canvas.width / 2 - (art.width * scale) / 2}
	y={canvas.height / 2 - (artHeight * scale) / 2}
	{scale}
	visible={shown}
	zIndex={-1.4}
>
	{#each views as view (view.id)}
		<Sprite key={view.key} anchor={0.5} x={view.x} y={view.y} width={view.width} height={view.height} alpha={view.alpha} />
	{/each}
</Container>
