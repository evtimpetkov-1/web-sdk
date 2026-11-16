<script lang="ts" module>
	/** the logo's win beat: its light flashes and it swells once (bookEventHandlerMap) */
	export type EmitterEventGameLogo = { type: 'logoWin' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { Container, SpineProvider, SpineTrack, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';

	// desktop/landscape: the Dynamite Gulch logo (contained in Chaos Lab 2's
	// 1480x985 canvas, so the box is unchanged), top-left of the board.
	// tablet/portrait: the one-row logo (2209x701 canvas) above the
	// multiplier plate — there is no side room on those boxes (tablet's
	// 1000-wide box leaves ~175 a side).
	// tablet: sized by WIDTH, a share of the board, capped by the room above the
	// plate (~86 units: the cap binds at ~257x86), and centred in that room.
	// portrait (2026-10-26, the board spans the screen): its lettering fills the
	// band between the canvas top and the plate (Evtim 2026-10-28: bigger, so
	// the art's transparent margins may overlap the gaps), up to
	// PORTRAIT_MAX_WIDTH of the screen, centred over the plate. (It used to step
	// left of the mascot's head; there is no mascot since 2026-11-13.)
	//
	// ALIVE (Evtim, 2026-11-13: "we can also animate the logo"): it breathes, a
	// hair, and its light plays over it: a sweep across the gold letters and
	// glints on the stars every few seconds (the overlay rigs dgLogoFx /
	// dgLogoRowFx, `idle`), a flash, two fast sweeps and one swell on a win
	// (`win`, the cue the mascot used to take). The rig holds no logo art: it is
	// laid over the sprite on the same box, and the two scale together.
	const ASPECT = 1480 / 985;
	const ROW_ASPECT = 2209 / 701;
	// logo_one_row.webp: the lettering's share of the art's height (Dynamite
	// Gulch, rows 248-570, under the hat; art-review/dynamite-gulch/build_scene.py
	// prints it)
	const ROW_INK = 323 / 701;
	// of the band-filling size: a touch smaller (Evtim, 2026-10-28: 0.92, then
	// "just a bit" more)
	const PORTRAIT_SCALE = 0.86;
	const ROW_WIDTH = 0.8; // of the board width (0.86 of the screen was too big)
	const PORTRAIT_MAX_WIDTH = 0.84; // of the visible width
	const GAP = 12; // to the plate's top
	const TOP_MARGIN = 16;
	const BREATH = { amount: 0.012, seconds: 5.2 };
	const SWELL = 1.07;

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
			const width = Math.min(
				(Math.max(40, bottom - top) / ROW_INK) * ROW_ASPECT * PORTRAIT_SCALE,
				stage.visibleWidth * PORTRAIT_MAX_WIDTH,
			);
			const plateX = board.x + (plate.x - board.pivot.x) * board.scale;
			return { x: plateX, y: (top + bottom) / 2, width, height: width / ROW_ASPECT };
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

	// the breath, on the Pixi ticker (it pauses with the renderer); none under
	// prefers-reduced-motion
	let time = $state(0);
	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		const tick = () => (time += app.ticker.deltaMS / 1000);
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});
	const breath = $derived(1 + BREATH.amount * Math.sin((2 * Math.PI * time) / BREATH.seconds));

	const swell = new Tween(1);
	let light = $state<'idle' | 'win'>('idle');
	context.eventEmitter.subscribeOnMount({
		logoWin: async () => {
			light = 'win';
			await swell.set(SWELL, { duration: 140, easing: cubicOut });
			await swell.set(1, { duration: 460, easing: backOut });
		},
	});
</script>

<MainContainer>
	<Container x={box.x} y={box.y} scale={breath * swell.current}>
		<Sprite
			key={stacked ? 'msLogoRow' : 'msLogo'}
			anchor={0.5}
			width={box.width}
			height={box.height}
		/>
		{#key stacked}
			<SpineProvider key={stacked ? 'dgLogoRowFx' : 'dgLogoFx'} width={box.width}>
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
