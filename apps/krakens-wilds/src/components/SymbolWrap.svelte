<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { CELL_H, BOARD_SIZES } from '../game/constants';

	type Props = {
		debug?: boolean;
		x: number;
		y: number;
		animating: boolean;
		/** sorted against sibling wraps in the same board layer (default 0) */
		zIndex?: number;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);
	// Cull window, in board-local units (props.y is a symbol CENTRE). The two board
	// layers need different windows because only one of them is masked:
	//
	// - Static layer (animate=false): masked by BoardMask, so the window must reach
	//   at least as far as the mask does — otherwise a symbol stops being rendered
	//   while still inside the mask and blinks out instead of sliding away. One full
	//   cell of margin covers the mask overflow plus half a symbol.
	//   (The old window was `0 .. SYMBOL_SIZE * rows` = 0..384. Two bugs: the grid
	//   pitch is CELL_H (137), not SYMBOL_SIZE (128), so the lower bound sat 27 units
	//   ABOVE the board's bottom edge (411) and spinning symbols vanished before
	//   clearing the bottom row; and the upper bound was the board top, so symbols
	//   popped in instead of entering from behind the frame.)
	//
	// - Animating layer (animate=true): NOT masked — it is unmasked on purpose so
	//   land/win/idle spines can overflow their cell. Nothing clips it, so it must be
	//   culled to the visible rows only. A padded row landing an S or W would
	//   otherwise play its land animation and then sit in 'idle' below the frame.
	//   Row centres are 68.5/205.5/342.5, and the stop bounce shifts them down by
	//   reelBounceSizeMulti * CELL_H (max 0.3 -> 41), so 0..411 holds every visible
	//   row through the bounce while still excluding the padding rows at -68.5 and
	//   479.5. A bounce of half a cell or more would break that assumption.
	const top = $derived(boardContext.animate ? 0 : -CELL_H);
	const bottom = $derived(BOARD_SIZES.height + (boardContext.animate ? 0 : CELL_H));
	const inFrame = $derived(props.y >= top && props.y <= bottom);
</script>

{#if props.debug || (show && inFrame)}
	<Container label="SymbolWrapContainer" x={props.x} y={props.y} zIndex={props.zIndex ?? 0}>
		{@render props.children()}
	</Container>
{/if}
