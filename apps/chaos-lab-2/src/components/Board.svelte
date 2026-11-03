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
		| { type: 'boardWithMovingMultiplierTexts' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Container } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { getCellKey } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			// every winner acts in character while the overload charge plays over it; the
			// win state completes when BOTH are done (ReelSymbol pairs them), then the
			// paid symbols hold a residual glow until the board tumbles.
			// One animation per CELL: a Wild counted by two wins arrives twice, and a
			// second `oncomplete = resolve` on the same symbol orphans the first
			// promise — the round hung with no error (betID 274417160, event 52).
			const getPromises = () =>
				_.uniqBy(symbolPositions, getCellKey).map(async (position) => {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					reelSymbol.symbolState = 'postWinStatic';
				});

			await Promise.all(getPromises());
		},
		boardWithMovingMultiplierTexts: () => {
			context.stateGame.board.forEach((reel) => {
				reel.reelState.symbols.forEach((reelSymbol) => {
					if (reelSymbol.rawSymbol.name === 'M') {
						reelSymbol.rawSymbol = {
							...reelSymbol.rawSymbol,
							name: 'M_TAKEN',
						};
					}
				});
			});
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

<!--
	The wrapper never unmounts, so the board keeps its slot UNDER the pipe frame.
	pixi-svelte appends a (re)mounted child at the end of its parent: without it,
	the first boardHide/boardShow (every tumble) re-added both layers after
	BoardFrame and GlobalMultiplier, and the board drew over them.
-->
<Container>
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
</Container>
