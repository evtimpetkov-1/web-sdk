<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import WinCharge from './WinCharge.svelte';
	import CloneFx from './CloneFx.svelte';
	import { getCellKey, getSymbolInfo, getSymbolX, getSymbolZIndex } from '../game/utils';
	import { BOARD_DIMENSIONS, WIN_CHARGE_EXCLUDED } from '../game/constants';
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
	 * The idle loop. While a round is in play (reveal through the last cascade)
	 * a landed symbol with an idle rig — the scatter's lamp sway, the bomb's
	 * armed fuse — idles instead of sitting on its static plate. The reel state
	 * itself stays 'static'; only what is DRAWN changes. When the round ends the
	 * loop is released at its next loop boundary (the rig's rest pose, see
	 * oncomplete), so the swap back to the sprite never jumps mid-swing.
	 *
	 * The hold is shared per cell (stateGame.idleHold): this component is mounted
	 * once per board layer, and only the layer drawing the rig gets its oncomplete.
	 * With a local flag the other copy kept 'idle' forever — each layer left the
	 * cell to the other and the symbol vanished once the round ended.
	 */
	const cellKey = $derived(getCellKey({ reel: props.reelIndex, row: props.symbolIndex }));
	const hasIdle = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: 'idle' }).type === 'spine',
	);
	// the Scatters' anticipation loop while anticipated columns fall in, one
	// Scatter short of a trigger (stateGame.scatterPending; same rule as TumbleSymbol)
	const hasPending = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: 'pending' }).type === 'spine',
	);
	$effect(() => {
		if (props.reelSymbol.symbolState !== 'static') context.stateGame.idleHold[cellKey] = false;
		else if (hasIdle && context.stateGame.roundActive) context.stateGame.idleHold[cellKey] = true;
	});

	/**
	 * The padding cells above and below the window are never on screen as
	 * themselves (the bottom one only passes through while falling in), yet the
	 * shared reel lands them like any cell. A rig mounts in the unmasked layer, and
	 * the bottom cell's land fires right on the board's bottom edge (y = 550 minus
	 * the 50-unit bounce): it flashed over the frame's bottom pipe on every spin.
	 * Padding cells keep the plate, and their land settles straight away (the reel
	 * never waits for it).
	 */
	const isPadding = $derived(props.symbolIndex === 0 || props.symbolIndex > BOARD_DIMENSIONS.y);
	$effect(() => {
		if (isPadding && props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
	});

	const displayState = $derived.by<SymbolState>(() => {
		const { symbolState } = props.reelSymbol;
		if (isPadding) return symbolState === 'spin' ? 'spin' : 'static';
		if (hasPending && symbolState === 'static' && context.stateGame.scatterPending) return 'pending';
		return hasIdle &&
			symbolState === 'static' &&
			(context.stateGame.roundActive || context.stateGame.idleHold[cellKey])
			? 'idle'
			: symbolState;
	});

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

	// Cloner goo cover registered for this cell by the clonerActivate handler
	// (splat: the cell becomes a cloner; flood: the cloner becomes the paying symbol)
	const cloneFx = $derived(context.stateGame.cloneFx[cellKey]);
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
		loop={displayState === 'idle' || displayState === 'pending'}
		rawSymbol={props.reelSymbol.rawSymbol}
		oncomplete={() => {
			const { symbolState } = props.reelSymbol;
			// a loop boundary: the round is over, let the idle rig go static here
			if (displayState === 'idle' && !context.stateGame.roundActive) {
				context.stateGame.idleHold[cellKey] = false;
			}
			// win and the cloner's cast are awaited by their handlers
			if (symbolState === 'win' || symbolState === 'cast') props.reelSymbol.oncomplete();
			// rest-pose one-shots settle onto the static plate; 'out' holds its last
			// frame (sign gone, plate intact) until the flood swaps the symbol
			if (symbolState === 'land' || symbolState === 'cast' || symbolState === 'in') {
				// a landed rig with an idle loop always gets one full pass of it: a
				// no-win spin ends before the later reels finish landing, and only
				// the first bonus used to light up (the rest landed after the round)
				if (symbolState === 'land' && hasIdle) context.stateGame.idleHold[cellKey] = true;
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
