<script lang="ts">
	import _ from 'lodash';

	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS, SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';
	import { getSymbolX, getSymbolY } from '../game/utils';

	/**
	 * Scatter anticipation on the board itself: the EMPTY cells a pending column
	 * is about to fill crackle with the win charge's electric look (Evtim,
	 * 2026-10-26; 2026-10-27: only the empty spaces, never behind a symbol).
	 * Each lit cell plays the winfx rig's `pending_under` halo on track 0 and one
	 * of four `pending_over_*` crackles on track 1, so neighbours do not fire in
	 * step. Drawn under the symbol layers (before Board in Game.svelte's first
	 * container), and each column is masked to the union of its lit cells: the
	 * halo (scaled 1.3 so stacked cells merge) cannot bleed under a neighbour.
	 * - spin: an anticipated column (stateGame.spinAnticipation) is empty while it
	 *   hangs, fallen out, and while it falls in: every row is lit;
	 * - cascade: the rows the cleared symbols left (stateGame.tumbleAnticipation),
	 *   each column until TumbleBoard lands its drop.
	 * Both only while the Scatters are pending (stateGame.scatterPending).
	 */
	const VARIANTS = 4;
	const FADE_MS = 220;

	const context = getContext();
	const columns = _.range(BOARD_DIMENSIONS.x);
	const allRows = _.range(BOARD_DIMENSIONS.y);

	const emptyRows = (column: number): number[] => {
		if (!context.stateGame.scatterPending) return [];
		const motion = context.stateGame.board[column].reelState.motion;
		if (context.stateGame.spinAnticipation[column] && (motion === 'hanging' || motion === 'fallingIn')) {
			return allRows;
		}
		return context.stateGame.tumbleAnticipation[column] ?? [];
	};
	const lit = $derived(columns.map(emptyRows));
	// the rows last lit per column, kept through the fade-out
	const shown = $state<number[][]>(columns.map(() => []));
	$effect(() => {
		lit.forEach((rows, column) => {
			if (rows.length && !_.isEqual(rows, shown[column])) shown[column] = rows;
		});
	});
</script>

<!-- the wrapper never unmounts, so the layer keeps its slot under the board
     (pixi-svelte appends a remounted child at the end of its parent) -->
<Container>
	<BoardContainer>
		{#each columns as column (column)}
			<FadeContainer show={lit[column].length > 0} duration={FADE_MS}>
				<Container>
					<Graphics
						isMask
						draw={(graphics) => {
							for (const row of shown[column]) {
								graphics
									.rect(
										getSymbolX(column) - SYMBOL_WIDTH / 2,
										getSymbolY(row) - SYMBOL_SIZE / 2,
										SYMBOL_WIDTH,
										SYMBOL_SIZE,
									)
									.fill(0xffffff);
							}
						}}
					/>
					{#each shown[column] as row (row)}
						<SpineProvider
							key="msWinFx"
							x={getSymbolX(column)}
							y={getSymbolY(row)}
							width={SYMBOL_SIZE}
							height={SYMBOL_SIZE}
						>
							<SpineTrack
								trackIndex={0}
								animationName="pending_under"
								loop
								timeScale={stateBetDerived.timeScale()}
							/>
							<SpineTrack
								trackIndex={1}
								animationName={`pending_over_${(column * 3 + row) % VARIANTS}`}
								loop
								timeScale={stateBetDerived.timeScale()}
							/>
						</SpineProvider>
					{/each}
				</Container>
			</FadeContainer>
		{/each}
	</BoardContainer>
</Container>
