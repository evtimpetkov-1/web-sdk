<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

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
	const top = 0;
	const bottom = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	const inFrame = $derived(props.y >= top && props.y <= bottom);
	// Lower rows draw over upper ones: a high's hat overflows its cell upwards and
	// has to cover the tile above it, whatever order the wraps were (re)mounted in.
	// The row term stays far below the whole steps the callers sort by.
	const zIndex = $derived((props.zIndex ?? 0) + Math.round(props.y / SYMBOL_SIZE) * 0.001);
</script>

{#if show && inFrame}
	<Container x={props.x} y={props.y} {zIndex}>
		{@render props.children()}
	</Container>
{/if}
