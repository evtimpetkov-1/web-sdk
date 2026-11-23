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
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	// desktop/landscape: the Chaos Lab 2 logo (1480x985, trimmed to its lettering
	// like the Chaos Lab one it replaced, 2026-11-03), top-left of the
	// board, as in the mockup.
	// tablet/portrait: the one-row logo (2209x701, Evtim 2026-11-03) above the
	// multiplier plate — there is no side room on those boxes (tablet's
	// 1000-wide box leaves ~175 a side).
	// tablet: sized by WIDTH, a share of the board, capped by the room above the
	// plate (~86 units: the cap binds at ~257x86), and centred in that room.
	// portrait (2026-10-26, the board spans the screen): its lettering fills the
	// band between the canvas top and the plate (Evtim 2026-10-28: bigger, so
	// the art's transparent margins may overlap the gaps), up to
	// PORTRAIT_MAX_WIDTH of the screen, centred over the plate (which slides
	// left of the mascot's flask), and steps further left when it would cover
	// his head (tall phones).
	const ASPECT = 1480 / 985;
	const ROW_ASPECT = 2209 / 701;
	// logo_one_row.webp: the lettering's share of the art's height (Chaos Lab 2,
	// rows 84-632; art-review/chaoslab2/logos/make_cl2_logos.py prints it)
	const ROW_INK = 548 / 701;
	// of the band-filling size: a touch smaller (Evtim, 2026-10-28: 0.92, then
	// "just a bit" more)
	const PORTRAIT_SCALE = 0.86;
	const ROW_WIDTH = 0.8; // of the board width (0.86 of the screen was too big)
	const PORTRAIT_MAX_WIDTH = 0.62; // of the visible width
	const GAP = 12; // to the plate's top
	const TOP_MARGIN = 16;
	const SIDE_MARGIN = 16;
	const HEAD_GAP = 10;

	/**
	 * The logo is alive (2026-11-17: it was a still picture, and the reviewers keep
	 * writing "too static"). Nothing is redrawn:
	 * - its slime glows: the logo drawn again additively, breathing
	 * - it drips: drops swell on the tips of its painted drips, fall and fade. The
	 *   tips were found on the art by art-review/chaoslab2/logos/find_drip_tips.py
	 *   (the lowest green pixel of each drip); run it again if a logo is swapped
	 * - it answers the board: a hard shake (bomb, big win, the feature trigger) makes
	 *   it flare, jolt and shake its drops off
	 * Off under prefers-reduced-motion. The drops use the scene layer's particle
	 * sheet (cl2SceneLife, cell 2 = a droplet).
	 */
	// art px of each logo file's drip tips
	const STACKED = {
		width: 1480,
		height: 985,
		tips: [[122, 540], [169, 827], [217, 937], [298, 907], [422, 926], [506, 854], [594, 947], [700, 961], [757, 899], [838, 864], [1074, 953], [1252, 941], [1347, 616]],
	};
	const ROW = {
		width: 2209,
		height: 701,
		tips: [[119, 552], [191, 614], [331, 548], [450, 568], [553, 560], [627, 479], [709, 547], [834, 526], [992, 553], [1051, 608], [1279, 584], [1344, 543], [1467, 535], [1623, 554], [1719, 593], [1837, 488], [1977, 562], [2127, 546]],
	};
	const DROPS = 5;
	const DROP_WIDTH = 0.032; // of the logo's height (the painted drips are 0.02: a falling drop that thin was not seen)
	const FALL = 0.42; // how far a drop falls before it is gone, in logo heights
	const SLIME = 0x9fe014;

	type Particle = Parameters<ParticlesProps['init']>[0][number];
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	// Pixi 8.8's Particle reads a number tint as blue-green-red (see SceneLife)
	const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
	const still = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
	// `?scene=fast` (the scene layer's preview switch): big time steps, so a film made
	// in headless Chrome shows the drips at their real pace
	const MAX_STEP = new URLSearchParams(window.location.search).get('scene') === 'fast' ? 0.3 : 0.05;

	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const stacked = $derived(layout === 'tablet' || layout === 'portrait');

	const box = $derived.by(() => {
		if (layout === 'portrait') {
			const stage = context.stateGameDerived.portraitStage();
			const top = stage.top + TOP_MARGIN;
			const bottom = stage.plateTop - GAP;
			const fit = Math.min(
				(Math.max(40, bottom - top) / ROW_INK) * ROW_ASPECT * PORTRAIT_SCALE,
				stage.visibleWidth * PORTRAIT_MAX_WIDTH,
			);
			const plateX = board.x + (plate.x - board.pivot.x) * board.scale;
			const headLeft = context.stateGameDerived.portraitMascot().headLeft;
			const right = Math.min(plateX + fit / 2, headLeft - HEAD_GAP);
			const width = Math.min(fit, right - (stage.left + SIDE_MARGIN));
			return { x: right - width / 2, y: (top + bottom) / 2, width, height: width / ROW_ASPECT };
		}
		if (layout === 'tablet') {
			// plate top in main coords: the logo takes the room above it
			const plateTop = board.y - board.height / 2 + plate.y - plate.height / 2;
			const room = plateTop - GAP - TOP_MARGIN;
			const width = Math.min(board.width * ROW_WIDTH, Math.max(40, room) * ROW_ASPECT);
			// centred between the top margin and the gap above the plate
			const y = (TOP_MARGIN + plateTop - GAP) / 2;
			return { x: board.x, y, width, height: width / ROW_ASPECT };
		}
		if (context.stateGameDerived.sideLayout()) {
			// desktop / phone landscape (2026-11-20): on top of the column left of the frame,
			// over the multiplier plate; it grows with the board, as wide as the column lets it
			const column = context.stateGameDerived.sideColumn();
			const stage = context.stateGameDerived.wideStage();
			const x = board.x + (column.x - board.pivot.x) * board.scale;
			const frameLeft = board.x - board.pivot.x * board.scale;
			const width = Math.min(
				column.logo.height * board.scale * ASPECT,
				2 * (x - stage.left - SIDE_MARGIN),
				2 * (frameLeft - x),
			);
			return { x, y: board.y + (column.logo.y - board.pivot.y) * board.scale, width, height: width / ASPECT };
		}
		// mockup (2026-09-02): logo centre ~0.2 board widths left of the board, its
		// top level with the frame's top pipe
		const height = board.height * 0.34;
		const width = height * ASPECT;
		return {
			x: Math.max(board.x - board.width * 0.5 - width * 0.52, width * 0.52),
			y: board.y - board.height * 0.5 + height * 0.18,
			width,
			height,
		};
	});

	// ---- life
	let glow = $state(0);
	let pulse = $state(1);
	let flare = 0;
	let shakeOff = false;
	let clock = 0;
	let last = 0;
	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const strength = (SHAKE_PRESETS[preset] as { trauma?: number }).trauma ?? 0;
			if (strength < 0.45) return;
			flare = Math.max(flare, strength);
			shakeOff = true;
		},
	});

	type Drop = { state: 'wait' | 'grow' | 'fall'; t: number; tip: number; fell: number; speed: number; size: number };
	const drops: Drop[] = Array.from({ length: DROPS }, (_, i) => ({ state: 'wait' as const, t: 0.6 + i * 1.1 + rand(0, 1.5), tip: 0, fell: 0, speed: 0, size: 1 }));

	const initDrops = (particles: Particle[]) => {
		const droplet = new Texture({ source: particles[0].texture.source, frame: new PixiRectangle(2 * 128, 0, 128, 128) });
		for (const p of particles) {
			p.texture = droplet;
			p.anchorX = 0.5;
			p.anchorY = 0.2; // near the droplet's point, which hangs from the tip
			p.tint = bgr(SLIME);
			p.alpha = 0;
		}
	};

	const updateDrops = (particles: Particle[]) => {
		const now = performance.now();
		const dt = Math.min(MAX_STEP, last ? (now - last) / 1000 : 0.016);
		last = now;
		clock += dt;
		flare = Math.max(0, flare - dt * 2.2);
		// one write a frame each, rounded so a settled value stops writing
		const nextGlow = Math.round((0.1 + 0.07 * Math.sin(clock * 1.7) + 0.5 * flare) * 100) / 100;
		if (nextGlow !== glow) glow = nextGlow;
		const nextPulse = Math.round((1 + 0.006 * Math.sin(clock * 1.7) + 0.035 * flare) * 1000) / 1000;
		if (nextPulse !== pulse) pulse = nextPulse;

		const art = stacked ? ROW : STACKED;
		const k = box.height / art.height; // art px -> layout units
		const wide = DROP_WIDTH * box.height;
		drops.forEach((d, i) => {
			const p = particles[i];
			d.t -= dt;
			if (d.state === 'wait') {
				p.alpha = 0;
				if (d.t > 0) return;
				// a tip no other drop hangs from
				let tip = Math.floor(Math.random() * art.tips.length);
				if (drops.some((o) => o !== d && o.state !== 'wait' && o.tip === tip)) tip = (tip + 1) % art.tips.length;
				Object.assign(d, { state: 'grow', t: rand(0.7, 1.3), tip, fell: 0, speed: 0, size: rand(0.8, 1.25) });
				return;
			}
			const [tx, ty] = art.tips[d.tip % art.tips.length];
			let grown = 1;
			let stretch = 1;
			if (d.state === 'grow') {
				grown = 1 - Math.max(0, d.t) / 1.3;
				if (d.t <= 0 || shakeOff) d.state = 'fall';
			} else {
				d.speed += 2.6 * dt; // logo heights per second, per second
				d.fell += d.speed * dt;
				stretch = 1 + Math.min(0.9, d.speed * 0.9);
				if (d.fell >= FALL) {
					Object.assign(d, { state: 'wait', t: rand(1.2, 4.5) });
					p.alpha = 0;
					return;
				}
			}
			p.x = (tx - art.width / 2) * k;
			p.y = (ty - art.height / 2) * k + d.fell * box.height;
			p.scaleX = (wide * d.size * (0.35 + 0.65 * grown)) / 54;
			p.scaleY = p.scaleX * stretch;
			p.alpha = Math.min(1, grown * 2) * (1 - (d.fell / FALL) ** 2);
		});
		shakeOff = false;
	};
</script>

<MainContainer>
	<Container x={box.x} y={box.y} scale={pulse}>
		{#if !still}
			<!-- under the lettering: a drop swells out from behind its tip -->
			<ParticleContainer>
				<Particles key="cl2SceneLife" size={DROPS} init={initDrops} update={updateDrops} />
			</ParticleContainer>
		{/if}
		<Sprite key={stacked ? 'msLogoRow' : 'msLogo'} anchor={0.5} width={box.width} height={box.height} />
		{#if !still}
			<!-- the slime glows: the same art again, added on top, breathing -->
			<Sprite
				key={stacked ? 'msLogoRow' : 'msLogo'}
				anchor={0.5}
				width={box.width}
				height={box.height}
				blendMode="add"
				alpha={glow}
			/>
		{/if}
	</Container>
</MainContainer>
