<script lang="ts" module>
	import type { LineWinLabel } from '../game/lineWinLabels';

	export type EmitterEventLineWinLabels =
		| { type: 'lineWinLabelsShow'; labels: LineWinLabel[] }
		| { type: 'lineWinLabelsHide' };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { CELL_W, CELL_H, REEL_PADDING } from '../game/constants';
	import LineWinLabel from './LineWinLabel.svelte';

	const context = getContext();

	/**
	 * The per-winline amounts.
	 *
	 * Two beats use this layer. While every winning line celebrates at once
	 * (winInfo -> the winbox count-up), it holds one plate per line, each on a cell
	 * of its own — see computeLineWinLabels for how the cells are shared out.
	 * During finalWin's per-line cycle it holds a single plate, on the same cell
	 * that line used in the first beat, so the figure does not jump around as the
	 * cycle walks the lines.
	 *
	 * Book rows carry the spin padding (0 and 4 are off-screen), which is why the
	 * y here is `row - 0.5` and not `row + 0.5` — same convention as the kraken's
	 * overlay symbols.
	 */
	let labels = $state<LineWinLabel[]>([]);

	/**
	 * `boardStopLoop` and `boardResetSymbols` are the board's own "the win
	 * presentation is over" signals — the next spin starting (actor), a free spin's
	 * reveal, freeSpinEnd, finalWin's early return. Listening to them rather than
	 * adding a hide broadcast at each of those sites means no teardown path can be
	 * missed and leave a plate stranded over a fresh board.
	 */
	context.eventEmitter.subscribeOnMount({
		lineWinLabelsShow: (emitterEvent) => (labels = emitterEvent.labels),
		lineWinLabelsHide: () => (labels = []),
		boardStopLoop: () => (labels = []),
		boardResetSymbols: () => (labels = []),
	});
</script>

{#each labels as label (`${label.reel}:${label.row}`)}
	<FadeContainer show>
		<Container x={CELL_W * (label.reel + REEL_PADDING)} y={(label.row - 0.5) * CELL_H}>
			<LineWinLabel amount={label.amount} />
		</Container>
	</FadeContainer>
{/each}
