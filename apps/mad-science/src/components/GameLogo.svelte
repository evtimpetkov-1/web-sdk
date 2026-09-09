<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';

	// Mad Science logo (1465x1074).
	// desktop/landscape: top-left of the board, as in the mockup.
	// tablet/portrait: centred ABOVE the multiplier plate — there is no side
	// room on those boxes (tablet's 1000-wide box leaves ~175 a side).
	const ASPECT = 1465 / 1074;
	const GAP = 12; // to the plate's top
	const TOP_MARGIN = 16;

	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const stacked = $derived(layout === 'tablet' || layout === 'portrait');

	const size = $derived.by(() => {
		if (!stacked) {
			const height = board.height * 0.34;
			return { width: height * ASPECT, height };
		}
		// plate top in main coords; the logo takes the room above it, capped
		const plateTop = board.y - board.height / 2 + plate.y - plate.height / 2;
		const wanted = board.width * (layout === 'portrait' ? 0.42 : 0.3);
		const height = Math.max(40, Math.min(wanted, plateTop - GAP - TOP_MARGIN));
		return { width: height * ASPECT, height };
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
		const plateTop = board.y - board.height / 2 + plate.y - plate.height / 2;
		return { x: board.x, y: plateTop - GAP - size.height / 2 };
	});
</script>

<MainContainer>
	<Sprite
		key="msLogo"
		anchor={0.5}
		x={position.x}
		y={position.y}
		width={size.width}
		height={size.height}
	/>
</MainContainer>
