<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Rectangle, Sprite, Container, Text } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import type { TextStyleOptions } from 'pixi.js';
	import { stateBet, stateUi } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { headingGold, uiValue } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';

	const counterHeaderStyle = {
		...headingGold,
		letterSpacing: 3,
		fontSize: 34,
	} as const satisfies TextStyleOptions;

	const counterValueStyle = {
		...uiValue,
		fontSize: 42,
	} as const satisfies TextStyleOptions;

	const context = getContext();
	const BG_SCALE = { width: 1.053, height: 0.687 };
	// Openings measured per frame art (hole fraction of the trimmed image):
	// base 88.64%x79.60%, FS v3 91.25%x84.71% — both give a 660x420 opening
	// around the 655x411 grid (131x137 cells).
	const FRAME_SCALE_BASE = { width: 1.137, height: 0.805 };
	// fs_frame_v3.webp. Previous (fs_frame_v2.webp): { width: 1.166, height: 0.806 }
	const FRAME_SCALE_FS = { width: 1.104, height: 0.757 };
	// symbols sit +10 inside BoardContainer; the frame follows them down
	const FRAME_Y_OFFSET = 10;

	const boardLayout = $derived(context.stateGameDerived.boardLayout());
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const isFsFrame = $derived(context.stateGame.gameType === 'freegame');
	const FRAME_SCALE = $derived(isFsFrame ? FRAME_SCALE_FS : FRAME_SCALE_BASE);
	const frameX = $derived(boardLayout.x);
	const frameY = $derived(boardLayout.y + FRAME_Y_OFFSET);
	const frameW = $derived(boardLayout.width * FRAME_SCALE.width);
	const frameH = $derived(boardLayout.width * FRAME_SCALE.height);

	// Logo — positioned at top of frame
	const frameTopY = $derived(frameY - frameH * 0.5 + 20);
	const logoScale = $derived(boardLayout.width / 3400);

	// Counter panel dimensions (local coords, scaled by counterScale)
	const PANEL_WIDTH = 380;
	const PANEL_HEIGHT = PANEL_WIDTH / 2.607; // match counters_plate 1512x580

	// Counter positioning per layout
	const countersBelow = $derived(layout === 'portrait' || layout === 'tablet');
	const counterScale = $derived(boardLayout.width / 850);

	// Desktop/landscape: left of frame, stacked vertically, fully clear of the
	// stone border (panel half-width is 190*scale, so 215 leaves a ~19px gap).
	// GameLogo.svelte mirrors this center-line — keep the two in sync.
	const counterX = $derived(frameX - frameW * 0.5 - 215 * counterScale);
	const counterFsY = $derived(frameY - 115 * counterScale);
	const counterWinY = $derived(frameY + 115 * counterScale);

	// Portrait/tablet: below the board, side by side. In PORTRAIT the offset is
	// chosen so the panels' TOP edge lines up with the top of the frame's bottom
	// stone band (fs_frame_v3 stone is ~38 units thick; panel half-height ~56,
	// both in board space) — at the old +10 the panels rode ~11px above it.
	// Tablet keeps the original +10.
	const counterBottomY = $derived(
		frameY + frameH * 0.5 + (layout === 'portrait' ? 24 : 10) * counterScale,
	);
	const counterLeftX = $derived(frameX - 280 * counterScale);
	const counterRightX = $derived(frameX + 280 * counterScale);


	let glowVisible = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => (glowVisible = true),
		boardFrameGlowHide: () => (glowVisible = false),
	});
	/**
	 * The frame is drawn in two passes. The dark panel belongs BEHIND the reels;
	 * the stone border and the FS counters go in FRONT, so symbols leaving the board
	 * slide behind the stone instead of being cut at the opening edge, and the
	 * counters are not buried by it. `front` selects the front pass.
	 */
	const { front = false }: { front?: boolean } = $props();
</script>

{#if front}
	<Sprite
		key={context.stateGame.gameType === 'freegame' ? 'frameEdgeFs' : 'frameEdgeDeep'}
		anchor={0.5}
		x={frameX}
		y={frameY}
		width={frameW}
		height={frameH}
	/>
{:else}
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
{/if}

<!-- The old frameOverlay spine (gem glows etc.) was authored for the v1
     frame's gem corners — disabled with the v2 stone frame. -->

<!-- Game logo above the frame is replaced by the animated KrakenTopper.
     Restore this Sprite if the topper is ever removed. -->

<!--
	Free spin counters. These belong to the FRONT pass: the panels deliberately sit
	against the frame (tucked under its bottom edge in portrait/tablet, overlapping
	its left edge on desktop), so with the stone border now drawn over the reels the
	back pass would bury their titles — "FREE SPINS" / "TOTAL WIN" disappeared behind
	the stone while the values below stayed visible.
-->
{#if front && stateUi.freeSpinCounterShow}
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
