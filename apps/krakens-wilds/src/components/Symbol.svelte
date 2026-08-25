<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
</script>

{#if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				if (event.data?.name === 'wildExplode') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_kw_wild_land' });
				}
			},
		}}
	/>
{/if}

<!--
	No multiplier text here. This used to draw `${multiplier}X` in cinzel-bold-gold
	for ANY symbol carrying a multiplier, with no state gate — a leftover from the
	reference game. On a coin that meant a second value on top of CoinValue's `x2`,
	in a different font and format ("2X" vs "x2"), visible from the first frame the
	symbol existed instead of after its reveal. Coin values are CoinValue's job and
	its alone; see ReelSymbol and SpecialOverlay.
-->

