<script lang="ts">
	import MultiplierSymbolSprite from './MultiplierSymbolSprite.svelte';
	import type { MultiplierSymbol } from '../game/stateGame.svelte';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		reelIndex: number;
		multiplierSymbol: MultiplierSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({
			rawSymbol: props.multiplierSymbol.rawSymbol,
			state: props.multiplierSymbol.symbolState,
		}),
	);
</script>

<!-- the collected VALUE, flying from its cell onto the plaque above the reels.
     Only the number travels (Evtim, 2026-10-24): the cell keeps the empty tile
     (M_TAKEN), which bursts while the number is in the air (MultiplierBoard).
     Same font and size as on the symbol. -->
<MultiplierSymbolSprite
	{symbolInfo}
	multiplier={props.multiplierSymbol.rawSymbol.multiplier ?? 1}
	plate={false}
	x={props.multiplierSymbol.symbolX.current}
	y={props.multiplierSymbol.symbolY.current}
	oncomplete={props.multiplierSymbol.oncomplete}
/>
