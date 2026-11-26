<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, sineInOut } from 'svelte/easing';

	import { Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';
	import type { SymbolInfo } from '../game/constants';
	import type { SymbolState } from '../game/types';

	type Props = {
		symbolInfo: SymbolInfo;
		state: SymbolState;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	/**
	 * A still picture has nothing to play, so every state is over at once, except a
	 * WIN: a winner with no rig of its own (the Wild, until it has one) swells twice,
	 * so it is seen to count. The cell's other winners run 1.7-2 s rigs; the round
	 * waits for the longest.
	 */
	const PULSE = 1.14;
	const PULSE_MS = 260;
	const scale = new Tween(1);
	let run = 0;

	const present = async (state: SymbolState) => {
		const mine = ++run;
		if (state !== 'win') {
			scale.set(1, { duration: 0 });
			props.oncomplete?.();
			return;
		}
		const duration = PULSE_MS / stateBetDerived.timeScale();
		for (let beat = 0; beat < 2; beat++) {
			await scale.set(PULSE, { duration, easing: cubicOut });
			await scale.set(1, { duration, easing: sineInOut });
			if (mine !== run) return;
		}
		props.oncomplete?.();
	};

	$effect(() => {
		const state = props.state;
		untrack(() => void present(state));
	});
</script>

<Sprite
	anchor={0.5}
	key={props.symbolInfo.assetKey}
	x={props.symbolInfo.offset.x}
	y={props.symbolInfo.offset.y}
	width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * scale.current}
	height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * scale.current}
/>
