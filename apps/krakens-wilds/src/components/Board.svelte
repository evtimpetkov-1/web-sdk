<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  }
		| { type: 'boardLoopSymbols'; symbolPositions: Position[] }
		| { type: 'boardStopLoop' }
		| { type: 'boardResetSymbols' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Rectangle } from 'pixi-svelte';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, SYMBOL_SIZE } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);
	let dimmed = $state(false);
	let loopingPositions: Position[] = [];

	// Two things darken the reels, and they can overlap:
	//  - `dimmed`: the win presentation, where non-winning symbols drop back.
	//  - `reelsShaded`: the kraken's overlay wilds/coins are sitting on top of
	//    still-spinning reels, so the reels go back to let them read in front.
	// The shade fades so the reels don't snap brightness when they stop; the win
	// dim keeps its hard cut. Whichever is darker wins.
	const WIN_DIM = 0.5;
	const SHADE = 0.45;
	const shade = new Tween(0);
	$effect(() => {
		const shaded = context.stateGame.reelsShaded;
		shade.set(shaded ? SHADE : 0, { duration: shaded ? 200 : 400 });
	});
	const dimAlpha = $derived(Math.max(dimmed ? WIN_DIM : 0, shade.current));

	// Stop idle/landing spine animations so they don't render above the dim overlay
	const stopIdleAnimations = () => {
		for (const reel of context.stateGame.board) {
			for (const reelSymbol of reel.reelState.symbols) {
				if (reelSymbol.symbolState === 'idle') {
					reelSymbol.symbolState = 'static';
				}
				// Also stop landing W/S that would transition to idle after dimming starts
				if (reelSymbol.symbolState === 'land') {
					const name = reelSymbol.rawSymbol.name;
					if (name === 'W' || name === 'S') {
						reelSymbol.symbolState = 'static';
					}
				}
			}
		}
	};
	const restoreIdleAnimations = () => {
		const isFreegame = context.stateGame.gameType === 'freegame';
		for (const reel of context.stateGame.board) {
			for (const reelSymbol of reel.reelState.symbols) {
				const name = reelSymbol.rawSymbol.name;
				// During free spins, W is hidden — don't restore to idle
				if (isFreegame && name === 'W') continue;
				if (reelSymbol.symbolState === 'static' && (name === 'W' || name === 'S')) {
					reelSymbol.symbolState = 'idle';
				}
			}
		}
	};

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => {
			for (const reel of context.stateGame.board) {
				reel.reelState.anticipating = false;
			}
			context.stateGameDerived.enhancedBoard.stop();
		},
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			dimmed = true;
			context.stateGame.winAnimating = true;
			stopIdleAnimations();

			// During free spins, identify which moving wilds participate in wins
			const hasMovingWilds = context.stateGame.gameType === 'freegame' && context.stateGame.movingWilds.length > 0;
			if (hasMovingWilds) {
				const winSet = new Set<number>();
				for (const pos of symbolPositions) {
					const reelSymbol = context.stateGame.board[pos.reel].reelState.symbols[pos.row];
					if (reelSymbol.rawSymbol.name === 'W') {
						const wild = context.stateGame.movingWilds.find(w => w.reel === pos.reel && w.row === pos.row);
						if (wild) winSet.add(wild.id);
					}
				}
				context.stateGame.movingWildWinSet = winSet;
			}

			// During the second win cycle, move previously-animated symbols to postWinStatic
			// so the current winline gets a fresh animation start
			if (context.stateGame.winLooping) {
				for (const reel of context.stateGame.board) {
					for (const reelSymbol of reel.reelState.symbols) {
						if (reelSymbol.symbolState === 'win') {
							reelSymbol.oncomplete();
							reelSymbol.symbolState = 'postWinStatic';
						}
					}
				}
			}

			const getPromises = () =>
				symbolPositions
					.filter((pos) => {
						// During free spins, skip W — moving wilds handle their win animation
						if (hasMovingWilds) {
							return context.stateGame.board[pos.reel].reelState.symbols[pos.row].rawSymbol.name !== 'W';
						}
						return true;
					})
					.map(async (position) => {
						const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
						reelSymbol.symbolState = 'win';
						await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
						if (reelSymbol.symbolState === 'win' && !context.stateGame.winLooping) {
							reelSymbol.symbolState = 'postWinStatic';
						}
					});

			await Promise.all(getPromises());
			// Keep dimming persistent during the second win cycle (finalWin per-winline loop)
			// Guard: if boardResetSymbols ran during await, dimmed is already false — skip cleanup
			if (!context.stateGame.winLooping && dimmed) {
				dimmed = false;
				context.stateGame.winAnimating = false;
				context.stateGame.movingWildWinSet = new Set();
				restoreIdleAnimations();
			}
		},
		boardLoopSymbols: ({ symbolPositions }) => {
			dimmed = true;
			context.stateGame.winAnimating = true;
			stopIdleAnimations();
			loopingPositions = symbolPositions;

			const hasMovingWilds = context.stateGame.gameType === 'freegame' && context.stateGame.movingWilds.length > 0;
			if (hasMovingWilds) {
				const winSet = new Set<number>();
				for (const position of symbolPositions) {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					if (reelSymbol.rawSymbol.name === 'W') {
						const wild = context.stateGame.movingWilds.find(w => w.reel === position.reel && w.row === position.row);
						if (wild) winSet.add(wild.id);
						continue; // skip setting reel W to 'win' — it's hidden
					}
					reelSymbol.symbolState = 'win';
				}
				context.stateGame.movingWildWinSet = winSet;
			} else {
				for (const position of symbolPositions) {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					reelSymbol.symbolState = 'win';
				}
			}
		},
		boardStopLoop: () => {
			dimmed = false;
			context.stateGame.winAnimating = false;
			context.stateGame.movingWildWinSet = new Set();
			restoreIdleAnimations();
			for (const position of loopingPositions) {
				const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'postWinStatic';
			}
			loopingPositions = [];
		},
		boardResetSymbols: () => {
			dimmed = false;
			context.stateGame.winAnimating = false;
			context.stateGame.movingWildWinSet = new Set();
			loopingPositions = [];
			context.stateGame.winLooping = false;
			for (const reel of context.stateGame.board) {
				for (const reelSymbol of reel.reelState.symbols) {
					if (reelSymbol.symbolState === 'win') {
						reelSymbol.oncomplete();
					}
					if (reelSymbol.symbolState !== 'static' && reelSymbol.symbolState !== 'spin') {
						reelSymbol.symbolState = 'static';
					}
				}
			}
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

{#if show}
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<BoardBase />
			<!--
				zIndex, not mount order, keeps this above the symbols: pixi-svelte appends
				every newly mounted node to the END of the container, and the reels keep
				remounting symbols as they cycle — so each symbol scrolling in after the
				shade mounted would draw ON TOP of it, and spinning reels stayed at full
				brightness under the kraken's overlay. Symbols sit at the default zIndex 0.
				(Anticipations render in their own pass in Game.svelte, above the frame.)
			-->
			{#if dimAlpha > 0}
				<Rectangle
					x={-12}
					y={-12}
					zIndex={10}
					width={BOARD_SIZES.width + 30}
					height={BOARD_SIZES.height + 20}
					backgroundColor={0x000000}
					alpha={dimAlpha}
				/>
			{/if}
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
