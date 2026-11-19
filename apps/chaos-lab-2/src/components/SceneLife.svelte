<script lang="ts">
	import {
		Container,
		ParticleContainer,
		Particles,
		PixiRectangle,
		Rectangle,
		Sprite,
		Texture,
		type ParticlesProps,
	} from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SCENE_LIFE, type SceneArt } from '../game/sceneLife';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	/**
	 * The lab is alive (2026-11-16; the reviewers' "too static" was about the whole
	 * screen, and nothing behind the reels moved). Nothing in the paintings is
	 * redrawn: light and particles are laid over them, placed by points measured
	 * off the art (game/sceneLife.ts, written by
	 * art-review/chaoslab2/scene_life/build_scene_life.py).
	 * The lab (base game):
	 * - the glow breathes: the painting's own green (tanks, flasks, slime and their
	 *   reflections on the wet floor) drawn again additively, and now and then the
	 *   power dips and it all stutters
	 * - the tanks bubble, the flasks simmer and breathe vapour, slime drips off the
	 *   benches and splashes, the pipes vent steam, the porthole fan turns, the lamp
	 *   over the door flickers, wet spots on the floor glint, spores drift in the air
	 * - it answers the board: a shake (bomb, cascade, big win, the feature trigger)
	 *   makes the tanks boil, the pipes vent and dust come down
	 * The theatre (Cash Respins): the surgical lamps flicker and gutter, their light
	 * on the floor with them, and dust hangs in it.
	 * v2 (2026-11-17): the reviewers saw all of the above and still wrote "the
	 * background is too static": it was small and at the sides. Added, large and
	 * always on:
	 * - mist drifts over the floor (portrait: a haze in the band above the board),
	 *   and the floor drains steam
	 * - bubbles leave the flasks and drift up through the room until they pop
	 * - the porthole throws light shafts that turn with its fan
	 * - the tanks discharge every few seconds: an arc climbs the serum, the collar
	 *   throws sparks, the whole room flashes green; lava-lamp blobs rise between
	 * - slime drips from the ceiling ducts; the pipes vent bigger and more often
	 *   (portrait's vents now sit inside what a phone shows)
	 * - a power dip also darkens the painting itself, not only its glow
	 * - Scatters pending (anticipation): the room holds its breath: darker, the
	 *   tanks boiling, the lights stuttering, discharges close together
	 * - the theatre: light cones under the lamps, floor mist, sparks when a lamp gutters
	 * - something lives here: now and then a pair of eyes opens in the dark under a
	 *   bench, looks about, blinks and is gone (a hard shake scares it off)
	 *   (a specimen swimming in each tank was tried: a blur of soft beads 60 px wide
	 *   read as dirt on the glass, so it is out; it would need drawn art)
	 * Preview: `?scene=fast` lets the layer take big time steps, so a film made in
	 * headless Chrome (a few frames a second) still shows it at its real pace, and
	 * brings the rare events (discharges, the eyes) close together.
	 * One additive and one normal ParticleContainer on a shared atlas, stepped on the
	 * Pixi ticker: no Svelte state per particle. Mounted once (Background) and kept:
	 * pixi-svelte's Particles never removes its ticker callback. Drawn in art px about
	 * the art's centre, in a container that cover-fits exactly as the background does.
	 */
	// (the app has no pixi.js dependency of its own: the type comes off pixi-svelte's props)
	type Particle = Parameters<ParticlesProps['init']>[0][number];

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isFeature = $derived(context.stateGame.gameType === 'freegame');
	// the same choice Background makes: the feature has one (landscape) painting
	const artKey = $derived<'base' | 'portrait' | 'fs'>(
		isFeature ? 'fs' : canvas.height > canvas.width ? 'portrait' : 'base',
	);
	const art = $derived(SCENE_LIFE[artKey]);
	const scale = $derived(Math.max(canvas.width / art.width, canvas.height / art.height));
	const SHIMMER = { base: 'cl2ShimmerBase', portrait: 'cl2ShimmerPortrait', fs: 'cl2ShimmerFs' } as const;
	const FAN = { base: 'cl2FanBase', portrait: 'cl2FanPortrait', fs: 'cl2FanBase' } as const;

	// atlas cells (128 px): soft glow, bubble, droplet, speck, 4-point glint, steam puff,
	// streak (an arc's segment, a spark), ring (a pop, a ripple), light cone (apex up)
	const CELL = 128;
	const [GLOW, BUBBLE, DROP, SPECK, STAR, PUFF, STREAK, RING, CONE] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
	const cells = (particles: Particle[]) => {
		const source = particles[0].texture.source;
		return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(
			(i) => new Texture({ source, frame: new PixiRectangle(i * CELL, 0, CELL, CELL) }),
		);
	};
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	// Pixi 8.8's Particle takes a NUMBER tint as blue-green-red (only strings go through
	// its colour conversion): every particle colour here is written 0xRRGGBB and swapped.
	// (v1 wrote them straight: its slime drips were teal and the theatre's lamps blue.)
	const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};
	const TAU = 2 * Math.PI;
	const LAB_GREEN = 0x9cff3a;
	// how far the porthole's light shafts reach, in fan radii
	const RAYS_REACH = 7.5;
	// the longest time step: a stalled tab must not fling everything across the room.
	// `?scene=fast` lifts it for films made in headless Chrome (see above)
	const PREVIEW = new URLSearchParams(window.location.search).get('scene') === 'fast';
	const MAX_STEP = PREVIEW ? 0.3 : 0.05;

	let shimmer = $state(0.3);
	let fanAngle = $state(0);
	// the porthole's light shafts, and a veil that darkens the painting when the power dips
	let raysAlpha = $state(0);
	let dim = $state(0);
	let clock = 0;
	let last = 0;
	let dt = 0.016;
	let shownArt: SceneArt | undefined;
	// a shake of the board, waiting to be answered by the scene
	let surge = 0;
	let ventNow = false;
	let dustNow = 0;
	// the lab's power: 1 = steady; a dip stutters every light at once
	let power = 1;
	let dipAt = rand(6, 12);
	let dipAge = 1;
	let powerSmooth = 1;
	let fanSpin = 0;
	// a tank discharging lights the whole room for a moment
	let flash = 0;
	let dischargeIn = rand(3, 6);
	let dischargeAll = false;
	let popAll = false;
	// Scatters pending: 0 -> 1 while the board waits for the last one
	let tension = 0;

	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const strength = (SHAKE_PRESETS[preset] as { trauma?: number }).trauma ?? 0.3;
			surge = Math.max(surge, strength);
			if (strength >= 0.5) {
				ventNow = true;
				dustNow += Math.round(8 + strength * 14);
				dipAge = 0;
				dischargeAll = true;
				popAll = true;
			}
		},
	});

	// ------------------------------------------------------------ the lit layer
	const TANKS = 2;
	const PER_TANK = 14;
	const PER_TANK_BLOBS = 3;
	const ARC_SEGS = 6;
	const FLASKS = 3;
	const PER_FLASK_BUBBLES = 2;
	const PER_FLASK_VAPOUR = 3;
	const LAMPS = 3;
	const GLINTS = 6;
	const RIPPLES = 5;
	const DRIPS = 8;
	const FLOATERS = 8;
	// the bubbles that left the flasks and drifted up through the room are OFF (Evtim,
	// 2026-11-18: "there are also some bubbles coming out of the bottles, remove them
	// as well"). Their particles stay in the pool, never shown.
	const FLOATING_BUBBLES = false;
	const SPARKS = 40;
	const MOTES = 40;
	// the lit particles, block after block (= back to front): [name, count, atlas cell]
	const BLOCKS = [
		['cone', LAMPS, CONE],
		['tankHalo', TANKS, GLOW],
		['tankBlob', TANKS * PER_TANK_BLOBS, GLOW],
		['tankBubble', TANKS * PER_TANK, BUBBLE],
		['arc', TANKS * ARC_SEGS, STREAK],
		['flaskBubble', FLASKS * PER_FLASK_BUBBLES, BUBBLE],
		['vapour', FLASKS * PER_FLASK_VAPOUR, GLOW],
		['lamp', LAMPS * 2, GLOW],
		['glint', GLINTS, STAR],
		['ripple', RIPPLES, RING],
		['drop', DRIPS, DROP],
		['splash', DRIPS, GLOW],
		['mote', MOTES, SPECK],
		['floater', FLOATERS, BUBBLE],
		['pop', FLOATERS, RING],
		['spark', SPARKS, STREAK],
		['eye', 2, GLOW],
	] as const;
	const AT = {} as Record<(typeof BLOCKS)[number][0], number>;
	let LIT = 0;
	for (const [name, count] of BLOCKS) {
		AT[name] = LIT;
		LIT += count;
	}

	type Bubble = { x: number; y: number; v: number; size: number; wobble: number; phase: number };
	const tankBubbles: Bubble[] = Array.from({ length: TANKS * PER_TANK }, () => ({ x: 0, y: 0, v: 0, size: 0, wobble: 0, phase: 0 }));
	const flaskPhase = Array.from({ length: FLASKS * (PER_FLASK_BUBBLES + PER_FLASK_VAPOUR) }, () => rand(0, 1));
	const lamps = Array.from({ length: LAMPS }, (_, i) => ({ phase: i * 2.1 + 0.7, gutter: 0, next: rand(3, 8) }));
	type Glint = { life: number; age: number; x: number; y: number; size: number };
	const glints: Glint[] = Array.from({ length: GLINTS }, () => ({ life: 0, age: 0, x: 0, y: 0, size: 0 }));
	let glintWait = 1;
	type Drip = { state: 'wait' | 'grow' | 'fall' | 'splash'; t: number; y: number; vy: number };
	const drips: Drip[] = Array.from({ length: DRIPS }, () => ({ state: 'wait' as const, t: rand(0.5, 6), y: 0, vy: 0 }));
	type Mote = { x: number; y: number; vx: number; vy: number; size: number; phase: number };
	const motes: Mote[] = [];
	// v2
	const blobPhase = Array.from({ length: TANKS * PER_TANK_BLOBS }, () => rand(0, 1));
	const blobSide = Array.from({ length: TANKS * PER_TANK_BLOBS }, () => rand(-1, 1));
	const boil = Array.from({ length: TANKS }, () => 0);
	const discharges = Array.from({ length: TANKS }, () => ({
		age: 1,
		life: 0.45,
		jitterIn: 0,
		bright: 1,
		pts: new Float32Array((ARC_SEGS + 1) * 2),
	}));
	const flames = Array.from({ length: LAMPS }, () => 0.86);
	type Ripple = { age: number; life: number; x: number; y: number; size: number };
	const ripples: Ripple[] = Array.from({ length: RIPPLES }, () => ({ age: 1, life: 1, x: 0, y: 0, size: 0 }));
	let rippleWait = 1.5;
	type Floater = { state: 'off' | 'up' | 'pop'; age: number; life: number; x: number; y: number; vx: number; vy: number; size: number; phase: number };
	const floaters: Floater[] = Array.from({ length: FLOATERS }, () => ({ state: 'off' as const, age: 0, life: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, phase: 0 }));
	let floaterWait = 0.6;
	type Spark = { age: number; life: number; x: number; y: number; vx: number; vy: number };
	const sparks: Spark[] = Array.from({ length: SPARKS }, () => ({ age: 1, life: 1, x: 0, y: 0, vx: 0, vy: 0 }));
	const emitSparks = (x: number, y: number, count: number) => {
		for (const s of sparks) {
			if (count <= 0) break;
			if (s.age < s.life) continue;
			const a = rand(-Math.PI * 0.95, -Math.PI * 0.05); // upwards and to the sides
			const v = rand(90, 330);
			Object.assign(s, { age: -rand(0, 0.08), life: rand(0.45, 1.0), x: x + rand(-5, 5), y: y + rand(-3, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8 });
			count -= 1;
		}
	};
	// a pair of eyes in the dark under a bench: they open, look about, blink, and are gone
	const eyes = { spot: -1, age: 0, life: 0, wait: PREVIEW ? 1 : rand(4, 9), blinkAt: 0, glanceAt: 0, look: 0 };
	// a tank discharges: an arc up the serum, sparks off the collar, the room flashes
	const discharge = (t: number, strength = 1) => {
		const d = discharges[t];
		if (!art.tanks[t]) return;
		d.age = 0;
		d.life = rand(0.36, 0.58);
		d.jitterIn = 0;
		boil[t] = 1;
		flash = Math.max(flash, 0.5 * strength);
		const spot = art.sparks[t];
		if (spot) emitSparks(spot[0], spot[1], Math.round(9 + 6 * strength));
	};

	const spawnTankBubble = (b: Bubble, tank: number[], anywhere = false) => {
		const [x0, y0, x1, y1] = tank;
		b.x = rand(x0 + 5, x1 - 5);
		b.y = anywhere ? rand(y0 + 8, y1 - 2) : y1 - 2;
		b.v = rand(16, 42);
		b.size = rand(3.5, 12);
		b.wobble = rand(2.4, 5);
		b.phase = rand(0, TAU);
	};

	const reseed = () => {
		art.tanks.forEach((tank, t) => {
			for (let i = 0; i < PER_TANK; i++) spawnTankBubble(tankBubbles[t * PER_TANK + i], tank, true);
		});
		glints.forEach((g) => (g.life = 0));
		drips.forEach((d) => Object.assign(d, { state: 'wait', t: rand(0.5, 6) }));
		motes.length = 0;
		for (let i = 0; i < MOTES; i++) {
			motes.push({ x: rand(0, art.width), y: rand(0, art.height), vx: rand(-9, 9), vy: rand(-8, 2), size: rand(4, 10), phase: rand(0, TAU) });
		}
		steam.forEach((s) => (s.age = s.life = 0));
		dust.forEach((s) => (s.age = s.life = 0));
		floaters.forEach((f) => (f.state = 'off'));
		eyes.spot = -1;
		sparks.forEach((s) => (s.age = s.life = 1));
		ripples.forEach((r) => (r.age = r.life = 1));
		discharges.forEach((d) => (d.age = d.life));
		seedMist();
	};

	const initLit = (particles: Particle[]) => {
		const tex = cells(particles);
		let i = 0;
		for (const [, count, cell] of BLOCKS) {
			for (let n = 0; n < count; n++, i++) {
				const p = particles[i];
				p.anchorX = 0.5;
				p.anchorY = cell === CONE ? 0 : 0.5; // a cone hangs from its apex
				p.texture = tex[cell];
				hide(p);
			}
		}
	};

	const updateLit = (particles: Particle[]) => {
		const now = performance.now();
		dt = Math.min(MAX_STEP, last ? (now - last) / 1000 : 0.016);
		last = now;
		clock += dt;
		if (shownArt !== art) {
			// another painting (the feature, a rotated phone): start over on its points
			shownArt = art;
			reseed();
		}
		const cx = art.width / 2;
		const cy = art.height / 2;
		const warm = art.warm;

		// Scatters pending: the room holds its breath until the last one lands or misses
		tension += ((context.stateGame.scatterPending ? 1 : 0) - tension) * Math.min(1, dt * 5);
		if (tension > 0.5) {
			surge = Math.max(surge, 0.4);
			dipAt = Math.min(dipAt, 1.4);
			dischargeIn = Math.min(dischargeIn, 1.6);
		}

		// the power dips: every so often, and on a hard shake
		dipAt -= dt;
		if (dipAt <= 0 && !warm) {
			dipAt = tension > 0.5 ? rand(0.9, 1.8) : rand(8, 17);
			dipAge = 0;
		}
		dipAge += dt;
		power = dipAge < 0.45 ? 1 - 0.8 * (Math.sin(TAU * 11 * dipAge) > 0.1 ? 1 : 0) * (1 - dipAge / 0.45) : 1;
		// the painting itself darkens with it: smoothed, a dip and not a strobe
		powerSmooth += (power - powerSmooth) * Math.min(1, dt * 12);
		const veil = Math.round((0.3 * (1 - powerSmooth) + 0.14 * tension) * 100) / 100;
		if (veil !== dim) dim = veil;

		// the tanks discharge: one at a time while idle, both on a hard shake
		dischargeIn -= dt;
		if (dischargeAll) {
			discharge(0, 1.3);
			discharge(1, 1.3);
			dischargeAll = false;
			dischargeIn = rand(5, 9);
		} else if (dischargeIn <= 0) {
			dischargeIn = tension > 0.5 ? rand(0.9, 1.7) : PREVIEW ? rand(0.7, 1.1) : rand(5.5, 11);
			discharge(Math.random() < 0.5 ? 0 : 1);
		}
		flash = Math.max(0, flash - dt * 2.6);

		// lamps: slow sines and a fast one, a gutter now and then
		let flameSum = 0;
		for (let i = 0; i < LAMPS; i++) {
			const halo = particles[AT.lamp + i * 2];
			const core = particles[AT.lamp + i * 2 + 1];
			const spot = art.lamps[i];
			if (!spot) {
				hide(halo);
				hide(core);
				continue;
			}
			const [x, y, radius] = spot;
			const lamp = lamps[i];
			lamp.next -= dt;
			if (lamp.next <= 0) {
				lamp.gutter = 1;
				lamp.next = rand(warm ? 2.5 : 5, warm ? 8 : 13);
				// the theatre's old lamps spit sparks when they gutter
				const spit = warm && art.sparks[i];
				if (spit && Math.random() < 0.6) emitSparks(spit[0], spit[1], 8);
			}
			lamp.gutter = Math.max(0, lamp.gutter - dt * 4.5);
			const t = clock + lamp.phase;
			const flame =
				(0.86 + 0.07 * Math.sin(TAU * 1.3 * t) + 0.04 * Math.sin(TAU * 3.7 * t + lamp.phase) + 0.03 * Math.sin(TAU * 9.1 * t) -
					0.45 * lamp.gutter * (0.5 + 0.5 * Math.sin(TAU * 17 * t))) *
				power;
			flameSum += flame;
			flames[i] = flame;
			halo.x = x - cx;
			halo.y = y - cy + (warm ? radius * 0.25 : radius * 0.3);
			halo.scaleX = halo.scaleY = ((2 * radius) / CELL) * (0.95 + 0.07 * flame);
			halo.tint = bgr(warm ? 0xffb060 : 0x9dffc0);
			halo.alpha = (warm ? 0.3 : 0.22) * flame;
			core.x = x - cx;
			core.y = y - cy;
			core.scaleX = core.scaleY = ((radius * 0.5) / CELL) * (0.9 + 0.12 * flame);
			core.tint = bgr(warm ? 0xffe0a0 : 0xe8fff0);
			core.alpha = 0.42 * flame;
		}
		const flameAvg = art.lamps.length ? flameSum / art.lamps.length : 0.86;

		// a cone of light under each of the theatre's lamps, swaying a little on its chain
		for (let i = 0; i < LAMPS; i++) {
			const p = particles[AT.cone + i];
			const cone = art.cones[i];
			if (!cone) {
				hide(p);
				continue;
			}
			const [x, y, length, half] = cone;
			p.x = x - cx;
			p.y = y - cy;
			p.rotation = 0.035 * Math.sin(clock * 0.55 + i * 1.9);
			p.scaleX = (2 * half) / CELL;
			p.scaleY = length / CELL;
			p.tint = bgr(0xffd9a0);
			p.alpha = 0.2 * flames[i];
		}

		// the painting's own glow breathes; one write a frame
		shimmer = warm
			? 0.06 + 0.3 * flameAvg
			: Math.min(1, (0.36 + 0.17 * Math.sin((TAU * clock) / 4.6) + 0.05 * Math.sin((TAU * clock) / 1.1 + 1)) * power + 0.5 * surge + 0.9 * flash);
		// the fan (and the light shafts it throws) turns faster when the room is stirred
		fanSpin += dt * (0.8 + 3.2 * surge);
		fanAngle = fanSpin % TAU;
		raysAlpha = art.fan ? Math.min(1, (0.5 + 0.07 * Math.sin((TAU * clock) / 2.7)) * (0.35 + 0.65 * power) + 0.3 * flash + 0.2 * surge) : 0;

		// tanks: a soft halo each, and bubbles climbing the liquid (boiling on a shake)
		for (let t = 0; t < TANKS; t++) {
			const tank = art.tanks[t];
			const halo = particles[AT.tankHalo + t];
			if (!tank) {
				hide(halo);
				for (let i = 0; i < PER_TANK; i++) hide(particles[AT.tankBubble + t * PER_TANK + i]);
				for (let i = 0; i < PER_TANK_BLOBS; i++) hide(particles[AT.tankBlob + t * PER_TANK_BLOBS + i]);
				for (let i = 0; i < ARC_SEGS; i++) hide(particles[AT.arc + t * ARC_SEGS + i]);
				continue;
			}
			const [x0, y0, x1, y1] = tank;
			halo.x = (x0 + x1) / 2 - cx;
			halo.y = (y0 + y1) / 2 - cy;
			halo.scaleX = halo.scaleY = (2.3 * (y1 - y0)) / CELL;
			halo.tint = bgr(0x7dff2a);
			boil[t] = Math.max(0, boil[t] - dt * 0.8);
			const d = discharges[t];
			const live = d.age < d.life;
			const env = live ? Math.sin(Math.PI * Math.min(1, d.age / d.life)) ** 0.5 : 0;
			halo.alpha = (0.15 + 0.07 * Math.sin((TAU * clock) / 3.1 + t * 2) + 0.3 * surge + 0.45 * env) * power;
			// lava-lamp blobs: bright patches that climb the serum
			for (let i = 0; i < PER_TANK_BLOBS; i++) {
				const slot = t * PER_TANK_BLOBS + i;
				const p = particles[AT.tankBlob + slot];
				blobPhase[slot] = (blobPhase[slot] + (dt / (5.2 + 1.3 * i)) * (1 + 2.5 * surge + 2 * boil[t])) % 1;
				const k = blobPhase[slot];
				const half = (x1 - x0) / 2;
				p.x = (x0 + x1) / 2 + blobSide[slot] * half * 0.45 + 5 * Math.sin(TAU * k * 1.5 + slot) - cx;
				p.y = y1 - (y1 - y0) * k - cy;
				p.scaleX = ((half * (0.75 + 0.35 * Math.sin(Math.PI * k))) / CELL) * 2.2;
				p.scaleY = p.scaleX * (1.25 + 0.2 * Math.sin(TAU * k * 2 + slot));
				p.tint = bgr(0xd8ff60);
				p.alpha = 0.3 * Math.sin(Math.PI * k) * power;
			}
			// the discharge: a jagged arc from the foot of the serum to its surface, re-rolled as it burns
			if (live) {
				d.age += dt;
				d.jitterIn -= dt;
				if (d.jitterIn <= 0) {
					d.jitterIn = 0.05;
					d.bright = rand(0.55, 1);
					const mid = (x0 + x1) / 2;
					const sway = (x1 - x0) * 0.36;
					for (let i = 0; i <= ARC_SEGS; i++) {
						const end = i === 0 || i === ARC_SEGS;
						d.pts[i * 2] = mid + rand(-sway, sway) * (end ? 0.3 : 1);
						d.pts[i * 2 + 1] = y1 - 3 - (y1 - y0 - 6) * (i / ARC_SEGS) + (end ? 0 : rand(-5, 5));
					}
				}
			}
			for (let i = 0; i < ARC_SEGS; i++) {
				const p = particles[AT.arc + t * ARC_SEGS + i];
				if (!live) {
					hide(p);
					continue;
				}
				const ax = d.pts[i * 2];
				const ay = d.pts[i * 2 + 1];
				const bx = d.pts[i * 2 + 2];
				const by = d.pts[i * 2 + 3];
				p.x = (ax + bx) / 2 - cx;
				p.y = (ay + by) / 2 - cy;
				p.rotation = Math.atan2(by - ay, bx - ax);
				p.scaleX = (Math.hypot(bx - ax, by - ay) / (CELL * 0.86)) * 1.1;
				p.scaleY = 0.5 + 0.55 * d.bright;
				p.tint = bgr(0xf4ffd6);
				p.alpha = env * d.bright;
			}
			for (let i = 0; i < PER_TANK; i++) {
				const b = tankBubbles[t * PER_TANK + i];
				const p = particles[AT.tankBubble + t * PER_TANK + i];
				b.y -= b.v * dt * (1 + 3.5 * surge + 3 * boil[t]);
				if (b.y < y0 + 4) spawnTankBubble(b, tank);
				p.x = b.x + 2.4 * Math.sin(clock * b.wobble + b.phase) - cx;
				p.y = b.y - cy;
				p.scaleX = p.scaleY = b.size / 92;
				p.tint = bgr(0xe4ffa8);
				p.alpha = 0.6 * Math.min(1, (y1 - b.y) / 12) * Math.min(1, (b.y - y0) / 16) * (0.6 + 0.4 * power);
			}
		}

		// flasks: two bubbles simmering in the liquid, vapour breathing from the neck
		for (let f = 0; f < FLASKS; f++) {
			const flask = art.flasks[f];
			for (let i = 0; i < PER_FLASK_BUBBLES + PER_FLASK_VAPOUR; i++) {
				const vapour = i >= PER_FLASK_BUBBLES;
				const p = particles[vapour ? AT.vapour + f * PER_FLASK_VAPOUR + (i - PER_FLASK_BUBBLES) : AT.flaskBubble + f * PER_FLASK_BUBBLES + i];
				if (!flask) {
					hide(p);
					continue;
				}
				const [lx, ly, nx, ny, tint] = flask;
				const slot = f * (PER_FLASK_BUBBLES + PER_FLASK_VAPOUR) + i;
				const period = vapour ? 3.2 : 1.5 + 0.5 * i;
				flaskPhase[slot] = (flaskPhase[slot] + (dt / period) * (1 + 2 * surge)) % 1;
				const k = flaskPhase[slot];
				if (vapour) {
					p.x = nx + 7 * Math.sin(TAU * (k * 0.8 + slot * 0.37)) * k - cx;
					p.y = ny - 6 - 48 * k - cy;
					p.scaleX = p.scaleY = (10 + 30 * k) / (CELL * 0.6);
					p.tint = bgr(tint);
					p.alpha = 0.2 * Math.sin(Math.PI * k) ** 0.8;
				} else {
					p.x = lx + (i ? 8 : -7) + 1.5 * Math.sin(TAU * k * 2) - cx;
					p.y = ly + 5 - 15 * k - cy;
					p.scaleX = p.scaleY = (3 + 1.5 * i) / 92;
					p.tint = bgr(0xf0ffd0);
					p.alpha = 0.7 * Math.sin(Math.PI * k);
				}
			}
		}

		// wet spots on the floor glint, a couple at a time
		glintWait -= dt;
		if (glintWait <= 0 && art.glints.length) {
			glintWait = rand(0.35, 1.0);
			const free = glints.find((g) => g.age >= g.life);
			if (free) {
				const [x, y] = art.glints[Math.floor(Math.random() * art.glints.length)];
				Object.assign(free, { x: x + rand(-10, 10), y: y + rand(-5, 5), age: 0, life: rand(0.6, 1.2), size: rand(16, 30) });
			}
		}
		glints.forEach((g, i) => {
			const p = particles[AT.glint + i];
			if (g.age >= g.life) return hide(p);
			g.age += dt;
			const k = Math.sin(Math.PI * Math.min(1, g.age / g.life));
			p.x = g.x - cx;
			p.y = g.y - cy;
			p.scaleX = (g.size / 100) * (0.3 + 0.7 * k);
			p.scaleY = p.scaleX * 0.6; // the floor is seen at a slant
			p.tint = bgr(0xe6ffb4);
			p.alpha = k * power;
		});

		// slime drips: a drop swells on the bench's edge, falls, splashes on the floor
		for (let i = 0; i < DRIPS; i++) {
			const drop = particles[AT.drop + i];
			const splash = particles[AT.splash + i];
			const spot = art.drips[i];
			const d = drips[i];
			hide(drop);
			hide(splash);
			if (!spot) continue;
			const [x, y, floor] = spot;
			d.t -= dt;
			if (d.state === 'wait') {
				if (d.t <= 0) Object.assign(d, { state: 'grow', t: 0.5, y, vy: 0 });
				continue;
			}
			if (d.state === 'splash') {
				const k = 1 - Math.max(0, d.t) / 0.45;
				splash.x = x - cx;
				splash.y = floor - cy;
				splash.scaleX = (10 + 34 * k) / CELL;
				splash.scaleY = splash.scaleX * 0.3;
				splash.tint = bgr(LAB_GREEN);
				splash.alpha = 0.7 * (1 - k);
				if (d.t <= 0) Object.assign(d, { state: 'wait', t: rand(2.5, 8) });
				continue;
			}
			let stretch = 1;
			let grown = 1;
			if (d.state === 'grow') {
				grown = 1 - Math.max(0, d.t) / 0.5;
				if (d.t <= 0) d.state = 'fall';
			} else {
				d.vy += 1100 * dt;
				d.y += d.vy * dt;
				stretch = 1 + Math.min(0.9, d.vy / 600);
				if (d.y >= floor) Object.assign(d, { state: 'splash', t: 0.45 });
			}
			drop.x = x - cx;
			drop.y = d.y + 4 * grown - cy;
			drop.scaleX = (5.5 * grown) / 54;
			drop.scaleY = drop.scaleX * stretch;
			drop.tint = bgr(0xb8ff4a);
			drop.alpha = 0.9;
		}

		// the air: spores in the lab, lit near the tanks; dust in the theatre's lamp light
		motes.forEach((m, i) => {
			const p = particles[AT.mote + i];
			m.x += (m.vx + 4 * Math.sin(clock * 0.7 + m.phase)) * dt;
			m.y += m.vy * dt;
			if (m.y < -10) m.y = art.height + 10;
			if (m.y > art.height + 10) m.y = -10;
			if (m.x < -10) m.x = art.width + 10;
			if (m.x > art.width + 10) m.x = -10;
			let light = warm ? 0.14 : 0.13;
			for (const [x0, y0, x1, y1] of art.tanks) {
				const d = Math.hypot(m.x - (x0 + x1) / 2, m.y - (y0 + y1) / 2) / 330;
				if (d < 1) light = Math.max(light, 0.85 * (1 - d) ** 1.3);
			}
			for (const [lx, ly, radius] of art.lamps) {
				const d = Math.hypot(m.x - lx, m.y - (ly + radius)) / (radius * 2.2);
				if (d < 1) light = Math.max(light, 0.8 * (1 - d) ** 1.2);
			}
			p.x = m.x - cx;
			p.y = m.y - cy;
			p.scaleX = p.scaleY = m.size / 64;
			p.tint = bgr(warm ? 0xffd9a0 : 0xc4ff70);
			p.alpha = light * (0.6 + 0.4 * Math.sin(clock * 1.9 + m.phase)) * (0.5 + 0.5 * power);
		});

		// rings spread on the wet floor where something fell
		rippleWait -= dt;
		if (rippleWait <= 0 && art.glints.length) {
			rippleWait = rand(1.1, 2.6);
			const free = ripples.find((r) => r.age >= r.life);
			if (free) {
				const [x, y] = art.glints[Math.floor(Math.random() * art.glints.length)];
				Object.assign(free, { x: x + rand(-30, 30), y: y + rand(-8, 8), age: 0, life: rand(0.9, 1.4), size: rand(40, 78) });
			}
		}
		ripples.forEach((r, i) => {
			const p = particles[AT.ripple + i];
			if (r.age >= r.life) return hide(p);
			r.age += dt;
			const k = Math.min(1, r.age / r.life);
			p.x = r.x - cx;
			p.y = r.y - cy;
			p.scaleX = (r.size * (0.15 + 0.85 * k ** 0.6)) / (CELL * 0.8);
			p.scaleY = p.scaleX * 0.3; // the floor is seen at a slant
			p.tint = bgr(0xc8ff8a);
			p.alpha = 0.55 * (1 - k) * power;
		});

		// bubbles leave the flasks and drift up through the room, towards its middle, until they pop
		floaterWait -= dt;
		if (FLOATING_BUBBLES && floaterWait <= 0 && art.bubbles.length) {
			floaterWait = rand(1.3, 3.0) / (1 + 2 * surge);
			const free = floaters.find((f) => f.state === 'off');
			if (free) {
				const [x, y] = art.bubbles[Math.floor(Math.random() * art.bubbles.length)];
				Object.assign(free, {
					state: 'up',
					age: 0,
					life: rand(7, 14),
					x,
					y,
					vx: Math.sign(cx - x) * rand(5, 17),
					vy: -rand(20, 40),
					size: rand(18, 46),
					phase: rand(0, TAU),
				});
			}
		}
		const viewTop = cy - canvas.height / scale / 2;
		floaters.forEach((f, i) => {
			const p = particles[AT.floater + i];
			const ring = particles[AT.pop + i];
			hide(p);
			hide(ring);
			if (f.state === 'off') return;
			f.age += dt;
			if (f.state === 'pop') {
				const k = f.age / 0.3;
				if (k >= 1) {
					f.state = 'off';
					return;
				}
				ring.x = f.x - cx;
				ring.y = f.y - cy;
				ring.scaleX = ring.scaleY = (f.size * (1 + 0.9 * k)) / (CELL * 0.8);
				ring.tint = bgr(0xdcffa0);
				ring.alpha = 0.8 * (1 - k);
				return;
			}
			f.x += (f.vx + 9 * Math.sin(clock * 0.9 + f.phase)) * dt;
			f.y += f.vy * dt;
			if (f.age >= f.life || f.y < viewTop - f.size || popAll) {
				f.state = 'pop';
				f.age = 0;
				return;
			}
			const grown = Math.min(1, f.age / 0.7);
			const wobble = 0.07 * Math.sin(clock * 3.1 + f.phase);
			p.x = f.x - cx;
			p.y = f.y - cy;
			p.scaleX = ((f.size * grown) / 92) * (1 + wobble);
			p.scaleY = ((f.size * grown) / 92) * (1 - wobble);
			p.tint = bgr(0xc8ff7a);
			p.alpha = (0.5 + 0.12 * Math.sin(clock * 1.7 + f.phase)) * (0.6 + 0.4 * power);
		});

		// sparks: thrown up and out, pulled down, drawn along their flight
		sparks.forEach((s, i) => {
			const p = particles[AT.spark + i];
			if (s.age >= s.life) return hide(p);
			s.age += dt;
			if (s.age < 0) return hide(p);
			s.vy += 620 * dt;
			s.x += s.vx * dt;
			s.y += s.vy * dt;
			const k = s.age / s.life;
			const speed = Math.hypot(s.vx, s.vy);
			p.x = s.x - cx;
			p.y = s.y - cy;
			p.rotation = Math.atan2(s.vy, s.vx);
			p.scaleX = Math.min(34, Math.max(7, speed * 0.055)) / (CELL * 0.86);
			p.scaleY = 0.34;
			p.tint = bgr(k < 0.35 ? 0xfff2c0 : 0xffa040);
			p.alpha = (1 - k) ** 0.6;
		});

		// the eyes under the benches
		const eyeL = particles[AT.eye];
		const eyeR = particles[AT.eye + 1];
		hide(eyeL);
		hide(eyeR);
		if (eyes.spot < 0) {
			eyes.wait -= dt;
			if (eyes.wait <= 0 && art.eyes.length) {
				Object.assign(eyes, { spot: Math.floor(Math.random() * art.eyes.length), age: 0, life: rand(3.2, 6), blinkAt: rand(0.9, 2), glanceAt: rand(1.2, 2.6), look: 0 });
			}
		} else {
			eyes.age += dt;
			const spot = art.eyes[eyes.spot];
			// a hard shake scares it off
			if (eyes.age >= eyes.life || !spot || popAll) {
				eyes.spot = -1;
				eyes.wait = PREVIEW ? rand(1, 2) : rand(7, 16);
			} else {
				if (eyes.age > eyes.glanceAt) {
					eyes.look = rand(-3, 3);
					eyes.glanceAt = eyes.age + rand(0.8, 1.9);
				}
				if (eyes.age > eyes.blinkAt + 0.14) eyes.blinkAt = eyes.age + rand(1.1, 2.6);
				const shut = eyes.age > eyes.blinkAt ? 0.12 : 1;
				const fade = Math.min(1, eyes.age / 0.35, (eyes.life - eyes.age) / 0.35);
				[eyeL, eyeR].forEach((p, i) => {
					p.x = spot[0] + (i ? 5.5 : -5.5) + eyes.look - cx;
					p.y = spot[1] - cy;
					p.scaleX = 9 / CELL;
					p.scaleY = (9 / CELL) * shut;
					p.tint = bgr(0xffd84a);
					p.alpha = 0.95 * fade;
				});
			}
		}

		popAll = false;
		surge = Math.max(0, surge - dt * 0.9);
	};

	// ------------------------------------------------------------ steam and dust
	const VENTS = 4;
	const PER_VENT = 13;
	const DUST = 26;
	const DRAINS = 2;
	const PER_DRAIN = 7;
	const MIST = 11;
	const AT_DUST = VENTS * PER_VENT;
	const AT_DRAIN = AT_DUST + DUST;
	const AT_MIST = AT_DRAIN + DRAINS * PER_DRAIN;
	const SMOKE = AT_MIST + MIST;
	type Grain = { age: number; life: number; x: number; y: number; vx: number; vy: number; size: number };
	const grain = (): Grain => ({ age: 0, life: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0 });
	const steam = Array.from({ length: VENTS * PER_VENT }, grain);
	const dust = Array.from({ length: DUST }, grain);
	const vents = Array.from({ length: VENTS }, (_, i) => ({ wait: rand(1, 4) + i * 1.7, left: 0, gap: 0 }));
	const drainPhase = Array.from({ length: DRAINS * PER_DRAIN }, (_, i) => ((i % PER_DRAIN) + rand(0, 0.6)) / PER_DRAIN);
	const drainSway = Array.from({ length: DRAINS * PER_DRAIN }, () => rand(0, TAU));
	type Mist = { x: number; y: number; v: number; size: number; flat: number; alpha: number; phase: number };
	const mist: Mist[] = Array.from({ length: MIST }, () => ({ x: 0, y: 0, v: 0, size: 0, flat: 0, alpha: 0, phase: 0 }));
	// mist banks spread over the band, each drifting at its own pace (the low, big ones faster)
	function seedMist() {
		const band = art.mist;
		if (!band) return;
		const [x0, y0, x1, y1] = band;
		const tall = y1 - y0;
		mist.forEach((m, i) => {
			const depth = (i + rand(0, 0.9)) / MIST; // 0 = far (top of the band), 1 = near
			m.size = Math.min(560, tall * (1.5 + 1.4 * depth)) * rand(0.85, 1.2);
			m.flat = rand(0.3, 0.42);
			m.x = rand(x0 - m.size / 2, x1 + m.size / 2);
			m.y = y0 + tall * (0.12 + 0.8 * depth);
			m.v = (7 + 15 * depth) * rand(0.8, 1.25);
			m.alpha = rand(0.17, 0.27) * (art.warm ? 0.75 : 1);
			m.phase = rand(0, TAU);
		});
	}

	const initSmoke = (particles: Particle[]) => {
		const tex = cells(particles);
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = i >= AT_DUST && i < AT_DRAIN ? tex[SPECK] : tex[PUFF];
			hide(p);
		});
	};

	const updateSmoke = (particles: Particle[]) => {
		const cx = art.width / 2;
		const cy = art.height / 2;
		// a pipe joint vents a short jet of steam every few seconds, and on a hard shake
		for (let v = 0; v < VENTS; v++) {
			const spot = art.vents[v];
			const vent = vents[v];
			if (spot) {
				vent.wait -= dt;
				if (vent.wait <= 0 || ventNow) {
					vent.wait = rand(3.5, 8.5);
					vent.left = PER_VENT;
					vent.gap = 0;
				}
				vent.gap -= dt;
				if (vent.left > 0 && vent.gap <= 0) {
					const puff = steam.slice(v * PER_VENT, (v + 1) * PER_VENT).find((g) => g.age >= g.life);
					if (puff) {
						const [x, y, dir] = spot;
						Object.assign(puff, { age: 0, life: rand(1.3, 2.1), x, y, vx: dir * rand(95, 175), vy: rand(-34, 6), size: rand(10, 16) });
					}
					vent.left -= 1;
					vent.gap = 0.055;
				}
			}
			for (let i = 0; i < PER_VENT; i++) {
				const g = steam[v * PER_VENT + i];
				const p = particles[v * PER_VENT + i];
				if (!spot || g.age >= g.life) {
					hide(p);
					continue;
				}
				g.age += dt;
				const k = g.age / g.life;
				g.vx *= 1 - 2.2 * dt;
				g.vy -= 22 * dt;
				g.x += g.vx * dt;
				g.y += g.vy * dt;
				p.x = g.x - cx;
				p.y = g.y - cy;
				p.scaleX = p.scaleY = (g.size * (1 + 4.6 * k)) / (CELL * 0.6);
				p.rotation = k * 1.2 * (i % 2 ? 1 : -1);
				p.tint = bgr(0xb4c8ae);
				p.alpha = 0.36 * Math.sin(Math.PI * Math.min(1, k)) ** 0.6;
			}
		}
		ventNow = false;

		// the floor drains breathe steam, all the time: a thin plume that widens as it climbs
		for (let d = 0; d < DRAINS; d++) {
			const spot = art.drains[d];
			for (let i = 0; i < PER_DRAIN; i++) {
				const slot = d * PER_DRAIN + i;
				const p = particles[AT_DRAIN + slot];
				if (!spot) {
					hide(p);
					continue;
				}
				drainPhase[slot] += (dt / 4.4) * (1 + 1.5 * surge);
				if (drainPhase[slot] >= 1) {
					drainPhase[slot] -= 1;
					drainSway[slot] = rand(0, TAU);
				}
				const k = drainPhase[slot];
				p.x = spot[0] + 26 * Math.sin(drainSway[slot]) * (0.3 + k) + 34 * k * k - cx;
				p.y = spot[1] - 215 * k ** 0.85 - cy;
				p.scaleX = p.scaleY = (30 + 125 * k) / (CELL * 0.6);
				p.rotation = drainSway[slot] + k * 0.8;
				p.tint = bgr(0xc4d8bc);
				p.alpha = 0.32 * Math.sin(Math.PI * k) ** 0.75;
			}
		}

		// mist over the floor (portrait: a haze above the board), drifting across and coming round again
		const band = art.mist;
		mist.forEach((m, i) => {
			const p = particles[AT_MIST + i];
			if (!band) return hide(p);
			m.x += m.v * dt * (1 + 1.2 * surge);
			if (m.x - m.size / 2 > band[2]) m.x = band[0] - m.size / 2;
			p.x = m.x - cx;
			p.y = m.y + 5 * Math.sin(clock * 0.31 + m.phase) - cy;
			p.scaleX = m.size / (CELL * 0.6);
			p.scaleY = p.scaleX * m.flat;
			p.rotation = 0;
			p.tint = bgr(art.warm ? 0xd9c6a4 : 0xa9c4a2);
			p.alpha = m.alpha * (0.72 + 0.28 * Math.sin(clock * 0.43 + m.phase * 2));
		});

		// a hard shake brings dust down from the pipes under the ceiling
		if (dustNow > 0) {
			const halfW = canvas.width / scale / 2;
			const top = cy - canvas.height / scale / 2;
			for (const g of dust) {
				if (dustNow <= 0) break;
				if (g.age < g.life) continue;
				Object.assign(g, { age: -rand(0, 0.35), life: rand(1.1, 1.9), x: cx + rand(-halfW, halfW), y: top + rand(-8, 30), vx: rand(-10, 10), vy: rand(40, 130), size: rand(3, 6.5) });
				dustNow -= 1;
			}
			dustNow = 0;
		}
		dust.forEach((g, i) => {
			const p = particles[AT_DUST + i];
			if (g.age >= g.life) return hide(p);
			g.age += dt;
			if (g.age < 0) return hide(p);
			g.vy += 220 * dt;
			g.x += g.vx * dt;
			g.y += g.vy * dt;
			p.x = g.x - cx;
			p.y = g.y - cy;
			p.scaleX = g.size / 64;
			p.scaleY = p.scaleX * (1 + Math.min(1.2, g.vy / 260));
			p.tint = bgr(art.warm ? 0xd8c8a8 : 0xaab89c);
			p.alpha = 0.55 * Math.min(1, g.age * 8) * (1 - g.age / g.life) ** 0.6;
		});
	};
</script>

<!-- over the backgrounds (zIndex -2), under everything else at the root -->
<Container zIndex={-1.5} x={canvas.width / 2} y={canvas.height / 2} {scale}>
	<!-- the power dips: the painting darkens under its lights -->
	<Rectangle
		anchor={0.5}
		width={art.width}
		height={art.height}
		backgroundColor={0x000000}
		alpha={dim}
		visible={dim > 0}
	/>
	<Sprite
		key={SHIMMER[artKey]}
		anchor={0.5}
		width={art.width}
		height={art.height}
		blendMode="add"
		alpha={Math.max(0, Math.min(1, shimmer))}
	/>
	{#if art.fan}
		<!-- light through the turning fan: shafts that sweep the wall round the porthole -->
		<Sprite
			key="cl2Rays"
			anchor={0.5}
			x={art.fan[0] - art.width / 2}
			y={art.fan[1] - art.height / 2}
			width={art.fan[2] * RAYS_REACH * 2}
			height={art.fan[2] * RAYS_REACH * 2}
			rotation={fanAngle}
			blendMode="add"
			tint={0x8dff5a}
			alpha={raysAlpha}
		/>
		<Sprite
			key={FAN[artKey]}
			anchor={0.5}
			x={art.fan[0] - art.width / 2}
			y={art.fan[1] - art.height / 2}
			width={2 * art.fan[2] + 4}
			height={2 * art.fan[2] + 4}
			rotation={fanAngle}
		/>
	{/if}
	<ParticleContainer blendMode="add">
		<Particles key="cl2SceneLife" size={LIT} init={initLit} update={updateLit} />
	</ParticleContainer>
	<ParticleContainer>
		<Particles key="cl2SceneLife" size={SMOKE} init={initSmoke} update={updateSmoke} />
	</ParticleContainer>
</Container>
