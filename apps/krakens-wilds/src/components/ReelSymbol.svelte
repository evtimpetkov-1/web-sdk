<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import CoinValue from './CoinValue.svelte';
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
	// Coin value sits on the coin face. The coin arrives BLANK: the value is struck
	// on only once `coin_land` has played out, so the reveal is the payoff of the
	// landing animation rather than something the coin was already carrying.
	// ('land' is the animation, 'spin' is in-flight on the reel — neither shows it.)
	const coinValueHidden = $derived(
		props.reelSymbol.symbolState === 'spin' || props.reelSymbol.symbolState === 'land',
	);
	const coinMultiplier = $derived(
		props.reelSymbol.rawSymbol.name === 'C' && !coinValueHidden
			? props.reelSymbol.rawSymbol.multiplier
			: undefined
	);
</script>

{#if !(context.stateGame.gameType === 'freegame' && props.reelSymbol.rawSymbol.name === 'W')}
	<!--
		`animating` picks the board layer: true = the unmasked, un-dimmed layer.
		A symbol that has FINISHED its win animation goes to `postWinStatic`, and it
		has to stay in that layer for as long as the win presentation runs — dropping
		it back under the dim overlay made an already-paid symbol go dark while its
		neighbours were still animating. Most visible on coins, whose gold value text
		turned near-black the instant their animation ended.
	-->
	<SymbolWrap
		x={getSymbolX(props.reelIndex)}
		y={props.reelSymbol.symbolY()}
		animating={(symbolInfo.type === 'spine' &&
			(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win' || props.reelSymbol.symbolState === 'idle')) ||
			(props.reelSymbol.symbolState === 'postWinStatic' &&
				(context.stateGame.winLooping || context.stateGame.winAnimating))}
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
		{#if coinMultiplier}
			<!--
				No `pop` here. On a kraken coin spin the value was already punched in on the
				overlay copy mid-spin, and this instance mounts as the overlay hands over at
				the reel stop — punching again would read as a second reveal. The overlay
				owns the reveal beat; this just keeps the value on the coin.
			-->
			<CoinValue multiplier={coinMultiplier} size={SYMBOL_SIZE} />
		{/if}
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
