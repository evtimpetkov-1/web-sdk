<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Rectangle, Sprite, SpineProvider, SpineTrack, Container, Text } from 'pixi-svelte';
	import { stateUi } from 'state-shared';
	import { WHITE } from 'constants-shared/colors';

	import { getContext } from '../game/context';

	const context = getContext();
	const BG_SCALE = { width: 1.1, height: 0.7 };
	const FRAME_SCALE = { width: 1.3653, height: 0.9217 };
	const POSITION_ADJUSTMENT = 1.01;

	const boardLayout = $derived(context.stateGameDerived.boardLayout());
	const frameX = $derived(boardLayout.x * POSITION_ADJUSTMENT);
	const frameY = $derived(boardLayout.y * POSITION_ADJUSTMENT);
	const frameW = $derived(boardLayout.width * FRAME_SCALE.width);
	const frameH = $derived(boardLayout.width * FRAME_SCALE.height);

	// Free spin counter — positioned at bottom of frame, scales with board
	const fsCounterY = $derived(frameY + frameH * 0.5 + 20);
	const fsCounterScale = $derived(boardLayout.width / 600);

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

<!-- Free spin counter — anchored to bottom of frame, scales with board -->
{#if stateUi.freeSpinCounterShow}
	<Container
		label="FreeSpinCounterContainer"
		x={frameX}
		y={fsCounterY}
		scale={fsCounterScale}
	>
		<Sprite key="fsCounterBg" anchor={0.5} />
		<Text
			text="FREE SPINS"
			anchor={{ x: 0.5, y: 1 }}
			y={-10}
			style={{
				fontFamily: 'Inter',
				fontSize: 45,
				fontWeight: '700',
				fill: 0xf0d060,
				letterSpacing: 2,
			}}
		/>
		<Text
			text={`${stateUi.freeSpinCounterCurrent} / ${stateUi.freeSpinCounterTotal}`}
			anchor={{ x: 0.5, y: 0 }}
			y={-2}
			style={{
				fontFamily: 'Inter',
				fontSize: 52,
				fontWeight: '700',
				fill: WHITE,
				letterSpacing: 1,
			}}
		/>
	</Container>
{/if}
