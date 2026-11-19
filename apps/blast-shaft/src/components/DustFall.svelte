<script lang="ts">
	// Dust off the roof, in front of everything (Evtim, 2026-11-16: "drop some dust
	// from top of the screen on intro/outro, also on explosions in the reels, similar
	// to the earthquake effect"). BackgroundLife already drops thin falls BEHIND the
	// reels; this is the near layer: streams of lit dust, a soft cloud under the top
	// edge and a pebble now and then, coming down across the whole screen when the
	// mine takes a hit:
	// - every strong board shake (SceneShake: a bomb, the cloners bursting, the free
	//   spins trigger, each big-win title), more streams the harder the shake; the
	//   Wild's slam brings a couple, a cascade landing one now and then
	// - the free spins notice board dropping in on its ropes (intro and outro)
	// Canvas px, one ParticleContainer on BackgroundLife's atlas, stepped on the Pixi
	// ticker (no Svelte state per grain). Mounted once: pixi-svelte's Particles never
	// removes its ticker callback. Nothing falls under prefers-reduced-motion.
	import { ParticleContainer, Particles, PixiRectangle, Texture } from 'pixi-svelte';
	import type { Particle } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	const context = getContext();
	const still =
		typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	// BackgroundLife's atlas cells (128 px): soft glow, 4-point glint, dust speck, pebble
	const CELL = 128;
	const GLOW = 0;
	const SPECK = 2;
	const CHUNK = 3;
	const SPECKS = 220;
	const PUFFS = 14;
	const PEBBLES = 16;
	const TOTAL = SPECKS + PUFFS + PEBBLES;
	// lit dust: lighter than whatever it falls in front of
	const SHADES = [0xd8c8ac, 0xbfae94, 0xe6d8be, 0xa39480];
	// over the popups, under the curtains (Transition's CURTAIN_Z)
	const DUST_Z = 50;
	// the board lands about this long after the popup starts to drop
	const BOARD_LANDS_MS = 480;

	type Grain = {
		age: number;
		life: number;
		delay: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		size: number;
		spin: number;
		shade: number;
	};
	const grain = (): Grain => ({ age: 1, life: 0, delay: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, spin: 0, shade: 0 });
	const specks = Array.from({ length: SPECKS }, grain);
	const puffs = Array.from({ length: PUFFS }, grain);
	const pebbles = Array.from({ length: PEBBLES }, grain);
	// Pixi 8.8's Particle stores a NUMBER tint as it is, and its colour is BGR: a plain
	// 0xRRGGBB comes out with red and blue swapped (warm dust drew ice-blue). Every
	// tint goes through this.
	const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	const free = (g: Grain) => g.age >= g.life + g.delay;

	// streams waiting to start (set by the events, started on the ticker)
	let pending = 0;
	const bring = (streams: number) => {
		if (!still) pending = Math.min(16, pending + streams);
	};
	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const { trauma = 0, kick = 0 } = SHAKE_PRESETS[preset] as { trauma?: number; kick?: number };
			if (trauma >= 0.5) bring(Math.round(3 + trauma * 9));
			else if (kick >= 0.5) bring(2);
			else if (trauma >= 0.3 && Math.random() < 0.3) bring(1);
		},
		freeSpinIntroShow: () => setTimeout(() => bring(10), BOARD_LANDS_MS),
		freeSpinOutroShow: () => setTimeout(() => bring(10), BOARD_LANDS_MS),
	});

	const startStream = (width: number, u: number) => {
		const x = rand(0.03, 0.97) * width;
		let n = Math.round(rand(12, 20));
		for (const g of specks) {
			if (!free(g)) continue;
			Object.assign(g, {
				age: 0,
				delay: rand(0, 1.1),
				life: rand(1.3, 2.3),
				x: x + rand(-16, 16) * u,
				y: rand(-14, -2) * u,
				vx: rand(-14, 14) * u,
				vy: rand(40, 150) * u,
				size: rand(4, 9) * u,
				shade: SHADES[Math.floor(Math.random() * SHADES.length)],
			});
			if (--n <= 0) break;
		}
		const puff = puffs.find(free);
		if (puff) {
			Object.assign(puff, { age: 0, delay: 0, life: rand(1.6, 2.4), x, y: rand(0, 14) * u, vx: rand(-8, 8) * u, vy: rand(26, 46) * u, size: rand(46, 84) * u });
		}
		if (Math.random() < 0.5) {
			const pebble = pebbles.find(free);
			if (pebble) {
				Object.assign(pebble, { age: 0, delay: rand(0.05, 0.4), life: rand(1.1, 1.7), x: x + rand(-12, 12) * u, y: -8 * u, vx: rand(-26, 26) * u, vy: rand(90, 190) * u, size: rand(7, 13) * u, spin: rand(-9, 9), shade: SHADES[2 + Math.floor(Math.random() * 2)] });
			}
		}
	};

	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};
	const init = (particles: Particle[]) => {
		const source = particles[0].texture.source;
		const tex = [GLOW, SPECK, CHUNK].map((i) => new Texture({ source, frame: new PixiRectangle(i * CELL, 0, CELL, CELL) }));
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = i < SPECKS ? tex[1] : i < SPECKS + PUFFS ? tex[0] : tex[2];
			hide(p);
		});
	};

	let last = 0;
	const update = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
		last = now;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// sizes and speeds in units of a 675-high screen
		const u = height / 675;
		const gravity = 430 * u;
		// a few streams a frame, so a blast's dust arrives as a ragged curtain
		for (let i = Math.min(pending, 3); i > 0; i--, pending--) startStream(width, u);
		const step = (g: Grain, p: Particle, kind: 'speck' | 'puff' | 'pebble') => {
			if (free(g)) return hide(p);
			g.age += dt;
			const t = g.age - g.delay;
			if (t < 0) return hide(p);
			const k = Math.min(1, t / g.life);
			if (kind !== 'puff') g.vy += gravity * dt * (kind === 'pebble' ? 1.5 : 1);
			g.x += g.vx * dt;
			g.y += g.vy * dt;
			p.x = g.x;
			p.y = g.y;
			if (kind === 'puff') {
				p.scaleX = p.scaleY = ((g.size * 2) / CELL) * (0.6 + 1.7 * k);
				p.tint = bgr(0xb0a08a);
				p.alpha = 0.34 * Math.sin(Math.PI * k) ** 0.8;
			} else if (kind === 'pebble') {
				p.scaleX = p.scaleY = g.size / 90;
				p.rotation = g.spin * t;
				p.tint = bgr(g.shade);
				p.alpha = Math.min(1, (1 - k) * 4);
			} else {
				p.scaleX = g.size / 70;
				p.scaleY = p.scaleX * (1 + Math.min(1.6, g.vy / (300 * u))); // a falling grain streaks
				p.tint = bgr(g.shade);
				p.alpha = 0.9 * Math.min(1, t * 8) * (1 - k) ** 0.6;
			}
		};
		specks.forEach((g, i) => step(g, particles[i], 'speck'));
		puffs.forEach((g, i) => step(g, particles[SPECKS + i], 'puff'));
		pebbles.forEach((g, i) => step(g, particles[SPECKS + PUFFS + i], 'pebble'));
	};
</script>

<!-- zIndex: popups mount when shown and would otherwise land above a layer mounted at
     the start (pixi-svelte appends remounted children); still under the curtains -->
<ParticleContainer zIndex={DUST_Z}>
	<Particles key="bsBgLife" size={TOTAL} {init} {update} />
</ParticleContainer>
