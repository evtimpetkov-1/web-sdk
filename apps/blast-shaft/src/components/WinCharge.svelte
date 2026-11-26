<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';

	/**
	 * One layer of the generic win FX ("overload charge"). The symbol sprite is its
	 * own display object, so the halo (`under`) and the arcs/flash/sparks (`over`)
	 * are two instances of the same skeleton drawn either side of it.
	 * `charge` is a 0.8s one-shot gated through `oncomplete` (over layer only);
	 * `hold` loops the residual glow until the wrap unmounts with the board.
	 * Skeleton box is one cell, so it is sized to SYMBOL_SIZE on both axes.
	 */
	type Props = {
		layer: 'under' | 'over';
		phase: 'charge' | 'hold';
		x?: number;
		y?: number;
		loop?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const animationName = $derived(`${props.phase}_${props.layer}`);
	const loop = $derived(props.loop ?? props.phase === 'hold');

</script>

<SpineProvider key="msWinFx" x={props.x} y={props.y} width={SYMBOL_SIZE} height={SYMBOL_SIZE}>
	<SpineTrack
		trackIndex={0}
		{animationName}
		{loop}
		timeScale={stateBetDerived.timeScale()}
		listener={{
			complete: () => {
				if (props.phase === 'charge' && !loop) props.oncomplete?.();
			},
		}}
	/>
</SpineProvider>
