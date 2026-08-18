<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = { debug?: boolean };

	const props: Props = $props();
	const context = getContext();

	// How far past the board the mask reaches, top and bottom. The frame opening
	// starts ~4 units beyond the board, and everything from there to the frame's
	// outer edge has to be covered by solid stone or the symbol shows outside the
	// frame. Measured from the art's alpha across the full width of the opening:
	// reels_frame_v2 is opaque to 37 units past the board (fs_frame_v2 to 55), so
	// the base frame is the limit. 34 keeps a small margin for the soft edge.
	// NOTE: the nominal frame half-height suggests ~53 units of stone, but 16 of
	// those are transparent padding baked into the image — don't use that number.
	const OVERFLOW = 34;
</script>

{#if props.debug}
	<Rectangle
		alpha={0.5}
		backgroundColor={0xffffff}
		width={context.stateGameDerived.boardLayout().width}
		height={context.stateGameDerived.boardLayout().height}
	/>
{/if}

<!--
	The mask used to stop at the frame's opening (board height + 7), which meant a
	symbol was sliced by a hard horizontal line as soon as its centre passed ~10
	units below the bottom row — it vanished mid-cell instead of sliding away.

	The frame's stone border now renders on top of the board (see Game.svelte), so
	the mask can reach into it and let the stone do the hiding. OVERFLOW is kept
	just inside the stone so nothing pokes out past the frame. SymbolWrap's cull
	window has to stay wider than this rectangle — see the note there.
-->
<Rectangle
	isMask
	x={-SYMBOL_SIZE}
	y={-OVERFLOW}
	width={context.stateGameDerived.boardLayout().width + SYMBOL_SIZE * 2}
	height={context.stateGameDerived.boardLayout().height + OVERFLOW * 2}
/>
