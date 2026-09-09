<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { stateBetDerived } from 'state-shared';

	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import GooBurst from './GooBurst.svelte';
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
	// a scatter waiting out the cascade runs its pending loop (same rule as ReelSymbol;
	// the tumble board only exists mid-round, so no release hold is needed here)
	const displayState = $derived<SymbolState>(
		props.tumbleSymbol.rawSymbol.name === 'S' &&
			props.tumbleSymbol.symbolState === 'static' &&
			context.stateGame.roundActive
			? 'idle'
			: props.tumbleSymbol.symbolState,
	);
	const symbolInfo = $derived(
		getSymbolInfo({
			rawSymbol: props.tumbleSymbol.rawSymbol,
			state: displayState,
		}),
	);
	const exploding = $derived(props.tumbleSymbol.symbolState === 'explosion');

	// The plate pops, then bursts and fades under the goo splash. The goo rig
	// owns the state's completion (the sprite would complete on mount). Each cell
	// starts a random 0-90ms late so a row of winners never bursts in lockstep.
	const plateScale = new Tween(1);
	const plateAlpha = new Tween(1);
	let burstStarted = $state(false);

	$effect(() => {
		if (!exploding) {
			burstStarted = false;
			plateScale.set(1, { duration: 0 });
			plateAlpha.set(1, { duration: 0 });
			return;
		}
		const timeScale = stateBetDerived.timeScale();
		const timer = setTimeout(async () => {
			burstStarted = true;
			await plateScale.set(1.15, { duration: 80 / timeScale, easing: cubicOut });
			plateAlpha.set(0, { duration: 60 / timeScale, easing: cubicIn });
			await plateScale.set(1.25, { duration: 60 / timeScale, easing: cubicOut });
		}, (Math.random() * 90) / timeScale);
		return () => clearTimeout(timer);
	});
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.tumbleSymbol.symbolY.current}
	zIndex={getSymbolZIndex({ rawSymbol: props.tumbleSymbol.rawSymbol })}
	animating={symbolInfo.type === 'spine' || exploding}
>
	<Container scale={plateScale.current} alpha={plateAlpha.current}>
		<Symbol
			state={displayState}
			loop={displayState === 'idle'}
			rawSymbol={props.tumbleSymbol.rawSymbol}
			oncomplete={exploding ? undefined : props.tumbleSymbol.oncomplete}
		/>
	</Container>
	{#if exploding && burstStarted}
		<GooBurst oncomplete={props.tumbleSymbol.oncomplete} />
	{/if}
</SymbolWrap>
