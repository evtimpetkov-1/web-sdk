<script lang="ts" module>
	import type { Position } from '../game/types';

	/** winning cells throw their gold at the WIN counter (winInfo, late in the prewins) */
	export type EmitterEventGoldFx = { type: 'winGoldFly'; positions: Position[] };
</script>

<script lang="ts">
	// Gold in motion over the board (Evtim, 2026-11-16, ideas 1 and 2):
	// - a collected multiplier's value no longer just slides to the sign above the
	//   reels: it flies as a comet (a hot head and a trail of sparks), and the sign
	//   takes the hit: a flash and a burst of sparks (globalMultiplierUpdate)
	// - a win pays: nuggets leave every winning cell as it shatters and fly in an
	//   arc to the WIN counter (TOTAL WIN in free spins), which glints and throws
	//   sparks as they land, so the win reads as something collected
	// Board-local coordinates, inside a BoardContainer. Two ParticleContainers on one
	// small atlas (bs/fx/gold.webp: glow, star, four nuggets), stepped on the Pixi
	// ticker; mounted once and kept (pixi-svelte's Particles never removes its ticker
	// callback). Pixi's Particle takes a numeric tint as BGR, hence bgr().
	import { ParticleContainer, Particles, PixiRectangle, Texture } from 'pixi-svelte';
	import type { Particle } from 'pixi.js';
	import { stateBetDerived } from 'state-shared';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX, getSymbolY } from '../game/utils';

	const context = getContext();
	const still =
		typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	const CELL = 128;
	const U = SYMBOL_SIZE / 100; // sizes below are for a cell of 100 board units
	const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	const cells = (particles: Particle[]) => {
		const source = particles[0].texture.source;
		return [0, 1, 2, 3, 4, 5].map((i) => new Texture({ source, frame: new PixiRectangle(i * CELL, 0, CELL, CELL) }));
	};
	const hide = (p: Particle) => {
		p.alpha = 0;
		p.scaleX = p.scaleY = 0;
	};

	// where a win lands: the WIN counter (base game) / TOTAL WIN (free spins)
	const counter = () => {
		const plate = context.stateGameDerived.multiplierPlateLayout();
		const boardWidth = context.stateGameDerived.boardLayout().width;
		if (context.stateLayoutDerived.layoutType() === 'portrait') {
			const line = context.stateGameDerived.portraitCounterLayout();
			return { x: context.stateGame.gameType === 'freegame' ? line.right : boardWidth / 2, y: line.y };
		}
		const room = boardWidth - (plate.x + plate.width / 2);
		return { x: boardWidth - room / 2, y: plate.y + SYMBOL_SIZE * 0.1 };
	};

	// ---------------------------------------------------------------- nuggets (normal blend)
	const NUGGETS = 44;
	type Nugget = { t: number; life: number; delay: number; x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; size: number; spin: number; landed: boolean };
	const nuggets: Nugget[] = Array.from({ length: NUGGETS }, () => ({ t: 1, life: 0, delay: 0, x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0, size: 0, spin: 0, landed: true }));

	// ---------------------------------------------------------------- light (additive)
	const SPARKS = 110;
	const HEADS = 8;
	const FLASHES = 4;
	const LIT = SPARKS + HEADS + FLASHES;
	type Spark = { age: number; life: number; x: number; y: number; vx: number; vy: number; size: number; star: boolean; tint: number };
	const sparks: Spark[] = Array.from({ length: SPARKS }, () => ({ age: 1, life: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, star: false, tint: 0xffffff }));
	const flashes = Array.from({ length: FLASHES }, () => ({ age: 1, life: 0, x: 0, y: 0, size: 0 }));
	const GOLD = [0xffe9a8, 0xffd060, 0xfff4d6];

	const spark = (x: number, y: number, speed: number, life: number, size: number, up = 0) => {
		const s = sparks.find((q) => q.age >= q.life);
		if (!s) return;
		const angle = rand(0, Math.PI * 2);
		const v = speed * rand(0.35, 1);
		Object.assign(s, { age: 0, life: life * rand(0.7, 1.2), x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - up, size: size * rand(0.7, 1.3), star: Math.random() < 0.3, tint: GOLD[Math.floor(Math.random() * GOLD.length)] });
	};
	const flash = (x: number, y: number, size: number, life = 0.42) => {
		const f = flashes.find((q) => q.age >= q.life);
		if (f) Object.assign(f, { age: 0, life, x, y, size });
	};
	const burst = (x: number, y: number, n: number, speed: number, size: number) => {
		for (let i = 0; i < n; i++) spark(x, y, speed, 0.5, size, 30 * U);
	};

	// the sign flashes when its value RISES, not on every free spin's repeat of it
	let lastMultiplier = 1;
	context.eventEmitter.subscribeOnMount({
		winGoldFly: ({ positions }) => {
			if (still || !positions.length) return;
			const target = counter();
			// two nuggets a cell, fewer when half the board pays
			const each = positions.length > 14 ? 1 : 2;
			positions.forEach((position, i) => {
				for (let k = 0; k < each; k++) {
					const n = nuggets.find((q) => q.t >= q.life + q.delay && q.landed);
					if (!n) return;
					const x0 = getSymbolX(position.reel) + rand(-0.2, 0.2) * SYMBOL_SIZE;
					const y0 = getSymbolY(position.row - 1) + rand(-0.2, 0.2) * SYMBOL_SIZE;
					// thrown up and out of the cell first, then pulled to the counter
					Object.assign(n, {
						t: 0,
						delay: rand(0, 0.14) + (i % 6) * 0.012,
						life: rand(0.44, 0.62),
						x0,
						y0,
						cx: x0 + rand(-1.1, 1.1) * SYMBOL_SIZE,
						cy: y0 - rand(0.5, 1.5) * SYMBOL_SIZE,
						x1: target.x + rand(-0.25, 0.25) * SYMBOL_SIZE,
						y1: target.y + rand(-0.08, 0.08) * SYMBOL_SIZE,
						size: rand(26, 38) * U,
						spin: rand(-12, 12),
						landed: false,
					});
				}
			});
		},
		globalMultiplierUpdate: ({ multiplier, instant }) => {
			const rose = multiplier > lastMultiplier;
			lastMultiplier = multiplier;
			if (still || instant || !rose) return;
			const plate = context.stateGameDerived.multiplierPlateLayout();
			flash(plate.x, plate.y, plate.width * 1.5);
			burst(plate.x, plate.y, 18, 260 * U, 11 * U);
		},
	});

	const initNuggets = (particles: Particle[]) => {
		const tex = cells(particles);
		particles.forEach((p, i) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = tex[2 + (i % 4)];
			hide(p);
		});
	};
	let lastA = 0;
	const updateNuggets = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(0.05, lastA ? (now - lastA) / 1000 : 0.016) * stateBetDerived.timeScale();
		lastA = now;
		nuggets.forEach((n, i) => {
			const p = particles[i];
			if (n.landed) return hide(p);
			n.t += dt;
			const t = n.t - n.delay;
			if (t < 0) return hide(p);
			if (t >= n.life) {
				n.landed = true;
				hide(p);
				// the counter takes it: a glint and a few sparks
				flash(n.x1, n.y1, SYMBOL_SIZE * 0.9, 0.3);
				for (let k = 0; k < 3; k++) spark(n.x1, n.y1, 150 * U, 0.4, 8 * U, 20 * U);
				return;
			}
			// slow out of the cell, fast into the counter
			const k = (t / n.life) ** 1.45;
			const a = (1 - k) * (1 - k);
			const b = 2 * (1 - k) * k;
			const c = k * k;
			p.x = a * n.x0 + b * n.cx + c * n.x1;
			p.y = a * n.y0 + b * n.cy + c * n.y1;
			p.rotation = n.spin * t;
			p.scaleX = p.scaleY = (n.size / CELL) * (1.25 - 0.55 * k) * Math.min(1, t / 0.06);
			p.alpha = 1;
			// a thin trail of light behind each one
			if (Math.random() < 0.35) spark(p.x, p.y, 28 * U, 0.3, 6 * U);
		});
	};

	let glowTexture: Texture;
	let starTexture: Texture;
	const initLit = (particles: Particle[]) => {
		[glowTexture, starTexture] = cells(particles);
		particles.forEach((p) => {
			p.anchorX = p.anchorY = 0.5;
			p.texture = glowTexture;
			hide(p);
		});
	};
	let lastB = 0;
	const updateLit = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(0.05, lastB ? (now - lastB) / 1000 : 0.016);
		lastB = now;
		// multiplier values in flight (MultiplierBoard tweens them to the sign): a hot
		// head on each, sparks shed along the way
		const plate = context.stateGameDerived.multiplierPlateLayout();
		let head = 0;
		for (const reel of context.stateGame.multiplierBoard) {
			for (const symbol of reel ?? []) {
				if (!symbol || head >= HEADS) continue;
				const x = symbol.symbolX.current;
				const y = symbol.symbolY.current;
				const moved = Math.hypot(x - symbol.initX, y - symbol.initY);
				const left = Math.hypot(x - plate.x, y - plate.y);
				if (still || moved < 2 || left < 2) continue;
				const p = particles[SPARKS + head++];
				p.texture = glowTexture;
				p.x = x;
				p.y = y;
				p.scaleX = p.scaleY = (SYMBOL_SIZE * 1.5) / CELL;
				p.tint = bgr(0xffc45a);
				p.alpha = 0.75;
				for (let k = 0; k < 2; k++) spark(x + rand(-14, 14) * U, y + rand(-10, 10) * U, 60 * U, 0.42, 9 * U);
			}
		}
		for (let i = head; i < HEADS; i++) hide(particles[SPARKS + i]);

		sparks.forEach((s, i) => {
			const p = particles[i];
			if (s.age >= s.life) return hide(p);
			s.age += dt;
			const k = Math.min(1, s.age / s.life);
			s.vy += 260 * U * dt;
			s.x += s.vx * dt;
			s.y += s.vy * dt;
			p.texture = s.star ? starTexture : glowTexture;
			p.x = s.x;
			p.y = s.y;
			p.rotation = s.star ? k * 2 : 0;
			p.scaleX = p.scaleY = ((s.size * (s.star ? 3.2 : 1.6)) / CELL) * (1 - 0.6 * k);
			p.tint = bgr(s.tint);
			p.alpha = (1 - k) ** 0.7;
		});
		flashes.forEach((f, i) => {
			const p = particles[SPARKS + HEADS + i];
			if (f.age >= f.life) return hide(p);
			f.age += dt;
			const k = Math.min(1, f.age / f.life);
			p.texture = glowTexture;
			p.x = f.x;
			p.y = f.y;
			p.scaleX = p.scaleY = (f.size / CELL) * (0.7 + 1.1 * k);
			p.tint = bgr(0xffdc8a);
			p.alpha = 0.85 * (1 - k) ** 1.4;
		});
	};
</script>

<BoardContainer>
	<ParticleContainer>
		<Particles key="bsGold" size={NUGGETS} init={initNuggets} update={updateNuggets} />
	</ParticleContainer>
	<ParticleContainer blendMode="add">
		<Particles key="bsGold" size={LIT} init={initLit} update={updateLit} />
	</ParticleContainer>
</BoardContainer>
