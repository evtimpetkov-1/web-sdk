<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { stateBetDerived } from 'state-shared';

	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import GooBurst from './GooBurst.svelte';
	import BlastBurst from './BlastBurst.svelte';
	import { getSymbolX, getSymbolInfo, getSymbolZIndex } from '../game/utils';
	import { getContext } from '../game/context';
	import type { TumbleSymbol } from '../game/stateGame.svelte';
	import type { SymbolState } from '../game/types';

	type Props = {
		reelIndex: number;
		tumbleSymbol: TumbleSymbol;
	};

	const props: Props = $props();
	const context = getContext();
	// a symbol with an idle rig (scatter, armed bomb) waiting out the cascade runs its
	// idle loop (same rule as ReelSymbol; the tumble board only exists mid-round,
	// so no release hold is needed here). One Scatter short of a trigger, the
	// scatters swap it for their `pending` loop (stateGame.scatterPending).
	const hasIdle = $derived(
		getSymbolInfo({ rawSymbol: props.tumbleSymbol.rawSymbol, state: 'idle' }).type === 'spine',
	);
	const hasPending = $derived(
		getSymbolInfo({ rawSymbol: props.tumbleSymbol.rawSymbol, state: 'pending' }).type === 'spine',
	);
	const displayState = $derived.by<SymbolState>(() => {
		if (props.tumbleSymbol.symbolState !== 'static') return props.tumbleSymbol.symbolState;
		if (hasPending && context.stateGame.scatterPending) return 'pending';
		if (hasIdle && context.stateGame.roundActive) return 'idle';
		return 'static';
	});
	const symbolInfo = $derived(
		getSymbolInfo({
			rawSymbol: props.tumbleSymbol.rawSymbol,
			state: displayState,
		}),
	);
	// three ways out of the board: the goo burst (a paid symbol), the bomb's own
	// explode rig, and the blast ring over a bomb's neighbour
	const exploding = $derived(props.tumbleSymbol.symbolState === 'explosion');
	const detonating = $derived(
		props.tumbleSymbol.symbolState === 'explode' || props.tumbleSymbol.symbolState === 'explodeWild',
	);
	const blasted = $derived(props.tumbleSymbol.symbolState === 'blasted');
	const popping = $derived(exploding || blasted);

	// The plate pops, then bursts and fades under the goo splash / the blast. The
	// burst rig owns the state's completion (the sprite would complete on mount).
	// A goo cell starts a random 0-90ms late so a row of winners never bursts in
	// lockstep; a blasted cell waits for the ring to reach it (blastDelay, set by
	// TumbleBoard from its distance to the bomb).
	const plateScale = new Tween(1);
	const plateAlpha = new Tween(1);
	let burstStarted = $state(false);

	$effect(() => {
		if (!popping) {
			burstStarted = false;
			plateScale.set(1, { duration: 0 });
			plateAlpha.set(1, { duration: 0 });
			return;
		}
		const timeScale = stateBetDerived.timeScale();
		const delay = blasted ? (props.tumbleSymbol.blastDelay ?? 0) : Math.random() * 90;
		const timer = setTimeout(async () => {
			burstStarted = true;
			await plateScale.set(1.15, { duration: 80 / timeScale, easing: cubicOut });
			plateAlpha.set(0, { duration: 60 / timeScale, easing: cubicIn });
			await plateScale.set(1.25, { duration: 60 / timeScale, easing: cubicOut });
		}, delay / timeScale);
		return () => clearTimeout(timer);
	});
</script>

<!-- the bomb's blast spills over its neighbours, so it sorts above them -->
<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.tumbleSymbol.symbolY.current}
	zIndex={detonating ? 2 : getSymbolZIndex({ rawSymbol: props.tumbleSymbol.rawSymbol })}
	animating={symbolInfo.type === 'spine' || popping}
>
	<Container scale={plateScale.current} alpha={plateAlpha.current}>
		<!-- explode / explodeWild: the bomb rig completes the state itself (it ends empty / on the Wild) -->
		<Symbol
			state={displayState}
			loop={displayState === 'idle' || displayState === 'pending'}
			rawSymbol={props.tumbleSymbol.rawSymbol}
			oncomplete={popping ? undefined : props.tumbleSymbol.oncomplete}
		/>
	</Container>
	{#if exploding && burstStarted}
		<GooBurst oncomplete={props.tumbleSymbol.oncomplete} />
	{/if}
	{#if blasted && burstStarted}
		<BlastBurst oncomplete={props.tumbleSymbol.oncomplete} />
	{/if}
</SymbolWrap>
