<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';

	/**
	 * Cloner goo cover over one reel cell, drawn OVER the symbol (ReelSymbol
	 * mounts it at zIndex 3 from a stateGame.cloneFx entry). `splat`: a ghost has
	 * landed and the cell becomes a cloner; `flood`: a cloner turns into the paying
	 * symbol. The rig fires `swap` when the cell is fully covered — that is when
	 * the symbol underneath is exchanged, so the change is never seen — and ends
	 * empty; `complete` releases the caller. Skeleton box is one cell.
	 */
	type Props = {
		kind: 'splat' | 'flood';
		x?: number;
		y?: number;
		onswap?: () => void;
		oncomplete?: () => void;
	};

	const props: Props = $props();
</script>

<SpineProvider key="msCloneFx" x={props.x} y={props.y} width={SYMBOL_SIZE} height={SYMBOL_SIZE}>
	<SpineTrack
		trackIndex={0}
		animationName={props.kind}
		loop={false}
		timeScale={stateBetDerived.timeScale()}
		listener={{
			complete: () => props.oncomplete?.(),
			event: (_, event) => {
				if (event.data?.name === 'swap') props.onswap?.();
			},
		}}
	/>
</SpineProvider>
