<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Rectangle, Sprite, SpineProvider, SpineTrack, Container, Text, FillGradient } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import type { TextStyleOptions } from 'pixi.js';
	import { stateBet, stateUi } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const counterHeaderGradient = new FillGradient({
		type: 'linear',
		start: { x: 0, y: 0 },
		end: { x: 0, y: 1 },
		textureSpace: 'local',
		colorStops: [
			{ offset: 0, color: '#00E5FF' },
			{ offset: 0.5, color: '#B2EBF2' },
			{ offset: 1, color: '#00ACC1' },
		],
	});

	const counterHeaderStyle = {
		fontFamily: 'Cinzel',
		fontWeight: '700',
		fill: counterHeaderGradient,
		stroke: { color: '#071a2b', width: 3 },
		dropShadow: { color: '#00BCD4', blur: 10, distance: 0, alpha: 0.5 },
		letterSpacing: 3,
		align: 'center',
		fontSize: 34,
	} as const satisfies TextStyleOptions;

	const counterValueStyle = {
		fontFamily: 'Cinzel',
		fontWeight: '700',
		fill: '#B0C4DE',
		stroke: { color: '#0a1929', width: 2 },
		letterSpacing: 1,
		align: 'center',
		fontSize: 42,
	} as const satisfies TextStyleOptions;

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
	const frameTopY = $derived(frameY - frameH * 0.5 + 20);
	const logoScale = $derived(boardLayout.width / 3400);

	// Counter panel dimensions (local coords, scaled by counterScale)
	const PANEL_WIDTH = 380;
	const PANEL_HEIGHT = PANEL_WIDTH / 1.876; // match 782x417 image aspect ratio

	// Counter positioning per layout
	const countersBelow = $derived(layout === 'portrait' || layout === 'tablet');
	const counterScale = $derived(boardLayout.width / 850);

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
	key={context.stateGame.gameType === 'freegame' ? 'frameEdgeFs' : 'frameEdgeDeep'}
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

<!-- Game logo — centered above frame -->
<Sprite
	key="gameLogo"
	anchor={{ x: 0.5, y: 0.5 }}
	x={frameX}
	y={frameTopY}
	scale={logoScale}
/>

<!-- Free spin counters -->
{#if stateUi.freeSpinCounterShow}
	{#if countersBelow}
		<!-- Portrait: below the board, side by side -->
		<Container label="FreeSpinCounter" x={counterLeftX} y={counterBottomY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<ResponsiveText text={i18nDerived.freeSpins()} anchor={0.5} y={-20} maxWidth={270} style={counterHeaderStyle} />
			<Text text={`${stateUi.freeSpinCounterCurrent} / ${stateUi.freeSpinCounterTotal}`} anchor={0.5} y={20} style={counterValueStyle} />
		</Container>
		<Container label="TotalWinCounter" x={counterRightX} y={counterBottomY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<ResponsiveText text={i18nDerived.totalWin()} anchor={0.5} y={-20} maxWidth={270} style={counterHeaderStyle} />
			<Text text={bookEventAmountToCurrencyString(stateBet.winBookEventAmount)} anchor={0.5} y={20} style={counterValueStyle} />
		</Container>
	{:else}
		<!-- Desktop/Landscape: left of frame, stacked vertically -->
		<Container label="FreeSpinCounter" x={counterX} y={counterFsY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<ResponsiveText text={i18nDerived.freeSpins()} anchor={0.5} y={-20} maxWidth={270} style={counterHeaderStyle} />
			<Text text={`${stateUi.freeSpinCounterCurrent} / ${stateUi.freeSpinCounterTotal}`} anchor={0.5} y={20} style={counterValueStyle} />
		</Container>
		<Container label="TotalWinCounter" x={counterX} y={counterWinY} scale={counterScale}>
			<Sprite key="fsCounterBg" anchor={0.5} width={PANEL_WIDTH} height={PANEL_HEIGHT} />
			<ResponsiveText text={i18nDerived.totalWin()} anchor={0.5} y={-20} maxWidth={270} style={counterHeaderStyle} />
			<Text text={bookEventAmountToCurrencyString(stateBet.winBookEventAmount)} anchor={0.5} y={20} style={counterValueStyle} />
		</Container>
	{/if}
{/if}
