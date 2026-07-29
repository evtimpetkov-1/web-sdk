<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);
	const showRetriggerLabel = $derived(
		props.reelSymbol.rawSymbol.name === 'S' &&
		props.reelSymbol.symbolState === 'win' &&
		context.stateGame.retriggerExtra > 0
	);
</script>

{#if !(context.stateGame.gameType === 'freegame' && props.reelSymbol.rawSymbol.name === 'W')}
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY()}
		animating={(symbolInfo.type === 'spine' &&
			(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win' || props.reelSymbol.symbolState === 'idle')) ||
			(props.reelSymbol.symbolState === 'postWinStatic' && context.stateGame.winLooping)}
	>
		<Symbol
			state={props.reelSymbol.symbolState}
			rawSymbol={props.reelSymbol.rawSymbol}
			loop={props.reelSymbol.symbolState === 'idle' || (props.reelSymbol.symbolState === 'win' && context.stateGame.winLooping)}
			oncomplete={() => {
				if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
				if (props.reelSymbol.symbolState === 'land') {
					const name = props.reelSymbol.rawSymbol.name;
					// Don't enter idle during win animations — idle renders above the dim overlay
					props.reelSymbol.symbolState = (name === 'W' || name === 'S') && !context.stateGame.winAnimating ? 'idle' : 'static';
				}
			}}
		/>
		{#if showRetriggerLabel}
			<Container y={-SYMBOL_SIZE * 0.3} zIndex={20}>
				<ResponsiveBitmapText
					anchor={0.5}
					maxWidth={SYMBOL_SIZE}
					text="+1"
					style={{
						fontFamily: 'cinzel-bold-gold',
						fontSize: 96,
						align: 'center',
						letterSpacing: 0,
					}}
				/>
			</Container>
		{/if}
	</SymbolWrap>
{/if}
