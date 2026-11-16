<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';

	/**
	 * Cascade explosion ("goo burst"): flash, splash crown, droplets, bits and
	 * drips, drawn OVER the exploding plate while TumbleSymbol pops and collapses
	 * the sprite underneath. One generic rig for every symbol; `oncomplete` gates
	 * the tumble. Skeleton box is one cell, so it is sized to SYMBOL_SIZE.
	 */
	type Props = {
		x?: number;
		y?: number;
		loop?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	// three simulations x mirror x small rotation = 18 variants, so neighbouring cells never burst identically
	const animationName = `burst_${String(Math.floor(Math.random() * 18)).padStart(2, '0')}`;
</script>

<SpineProvider key="msGoo" x={props.x} y={props.y} width={SYMBOL_SIZE} height={SYMBOL_SIZE}>
	<SpineTrack
		trackIndex={0}
		{animationName}
		loop={props.loop ?? false}
		timeScale={stateBetDerived.timeScale()}
		listener={{
			complete: () => {
				if (!props.loop) props.oncomplete?.();
			},
		}}
	/>
</SpineProvider>
