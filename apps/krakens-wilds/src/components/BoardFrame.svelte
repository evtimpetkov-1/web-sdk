<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Rectangle, Sprite, SpineProvider, SpineTrack, Container, Text } from 'pixi-svelte';
	import { stateBet, stateUi } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { goldTextStyle } from '../game/textStyles';

	const context = getContext();
	const BG_SCALE = { width: 1.1, height: 0.7 };
	const FRAME_SCALE = { width: 1.3653, height: 0.9217 };
	const POSITION_ADJUSTMENT = 1.01;

	const boardLayout = $derived(context.stateGameDerived.boardLayout());
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const frameX = $derived(boardLayout.x * POSITION_ADJUSTMENT);
	const frameY = $derived(boardLayout.y * POSITION_ADJUSTMENT);
	const frameW = $derived(boardLayout.width * FRAME_SCALE.width);
	const frameH = $derived(boardLayout.width * FRAME_SCALE.height);

	// Logo — positioned at top of frame
	const frameTopY = $derived(frameY - frameH * 0.5);
	const logoScale = $derived(boardLayout.width / 3000);

	// Counter panel dimensions (local coords, scaled by counterScale)
	const PANEL_WIDTH = 380;
	const PANEL_HEIGHT = PANEL_WIDTH / 1.876; // match 782x417 image aspect ratio

	// Counter positioning per layout
	const isPortrait = $derived(layout === 'portrait');
	const counterScale = $derived(isPortrait ? boardLayout.width / 850 : boardLayout.width / 850);

	// Desktop/landscape: left of frame, stacked vertically
	const counterX = $derived(frameX - frameW * 0.5 - 170 * counterScale);
	const counterFsY = $derived(frameY - 115 * counterScale);
	const counterWinY = $derived(frameY + 115 * counterScale);

	// Portrait: below the board, side by side
	const counterBottomY = $derived(frameY + frameH * 0.5 + 10 * counterScale);
	const counterLeftX = $derived(frameX - 280 * counterScale);
	const counterRightX = $derived(frameX + 280 * counterScale);

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

<!-- Game logo — centered above frame, hidden during free spins -->
{#if !stateUi.freeSpinCounterShow}
	<Sprite
		key="gameLogo"
		anchor={{ x: 0.5, y: 0.5 }}
		x={frameX}
		y={frameTopY}
		scale={logoScale}
	/>
{/if}

<!-- Free spin counters -->
{#if stateUi.freeSpinCounterShow}
	{#if isPortrait}
		<!-- Portrait: below the board, side by side -->
		<Container label="FreeSpinCounter" x={counterLeftX} y={counterBottomY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<Text
				y={8}
				text={`FREE SPINS\n${stateUi.freeSpinCounterCurrent} / ${stateUi.freeSpinCounterTotal}`}
				anchor={0.5}
				style={{
					...goldTextStyle,
					fontSize: 42,
				}}
			/>
		</Container>
		<Container label="TotalWinCounter" x={counterRightX} y={counterBottomY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<Text
				y={8}
				text={`TOTAL WIN\n${bookEventAmountToCurrencyString(stateBet.winBookEventAmount)}`}
				anchor={0.5}
				style={{
					...goldTextStyle,
					fontSize: 42,
				}}
			/>
		</Container>
	{:else}
		<!-- Desktop/Landscape: left of frame, stacked vertically -->
		<Container label="FreeSpinCounter" x={counterX} y={counterFsY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<Text
				y={8}
				text={`FREE SPINS\n${stateUi.freeSpinCounterCurrent} / ${stateUi.freeSpinCounterTotal}`}
				anchor={0.5}
				style={{
					...goldTextStyle,
					fontSize: 42,
				}}
			/>
		</Container>
		<Container label="TotalWinCounter" x={counterX} y={counterWinY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<Text
				y={8}
				text={`TOTAL WIN\n${bookEventAmountToCurrencyString(stateBet.winBookEventAmount)}`}
				anchor={0.5}
				style={{
					...goldTextStyle,
					fontSize: 42,
				}}
			/>
		</Container>
	{/if}
{/if}
