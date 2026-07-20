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
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);
	let loopingPositions: Position[] = [];

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			const getPromises = () =>
				symbolPositions.map(async (position) => {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					if (reelSymbol.symbolState === 'win' && !context.stateGame.winLooping) {
						reelSymbol.symbolState = 'postWinStatic';
					}
				});

			await Promise.all(getPromises());
		},
		boardLoopSymbols: ({ symbolPositions }) => {
			loopingPositions = symbolPositions;
			for (const position of symbolPositions) {
				const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'win';
			}
		},
		boardStopLoop: () => {
			for (const position of loopingPositions) {
				const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'postWinStatic';
			}
			loopingPositions = [];
		},
		boardResetSymbols: () => {
			loopingPositions = [];
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
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
