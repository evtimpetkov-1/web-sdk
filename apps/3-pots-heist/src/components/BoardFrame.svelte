<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { FRAME_BOX } from '../game/constants';

	/**
	 * Evtim's reel frame (reels/frame.png) in two layers, cut by
	 * art-review/3-pots-heist/app/build_app_assets.py:
	 * - `panel`: the whole art, under the reels (the dark cells and the grid between them);
	 * - `border`: its steel border alone, over the reels.
	 * Board-local units; the art's cells are the board's cells.
	 */
	type Props = { layer: 'panel' | 'border' };

	const props: Props = $props();
</script>

<Sprite key={props.layer === 'panel' ? 'phFramePanel' : 'phFrameBorder'} {...FRAME_BOX} />
