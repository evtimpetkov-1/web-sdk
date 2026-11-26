<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import SymbolSprite from './SymbolSprite.svelte';
	import CoinValue from './CoinValue.svelte';
	import { coinValue, getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { SymbolState, RawSymbol } from '../game/types';

	/**
	 * One symbol about its cell centre (0, 0): the static picture, or the rig when the
	 * state has one (constants.ts SYMBOL_INFO_MAP). `oncomplete` fires when the state's
	 * presentation is over: a rig's animation ending, a still winner's pulse ending, at
	 * once for a still picture in any other state.
	 */
	type Props = {
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const value = $derived(coinValue(props.rawSymbol));
</script>

{#if symbolInfo.type === 'sprite'}
	<SymbolSprite {symbolInfo} state={props.state} oncomplete={props.oncomplete} />
{:else}
	<SpineProvider
		key={symbolInfo.assetKey}
		x={symbolInfo.offset.x}
		y={symbolInfo.offset.y}
		width={SYMBOL_SIZE * symbolInfo.sizeRatios.width}
		height={SYMBOL_SIZE * symbolInfo.sizeRatios.height}
	>
		<SpineTrack
			trackIndex={0}
			animationName={symbolInfo.animationName}
			timeScale={stateBetDerived.timeScale()}
			listener={{ complete: props.oncomplete }}
		/>
	</SpineProvider>
{/if}

{#if value !== undefined}
	<CoinValue {value} />
{/if}
