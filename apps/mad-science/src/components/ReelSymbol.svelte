<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import WinCharge from './WinCharge.svelte';
	import { getSymbolInfo, getSymbolX, getSymbolZIndex } from '../game/utils';
	import { WIN_CHARGE_EXCLUDED } from '../game/constants';
	import { getContext } from '../game/context';
	import type { ReelSymbol } from '../game/stateGame.svelte';
	import type { SymbolState } from '../game/types';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const context = getContext();

	/**
	 * The scatter's pending loop. While a round is in play (reveal through the
	 * last cascade) a landed scatter idles — lamp swaying, bulbs breathing —
	 * instead of sitting on its static plate. The reel state itself stays
	 * 'static'; only what is DRAWN changes. When the round ends the loop is
	 * released at its next loop boundary (the rig's rest pose, see oncomplete),
	 * so the swap back to the sprite never jumps mid-swing.
	 */
	const isScatter = $derived(props.reelSymbol.rawSymbol.name === 'S');
	let idleHold = $state(false);
	$effect(() => {
		if (props.reelSymbol.symbolState !== 'static') idleHold = false;
		else if (isScatter && context.stateGame.roundActive) idleHold = true;
	});
	const displayState = $derived<SymbolState>(
		isScatter &&
			props.reelSymbol.symbolState === 'static' &&
			(context.stateGame.roundActive || idleHold)
			? 'idle'
			: props.reelSymbol.symbolState,
	);

	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: displayState }),
	);
	const x = $derived(getSymbolX(props.reelIndex));
	const y = $derived(props.reelSymbol.symbolY.current);
	const zIndex = $derived(getSymbolZIndex({ rawSymbol: props.reelSymbol.rawSymbol }));

	// The generic win FX (overload charge) plays ALONGSIDE the symbol's own prewin,
	// starting on the same frame. The win state ends with the prewin alone: the
	// charge is never waited for — it drops into its residual hold and keeps
	// playing through postWinStatic until the board tumbles, cut by the board hide.
	// (The wild has no rig, but the cluster waits for the longest prewin anyway.)
	// Scatters and multipliers keep their own presentation.
	const fxEligible = $derived(!WIN_CHARGE_EXCLUDED.includes(props.reelSymbol.rawSymbol.name));
	let chargeDone = $state(false);

	$effect(() => {
		if (props.reelSymbol.symbolState !== 'win') chargeDone = false;
	});

	const fxPhase = $derived.by(() => {
		if (!fxEligible) return undefined;
		if (props.reelSymbol.symbolState === 'win') return chargeDone ? ('hold' as const) : ('charge' as const);
		if (props.reelSymbol.symbolState === 'postWinStatic') return 'hold' as const;
		return undefined;
	});

</script>

<!--
	The FX lives in its OWN wraps, not inside the symbol's: every wrap is a sibling
	in the board layer's container, so zIndex -1 puts ALL halos under ALL winning
	symbols and zIndex 1 puts ALL arcs over them, whatever order the cells entered
	their win state (the same reason Kraken's win frame is hoisted).
-->
{#if fxPhase}
	<SymbolWrap {x} {y} animating={true} zIndex={-1}>
		<WinCharge layer="under" phase={fxPhase} />
	</SymbolWrap>
{/if}

<!--
	`animating` picks the unmasked board layer. A winning or held symbol stays
	there so its halo is not clipped by the board mask and sorts under it.
-->
<SymbolWrap
	{x}
	{y}
	{zIndex}
	animating={(symbolInfo.type === 'spine' &&
		(displayState === 'land' || displayState === 'win' || displayState === 'idle')) ||
		fxPhase !== undefined}
>
	<Symbol
		state={displayState}
		loop={displayState === 'idle'}
		rawSymbol={props.reelSymbol.rawSymbol}
		oncomplete={() => {
			// a loop boundary: the round is over, let the scatter go static here
			if (displayState === 'idle' && !context.stateGame.roundActive) idleHold = false;
			if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
			if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
		}}
	/>
</SymbolWrap>

{#if fxPhase}
	<SymbolWrap {x} {y} animating={true} zIndex={1}>
		<WinCharge
			layer="over"
			phase={fxPhase}
			oncomplete={() => (chargeDone = true)}
		/>
	</SymbolWrap>
{/if}
