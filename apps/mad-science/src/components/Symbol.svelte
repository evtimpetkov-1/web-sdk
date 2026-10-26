<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import MultiplierSymbolSprite from './MultiplierSymbolSprite.svelte';
	import { getSymbolBackgroundInfo, getSymbolInfo } from '../game/utils';
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
	const isMultiplier = $derived(symbolInfo.type === 'multiplier');
</script>

{#if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else if isMultiplier}
	<MultiplierSymbolSprite
		{symbolInfo}
		multiplier={props.rawSymbol.multiplier ?? 1}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{:else}
	{@const symbolBackgroundInfo = getSymbolBackgroundInfo({
		rawSymbol: props.rawSymbol,
		state: props.state,
	})}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		{symbolBackgroundInfo}
		x={props.x}
		y={props.y}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				// the bomb rig's bang (0.38s into `explode`)
				if (event.data?.name === 'detonate') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_ms_bomb_explode', forcePlay: true });
				}
			},
		}}
	/>
{/if}
