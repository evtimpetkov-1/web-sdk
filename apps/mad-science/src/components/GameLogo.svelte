<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';

	// desktop/landscape: the Mad Science logo (1465x1074), top-left of the
	// board, as in the mockup.
	// tablet/portrait: the one-row logo (2172x724, Evtim 2026-10-24) above the
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
	const ASPECT = 1465 / 1074;
	const ROW_ASPECT = 2172 / 724;
	// logo_one_row.webp: the lettering's share of the art's height (rows 86-627)
	const ROW_INK = 541 / 724;
	// of the band-filling size: a touch smaller (Evtim, 2026-10-28: 0.92, then
	// "just a bit" more)
	const PORTRAIT_SCALE = 0.86;
	const ROW_WIDTH = 0.8; // of the board width (0.86 of the screen was too big)
	const PORTRAIT_MAX_WIDTH = 0.62; // of the visible width
	const GAP = 12; // to the plate's top
	const TOP_MARGIN = 16;
	const SIDE_MARGIN = 16;
	const HEAD_GAP = 10;

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
	<Sprite
		key={stacked ? 'msLogoRow' : 'msLogo'}
		anchor={0.5}
		x={box.x}
		y={box.y}
		width={box.width}
		height={box.height}
	/>
</MainContainer>
