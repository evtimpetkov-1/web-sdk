<script lang="ts">
	import { Container, ParticleContainer, Particles } from 'pixi-svelte';
	import type { Particle, Texture } from 'pixi.js';

	import { getContext } from '../game/context';
	import { FRAME_ART } from '../game/constants';
	import { HOOK_ART, LANTERN_ART } from '../game/windLife';
	import { bgr, reducedMotion, windNow } from '../game/wind';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	/**
	 * The reel frame lives (2026-11-17, after the 5.3-point review; Evtim: "not sure
	 * what we can do to the reels frame too"). It was one still picture of timber.
	 * Now, all of it ON the frame, so it shakes with the board (SceneShake):
	 *  - TWO LANTERNS hang from wrought-iron shepherd's hooks on the top beam's ends
	 *    (real things: a hook bolted to the beam, a kerosene barn lantern on its
	 *    bail). They are pendulums: they sway in the street's wind (game/wind.ts, the
	 *    one that turns the windmill), a spin nudges them, every quake of the board
	 *    throws them about, and they swing themselves out. Their flames flicker; they
	 *    flare on a win, while a Scatter is awaited and when Cash Respins start, and
	 *    at night they are the brightest thing on the screen.
	 *  - DUST comes off the top beam whenever the board shakes: a few grains with a
	 *    cascade's landing, a shower with puffs and splinters under a bomb.
	 *  - THE IRON catches the light: now and then one of the four corner brackets
	 *    glints; on every win all four do.
	 *  - A LIGHT RUNS ROUND THE FRAME on a win worth the bet or more, with every big
	 *    win title and when Cash Respins start, and keeps running, a chase, while the
	 *    reels wait for the last Scatter.
	 * The hooks stand at the frame's corners and curl outwards, where the canvas
	 * has room; where it has none (portrait: the frame spans the screen) they step
	 * inwards just enough, and the whole fitting shrinks if the room above the frame
	 * is short. Desktop's counters beside the plaque stay clear either way.
	 * Two ParticleContainers (normal, additive) on the `dgWind` sheet, stepped on
	 * the Pixi ticker: no Svelte state per sprite. Frame-art px (FRAME_ART, x right,
	 * y down from the frame sprite's top-left corner) under ONE uniform scale: the
	 * frame sprite itself is stretched a little per axis, a lantern must not be.
	 * Mounted once with the frame (BoardFrame) and kept. Under
	 * prefers-reduced-motion the lanterns hang still and lit, nothing else shows.
	 */
	const context = getContext();
	const frame = $derived(context.stateGameDerived.frameLayout());
	const unit = $derived(frame.width / FRAME_ART.width); // main units per frame-art px
	const isNight = $derived(context.stateGame.gameType === 'freegame');
	const still = reducedMotion();
	// `?ambient=fast` (the ambient layers' preview switch): the frame's reactions play by
	// themselves, one every few seconds: a bomb's quake, a win, a cascade's landing
	const FAST = new URLSearchParams(window.location.search).get('ambient') === 'fast';
	let demoWait = 3;
	let demoStep = 0;

	// ---- the frame art's landmarks (frame.webp, 960x879)
	const BEAM_TOP = 6; // the top beam's upper edge
	const WINDOW = FRAME_ART.window; // its lower edge is the window's top
	// the beams' centre lines: the path the running light takes, clockwise from the top left
	const PATH = [
		{ x: 37, y: 34 },
		{ x: 923, y: 34 },
		{ x: 923, y: 808 },
		{ x: 37, y: 808 },
	];
	// the four iron corner brackets (where each glints)
	const BRACKETS = [
		{ x: 34, y: 36 },
		{ x: 926, y: 36 },
		{ x: 50, y: 806 },
		{ x: 910, y: 806 },
	];

	// ---- the fitting, at full size (frame-art px)
	const HOOK_H = 150;
	const HOOK_W = HOOK_H * HOOK_ART.aspect;
	const LANTERN_H = 114;
	const LANTERN_W = LANTERN_H * LANTERN_ART.aspect;
	const CORNER = 50; // the hook's foot from the frame's outer edge, when there is room
	const SINK = 3; // the base plate overlaps the beam's edge
	// from the foot to the point the bail hangs in (the art curls right; the left hook is mirrored)
	const REACH = (HOOK_ART.rest.x - HOOK_ART.foot) * HOOK_W;
	const RISE = (1 - HOOK_ART.rest.y) * HOOK_H;
	const EDGE_PX = 5; // the least the swinging lantern keeps from the canvas edge, canvas px
	const SWING_ROOM = LANTERN_W * 0.5 + 12; // half the lantern and a little for its swing

	// ---- the pendulum
	const GRAVITY = 17; // (2 pi / 1.5 s) ^ 2: it swings about once in a second and a half
	const DAMP = 0.85;
	const WIND = { push: 2.3, gusty: 2.6, breath: 0.5 }; // steady lean, flutter in a gust, never dead still
	const KICK = { spin: 0.7, quake: [0.8, 2.9] }; // rad/s: a spin's nudge; a quake at strength 0 and 1
	const MAX_ANGLE = 0.95;

	// ---- light
	const WARM = 0xffb040;
	const GLOW = { size: 200, day: 0.4, night: 0.66, flare: 0.5 };
	const NIGHT_IRON = 0xa4b0dc;
	const STAR = { size: 84, life: 0.6, every: [2.0, 4.2] };
	// the running light: a warm bloom with a bright heart (the heart's share of its size)
	const RUN = { length: 360, width: 104, lap: 0.9, chaseLap: 1.3, day: 0.78, night: 0.9, tint: 0xffc766, heart: 0.52, heartTint: 0xfff6d2 };

	// ---- dust
	const SPECKS = 28;
	const PUFFS = 6;
	const SPLINTERS = 6;
	const GRAV = 620;
	const DUST_TINT = { day: 0xecd4ac, night: 0x8f9bca };

	const N_DUST = SPECKS + PUFFS + SPLINTERS;
	const NORMAL = N_DUST + 4; // + hook, lantern, hook, lantern
	const LIT = 2 + 4 + 4; // two halos, four bracket stars, two running lights (bloom + heart each)

	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};

	type Grain = { age: number; life: number; delay: number; x: number; y: number; vx: number; vy: number; size: number; spin: number };
	const grain = (): Grain => ({ age: 1, life: 0, delay: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, spin: 0 });
	const specks = Array.from({ length: SPECKS }, grain);
	const puffs = Array.from({ length: PUFFS }, grain);
	const splinters = Array.from({ length: SPLINTERS }, grain);
	const lanterns = [
		{ side: -1, angle: 0.02, speed: 0, phase: 0.4, flare: 0 },
		{ side: 1, angle: -0.03, speed: 0, phase: 2.9, flare: 0 },
	];
	const stars = BRACKETS.map(() => ({ age: 1, delay: 0 }));
	let textures: Record<string, Texture> | undefined;
	let last = 0;
	let clock = 0;
	let starWait = rand(1, 2.5);
	let frameDt = 0.016; // this frame's step (set by the normal layer, read by the lit one)
	let laps = 0; // running-light laps still owed
	let lapAt = 0; // where the light is on its lap, 0..1
	let runLevel = 0; // how bright the running light is, 0..1: it fades in and out
	let roundWas = false;
	let shake = 0; // a quake waiting to be answered: its strength
	// where the fitting stands this frame (set by the normal layer, read by the lit one)
	const fit = { k: 1, ratio: 1, feet: [0, 0], top: 0, tips: [{ x: 0, y: 0 }, { x: 0, y: 0 }] };

	const strengthOf = (preset: keyof typeof SHAKE_PRESETS) => {
		const { trauma = 0, kick = 0 } = SHAKE_PRESETS[preset] as { trauma?: number; kick?: number };
		return Math.max(trauma, kick * 0.6);
	};

	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			if (still) return;
			const strength = strengthOf(preset);
			shake = Math.max(shake, strength);
			// a big win's title stamps in: the light goes round, more laps the bigger the win
			if (preset === 'bigWin' || preset === 'megaWin' || preset === 'epicWin') {
				laps = Math.max(laps, preset === 'epicWin' ? 4 : preset === 'megaWin' ? 3 : 2);
			}
			lanterns.forEach((lantern) => {
				const kick = KICK.quake[0] + (KICK.quake[1] - KICK.quake[0]) * strength;
				lantern.speed += (Math.random() < 0.5 ? -1 : 1) * kick * rand(0.7, 1.15);
				if (strength >= 0.5) lantern.flare = Math.max(lantern.flare, 0.6);
			});
		},
		// every win: the iron glints, the flames jump
		winGoldFly: () => {
			if (still) return;
			stars.forEach((star, i) => {
				star.age = 0;
				star.delay = i * 0.07;
			});
			lanterns.forEach((lantern) => (lantern.flare = Math.max(lantern.flare, 0.7)));
		},
		// a win worth the bet or more: the light runs round the frame once
		logoWin: () => {
			if (!still) laps = Math.max(laps, 1);
		},
		// Cash Respins start: a lap, and the lanterns blaze up
		boardFrameGlowShow: () => {
			if (still) return;
			laps = Math.max(laps, 2);
			lanterns.forEach((lantern) => (lantern.flare = 1));
		},
	});

	// where the frame's top-left corner is on the canvas, and canvas px per frame-art px
	const onCanvas = () => {
		const main = context.stateLayoutDerived.mainLayout();
		const layout = context.stateGameDerived.frameLayout();
		const scale = (layout.width / FRAME_ART.width) * main.scale;
		return {
			scale,
			left: main.x + (layout.x - layout.width / 2 - main.width * 0.5) * main.scale,
			top: main.y + (layout.y - layout.height / 2 - main.height * 0.5) * main.scale,
			// the frame sprite's own stretch: a frame-art row sits at y * ratio here
			ratio: layout.height / FRAME_ART.height / (layout.width / FRAME_ART.width),
		};
	};

	const startDust = (strength: number) => {
		const y = (WINDOW.y - 2) * fit.ratio;
		let count = Math.round(2 + 16 * strength);
		for (const g of specks) {
			if (count <= 0) break;
			if (g.age < g.life + g.delay) continue;
			count--;
			g.age = 0;
			g.delay = rand(0, 0.18);
			g.life = rand(0.55, 1.0);
			g.x = rand(WINDOW.x + 10, WINDOW.x + WINDOW.width - 10);
			g.y = y + rand(-4, 4);
			g.vx = rand(-26, 26);
			g.vy = rand(30, 150) * (0.6 + strength);
			g.size = rand(9, 17);
			g.spin = 0;
		}
		if (strength < 0.45) return;
		let clouds = Math.round(2 + 4 * strength);
		for (const g of puffs) {
			if (clouds <= 0) break;
			if (g.age < g.life + g.delay) continue;
			clouds--;
			g.age = 0;
			g.delay = rand(0, 0.1);
			g.life = rand(0.8, 1.3);
			g.x = rand(WINDOW.x + 30, WINDOW.x + WINDOW.width - 30);
			g.y = y + rand(4, 16);
			g.vx = rand(-18, 18);
			g.vy = rand(18, 46);
			g.size = rand(54, 92);
			g.spin = rand(-0.6, 0.6);
		}
		let chips = Math.round(1 + 4 * strength);
		for (const g of splinters) {
			if (chips <= 0) break;
			if (g.age < g.life + g.delay) continue;
			chips--;
			g.age = 0;
			g.delay = rand(0, 0.12);
			g.life = rand(0.7, 1.05);
			g.x = rand(WINDOW.x + 20, WINDOW.x + WINDOW.width - 20);
			g.y = y;
			g.vx = rand(-90, 90);
			g.vy = rand(-60, 90);
			g.size = rand(26, 40);
			g.spin = rand(-9, 9);
		}
	};

	const initNormal = (particles: Particle[]) => {
		particles.forEach((p) => {
			p.anchorX = p.anchorY = 0.5;
			hide(p);
		});
	};
	const initLit = initNormal;

	const updateNormal = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
		last = now;
		frameDt = dt;
		clock += dt;
		textures ??= context.stateApp.loadedAssets?.['hook.png']
			? (context.stateApp.loadedAssets as unknown as Record<string, Texture>)
			: undefined;
		if (!textures) return;

		// ---- where the fitting stands: at the corners, curled outwards; stepped in and
		// shrunk as the canvas asks
		const at = onCanvas();
		const canvas = context.stateLayoutDerived.canvasSizes();
		fit.ratio = at.ratio;
		fit.top = BEAM_TOP * at.ratio + SINK;
		fit.k = Math.min(1, Math.max(0.45, (at.top + fit.top * at.scale - 6) / ((HOOK_H + 4) * at.scale)));
		const out = (REACH + SWING_ROOM) * fit.k; // how far past its foot the lantern reaches
		const leftEdge = (EDGE_PX - at.left) / at.scale; // the canvas's edges in frame-art px
		const rightEdge = (canvas.width - EDGE_PX - at.left) / at.scale;
		fit.feet[0] = Math.max(CORNER, leftEdge + out);
		fit.feet[1] = Math.min(FRAME_ART.width - CORNER, rightEdge - out);

		if (FAST && !still) {
			demoWait -= dt;
			if (demoWait <= 0) {
				demoWait = 3.2;
				const step = demoStep++ % 3;
				if (step === 0) context.eventEmitter.broadcast({ type: 'sceneShake', preset: 'bomb' });
				else if (step === 1) {
					context.eventEmitter.broadcast({ type: 'winGoldFly', positions: [] });
					context.eventEmitter.broadcast({ type: 'logoWin' });
				} else context.eventEmitter.broadcast({ type: 'sceneShake', preset: 'cascade' });
			}
		}

		// ---- the round's own beats
		const round = context.stateGame.roundActive;
		if (round && !roundWas && !still) lanterns.forEach((lantern) => (lantern.speed += lantern.side * KICK.spin * rand(0.6, 1.2)));
		roundWas = round;
		if (shake > 0) {
			if (!still) startDust(shake);
			shake = 0;
		}

		// ---- dust off the top beam
		const dustTint = bgr(isNight ? DUST_TINT.night : DUST_TINT.day);
		const fall = (g: Grain, p: Particle, kind: 'speck' | 'puff' | 'chip', index: number) => {
			if (g.age >= g.life + g.delay) return hide(p);
			g.age += dt;
			const t = g.age - g.delay;
			if (t < 0) return hide(p);
			const u = Math.min(1, t / g.life);
			if (kind !== 'puff') g.vy += GRAV * dt;
			g.x += g.vx * dt;
			g.y += g.vy * dt;
			p.x = g.x;
			p.y = g.y;
			p.tint = dustTint;
			if (kind === 'puff') {
				p.texture = textures!['fpuff.png'];
				p.scaleX = p.scaleY = (g.size / 112) * (0.5 + 0.9 * u ** 0.6);
				p.rotation = g.spin * t;
				p.alpha = 0.66 * Math.min(1, u / 0.12) * (1 - u) ** 1.2;
			} else if (kind === 'chip') {
				p.texture = textures![index % 2 ? 'splinter_1.png' : 'splinter_0.png'];
				p.scaleX = p.scaleY = g.size / 48;
				p.rotation = g.spin * t;
				p.alpha = Math.min(1, (1 - u) * 3);
			} else {
				p.texture = textures!['bit_grain.png'];
				p.scaleX = g.size / 32;
				p.scaleY = p.scaleX * (1 + Math.min(0.9, g.vy / 420)); // a falling grain streaks
				p.rotation = 0;
				p.alpha = Math.min(1, t * 10) * (1 - u) ** 0.7;
			}
		};
		specks.forEach((g, i) => fall(g, particles[i], 'speck', i));
		puffs.forEach((g, i) => fall(g, particles[SPECKS + i], 'puff', i));
		splinters.forEach((g, i) => fall(g, particles[SPECKS + PUFFS + i], 'chip', i));

		// ---- the lanterns: two pendulums in the same wind, each with its own flutter
		const gust = windNow();
		const iron = bgr(isNight ? NIGHT_IRON : 0xffffff);
		lanterns.forEach((lantern, i) => {
			if (!still) {
				// the wind blows left to right: it leans the lantern that way (its foot swings
				// right, a negative turn) and worries it; a lull leaves a slow breath
				const flutter = Math.sin(2.3 * clock + lantern.phase) * Math.sin(0.9 * clock + 2 * lantern.phase);
				const torque =
					-WIND.push * (0.12 + gust) +
					WIND.gusty * gust * flutter +
					WIND.breath * Math.sin(1.1 * clock + lantern.phase);
				lantern.speed += (-GRAVITY * Math.sin(lantern.angle) - DAMP * lantern.speed + torque) * dt;
				lantern.angle += lantern.speed * dt;
				if (Math.abs(lantern.angle) > MAX_ANGLE) {
					lantern.angle = Math.sign(lantern.angle) * MAX_ANGLE;
					lantern.speed *= -0.4;
				}
				// a Scatter is awaited: the flame strains; otherwise a flare dies down
				if (context.stateGame.scatterPending) lantern.flare = Math.max(lantern.flare, 0.75);
				lantern.flare = Math.max(0, lantern.flare - 1.4 * dt);
			}
			const foot = fit.feet[i];
			const hook = particles[N_DUST + 2 * i];
			hook.texture = textures!['hook.png'];
			hook.anchorX = HOOK_ART.foot;
			hook.anchorY = 1;
			hook.x = foot;
			hook.y = fit.top;
			hook.scaleY = (HOOK_H * fit.k) / hook.texture.height;
			hook.scaleX = lantern.side * hook.scaleY; // the art curls right: mirrored on the left
			hook.rotation = 0;
			hook.tint = iron;
			hook.alpha = 1;
			const tip = fit.tips[i];
			tip.x = foot + lantern.side * REACH * fit.k;
			tip.y = fit.top - RISE * fit.k;
			const body = particles[N_DUST + 2 * i + 1];
			body.texture = textures!['lantern.png'];
			body.anchorX = LANTERN_ART.bail.x;
			body.anchorY = LANTERN_ART.bail.y;
			body.x = tip.x;
			body.y = tip.y;
			body.scaleX = body.scaleY = (LANTERN_H * fit.k) / body.texture.height;
			body.rotation = lantern.angle;
			body.tint = iron;
			body.alpha = 1;
		});
	};

	// a point `at` (0..1) of the way round the frame, and the way the light faces there
	const SIDES = PATH.map((from, i) => {
		const to = PATH[(i + 1) % PATH.length];
		return { from, to, length: Math.hypot(to.x - from.x, to.y - from.y) };
	});
	const PERIMETER = SIDES.reduce((sum, side) => sum + side.length, 0);
	const along = (at: number) => {
		let d = (((at % 1) + 1) % 1) * PERIMETER;
		for (const [i, side] of SIDES.entries()) {
			if (d <= side.length || i === SIDES.length - 1) {
				const u = d / side.length;
				return {
					x: side.from.x + (side.to.x - side.from.x) * u,
					y: side.from.y + (side.to.y - side.from.y) * u,
					rotation: (i * Math.PI) / 2,
					// it dims as it turns a corner, so the turn is not seen
					corner: Math.min(1, Math.min(d, side.length - d) / 110),
				};
			}
			d -= side.length;
		}
		return { x: 0, y: 0, rotation: 0, corner: 0 };
	};

	const updateLit = (particles: Particle[]) => {
		if (!textures) return;
		const dt = frameDt;
		const night = isNight;

		// ---- the lanterns' halos, on the glass (which swings with the lantern)
		lanterns.forEach((lantern, i) => {
			const p = particles[i];
			const tip = fit.tips[i];
			const drop = (LANTERN_ART.glass.y - LANTERN_ART.bail.y) * LANTERN_H * fit.k;
			const flicker = still
				? 0
				: 0.07 * Math.sin(7.3 * clock + lantern.phase) + 0.05 * Math.sin(12.7 * clock + 2 * lantern.phase) + 0.04 * Math.sin(2.1 * clock);
			p.texture = textures!['glow.png'];
			p.x = tip.x - Math.sin(lantern.angle) * drop;
			p.y = tip.y + Math.cos(lantern.angle) * drop;
			p.scaleX = p.scaleY = ((GLOW.size * fit.k) / 128) * (1 + 0.5 * lantern.flare + flicker);
			p.tint = bgr(WARM);
			p.alpha = Math.min(1, (night ? GLOW.night : GLOW.day) + flicker + GLOW.flare * lantern.flare);
		});
		if (still) {
			for (let i = 2; i < LIT; i++) hide(particles[i]);
			return;
		}

		// ---- the iron glints: one bracket now and then, all four on a win
		starWait -= dt;
		if (starWait <= 0) {
			starWait = rand(STAR.every[0], STAR.every[1]);
			const star = stars[Math.floor(Math.random() * stars.length)];
			if (star.age >= STAR.life + star.delay) {
				star.age = 0;
				star.delay = 0;
			}
		}
		stars.forEach((star, i) => {
			const p = particles[2 + i];
			if (star.age >= STAR.life + star.delay) return hide(p);
			star.age += dt;
			const t = star.age - star.delay;
			if (t < 0) return hide(p);
			const u = Math.min(1, t / STAR.life);
			const swell = Math.sin(Math.PI * u);
			p.texture = textures!['star.png'];
			p.x = BRACKETS[i].x;
			p.y = BRACKETS[i].y * fit.ratio;
			p.scaleX = p.scaleY = (STAR.size / 96) * (0.25 + 0.95 * swell);
			p.rotation = 0.9 * u;
			p.tint = bgr(night ? 0xdfe6ff : 0xfff4d6);
			p.alpha = Math.min(1, 1.25 * swell);
		});

		// ---- the light that runs round the frame: once per lap owed, on and on while a
		// Scatter is awaited
		const chase = context.stateGame.scatterPending;
		const running = laps > 0 || chase;
		runLevel += ((running ? 1 : 0) - runLevel) * Math.min(1, dt * (running ? 12 : 5));
		const lit = running || runLevel > 0.02;
		if (lit) {
			lapAt += dt / (chase ? RUN.chaseLap : RUN.lap);
			if (lapAt >= 1) {
				lapAt -= 1;
				if (laps > 0) laps -= 1;
			}
		} else {
			lapAt = 0;
			runLevel = 0;
		}
		for (let i = 0; i < 4; i++) {
			const p = particles[6 + i];
			if (!lit) {
				hide(p);
				continue;
			}
			// two lights, opposite each other; each a bloom (i 0, 1) with a heart (i 2, 3)
			const spot = along(lapAt + (i % 2) * 0.5);
			const heart = i >= 2 ? RUN.heart : 1;
			p.texture = textures!['streak.png'];
			p.x = spot.x;
			p.y = spot.y * fit.ratio;
			p.rotation = spot.rotation;
			p.scaleX = (RUN.length / 256) * heart;
			p.scaleY = (RUN.width / 72) * heart;
			p.tint = bgr(i >= 2 ? RUN.heartTint : RUN.tint);
			p.alpha = (night ? RUN.night : RUN.day) * (0.45 + 0.55 * spot.corner) * runLevel;
		}
	};
</script>

<!-- frame-art px from the frame sprite's top-left corner, one uniform scale -->
<Container x={frame.x - frame.width / 2} y={frame.y - frame.height / 2} scale={unit}>
	<ParticleContainer>
		<Particles key="hook.png" size={NORMAL} init={initNormal} update={updateNormal} />
	</ParticleContainer>
	<ParticleContainer blendMode="add">
		<Particles key="hook.png" size={LIT} init={initLit} update={updateLit} />
	</ParticleContainer>
</Container>
