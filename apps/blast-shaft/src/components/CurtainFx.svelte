<script lang="ts">
	// What the curtains throw off (2026-11-24, after the third review; Evtim: "we need
	// more excitement when we show the curtains - maybe some dust, after all it should
	// be celebration we won free spins"). Transition.svelte owns the cloth and calls:
	//   thud()        the two sides meet: dust shaken off the rod and out of the seam
	//   setCharge(k)  free spins are behind them: gold light leaks through the seam,
	//                 0..1, with glints climbing it and sparks escaping
	//   burst()       they are thrown open: a flash and a fan of light from the seam,
	//                 dust blown out to both sides, sparks and gold nuggets in the air
	//   puff()        an ordinary opening: a little dust off the parting edges
	// Canvas px, drawn inside the curtain's own layer (above everything). Three
	// ParticleContainers on two small atlases the game already has: dust on
	// BackgroundLife's (soft puff, speck, pebble), nuggets and light on GoldFx's
	// (glow, star, four nuggets). Stepped on the Pixi ticker, no Svelte state per
	// particle. Mounted once and never inside an {#if}: pixi-svelte's Particles never
	// removes its ticker callback. Nothing is thrown under prefers-reduced-motion.
	import { ParticleContainer, Particles, PixiRectangle, Texture } from 'pixi-svelte';
	import type { Particle } from 'pixi.js';

	import { getContext } from '../game/context';

	const context = getContext();
	const still =
		typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	const CELL = 128;
	// Pixi 8.8's Particle reads a NUMBER tint as blue-green-red
	const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
	const size = () => context.stateLayoutDerived.canvasSizes();
	/** sizes and speeds are written for a 675-high landscape screen; an upright phone is measured by its width instead, or everything would be drawn a third too large for it */
	const unit = () => Math.min(size().height, size().width * 1.6) / 675;

	type Bit = {
		age: number;
		life: number;
		delay: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		size: number;
		grow: number;
		spin: number;
		shade: number;
		gravity: number;
		drag: number;
		alpha: number;
	};
	const bit = (): Bit => ({ age: 1, life: 0, delay: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, grow: 0, spin: 0, shade: 0xffffff, gravity: 0, drag: 0, alpha: 1 });
	const pool = (n: number) => Array.from({ length: n }, bit);
	const free = (b: Bit) => b.age >= b.life + b.delay;
	const take = (list: Bit[], values: Partial<Bit>) => {
		const b = list.find(free);
		if (b) Object.assign(b, bit(), { age: 0 }, values);
	};
	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};
	/** moves a bit one step; false while it waits or once it is spent */
	const step = (b: Bit, dt: number) => {
		if (free(b)) return false;
		b.age += dt;
		if (b.age < b.delay) return false;
		b.vy += b.gravity * dt;
		if (b.drag) {
			const k = Math.exp(-b.drag * dt);
			b.vx *= k;
			b.vy *= k;
		}
		b.x += b.vx * dt;
		b.y += b.vy * dt;
		return true;
	};
	const clock = () => {
		let last = 0;
		return () => {
			const now = performance.now();
			const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
			last = now;
			return dt;
		};
	};

	// ---------------------------------------------------------------- dust (normal blend)
	const PUFFS = 56;
	const SPECKS = 280;
	const PEBBLES = 14;
	const puffs = pool(PUFFS);
	const specks = pool(SPECKS);
	const pebbles = pool(PEBBLES);
	const DUST = [0xd8c8ac, 0xbfae94, 0xe6d8be, 0xa39480];

	// ---------------------------------------------------------------- gold (normal blend)
	const NUGGETS = 44;
	const nuggets = pool(NUGGETS);

	// ---------------------------------------------------------------- light (additive)
	const SEAM = 5;
	const RAYS = 12;
	const STARS = 40;
	const SPARKS = 120;
	const stars = pool(STARS);
	const sparks = pool(SPARKS);
	let charge = 0; // the seam's light, 0..1 (Transition sets it every frame while it charges)
	let flash = 0; // the burst's flood of light, decays by itself
	let raysAge = 9; // seconds since the burst
	const RAYS_S = 0.85;
	const GOLD = [0xffd27a, 0xffe7b0, 0xffb347, 0xfff4d6];

	export const thud = () => {
		if (still) return;
		const { width, height } = size();
		const u = unit();
		// shaken off the rod, right across the screen
		for (let i = 0; i < 16; i++) {
			take(puffs, { life: rand(1.1, 1.8), delay: rand(0, 0.12), x: rand(0, width), y: rand(-6, 24) * u, vx: rand(-10, 10) * u, vy: rand(26, 64) * u, size: rand(44, 86) * u, grow: 1.5, alpha: 0.3 });
		}
		for (let i = 0; i < 120; i++) {
			take(specks, { life: rand(0.9, 1.7), delay: rand(0, 0.3), x: rand(0, width), y: rand(-10, 14) * u, vx: rand(-12, 12) * u, vy: rand(40, 190) * u, size: rand(4, 9) * u, gravity: 430 * u, shade: pick(DUST), alpha: 0.9 });
		}
		for (let i = 0; i < 6; i++) {
			take(pebbles, { life: rand(1.0, 1.5), delay: rand(0, 0.25), x: rand(0.05, 0.95) * width, y: -8 * u, vx: rand(-24, 24) * u, vy: rand(90, 180) * u, size: rand(7, 12) * u, gravity: 640 * u, spin: rand(-9, 9), shade: pick(DUST) });
		}
		// and squeezed out of the seam where the two sides meet
		for (let i = 0; i < 12; i++) {
			const side = i % 2 ? 1 : -1;
			take(puffs, { life: rand(0.8, 1.3), x: width / 2 + side * rand(4, 26) * u, y: rand(0.08, 0.96) * height, vx: side * rand(30, 110) * u, vy: rand(-12, 26) * u, drag: 2.4, size: rand(34, 66) * u, grow: 1.4, alpha: 0.34 });
		}
	};

	export const puff = () => {
		if (still) return;
		const { width, height } = size();
		const u = unit();
		for (let i = 0; i < 14; i++) {
			const side = i % 2 ? 1 : -1;
			take(puffs, { life: rand(0.8, 1.3), delay: rand(0.05, 0.2), x: width / 2 + side * rand(10, 60) * u, y: rand(0.05, 0.95) * height, vx: side * rand(90, 260) * u, vy: rand(-14, 30) * u, drag: 2.0, size: rand(40, 80) * u, grow: 1.6, alpha: 0.28 });
		}
		for (let i = 0; i < 50; i++) {
			const side = i % 2 ? 1 : -1;
			take(specks, { life: rand(0.8, 1.4), delay: rand(0.05, 0.3), x: width / 2 + side * rand(0, 50) * u, y: rand(0, 0.7) * height, vx: side * rand(40, 240) * u, vy: rand(-40, 80) * u, size: rand(4, 8) * u, gravity: 430 * u, shade: pick(DUST), alpha: 0.85 });
		}
	};

	export const setCharge = (level: number) => {
		charge = still ? 0 : clamp01(level);
	};

	export const burst = () => {
		if (still) return;
		const { width, height } = size();
		const u = unit();
		charge = 0;
		flash = 1;
		raysAge = 0;
		// dust blown out of the gap to both sides
		for (let i = 0; i < 30; i++) {
			const side = i % 2 ? 1 : -1;
			take(puffs, { life: rand(0.9, 1.5), delay: rand(0, 0.1), x: width / 2 + side * rand(0, 30) * u, y: rand(0.04, 0.98) * height, vx: side * rand(220, 720) * u, vy: rand(-50, 40) * u, drag: 2.3, size: rand(60, 120) * u, grow: 2.0, alpha: 0.36 });
		}
		for (let i = 0; i < 160; i++) {
			const side = i % 2 ? 1 : -1;
			take(specks, { life: rand(0.8, 1.6), delay: rand(0, 0.12), x: width / 2 + side * rand(0, 20) * u, y: rand(0.05, 0.9) * height, vx: side * rand(80, 760) * u, vy: rand(-380, 120) * u, drag: 0.9, size: rand(4, 10) * u, gravity: 520 * u, shade: pick(DUST), alpha: 0.95 });
		}
		for (let i = 0; i < 8; i++) {
			take(pebbles, { life: rand(1.0, 1.6), x: width / 2, y: rand(0.2, 0.8) * height, vx: rand(-520, 520) * u, vy: rand(-420, -80) * u, size: rand(8, 14) * u, gravity: 900 * u, spin: rand(-11, 11), shade: pick(DUST) });
		}
		// the celebration: gold thrown out of the light
		for (let i = 0; i < NUGGETS; i++) {
			const side = i % 2 ? 1 : -1;
			take(nuggets, { life: rand(1.2, 1.9), delay: rand(0, 0.16), x: width / 2 + side * rand(0, 24) * u, y: rand(0.3, 0.72) * height, vx: side * rand(120, 780) * u, vy: rand(-860, -300) * u, size: rand(20, 44) * u, gravity: 1350 * u, spin: rand(-8, 8) });
		}
		for (let i = 0; i < SPARKS; i++) {
			const angle = rand(0, Math.PI * 2);
			const speed = rand(180, 1050) * u;
			take(sparks, { life: rand(0.45, 1.15), delay: rand(0, 0.08), x: width / 2 + rand(-10, 10) * u, y: rand(0.25, 0.75) * height, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.7 - 160 * u, drag: 1.6, size: rand(7, 16) * u, gravity: 620 * u, shade: pick(GOLD) });
		}
		for (let i = 0; i < 26; i++) {
			take(stars, { life: rand(0.4, 0.8), delay: rand(0.02, 0.35), x: rand(0.12, 0.88) * width, y: rand(0.1, 0.85) * height, size: rand(40, 110) * u, spin: rand(-1.5, 1.5), shade: pick(GOLD) });
		}
	};

	// ---------------------------------------------------------------- stepping
	const initDust = (particles: Particle[]) => {
		const source = particles[0].texture.source;
		const tex = [0, 2, 3].map((i) => new Texture({ source, frame: new PixiRectangle(i * CELL, 0, CELL, CELL) }));
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = i < PUFFS ? tex[0] : i < PUFFS + SPECKS ? tex[1] : tex[2];
			hide(p);
		});
	};
	const dustClock = clock();
	const updateDust = (particles: Particle[]) => {
		const dt = dustClock();
		const u = unit();
		puffs.forEach((b, i) => {
			const p = particles[i];
			if (!step(b, dt)) return hide(p);
			const k = clamp01((b.age - b.delay) / b.life);
			p.x = b.x;
			p.y = b.y;
			p.scaleX = p.scaleY = ((b.size * 2) / CELL) * (0.6 + b.grow * k);
			p.tint = bgr(0xb8a88e);
			p.alpha = b.alpha * Math.sin(Math.PI * k) ** 0.8;
		});
		specks.forEach((b, i) => {
			const p = particles[PUFFS + i];
			if (!step(b, dt)) return hide(p);
			const t = b.age - b.delay;
			const k = clamp01(t / b.life);
			p.x = b.x;
			p.y = b.y;
			p.scaleX = b.size / 70;
			p.scaleY = p.scaleX * (1 + Math.min(1.6, Math.abs(b.vy) / (300 * u))); // a falling grain streaks
			p.tint = bgr(b.shade);
			p.alpha = b.alpha * Math.min(1, t * 8) * (1 - k) ** 0.6;
		});
		pebbles.forEach((b, i) => {
			const p = particles[PUFFS + SPECKS + i];
			if (!step(b, dt)) return hide(p);
			const t = b.age - b.delay;
			p.x = b.x;
			p.y = b.y;
			p.scaleX = p.scaleY = b.size / 90;
			p.rotation = b.spin * t;
			p.tint = bgr(b.shade);
			p.alpha = Math.min(1, (1 - clamp01(t / b.life)) * 4);
		});
	};

	const initGold = (particles: Particle[]) => {
		const source = particles[0].texture.source;
		const tex = [2, 3, 4, 5].map((i) => new Texture({ source, frame: new PixiRectangle(i * CELL, 0, CELL, CELL) }));
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = tex[i % 4];
			hide(p);
		});
	};
	const goldClock = clock();
	const updateGold = (particles: Particle[]) => {
		const dt = goldClock();
		nuggets.forEach((b, i) => {
			const p = particles[i];
			if (!step(b, dt)) return hide(p);
			const t = b.age - b.delay;
			p.x = b.x;
			p.y = b.y;
			p.scaleX = p.scaleY = (b.size / 100) * Math.min(1, 0.4 + t * 8);
			p.rotation = b.spin * t;
			p.alpha = Math.min(1, (1 - clamp01(t / b.life)) * 3.5);
		});
	};

	const initLight = (particles: Particle[]) => {
		const source = particles[0].texture.source;
		const glow = new Texture({ source, frame: new PixiRectangle(0, 0, CELL, CELL) });
		const star = new Texture({ source, frame: new PixiRectangle(CELL, 0, CELL, CELL) });
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = i >= SEAM + RAYS && i < SEAM + RAYS + STARS ? star : glow;
			hide(p);
		});
	};
	const lightClock = clock();
	let emit = 0;
	const updateLight = (particles: Particle[]) => {
		const dt = lightClock();
		const { width, height } = size();
		const u = unit();
		flash = Math.max(0, flash - dt * 2.4);
		raysAge += dt;
		// the seam: a bar of gold light down the middle, flooding the screen at the burst
		const level = Math.min(0.88, 0.85 * charge + flash);
		for (let i = 0; i < SEAM; i++) {
			const p = particles[i];
			if (level <= 0.002) {
				hide(p);
				continue;
			}
			p.x = width / 2;
			p.y = (height * (i + 0.5)) / SEAM;
			p.scaleX = ((34 + 150 * charge) * u * (1 + 0.12 * Math.sin(performance.now() / 70 + i)) + flash ** 0.7 * width * 2.2) / CELL;
			p.scaleY = ((height / SEAM) * 3.2) / CELL;
			p.tint = bgr(flash > 0.5 ? 0xffe2a8 : 0xffc468);
			p.alpha = level;
		}
		// a fan of light out of the gap
		const rk = clamp01(raysAge / RAYS_S);
		for (let i = 0; i < RAYS; i++) {
			const p = particles[SEAM + i];
			if (rk >= 1) {
				hide(p);
				continue;
			}
			p.x = width / 2;
			p.y = height * 0.48;
			p.rotation = (i * Math.PI) / RAYS + raysAge * 0.35;
			p.scaleX = (Math.hypot(width, height) * 1.5 * (0.5 + 0.5 * Math.min(1, raysAge / 0.25))) / CELL;
			p.scaleY = ((i % 2 ? 46 : 26) * u) / CELL;
			p.tint = bgr(i % 2 ? 0xffb347 : 0xffe2a0);
			p.alpha = 0.3 * Math.sin(Math.PI * rk ** 0.6) ** 1.2;
		}
		// while it charges: glints climbing the seam, sparks slipping out of it
		if (charge > 0.05) {
			emit += dt * (10 + 46 * charge);
			while (emit >= 1) {
				emit -= 1;
				take(stars, { life: rand(0.35, 0.7), x: width / 2 + rand(-30, 30) * u * (0.4 + charge), y: rand(0.04, 0.96) * height, vy: -rand(20, 80) * u, size: rand(26, 64) * u * (0.6 + 0.6 * charge), spin: rand(-2, 2), shade: pick(GOLD) });
				const side = Math.random() < 0.5 ? -1 : 1;
				take(sparks, { life: rand(0.4, 0.8), x: width / 2, y: rand(0.05, 0.95) * height, vx: side * rand(40, 260) * u, vy: rand(-140, 40) * u, drag: 1.5, size: rand(5, 11) * u, gravity: 380 * u, shade: pick(GOLD) });
			}
		}
		stars.forEach((b, i) => {
			const p = particles[SEAM + RAYS + i];
			if (!step(b, dt)) return hide(p);
			const t = b.age - b.delay;
			const k = clamp01(t / b.life);
			const twinkle = Math.sin(Math.PI * k);
			p.x = b.x;
			p.y = b.y;
			p.scaleX = p.scaleY = (b.size / CELL) * (0.3 + 0.9 * twinkle);
			p.rotation = b.spin * t;
			p.tint = bgr(b.shade);
			p.alpha = twinkle;
		});
		sparks.forEach((b, i) => {
			const p = particles[SEAM + RAYS + STARS + i];
			if (!step(b, dt)) return hide(p);
			const k = clamp01((b.age - b.delay) / b.life);
			// stretched along its flight: a streak, not a dot
			const speed = Math.hypot(b.vx, b.vy);
			p.x = b.x;
			p.y = b.y;
			p.rotation = Math.atan2(b.vy, b.vx);
			p.scaleX = (b.size / 40) * (1 + Math.min(3.2, speed / (260 * u)));
			p.scaleY = b.size / 60;
			p.tint = bgr(b.shade);
			p.alpha = (1 - k) ** 0.7;
		});
	};
</script>

<ParticleContainer>
	<Particles key="bsBgLife" size={PUFFS + SPECKS + PEBBLES} init={initDust} update={updateDust} />
</ParticleContainer>
<ParticleContainer>
	<Particles key="bsGold" size={NUGGETS} init={initGold} update={updateGold} />
</ParticleContainer>
<ParticleContainer blendMode="add">
	<Particles key="bsGold" size={SEAM + RAYS + STARS + SPARKS} init={initLight} update={updateLight} />
</ParticleContainer>
