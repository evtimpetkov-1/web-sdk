<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';

	// desktop/landscape: the Mad Science logo (1465x1074), top-left of the
	// board, as in the mockup.
	// tablet/portrait: the one-row logo (2172x724, Evtim 2026-10-24) above the
	// multiplier plate — there is no side room on those boxes (tablet's
	// 1000-wide box leaves ~175 a side). Sized by WIDTH, a share of the board,
	// capped by the room above the plate (portrait ~271 units: 444x148; tablet
	// ~86: the cap binds at ~257x86), and centred in that room.
	const ASPECT = 1465 / 1074;
	const ROW_ASPECT = 2172 / 724;
	const ROW_WIDTH = 0.8; // of the board width (0.86 of the screen was too big)
	const GAP = 12; // to the plate's top
	const TOP_MARGIN = 16;

	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const stacked = $derived(layout === 'tablet' || layout === 'portrait');
	// plate top in main coords: the stacked logo takes the room above it
	const plateTop = $derived(board.y - board.height / 2 + plate.y - plate.height / 2);

	const size = $derived.by(() => {
		if (!stacked) {
			const height = board.height * 0.34;
			return { width: height * ASPECT, height };
		}
		const room = plateTop - GAP - TOP_MARGIN;
		const width = Math.min(board.width * ROW_WIDTH, Math.max(40, room) * ROW_ASPECT);
		return { width, height: width / ROW_ASPECT };
	});
	// mockup (2026-09-02): logo centre ~0.2 board widths left of the board, its
	// top level with the frame's top pipe
	const position = $derived.by(() => {
		if (!stacked) {
			return {
				x: Math.max(board.x - board.width * 0.5 - size.width * 0.52, size.width * 0.52),
				y: board.y - board.height * 0.5 + size.height * 0.18,
			};
		}
		// centred between the top margin and the gap above the plate
		return { x: board.x, y: (TOP_MARGIN + plateTop - GAP) / 2 };
	});
</script>

<MainContainer>
	<Sprite
		key={stacked ? 'msLogoRow' : 'msLogo'}
		anchor={0.5}
		x={position.x}
		y={position.y}
		width={size.width}
		height={size.height}
	/>
</MainContainer>
