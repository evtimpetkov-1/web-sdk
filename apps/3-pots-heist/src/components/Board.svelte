<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardWithAnimateSymbols'; symbolPositions: Position[] };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { getCellKey } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Bags from './Bags.svelte';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.reelsSettle(board),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			// Every winner acts at once; the wins are over when the longest is.
			// One animation per CELL: a Wild counted by two ways arrives twice, and a
			// second `oncomplete = resolve` on the same symbol orphans the first
			// promise (a round that hangs with no error).
			await Promise.all(
				_.uniqBy(symbolPositions, getCellKey).map(async (position) => {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					reelSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					reelSymbol.symbolState = 'postWinStatic';
				}),
			);
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

<!--
	The board group, bottom to top: the frame's panel (the dark cells and their grid),
	the reels behind their mask, the frame's steel border, the loot bags standing on
	it, and the symbols that are acting (wins), unmasked, so a thief's head can rise
	over his tile and over the steel.
-->
<BoardContainer>
	<BoardFrame layer="panel" />
</BoardContainer>

<BoardContext animate={false}>
	<BoardContainer>
		<BoardMask />
		<BoardBase />
	</BoardContainer>
</BoardContext>

<BoardContainer>
	<BoardFrame layer="border" />
	<Bags />
</BoardContainer>

<BoardContext animate={true}>
	<BoardContainer>
		<BoardBase />
	</BoardContainer>
</BoardContext>
