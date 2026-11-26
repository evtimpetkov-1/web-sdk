<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { BOARD_SIZES, FRAME_COVER, SYMBOL_SIZE } from '../game/constants';
</script>

<!--
	The reel window, reaching FRAME_COVER past the cells top and bottom: that strip is
	under the frame's steel border (drawn over the reels), so a spinning symbol slides
	away under the steel instead of being cut flat at the cells' edge.
-->
<Rectangle
	isMask
	x={-SYMBOL_SIZE}
	y={-FRAME_COVER}
	width={BOARD_SIZES.width + SYMBOL_SIZE * 2}
	height={BOARD_SIZES.height + FRAME_COVER * 2}
/>
