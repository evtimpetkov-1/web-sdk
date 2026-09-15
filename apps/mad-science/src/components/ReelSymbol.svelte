<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import WinCharge from './WinCharge.svelte';
	import CloneFx from './CloneFx.svelte';
	import { getCloneFxKey, getSymbolInfo, getSymbolX, getSymbolZIndex } from '../game/utils';
	import { WIN_CHARGE_EXCLUDED } from '../game/constants';
	import { getContext } from '../game/context';
	import type { ReelSymbol } from '../game/stateGame.svelte';
	import type { SymbolState } from '../game/types';

	type Props = {
		reelIndex: number;
		/** index in the reel's padded symbols array — the book's row for this cell */
		symbolIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const context = getContext();

	/**
	 * The pending loop. While a round is in play (reveal through the last cascade)
	 * a landed symbol with an idle rig — the scatter's lamp sway, the bomb's
	 * armed fuse — idles instead of sitting on its static plate. The reel state
	 * itself stays 'static'; only what is DRAWN changes. When the round ends the
	 * loop is released at its next loop boundary (the rig's rest pose, see
	 * oncomplete), so the swap back to the sprite never jumps mid-swing.
	 */
	const hasIdle = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: 'idle' }).type === 'spine',
	);
	let idleHold = $state(false);
	$effect(() => {
		if (props.reelSymbol.symbolState !== 'static') idleHold = false;
		else if (hasIdle && context.stateGame.roundActive) idleHold = true;
	});
	const displayState = $derived<SymbolState>(
		hasIdle &&
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

	// Cloner goo cover registered for this cell by the clonerTransform handler
	// (splat: the cell becomes a cloner; flood: the cloner becomes the paying symbol)
	const cloneFx = $derived(
		context.stateGame.cloneFx[getCloneFxKey({ reel: props.reelIndex, row: props.symbolIndex })],
	);
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
	`animating` picks the unmasked board layer. Every rig state (land, win, idle,
	the cloner's cast/in/out) lives there, as does a held symbol (its halo is not
	clipped by the board mask and sorts under it) and a cell under a goo cover
	(symbol and cover must share one container to sort against each other).
-->
<SymbolWrap
	{x}
	{y}
	{zIndex}
	animating={symbolInfo.type === 'spine' || fxPhase !== undefined || cloneFx !== undefined}
>
	<Symbol
		state={displayState}
		loop={displayState === 'idle'}
		rawSymbol={props.reelSymbol.rawSymbol}
		oncomplete={() => {
			const { symbolState } = props.reelSymbol;
			// a loop boundary: the round is over, let the idle rig go static here
			if (displayState === 'idle' && !context.stateGame.roundActive) idleHold = false;
			// win and the cloner's cast are awaited by their handlers
			if (symbolState === 'win' || symbolState === 'cast') props.reelSymbol.oncomplete();
			// rest-pose one-shots settle onto the static plate; 'out' holds its last
			// frame (sign gone, plate intact) until the flood swaps the symbol
			if (symbolState === 'land' || symbolState === 'cast' || symbolState === 'in') {
				props.reelSymbol.symbolState = 'static';
			}
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

<!-- over the symbol: the swap underneath happens while the cell is fully covered -->
{#if cloneFx}
	<SymbolWrap {x} {y} animating={true} zIndex={3}>
		<CloneFx kind={cloneFx.kind} onswap={cloneFx.onSwap} oncomplete={cloneFx.oncomplete} />
	</SymbolWrap>
{/if}
