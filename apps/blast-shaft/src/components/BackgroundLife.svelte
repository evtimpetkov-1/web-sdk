<script lang="ts">
	import { Container, ParticleContainer, Particles, PixiRectangle, Sprite, Texture } from 'pixi-svelte';
	import type { Particle } from 'pixi.js';

	import { getContext } from '../game/context';
	import { BG_LIFE, type BgLife } from '../game/bgLife';
	import { draughtNow, reducedMotion } from '../game/draught';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	/**
	 * The mine is alive (Evtim, 2026-11-13: "remove the mascot here, instead we will
	 * try to animate the background ... some gold effects to the ore, some dust
	 * falling down from time to time, the lantern can have some idle animation").
	 * Nothing in the painting moves: light and particles are drawn over it, placed
	 * by points measured off the art (game/bgLife.ts, written by
	 * art-review/blast-shaft/build_bg_life.py).
	 * - lanterns: a warm halo and a flame core on each, flickering on their own
	 *   rhythms, and guttering now and then (and whenever the mine shakes)
	 * - gold: the veins and the cart's load breathe (the art's gold alone, drawn
	 *   additively) and throw glints, a few at a time, more in free spins
	 * - air: dust motes drift and catch the lantern light; in free spins they are
	 *   gold embers rising
	 * - dust: every few seconds a thin fall of dust, sometimes a pebble, from a
	 *   point under the roof; a shake of the board (SceneShake) brings several down
	 * 2026-11-17, after the second review ("The background is too static": all of the
	 * above was in that build, but it is small and sits at the sides). Added, large
	 * and always on, all driven by ONE draught (game/draught.ts, as Dynamite Gulch's
	 * wind drives its street):
	 * - the dust in the air STREAMS out of the tunnel towards the viewer, slowly in
	 *   still air, fast in a gust, and a blast in the reels blows it out
	 * - banks of lit haze drift across the roof and along the floor
	 * - lamp light sways over the rock (one pool on the roof, one low down), so the
	 *   stone itself seems to move; it is what a phone held upright sees most of
	 * - the lantern flames gutter in the gusts, their light swells and sinks, and
	 *   moths circle the two near lanterns
	 * - dust comes off the roof about twice as often
	 * The version the reviewers saw: art-review/alt/bg_life_v1_2026-11-17/restore.sh
	 * One additive and one normal ParticleContainer on the shared atlas, stepped on
	 * the Pixi ticker: no Svelte state per particle. Mounted once (Background) and
	 * kept: pixi-svelte's Particles never removes its ticker callback.
	 * Drawn in art px about the art's centre, inside a container that cover-fits
	 * exactly as the background sprite does.
	 */
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isFreeSpins = $derived(context.stateGame.gameType === 'freegame');
	// the same choice Background makes: free spins has one (landscape) painting
	const artKey = $derived<'base' | 'fs' | 'portrait'>(
		isFreeSpins ? 'fs' : canvas.height > canvas.width ? 'portrait' : 'base',
	);
	const art = $derived(BG_LIFE[artKey]);
	const scale = $derived(Math.max(canvas.width / art.width, canvas.height / art.height));
	const SHIMMER = { base: 'bsShimmerBase', fs: 'bsShimmerFs', portrait: 'bsShimmerPortrait' } as const;

	// atlas cells (128 px): soft glow, 4-point glint, dust speck, pebble
	const CELL = 128;
	const GLOW = 0;
	const STAR = 1;
	const SPECK = 2;
	const CHUNK = 3;
	const cells = (particles: Particle[]) => {
		const source = particles[0].texture.source;
		return [0, 1, 2, 3].map(
			(i) => new Texture({ source, frame: new PixiRectangle(i * CELL, 0, CELL, CELL) }),
		);
	};

	// Pixi 8.8's Particle stores a NUMBER tint as it is, and its colour is BGR: a plain
	// 0xRRGGBB comes out with red and blue swapped (warm dust drew ice-blue). Every
	// tint goes through this.
	const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};

	// the reel frame in art px: what it covers is not worth a glint or a dust fall
	const frameInArt = () => {
		const main = context.stateLayoutDerived.mainLayout();
		const frame = context.stateGameDerived.frameLayout();
		const toArt = (mainX: number, mainY: number) => ({
			x: (main.x + (mainX - main.width * 0.5) * main.scale - canvas.width / 2) / scale + art.width / 2,
			y: (main.y + (mainY - main.height * 0.5) * main.scale - canvas.height / 2) / scale + art.height / 2,
		});
		const a = toArt(frame.x - frame.width / 2, frame.y - frame.height / 2);
		const b = toArt(frame.x + frame.width / 2, frame.y + frame.height / 2);
		return { left: a.x, top: a.y, right: b.x, bottom: b.y };
	};
	// seen = on the canvas and not behind the frame
	const seen = (x: number, y: number, frame: ReturnType<typeof frameInArt>) => {
		const halfW = canvas.width / scale / 2;
		const halfH = canvas.height / scale / 2;
		if (Math.abs(x - art.width / 2) > halfW || Math.abs(y - art.height / 2) > halfH + 60) return false;
		return !(x > frame.left && x < frame.right && y > frame.top && y < frame.bottom);
	};

	const still = reducedMotion();
	let shimmer = $state(0.4);
	let clock = 0;
	let last = 0;
	let shownArt: BgLife | undefined;
	// a shake of the board, waiting to be answered by the scene (set by sceneShake)
	let jolt = 0;
	let falls = 0;

	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const strength = (SHAKE_PRESETS[preset] as { trauma?: number; kick?: number }).trauma ?? 0.3;
			jolt = Math.max(jolt, strength);
			// a cascade landing brings dust down only now and then; a blast always does
			if (strength >= 0.5) falls += Math.round(2 + strength * 3);
			else if (Math.random() < 0.3) falls += 1;
		},
	});

	// ---------------------------------------------------------------- the lit things
	const LANTERNS = 3;
	const GLINTS = 12;
	const MOTES = 64;
	const SWAYS = 2;
	const HAZE = 6;
	const MOTHS = 6; // three round each near lantern
	const MOTE0 = LANTERNS * 2 + GLINTS;
	const SWAY0 = MOTE0 + MOTES;
	const HAZE0 = SWAY0 + SWAYS;
	const MOTH0 = HAZE0 + HAZE;
	const LIT = MOTH0 + MOTHS;
	type Glint = { life: number; age: number; x: number; y: number; size: number; spin: number };
	type Mote = { x: number; y: number; depth: number; size: number; phase: number; age: number };
	// a bank of haze: x, y, width, height in visible heights about the screen's centre
	type Bank = { x: number; y: number; w: number; h: number; v: number; phase: number };
	const banks: Bank[] = [];
	const glints: Glint[] = Array.from({ length: GLINTS }, () => ({ life: 0, age: 0, x: 0, y: 0, size: 0, spin: 0 }));
	const motes: Mote[] = [];
	const lamps = Array.from({ length: LANTERNS }, (_, i) => ({ phase: i * 2.1 + 0.7, gutter: 0, next: rand(3, 8) }));
	let glintWait = 0;

	// what the canvas shows of the painting, in art px
	const view = () => ({ halfW: canvas.width / scale / 2, halfH: canvas.height / scale / 2 });
	// a mote somewhere on the screen; it fades in, so one put down in plain sight never pops
	const placeMote = (m: Mote, age = 0) => {
		const { halfW, halfH } = view();
		m.x = art.width / 2 + rand(-halfW, halfW);
		m.y = art.height / 2 + rand(-halfH, halfH);
		m.depth = rand(0.5, 1.5);
		m.size = rand(8, 17);
		m.phase = rand(0, 6.28);
		m.age = age;
	};
	const seedMotes = () => {
		motes.length = 0;
		for (let i = 0; i < MOTES; i++) {
			const m = {} as Mote;
			placeMote(m, rand(0, 3));
			motes.push(m);
		}
		banks.length = 0;
		for (let i = 0; i < HAZE; i++) {
			banks.push({
				x: rand(-1, 1),
				// half of them under the roof, half along the floor
				y: i % 2 ? rand(0.14, 0.42) : rand(-0.44, -0.18),
				w: rand(0.9, 1.5),
				h: rand(0.24, 0.38),
				v: rand(0.012, 0.03),
				phase: rand(0, 6.28),
			});
		}
	};

	const initLit = (particles: Particle[]) => {
		const tex = cells(particles);
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture =
				i < LANTERNS * 2 ? tex[GLOW] : i < MOTE0 ? tex[STAR] : i < SWAY0 ? tex[SPECK] : i < MOTH0 ? tex[GLOW] : tex[SPECK];
			hide(p);
		});
	};

	const updateLit = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
		last = now;
		clock += dt;
		if (shownArt !== art) {
			// another painting (free spins, a rotated phone): start over on its points
			shownArt = art;
			glints.forEach((g) => (g.life = 0));
			seedMotes();
		}
		const frame = frameInArt();
		const cx = art.width / 2;
		const cy = art.height / 2;
		const fs = isFreeSpins;
		const { halfW, halfH } = view();
		const visH = 2 * halfH;
		// what the light pools and haze banks are sized by: a phone held upright is narrow,
		// and a pool sized by its height lit the whole roof evenly (a flat brown wash)
		const span = Math.min(visH, halfW * 2.4);
		const draught = still ? 0 : draughtNow();

		// the veins breathe; one write a frame
		shimmer = (fs ? 0.5 : 0.42) + (fs ? 0.4 : 0.34) * Math.sin((2 * Math.PI * clock) / 5.5) + 0.25 * jolt;

		// lanterns: two slow sines and a fast one, a gutter now and then, a jolt on a shake
		art.lanterns.forEach(([x, y, radius], i) => {
			const lamp = lamps[i];
			lamp.next -= dt;
			if (lamp.next <= 0) {
				lamp.gutter = 1;
				lamp.next = rand(4, 11);
			}
			lamp.gutter = Math.max(0, lamp.gutter - dt * 5);
			const t = clock + lamp.phase;
			const flame =
				0.84 +
				0.09 * Math.sin(2 * Math.PI * 1.3 * t) +
				0.05 * Math.sin(2 * Math.PI * 3.7 * t + lamp.phase) +
				0.03 * Math.sin(2 * Math.PI * 9.1 * t) -
				// a gust makes the flame gutter, all the lanterns together
				0.2 * draught * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7.3 * t)) -
				0.34 * lamp.gutter -
				0.3 * jolt * (0.5 + 0.5 * Math.sin(2 * Math.PI * 13 * t));
			const halo = particles[i * 2];
			halo.x = x - cx;
			halo.y = y - cy;
			halo.scaleX = halo.scaleY = ((2 * radius) / CELL) * (0.94 + 0.08 * flame);
			halo.tint = bgr(fs ? 0xffa040 : 0xff8c32);
			// the pool of light swells and sinks slowly, so the wall beside it is never still
			halo.alpha = (fs ? 0.34 : 0.3) * flame * (still ? 1 : 1.08 + 0.3 * Math.sin((2 * Math.PI * t) / 3.1));
			const core = particles[i * 2 + 1];
			core.x = x - cx + 1.2 * Math.sin(2 * Math.PI * 5.3 * t) + radius * 0.02 * draught;
			core.y = y - cy - 2 * Math.sin(2 * Math.PI * 4.1 * t + 1);
			core.scaleX = ((radius * 0.27) / CELL) * (0.9 + 0.12 * flame);
			core.scaleY = core.scaleX * (1.1 + 0.16 * Math.sin(2 * Math.PI * 6.7 * t));
			core.tint = bgr(0xffc470);
			core.alpha = 0.5 * flame;
		});

		// glints on the gold: a few at a time, where the frame does not cover it
		glintWait -= dt;
		if (glintWait <= 0 && art.gold.length) {
			glintWait = fs ? rand(0.08, 0.22) : rand(0.25, 0.6);
			const free = glints.find((g) => g.age >= g.life);
			if (free) {
				for (let tries = 0; tries < 6; tries++) {
					const [x, y, weight] = art.gold[Math.floor(Math.random() * art.gold.length)];
					if (!seen(x, y, frame) || Math.random() > 0.35 + weight) continue;
					Object.assign(free, {
						x: x + rand(-6, 6),
						y: y + rand(-6, 6),
						age: 0,
						life: rand(0.55, 1.2),
						size: (26 + 34 * weight) * rand(0.8, 1.25),
						spin: rand(-0.5, 0.5),
					});
					break;
				}
			}
		}
		glints.forEach((g, i) => {
			const p = particles[LANTERNS * 2 + i];
			if (g.age >= g.life) return hide(p);
			g.age += dt;
			const k = Math.sin(Math.PI * Math.min(1, g.age / g.life));
			p.x = g.x - cx;
			p.y = g.y - cy;
			p.scaleX = p.scaleY = (g.size / 80) * (0.25 + 0.75 * k);
			p.rotation = g.spin * (g.age / g.life);
			p.tint = bgr(0xffecb0);
			p.alpha = Math.min(1, k * 1.25);
		});

		// the dust in the air streams out of the tunnel (the far lamp marks where it runs
		// to) towards the viewer: slowly in still air, fast in a gust, and a blast blows
		// it out. Lit where a lantern reaches it; in free spins, gold embers that rise.
		const [farX, farY] = art.lanterns[2];
		const pace = still ? 0 : (0.022 + 0.085 * draught + 0.3 * jolt) * visH;
		motes.forEach((m, i) => {
			const p = particles[MOTE0 + i];
			const dx = m.x - farX;
			const dy = m.y - farY;
			const dist = Math.hypot(dx, dy) || 1;
			const near = dist / visH; // 0 at the tunnel's end, about 0.8 at the screen's edge
			const v = pace * m.depth * (0.35 + near); // what comes at you speeds up
			m.x += ((dx / dist) * v + 5 * Math.sin(clock * 0.7 + m.phase)) * dt;
			m.y += ((dy / dist) * v + 4 * Math.sin(clock * 0.9 + 2 * m.phase) - (fs ? 16 : 3)) * dt;
			m.age += dt;
			if (Math.abs(m.x - cx) > halfW + 12 || Math.abs(m.y - cy) > halfH + 12) placeMote(m);
			let light = (fs ? 0.55 : 0.3) + 0.22 * draught;
			for (const [lx, ly, radius] of art.lanterns) {
				const d = Math.hypot(m.x - lx, m.y - ly) / (radius * 1.7);
				if (d < 1) light = Math.max(light, 0.95 * (1 - d) ** 1.3);
			}
			p.x = m.x - cx;
			p.y = m.y - cy;
			p.scaleX = p.scaleY = (m.size / 70) * (0.7 + 1.1 * near);
			// warm, or pale specks on dark rock read as snow
			p.tint = bgr(fs ? 0xffc850 : 0xffb464);
			p.alpha = light * (0.65 + 0.35 * Math.sin(clock * 1.9 + m.phase)) * Math.min(1, m.age / 0.8);
		});

		// lamp light sways over the rock: one pool on the roof, one low down
		for (let k = 0; k < SWAYS; k++) {
			const p = particles[SWAY0 + k];
			if (still) {
				hide(p);
				continue;
			}
			const t = clock * (k ? 0.83 : 1) + k * 2.4;
			p.x = (0.62 * Math.sin((2 * Math.PI * t) / 7.1) + 0.1 * Math.sin((2 * Math.PI * t) / 2.9 + 1)) * halfW;
			p.y = (k ? 0.46 : -0.74) * halfH;
			const r = span * (k ? 0.46 : 0.6);
			p.scaleX = ((2 * r) / CELL) * 1.5;
			p.scaleY = (2 * r) / CELL;
			p.tint = bgr(fs ? 0xffb050 : 0xff8c32);
			// (the atlas glow is a narrow bell, 0.2 at half its radius: a wide pool needs a high peak)
			p.alpha = (k ? 0.24 : 0.33) * (0.82 + 0.18 * Math.sin(2 * Math.PI * 1.1 * t)) * (1 + 0.35 * draught) + 0.25 * jolt;
		}

		// haze: banks of lit dust drifting one way, thicker and faster in a gust
		const reach = halfW / visH;
		banks.forEach((bank, i) => {
			const p = particles[HAZE0 + i];
			if (still) return hide(p);
			bank.x += bank.v * (0.5 + 2.2 * draught) * dt;
			if (bank.x - bank.w / 2 > reach) bank.x = -reach - bank.w / 2;
			p.x = bank.x * visH;
			p.y = bank.y * visH;
			p.scaleX = (bank.w * span) / CELL;
			p.scaleY = (bank.h * span) / CELL;
			p.tint = bgr(fs ? 0xc89040 : 0xa87848);
			// enough to be seen drifting, not so much that the rock's blacks go milky
			p.alpha = (0.13 + 0.1 * draught) * (0.6 + 0.4 * Math.sin(clock * 0.31 + bank.phase));
		});

		// moths round the two near lanterns: specks on restless loops, their wings a flutter
		for (let j = 0; j < MOTHS; j++) {
			const p = particles[MOTH0 + j];
			const [lx, ly, radius] = art.lanterns[j % 2];
			if (still || !seen(lx, ly, frame)) {
				hide(p);
				continue;
			}
			const a = clock * (2.3 + 0.7 * j) * (j % 3 ? 1 : -1) + j * 1.9;
			const r = radius * (0.24 + 0.1 * Math.sin(clock * 1.7 + j * 2.1));
			p.x = lx - cx + r * Math.cos(a) + 5 * Math.sin(clock * 9 + j);
			p.y = ly - cy - radius * 0.06 + r * 0.62 * Math.sin(a * 1.3 + j);
			const wing = 0.55 + 0.45 * Math.sin(clock * 31 + j * 1.7);
			p.scaleX = p.scaleY = (17 / 70) * (0.8 + 0.35 * wing);
			p.tint = bgr(0xffe2b0);
			p.alpha = 0.8 * wing;
		}

		jolt = Math.max(0, jolt - dt * 1.6);
	};

	// ---------------------------------------------------------------- dust from the roof
	const SPECKS = 84;
	const PUFFS = 6;
	const PEBBLES = 6;
	const DUST = SPECKS + PUFFS + PEBBLES;
	const GRAVITY = 240;
	type Grain = { age: number; life: number; delay: number; x: number; y: number; vx: number; vy: number; size: number; spin: number; shade: number };
	const grain = (): Grain => ({ age: 1, life: 0, delay: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, spin: 0, shade: 0 });
	const specks = Array.from({ length: SPECKS }, grain);
	const puffs = Array.from({ length: PUFFS }, grain);
	const pebbles = Array.from({ length: PEBBLES }, grain);
	// lit dust: lighter than the rock it falls in front of, or it is not seen at all
	const SHADES = [0xd2c2a8, 0xb8a890, 0xe2d4bc, 0x9a8c7a];
	let fallWait = rand(2.5, 5);
	let dustLast = 0;

	const startFall = (frame: ReturnType<typeof frameInArt>) => {
		const open = art.drops.filter(([x, y]) => seen(x, Math.max(y, art.height / 2 - canvas.height / scale / 2 + 4), frame));
		if (!open.length) return;
		const [sx, sy0] = open[Math.floor(Math.random() * open.length)];
		// a point above the screen's top edge falls in from the edge
		const sy = Math.max(sy0, art.height / 2 - canvas.height / scale / 2 - 6);
		let n = Math.round(rand(22, 32));
		for (const g of specks) {
			if (g.age < g.life + g.delay) continue;
			Object.assign(g, {
				age: 0,
				delay: rand(0, 0.9),
				life: rand(1.2, 2.1),
				x: sx + rand(-9, 9),
				y: sy + rand(-3, 3),
				vx: rand(-11, 11),
				vy: rand(30, 110),
				size: rand(3.5, 7.5),
				shade: SHADES[Math.floor(Math.random() * SHADES.length)],
			});
			if (--n <= 0) break;
		}
		const puff = puffs.find((g) => g.age >= g.life + g.delay);
		if (puff) Object.assign(puff, { age: 0, delay: 0, life: rand(1.5, 2.2), x: sx, y: sy + 10, vx: rand(-5, 5), vy: rand(26, 42), size: rand(34, 52) });
		if (Math.random() < 0.45) {
			const pebble = pebbles.find((g) => g.age >= g.life + g.delay);
			if (pebble) Object.assign(pebble, { age: 0, delay: rand(0.05, 0.3), life: rand(1.0, 1.5), x: sx + rand(-8, 8), y: sy, vx: rand(-20, 20), vy: rand(60, 130), size: rand(7, 12), spin: rand(-9, 9), shade: SHADES[Math.floor(Math.random() * 2) + 2] });
		}
	};

	const initDust = (particles: Particle[]) => {
		const tex = cells(particles);
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = i < SPECKS ? tex[SPECK] : i < SPECKS + PUFFS ? tex[GLOW] : tex[CHUNK];
			hide(p);
		});
	};

	const updateDust = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(0.05, dustLast ? (now - dustLast) / 1000 : 0.016);
		dustLast = now;
		const cx = art.width / 2;
		const cy = art.height / 2;
		fallWait -= dt;
		if (fallWait <= 0) {
			fallWait = rand(2.2, 5.5);
			falls += 1;
		}
		if (falls > 0) {
			const frame = frameInArt();
			for (let i = Math.min(falls, 5); i > 0; i--) startFall(frame);
			falls = 0;
		}
		const step = (g: Grain, p: Particle, kind: 'speck' | 'puff' | 'pebble') => {
			if (g.age >= g.life + g.delay) return hide(p);
			g.age += dt;
			const t = g.age - g.delay;
			if (t < 0) return hide(p);
			const k = t / g.life;
			if (kind !== 'puff') g.vy += GRAVITY * dt * (kind === 'pebble' ? 1.6 : 1);
			g.x += g.vx * dt;
			g.y += g.vy * dt;
			p.x = g.x - cx;
			p.y = g.y - cy;
			if (kind === 'puff') {
				p.scaleX = p.scaleY = ((g.size * 2) / CELL) * (0.6 + 1.6 * k);
				p.tint = bgr(0xa89884);
				p.alpha = 0.4 * Math.sin(Math.PI * Math.min(1, k)) ** 0.8;
			} else if (kind === 'pebble') {
				p.scaleX = p.scaleY = g.size / 90;
				p.rotation = g.spin * t;
				p.tint = bgr(g.shade);
				p.alpha = Math.min(1, (1 - k) * 4);
			} else {
				p.scaleX = g.size / 70;
				p.scaleY = p.scaleX * (1 + Math.min(1.2, g.vy / 260)); // a falling grain streaks
				p.tint = bgr(g.shade);
				p.alpha = Math.min(1, t * 8) * (1 - k) ** 0.6;
			}
		};
		specks.forEach((g, i) => step(g, particles[i], 'speck'));
		puffs.forEach((g, i) => step(g, particles[SPECKS + i], 'puff'));
		pebbles.forEach((g, i) => step(g, particles[SPECKS + PUFFS + i], 'pebble'));
	};
</script>

<!-- over the backgrounds (zIndex -2), under everything else at the root -->
<Container zIndex={-1.5} x={canvas.width / 2} y={canvas.height / 2} {scale}>
	<Sprite
		key={SHIMMER[artKey]}
		anchor={0.5}
		width={art.width}
		height={art.height}
		blendMode="add"
		alpha={Math.max(0, Math.min(1, shimmer))}
	/>
	<ParticleContainer blendMode="add">
		<Particles key="bsBgLife" size={LIT} init={initLit} update={updateLit} />
	</ParticleContainer>
	<ParticleContainer>
		<Particles key="bsBgLife" size={DUST} init={initDust} update={updateDust} />
	</ParticleContainer>
</Container>
