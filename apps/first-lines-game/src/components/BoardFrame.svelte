<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	const boardX = $derived(context.stateGameDerived.boardLayout().x);
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const boardY = $derived(layoutType === 'desktop' || layoutType === 'landscape' ? 240 : 550);
</script>

<Sprite
	key="reelsBg"
	label="reelsBg"
	anchor={0.5}
	scale={0.5}
	x={boardX}
	y={boardY}
	zIndex={-1}
/>

<Sprite
	key="reelsFrame"
	label="boardFrame"
	anchor={0.5}
	scale={0.5}
	x={boardX}
	y={boardY}
	zIndex={1}
/>
