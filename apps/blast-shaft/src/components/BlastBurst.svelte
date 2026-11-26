<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';

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
		/** in cells: the bomb's own fireball is drawn larger than a neighbour's hit */
		size?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	// twelve variants so the ring never bursts identically
	const animationName = `hit_${String(Math.floor(Math.random() * 12)).padStart(2, '0')}`;

</script>

<SpineProvider
	key="msBlast"
	x={props.x}
	y={props.y}
	width={SYMBOL_SIZE * (props.size ?? 1)}
	height={SYMBOL_SIZE * (props.size ?? 1)}
>
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
