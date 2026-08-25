<script lang="ts">
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import Anticipation from './Anticipation.svelte';

	const context = getContext();
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);
</script>

{#if hasAnticipation}
	<!--
		Three cues, not one. The bed alone started and stopped mid-air: it has to hold
		a constant texture in order to loop, so nothing marked the moment the tension
		arrived or the moment it broke. A stinger on each end does that, and the
		release fires whether or not the reel paid — the tension is over either way.
	-->
	<OnMount
		onmount={() => {
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_anticipation_start', forcePlay: true }); // prettier-ignore
			context.eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_anticipation' });

			return () => {
				context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_anticipation_end', forcePlay: true }); // prettier-ignore
			};
		}}
	/>
{/if}

{#each context.stateGame.board as reel}
	{#if reel.reelState.anticipating}
		<Anticipation {reel} oncomplete={() => (reel.reelState.anticipating = false)} />
	{/if}
{/each}
