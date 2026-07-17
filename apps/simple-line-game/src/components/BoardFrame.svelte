<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Rectangle, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const BG_SCALE = { width: 1.1, height: 0.7 };
	const FRAME_SCALE = { width: 1.30, height: 0.88 };
	const POSITION_ADJUSTMENT = 1.01;

	const boardLayout = $derived(context.stateGameDerived.boardLayout());
	const frameX = $derived(boardLayout.x * POSITION_ADJUSTMENT);
	const frameY = $derived(boardLayout.y * POSITION_ADJUSTMENT);
	const frameW = $derived(boardLayout.width * FRAME_SCALE.width);
	const frameH = $derived(boardLayout.width * FRAME_SCALE.height);

	let glowVisible = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (glowVisible = true),
		boardFrameGlowHide: () => (glowVisible = false),
	});
</script>

<Rectangle
	anchor={0.5}
	x={frameX}
	y={frameY}
	width={boardLayout.width * BG_SCALE.width}
	height={boardLayout.width * BG_SCALE.height}
	backgroundColor={0x0a2a3a}
	backgroundAlpha={0.85}
	borderRadius={8}
/>

<Sprite
	key="frameEdgeDeep"
	anchor={0.5}
	x={frameX}
	y={frameY}
	width={frameW}
	height={frameH}
/>

<!-- Frame overlay idle animation (gem glows, shimmers, bubbles, caustics, sparkles) -->
<SpineProvider
	key="frameOverlay"
	x={frameX}
	y={frameY}
	width={frameW}
	height={frameH}
>
	<SpineTrack trackIndex={0} animationName="idle" loop={true} />
</SpineProvider>
