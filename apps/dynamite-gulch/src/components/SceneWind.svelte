<script lang="ts">
	import { Container, ParticleContainer, Particles } from 'pixi-svelte';
	import type { Particle, Texture } from 'pixi.js';

	import { getContext } from '../game/context';
	import { bgr, reducedMotion, windNow } from '../game/wind';

	/**
	 * The wind, seen (2026-11-17, after the 5.3-point review: both reviewers wrote
	 * "the background is too static"). Until now the street only showed the wind
	 * where it turned the windmill; this layer shows it everywhere, all the time:
	 *  - BITS the wind carries across the street, left to right: leaves and straw
	 *    higher up, sand grains and twigs low down. Always some in the air; a gust
	 *    brings more of them, faster.
	 *  - WIND LINES, the comic's own sign for a gust: a cream stroke that ends in a
	 *    curl, or a pair of speed lines, sweeps across and is gone. A few in a lull,
	 *    one after another in a gust.
	 *  - WISPS of sand that run low along the ground.
	 * Speed and number follow game/wind.ts, the same value that turns the windmill,
	 * drives the clouds and swings the lanterns on the reel frame, so the whole
	 * scene breathes together.
	 * Small and pale on purpose: it is weather, behind the board, never a thing to
	 * look at. One ParticleContainer on the `dgWind` sheet, stepped on the Pixi
	 * ticker: no Svelte state per particle. Drawn in the shown painting's own pixels
	 * about its centre, under that painting's cover transform, so it sits the same
	 * on every screen. Mounted once (Background) and kept: pixi-svelte's Particles
	 * never removes its ticker callback. Nothing under prefers-reduced-motion.
	 */
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isFreeSpins = $derived(context.stateGame.gameType === 'freegame');
	// the same choice Background makes: the night has one (landscape) painting
	const SCENES = {
		// `ground`: the band of open street a wisp runs along (art px, top and bottom)
		day: { width: 1920, height: 1288, ground: [770, 895], night: false },
		portrait: { width: 1288, height: 1920, ground: [1470, 1860], night: false },
		night: { width: 1920, height: 1288, ground: [770, 895], night: true },
	} as const;
	const scene = $derived(SCENES[isFreeSpins ? 'night' : canvas.height > canvas.width ? 'portrait' : 'day']);
	const scale = $derived(Math.max(canvas.width / scene.width, canvas.height / scene.height));

	// how much of each, and how they move (lengths in shares of the visible height,
	// so a phone held upright sees them as large as a desktop does)
	const BITS = 30;
	const LINES = 4;
	const WISPS = 5;
	const BIT = { size: [0.012, 0.03], speed: [0.14, 0.62], calm: 0.45 }; // speed: visible heights a second, lull to gust
	const LINE = { length: [0.26, 0.46], speed: [0.9, 1.7], life: [0.9, 1.5], every: [3.6, 0.7], alpha: 0.58 };
	const WISP = { length: [0.26, 0.5], speed: [0.2, 0.75], life: [1.6, 2.8], every: [2.4, 0.6], alpha: 0.5 };
	const NIGHT_TINT = 0x8c9cd0;
	const KINDS = ['bit_leaf.png', 'bit_straw.png', 'bit_grain.png', 'bit_twig.png'] as const;
	const HIGH = [0, 0, 1]; // what flies high: leaves, a straw
	const LOW = [2, 2, 2, 3, 1, 0]; // what is blown along low down: sand, twigs

	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};

	type Bit = { x: number; y: number; depth: number; size: number; kind: number; phase: number; spin: number; rotation: number; calm: boolean };
	type Run = { age: number; life: number; x: number; y: number; length: number; speed: number; kind: number };
	const bits: Bit[] = [];
	const lines: Run[] = Array.from({ length: LINES }, () => ({ age: 1, life: 0, x: 0, y: 0, length: 0, speed: 0, kind: 0 }));
	const wisps: Run[] = Array.from({ length: WISPS }, () => ({ age: 1, life: 0, x: 0, y: 0, length: 0, speed: 0, kind: 0 }));
	let textures: Record<string, Texture> | undefined;
	let last = 0;
	let lineWait = 1;
	let wispWait = 0.5;
	let shown: (typeof SCENES)[keyof typeof SCENES] | undefined;
	const still = reducedMotion();

	// what the canvas shows of the painting, in its pixels about its centre
	const view = () => ({ halfW: canvas.width / scale / 2, halfH: canvas.height / scale / 2 });

	const placeBit = (bit: Bit, anywhere: boolean) => {
		const { halfW, halfH } = view();
		const high = Math.random() < 0.38;
		bit.kind = pick(high ? HIGH : LOW);
		bit.depth = rand(0.6, 1.4);
		bit.size = rand(BIT.size[0], BIT.size[1]) * 2 * halfH * (bit.kind === 2 ? 0.55 : 1) * bit.depth;
		bit.x = anywhere ? rand(-halfW, halfW) : -halfW - bit.size - rand(0, halfW * 0.5);
		// high: the upper half; low: from the middle down to just above the bar
		bit.y = high ? rand(-halfH * 0.92, halfH * 0.05) : rand(-halfH * 0.05, halfH * 0.74);
		bit.phase = rand(0, 6.28);
		bit.spin = rand(-3.2, 3.2) * (bit.kind === 2 ? 0 : 1);
		bit.rotation = rand(0, 6.28);
		// some are only in the air while it blows: a lull thins the street out
		bit.calm = Math.random() < BIT.calm;
	};

	const init = (particles: Particle[]) => {
		particles.forEach((p) => {
			p.anchorX = p.anchorY = 0.5;
			hide(p);
		});
	};

	const update = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
		last = now;
		if (still) return;
		textures ??= context.stateApp.loadedAssets?.['gust_0.png']
			? (context.stateApp.loadedAssets as unknown as Record<string, Texture>)
			: undefined;
		if (!textures) return;
		const { halfW, halfH } = view();
		const visH = 2 * halfH;
		if (shown !== scene) {
			// another painting (a turn of the phone, the night): lay the air out afresh
			shown = scene;
			bits.length = 0;
			for (let i = 0; i < BITS; i++) {
				const bit = {} as Bit;
				placeBit(bit, true);
				bits.push(bit);
			}
			lines.forEach((run) => (run.age = run.life = 0));
			wisps.forEach((run) => (run.age = run.life = 0));
		}
		const gust = windNow();
		const tint = bgr(scene.night ? NIGHT_TINT : 0xffffff);
		const dim = scene.night ? 0.6 : 1;
		const t = now / 1000;

		// ---- what the wind carries
		const pace = BIT.speed[0] + (BIT.speed[1] - BIT.speed[0]) * gust;
		bits.forEach((bit, i) => {
			const p = particles[i];
			bit.x += pace * visH * bit.depth * dt;
			// it bobs and flutters on its way; a gust lifts it a little
			bit.y += (Math.sin(t * 2.1 + bit.phase) * 0.03 + Math.sin(t * 5.3 + 2 * bit.phase) * 0.012 - 0.02 * gust) * visH * dt;
			bit.rotation += bit.spin * (0.4 + 1.6 * gust) * dt;
			if (bit.x > halfW + bit.size) placeBit(bit, false);
			p.texture = textures![KINDS[bit.kind]];
			p.x = bit.x;
			p.y = bit.y;
			p.rotation = bit.rotation;
			p.scaleX = p.scaleY = bit.size / 48;
			p.tint = tint;
			// the ones a lull drops fade with the wind, they never pop
			p.alpha = dim * (bit.calm ? 0.92 : 0.92 * Math.min(1, Math.max(0, (gust - 0.12) / 0.2)));
		});

		// ---- a run: a wind line or a wisp that sweeps a stretch and fades at both ends
		const step = (run: Run, p: Particle, key: string, peak: number, art: number) => {
			if (run.age >= run.life) return hide(p);
			run.age += dt;
			const u = Math.min(1, run.age / run.life);
			run.x += run.speed * visH * dt;
			p.texture = textures![key];
			p.x = run.x;
			p.y = run.y;
			p.rotation = 0;
			// it stretches as it goes
			p.scaleX = (run.length / art) * (0.75 + 0.45 * u);
			p.scaleY = run.length / art;
			p.tint = tint;
			p.alpha = dim * peak * Math.sin(Math.PI * u) ** 0.7;
		};

		lineWait -= dt;
		if (lineWait <= 0) {
			lineWait = (LINE.every[0] + (LINE.every[1] - LINE.every[0]) * gust) * rand(0.7, 1.3);
			const run = lines.find((r) => r.age >= r.life);
			if (run) {
				run.age = 0;
				run.life = rand(LINE.life[0], LINE.life[1]);
				run.length = rand(LINE.length[0], LINE.length[1]) * visH;
				run.speed = (LINE.speed[0] + (LINE.speed[1] - LINE.speed[0]) * gust) * rand(0.85, 1.15);
				run.kind = Math.random() < 0.6 ? 0 : 1;
				run.x = rand(-halfW * 1.05, halfW * 0.35);
				// mostly up in the sky, now and then low over the street
				run.y = Math.random() < 0.7 ? rand(-halfH * 0.9, -halfH * 0.1) : rand(0, halfH * 0.55);
			}
		}
		lines.forEach((run, i) => step(run, particles[BITS + i], run.kind ? 'gust_1.png' : 'gust_0.png', LINE.alpha, 384));

		wispWait -= dt;
		if (wispWait <= 0) {
			wispWait = (WISP.every[0] + (WISP.every[1] - WISP.every[0]) * gust) * rand(0.7, 1.3);
			const run = wisps.find((r) => r.age >= r.life);
			if (run) {
				run.age = 0;
				run.life = rand(WISP.life[0], WISP.life[1]);
				run.length = rand(WISP.length[0], WISP.length[1]) * visH;
				run.speed = (WISP.speed[0] + (WISP.speed[1] - WISP.speed[0]) * gust) * rand(0.85, 1.15);
				run.x = rand(-halfW * 1.1, halfW * 0.6);
				run.y = rand(scene.ground[0], scene.ground[1]) - scene.height / 2;
			}
		}
		wisps.forEach((run, i) => step(run, particles[BITS + LINES + i], 'wisp.png', WISP.alpha, 256));
	};
</script>

<!-- over the backgrounds (zIndex -2), under everything else at the root -->
<Container zIndex={-1.5} x={canvas.width / 2} y={canvas.height / 2} {scale}>
	<ParticleContainer>
		<Particles key="gust_0.png" size={BITS + LINES + WISPS} {init} {update} />
	</ParticleContainer>
</Container>
