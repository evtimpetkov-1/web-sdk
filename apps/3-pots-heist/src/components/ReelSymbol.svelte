<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX, getSymbolZIndex } from '../game/utils';
	import { BOARD_DIMENSIONS } from '../game/constants';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();

	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);
	const zIndex = $derived(getSymbolZIndex({ rawSymbol: props.reelSymbol.rawSymbol }));

	/**
	 * A stopped reel holds [padding, the four rows, padding]. The reel lands every
	 * cell of it, the two outside the window too: those settle at once, so a landing
	 * rig never plays unseen (the strip still passes through the window while it spins,
	 * so they are drawn like any other cell).
	 */
	$effect(() => {
		const outside =
			props.reelSymbol.symbolIndex === 0 || props.reelSymbol.symbolIndex > BOARD_DIMENSIONS.y;
		if (outside && props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
	});
</script>

<!--
	`animating` picks the unmasked board layer, over the frame's steel: only a WIN acts
	there (a thief's head rises over his tile; a top-row winner over the steel). A
	landing stays behind the mask: the reel's bounce starts it above its cell, and
	unmasked the top row would show over the frame for a moment.
-->
<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY()}
	{zIndex}
	animating={symbolInfo.type === 'spine' && props.reelSymbol.symbolState === 'win'}
>
	<Symbol
		state={props.reelSymbol.symbolState}
		rawSymbol={props.reelSymbol.rawSymbol}
		oncomplete={() => {
			if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
			if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
		}}
	/>
</SymbolWrap>
