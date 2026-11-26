<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';

	type Props = {
		x: number;
		y: number;
		animating: boolean;
		/** sorted against sibling wraps in the same board layer (default 0); Pixi 8 turns sorting on for the parent when a child sets it */
		zIndex?: number;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);
	// A spinning reel's strip is many cells long: only those in or beside the window
	// are drawn. The window is the mask plus a cell each way, so nothing pops in or out
	// inside it.
	const inFrame = $derived(props.y >= -SYMBOL_SIZE && props.y <= BOARD_SIZES.height + SYMBOL_SIZE);
</script>

{#if show && inFrame}
	<Container x={props.x} y={props.y} zIndex={props.zIndex ?? 0}>
		{@render props.children()}
	</Container>
{/if}
