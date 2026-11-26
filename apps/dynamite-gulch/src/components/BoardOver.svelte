<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { setBoardOver } from '../game/boardOver';
	import BoardContainer from './BoardContainer.svelte';
	import BoardBase from './BoardBase.svelte';

	/**
	 * The board's layer OVER the reel frame: mounted by BoardFrame between the timber
	 * and the frame's own life (lanterns, dust, light), so a winning symbol stands in
	 * front of the beams and under what hangs on them. Unmasked. It draws only the
	 * wraps a ReelSymbol marks `over`: with OVER_FRAME 'rigs' every animated cell (the
	 * winners with their outline and sparkles, every idle loop, the cloner's states and
	 * covers), with 'winners' the winners alone. A cell's pieces must share one
	 * container to sort against each other. Every other cell (static sprites, landings)
	 * stays in Board.svelte's layers under the frame. Shown and hidden with
	 * the board (the tumble board takes over between cascades).
	 */
	const context = getContext();
	setBoardOver();

	let show = $state(true);

	context.eventEmitter.subscribeOnMount({
		boardShow: () => (show = true),
		boardHide: () => (show = false),
	});
</script>

<!-- the wrapper never unmounts, so the layer keeps its slot between the timber and
     FrameLife (pixi-svelte appends a remounted child at the end of its parent) -->
<Container>
	{#if show}
		<BoardContext animate={true}>
			<BoardContainer>
				<BoardBase />
			</BoardContainer>
		</BoardContext>
	{/if}
</Container>
