<script lang="ts" module>
	// The ring reaches its eight cells within ~100ms of each other: one bang per
	// wave, not eight. Placeholder sfx until a custom blast is produced.
	let lastBangAt = 0;
	const BANG_SFX = 'sfx_multiplier_explosion_c';
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	/**
	 * Bomb blast on a neighbouring cell ("hit"): a red fire burst drawn OVER the
	 * plate while TumbleSymbol pops and collapses the sprite underneath — the
	 * bomb's counterpart to GooBurst. `oncomplete` gates the tumble. Skeleton box
	 * is one cell, so it is sized to SYMBOL_SIZE.
	 */
	type Props = {
		x?: number;
		y?: number;
		loop?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	// twelve variants so the ring never bursts identically
	const animationName = `hit_${String(Math.floor(Math.random() * 12)).padStart(2, '0')}`;

	const now = performance.now();
	if (now - lastBangAt > 80) {
		lastBangAt = now;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: BANG_SFX });
	}
</script>

<SpineProvider key="msBlast" x={props.x} y={props.y} width={SYMBOL_SIZE} height={SYMBOL_SIZE}>
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
