<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { Container, SpineProvider, SpineTrack, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	// ALIVE (Evtim, 2026-11-16: "maybe animate the logo of the game?"):
	// - it breathes, a hair, and light plays over the gold: one slow pass across the
	//   letters and glints on their brightest points every few seconds (the overlay
	//   rigs bsLogoFx, `idle`; art-review/blast-shaft/build_logo_fx.py). The rig holds
	//   only light cut from the logo, laid over the sprite on the same box.
	// - the mine's big moments reach it (SceneShake): it rattles on its nails with
	//   every shake, and on the strong ones (a bomb, the cloners bursting, the free
	//   spins trigger, a big win's title) it flares, two fast passes of light, and
	//   swells once (`win`).
	// Nothing moves under prefers-reduced-motion.
	// desktop/landscape: the Chaos Lab logo (1393x957, trimmed to its lettering
	// like the Mad Science one it replaced, 2026-10-29), top-left of the
	// board, as in the mockup.
	// tablet/portrait: the one-row logo (2172x724, Evtim 2026-10-24) above the
	// multiplier plate — there is no side room on those boxes (tablet's
	// 1000-wide box leaves ~175 a side).
	// tablet: sized by WIDTH, a share of the board, capped by the room above the
	// plate (~86 units: the cap binds at ~257x86), and centred in that room.
	// portrait (2026-10-26, the board spans the screen): its lettering fills the
	// band between the canvas top and the plate (Evtim 2026-10-28: bigger, so
	// the art's transparent margins may overlap the gaps), up to
	// PORTRAIT_MAX_WIDTH of the screen, centred over the plate (the middle of
	// the screen: no mascot stands behind the board since 2026-11-13).
	const ASPECT = 1393 / 957;
	const ROW_ASPECT = 2172 / 724;
	// logo_one_row.webp: the lettering's share of the art's height (Blast Drop,
	// rows 197-526; art-review/blast-shaft/build_logo_drop.py prints it)
	const ROW_INK = 330 / 724;
	// of the band-filling size: a touch smaller (Evtim, 2026-10-28: 0.92, then
	// "just a bit" more)
	const PORTRAIT_SCALE = 0.86;
	const ROW_WIDTH = 0.8; // of the board width (0.86 of the screen was too big)
	const PORTRAIT_MAX_WIDTH = 0.78; // of the visible width (0.62 while a mascot shared the band)
	const GAP = 12; // to the plate's top
	const TOP_MARGIN = 16;
	const SIDE_MARGIN = 16;

	const BREATH = { amount: 0.012, seconds: 5.6 };
	const SWELL = 1.06;
	// at a shake of strength 1: the rattle's roll (radians) and drop (x the logo's height)
	const RATTLE = { roll: 0.03, drop: 0.035, hz: 15, decay: 2.4 };

	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const stacked = $derived(layout === 'tablet' || layout === 'portrait');

	// the breath and the rattle, on the Pixi ticker (it pauses with the renderer)
	let time = $state(0);
	let jolt = $state(0);
	let still = true;
	onMount(() => {
		const app = context.stateApp.pixiApplication;
		still = !app || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (!app || still) return;
		const tick = () => {
			const dt = app.ticker.deltaMS / 1000;
			time += dt;
			if (jolt > 0) jolt = Math.max(0, jolt - RATTLE.decay * dt);
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});
	const breath = $derived(1 + BREATH.amount * Math.sin((2 * Math.PI * time) / BREATH.seconds));
	const roll = $derived(RATTLE.roll * jolt * jolt * Math.sin(2 * Math.PI * RATTLE.hz * time));
	const drop = $derived(RATTLE.drop * jolt * jolt * Math.abs(Math.sin(2 * Math.PI * RATTLE.hz * 0.5 * time)));

	const swell = new Tween(1);
	let light = $state<'idle' | 'win'>('idle');
	context.eventEmitter.subscribeOnMount({
		sceneShake: async ({ preset }) => {
			if (still) return;
			const { trauma = 0, kick = 0 } = SHAKE_PRESETS[preset] as { trauma?: number; kick?: number };
			const strength = Math.max(trauma, kick * 0.7);
			jolt = Math.min(1, Math.max(jolt, strength));
			if (trauma < 0.5 || light === 'win') return;
			light = 'win';
			await swell.set(SWELL, { duration: 140, easing: cubicOut });
			await swell.set(1, { duration: 460, easing: backOut });
		},
	});

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
			const width = Math.min(fit, stage.visibleWidth - 2 * SIDE_MARGIN);
			return { x: plateX, y: (top + bottom) / 2, width, height: width / ROW_ASPECT };
		}
		if (layout === 'tablet') {
			// plate top in main coords: the logo takes the room above it
			const plateTop = board.y - board.height / 2 + plate.y - plate.height / 2;
			const room = plateTop - GAP - TOP_MARGIN;
			// by the LETTERING's height, not the canvas's (the Blast Drop row is slim:
			// its ink is 0.42 of the art's height, so the canvas cap left it tiny)
			const width = Math.min(board.width * ROW_WIDTH, (Math.max(40, room) / ROW_INK) * ROW_ASPECT * PORTRAIT_SCALE);
			// centred between the top margin and the gap above the plate
			const y = (TOP_MARGIN + plateTop - GAP) / 2;
			return { x: board.x, y, width, height: width / ROW_ASPECT };
		}
		// desktop / landscape with the generic UI: left of the grown board (stateGame sideStage)
		const side = context.stateGameDerived.sideStage();
		if (side) return side.logo;
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
</script>

<MainContainer>
	<Container x={box.x} y={box.y + drop * box.height} rotation={roll} scale={breath * swell.current}>
		<Sprite
			key={stacked ? 'msLogoRow' : 'msLogo'}
			anchor={0.5}
			width={box.width}
			height={box.height}
		/>
		{#key stacked}
			<SpineProvider key={stacked ? 'bsLogoRowFx' : 'bsLogoFx'} width={box.width}>
				<SpineTrack
					trackIndex={0}
					animationName={light}
					loop={light === 'idle'}
					listener={{
						complete: () => {
							if (light === 'win') light = 'idle';
						},
					}}
				/>
			</SpineProvider>
		{/key}
	</Container>
</MainContainer>
