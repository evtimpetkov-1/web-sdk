<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';
	import { getContext } from '../game/context';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY()}
	animating={symbolInfo.type === 'spine' &&
		(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win' || props.reelSymbol.symbolState === 'idle')}
>
	<Symbol
		state={props.reelSymbol.symbolState}
		rawSymbol={props.reelSymbol.rawSymbol}
		loop={props.reelSymbol.symbolState === 'idle' || (props.reelSymbol.symbolState === 'win' && context.stateGame.winLooping)}
		oncomplete={() => {
			if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
			if (props.reelSymbol.symbolState === 'land') {
				const name = props.reelSymbol.rawSymbol.name;
				props.reelSymbol.symbolState = (name === 'W' || name === 'S') ? 'idle' : 'static';
			}
		}}
	/>
</SymbolWrap>
