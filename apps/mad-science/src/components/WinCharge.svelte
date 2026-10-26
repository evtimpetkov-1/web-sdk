<script lang="ts" module>
	// Every winner fires `zap` on the same frame: play the crack once per board-wide flash.
	let lastZapAt = 0;
	const ZAP_SFX = 'sfx_ms_win_zap';
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

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
	const context = getContext();
	const animationName = $derived(`${props.phase}_${props.layer}`);
	const loop = $derived(props.loop ?? props.phase === 'hold');

	const zap = () => {
		const now = performance.now();
		if (now - lastZapAt < 80) return;
		lastZapAt = now;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: ZAP_SFX });
	};
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
			event: (_, event) => {
				if (event.data?.name === 'zap') zap();
			},
		}}
	/>
</SpineProvider>
