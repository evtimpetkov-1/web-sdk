<script lang="ts">
	import {
		Container,
		ParticleContainer,
		Particles,
		PixiRectangle,
		Sprite,
		Texture,
		type ParticlesProps,
	} from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { FRAME_LIFE } from '../game/frameLife';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	/**
	 * The reel frame is alive (2026-11-17; it was a still picture, and the reviewers
	 * wrote "too static" a third time). Nothing in it is redrawn: light, drops and
	 * steam are laid over it, in the frame file's own px (960 x 879, FRAME_ART), in a
	 * container fitted exactly as BoardFrame fits the frame. Mounted right after
	 * BoardFrame, inside SceneShake, so it shakes with the board.
	 * - a sheen slides along the pipes: one slow pass each way, all the time
	 * - the slime on the pipes glows and breathes (the base frame's own green alone,
	 *   drawn again additively: frame_shimmer.webp)
	 * - drops swell on the tips of its painted drips, fall and fade: slime in the
	 *   base game, blood in Cash Respins (tips: game/frameLife.ts, written by
	 *   art-review/chaoslab2/frame_life/build_frame_life.py)
	 * - a corner joint lets off steam every few seconds
	 * - it answers the board (the SceneShake presets): every cascade sends a bright
	 *   pulse racing round the pipes and lights the slime; a hard hit (bomb, big win,
	 *   the feature trigger) makes all four corners vent and shakes the drops off
	 * Off under prefers-reduced-motion (Game mounts it only then). `?scene=fast`
	 * (the scene layer's preview switch) lets it take big time steps.
	 */
	// (the app has no pixi.js dependency of its own: the type comes off pixi-svelte's props)
	type Particle = Parameters<ParticlesProps['init']>[0][number];

	const context = getContext();
	const frame = $derived(context.stateGameDerived.frameLayout());
	const isFeature = $derived(context.stateGame.gameType === 'freegame');
	const art = $derived(FRAME_LIFE[isFeature ? 'feature' : 'base']);

	// the scene layer's particle sheet (cl2SceneLife): 128 px cells
	const CELL = 128;
	const [GLOW, DROP, PUFF] = [0, 2, 5];
	const cell = (particles: Particle[], index: number) =>
		new Texture({ source: particles[0].texture.source, frame: new PixiRectangle(index * CELL, 0, CELL, CELL) });
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	// Pixi 8.8's Particle reads a number tint as blue-green-red (see SceneLife)
	const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};
	const MAX_STEP = new URLSearchParams(window.location.search).get('scene') === 'fast' ? 0.3 : 0.05;

	// the pipes' centre line (frame art px): a rectangle the sheen runs round, clockwise from its top left
	const PIPE = { left: 38, right: 922, top: 36, bottom: 803 };
	const SIDE_X = PIPE.right - PIPE.left;
	const SIDE_Y = PIPE.bottom - PIPE.top;
	const LAP = 2 * (SIDE_X + SIDE_Y);
	/** where `s` px along the pipes is, which way the pipe runs there, how far the nearest corner is */
	const along = (s: number) => {
		let d = ((s % LAP) + LAP) % LAP;
		if (d < SIDE_X) return { x: PIPE.left + d, y: PIPE.top, turn: 0, corner: Math.min(d, SIDE_X - d) };
		d -= SIDE_X;
		if (d < SIDE_Y) return { x: PIPE.right, y: PIPE.top + d, turn: Math.PI / 2, corner: Math.min(d, SIDE_Y - d) };
		d -= SIDE_Y;
		if (d < SIDE_X) return { x: PIPE.right - d, y: PIPE.bottom, turn: 0, corner: Math.min(d, SIDE_X - d) };
		d -= SIDE_X;
		return { x: PIPE.left, y: PIPE.bottom - d, turn: Math.PI / 2, corner: Math.min(d, SIDE_Y - d) };
	};
	// the corner joints: [x, y, the way out (x, y)]
	const CORNERS = [
		[36, 34, -1, -1],
		[924, 34, 1, -1],
		[36, 806, -1, 0.25],
		[924, 806, 1, 0.25],
	];

	let shimmer = $state(0);
	let clock = 0;
	let last = 0;
	let dt = 0.016;
	let flare = 0;
	let featureMix = 0;
	let pulseNow = 0;
	let ventAll = false;
	let shakeOff = false;

	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const strength = (SHAKE_PRESETS[preset] as { trauma?: number }).trauma ?? 0;
			if (strength < 0.3) return;
			flare = Math.max(flare, strength);
			pulseNow = Math.max(pulseNow, strength);
			if (strength >= 0.5) {
				ventAll = true;
				shakeOff = true;
			}
		},
	});

	// ------------------------------------------------------------ the lit layer: sheen and pulses
	const SHEENS = 2;
	const PULSES = 2;
	const PULSE_TAIL = 4;
	const LIT = SHEENS + PULSES * PULSE_TAIL;
	const sheens = [
		{ s: rand(0, LAP), v: 210 },
		{ s: rand(0, LAP), v: -150 },
	];
	const pulses = Array.from({ length: PULSES }, () => ({ s: 0, v: 0, age: 1, life: 1, power: 0 }));

	const initLit = (particles: Particle[]) => {
		const glow = cell(particles, GLOW);
		for (const p of particles) {
			p.texture = glow;
			p.anchorX = p.anchorY = 0.5;
			hide(p);
		}
	};

	/** a soft streak lying along the pipe at `s` */
	const lay = (p: Particle, s: number, length: number, thick: number, alpha: number, tint: number) => {
		const at = along(s);
		p.x = at.x - art.width / 2;
		p.y = at.y - art.height / 2;
		p.rotation = at.turn;
		// the glow cell reads ~0.6 of its box
		p.scaleX = length / (CELL * 0.6);
		p.scaleY = thick / (CELL * 0.6);
		p.tint = bgr(tint);
		// a streak cannot bend: it dims as it comes to a corner and brightens out of it
		p.alpha = alpha * Math.min(1, 0.15 + at.corner / 110);
	};

	const updateLit = (particles: Particle[]) => {
		const now = performance.now();
		dt = Math.min(MAX_STEP, last ? (now - last) / 1000 : 0.016);
		last = now;
		clock += dt;
		flare = Math.max(0, flare - dt * 1.6);
		featureMix += ((isFeature ? 1 : 0) - featureMix) * Math.min(1, dt * 4);
		// the slime's glow belongs to the base frame: it fades with it into the feature
		const glowNow = Math.round((0.3 + 0.16 * Math.sin(clock * 1.3) + 0.7 * flare) * (1 - featureMix) * 100) / 100;
		if (glowNow !== shimmer) shimmer = glowNow;

		const pale = featureMix > 0.5 ? 0xffe2c8 : 0xe2ffc4;
		sheens.forEach((sheen, i) => {
			sheen.s += sheen.v * dt * (1 + 1.5 * flare);
			lay(particles[i], sheen.s, 190, 34, 0.34 + 0.3 * flare, pale);
		});

		// a cascade or a blast: a bright pulse races once round the pipes, a short tail behind it
		if (pulseNow > 0) {
			const free = pulses.find((pulse) => pulse.age >= pulse.life) ?? pulses[0];
			const way = Math.random() < 0.5 ? 1 : -1;
			Object.assign(free, { s: rand(0, LAP), v: way * 2900, age: 0, life: LAP / 2900, power: 0.45 + 0.55 * pulseNow });
			pulseNow = 0;
		}
		pulses.forEach((pulse, i) => {
			const live = pulse.age < pulse.life;
			if (live) {
				pulse.age += dt;
				pulse.s += pulse.v * dt;
			}
			const fade = live ? Math.sin(Math.PI * Math.min(1, pulse.age / pulse.life)) ** 0.6 : 0;
			for (let t = 0; t < PULSE_TAIL; t++) {
				const p = particles[SHEENS + i * PULSE_TAIL + t];
				if (!live) {
					hide(p);
					continue;
				}
				const back = pulse.s - Math.sign(pulse.v) * t * 70;
				lay(p, back, 150 - t * 22, 46 - t * 7, pulse.power * fade * (1 - t / PULSE_TAIL) ** 1.3, featureMix > 0.5 ? 0xffb090 : 0xc8ff78);
			}
		});
	};

	// ------------------------------------------------------------ drops and steam
	const DRIPS = 3;
	const PER_CORNER = 5;
	const STEAM = CORNERS.length * PER_CORNER;
	const SOLID = DRIPS + STEAM;
	const FALL = 105; // art px a drop falls before it is gone
	type Drip = { state: 'wait' | 'grow' | 'fall'; t: number; fell: number; speed: number; size: number };
	const drips: Drip[] = Array.from({ length: DRIPS }, (_, i) => ({ state: 'wait' as const, t: 1 + i * 1.7 + rand(0, 2), fell: 0, speed: 0, size: 1 }));
	type Puff = { age: number; life: number; x: number; y: number; vx: number; vy: number; size: number; spin: number };
	const puffs: Puff[] = Array.from({ length: STEAM }, () => ({ age: 1, life: 1, x: 0, y: 0, vx: 0, vy: 0, size: 0, spin: 0 }));
	const vents = CORNERS.map((_, i) => ({ left: 0, gap: 0, wait: rand(3, 9) + i * 2 }));

	const initSolid = (particles: Particle[]) => {
		const droplet = cell(particles, DROP);
		const puff = cell(particles, PUFF);
		particles.forEach((p, i) => {
			p.texture = i < DRIPS ? droplet : puff;
			p.anchorX = 0.5;
			p.anchorY = i < DRIPS ? 0.2 : 0.5; // a droplet hangs from near its point
			hide(p);
		});
	};

	const updateSolid = (particles: Particle[]) => {
		const cx = art.width / 2;
		const cy = art.height / 2;
		const blood = featureMix > 0.5;

		drips.forEach((d, i) => {
			const p = particles[i];
			const tip = art.tips[i];
			d.t -= dt;
			if (!tip || d.state === 'wait') {
				hide(p);
				if (tip && d.t <= 0) Object.assign(d, { state: 'grow', t: rand(0.8, 1.5), fell: 0, speed: 0, size: rand(0.85, 1.2) });
				return;
			}
			let grown = 1;
			let stretch = 1;
			if (d.state === 'grow') {
				grown = 1 - Math.max(0, d.t) / 1.5;
				if (d.t <= 0 || shakeOff) d.state = 'fall';
			} else {
				d.speed += 520 * dt;
				d.fell += d.speed * dt;
				stretch = 1 + Math.min(0.9, d.speed / 420);
				if (d.fell >= FALL) {
					Object.assign(d, { state: 'wait', t: rand(2, 6.5) });
					hide(p);
					return;
				}
			}
			p.x = tip[0] - cx;
			p.y = tip[1] - 4 + d.fell - cy;
			p.scaleX = (15 * d.size * (0.35 + 0.65 * grown)) / 54;
			p.scaleY = p.scaleX * stretch;
			p.tint = bgr(blood ? 0xa8201a : 0x93dc1c);
			p.alpha = Math.min(1, grown * 2) * (1 - (d.fell / FALL) ** 2);
		});
		shakeOff = false;

		// the corner joints let off steam: one of the upper two now and then, all four on a hard hit
		CORNERS.forEach(([x, y, outX, outY], c) => {
			const vent = vents[c];
			vent.wait -= dt;
			if (ventAll || (vent.wait <= 0 && c < 2)) {
				vent.wait = rand(9, 19);
				vent.left = ventAll ? PER_CORNER : 3;
				vent.gap = 0;
			}
			vent.gap -= dt;
			if (vent.left > 0 && vent.gap <= 0) {
				const free = puffs.slice(c * PER_CORNER, (c + 1) * PER_CORNER).find((puff) => puff.age >= puff.life);
				if (free) {
					Object.assign(free, {
						age: 0,
						life: rand(1.1, 1.7),
						x,
						y,
						vx: outX * rand(70, 130),
						vy: outY * rand(50, 100) - 14,
						size: rand(20, 30),
						spin: rand(-1, 1),
					});
				}
				vent.left -= 1;
				vent.gap = 0.07;
			}
		});
		ventAll = false;
		puffs.forEach((puff, i) => {
			const p = particles[DRIPS + i];
			if (puff.age >= puff.life) return hide(p);
			puff.age += dt;
			const k = Math.min(1, puff.age / puff.life);
			puff.vx *= 1 - 2 * dt;
			puff.vy = puff.vy * (1 - 2 * dt) - 26 * dt;
			puff.x += puff.vx * dt;
			puff.y += puff.vy * dt;
			p.x = puff.x - cx;
			p.y = puff.y - cy;
			p.scaleX = p.scaleY = (puff.size * (1 + 3.4 * k)) / (CELL * 0.6);
			p.rotation = puff.spin * k;
			p.tint = bgr(blood ? 0xcdbcae : 0xb9ccb2);
			p.alpha = 0.42 * Math.sin(Math.PI * k) ** 0.7;
		});
	};
</script>

<Container x={frame.x} y={frame.y} scale={{ x: frame.width / art.width, y: frame.height / art.height }}>
	<!-- the slime on the pipes, glowing -->
	<Sprite
		key="cl2FrameShimmer"
		anchor={0.5}
		width={art.width}
		height={art.height}
		blendMode="add"
		alpha={Math.max(0, Math.min(1, shimmer))}
		visible={shimmer > 0}
	/>
	<ParticleContainer blendMode="add">
		<Particles key="cl2SceneLife" size={LIT} init={initLit} update={updateLit} />
	</ParticleContainer>
	<ParticleContainer>
		<Particles key="cl2SceneLife" size={SOLID} init={initSolid} update={updateSolid} />
	</ParticleContainer>
</Container>
