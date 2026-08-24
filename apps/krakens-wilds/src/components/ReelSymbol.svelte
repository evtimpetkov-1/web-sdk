<script lang="ts">
	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import CoinValue from './CoinValue.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, WIN_FRAME_WIDTH, WIN_FRAME_HEIGHT } from '../game/constants';

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
	// on only once the coin has finished landing, so it is never carrying a value it
	// has not revealed. On a kraken spin this symbol is hidden anyway — the overlay
	// copy owns the reveal — but a coin landing without one still behaves.
	// ('land' is the animation, 'spin' is in-flight on the reel — neither shows it.)
	const coinValueHidden = $derived(
		props.reelSymbol.symbolState === 'spin' || props.reelSymbol.symbolState === 'land',
	);
	// NOT hidden while in-flight ('spin'): the overlay owns the SETTLED cells, but
	// the padding strips carry the same names (W in the base strips, and a stamped
	// symbol can be any paying symbol) — hiding those as they scroll past punched
	// visible holes into the spinning reels. The moving symbols pass behind the
	// shaded board; only the landed symbol under the overlay copy must not draw.
	const hiddenByOverlay = $derived(
		props.reelSymbol.symbolState !== 'spin' &&
			context.stateGame.overlaySymbols.some(
				(symbol) => symbol.name === props.reelSymbol.rawSymbol.name,
			),
	);
	const coinMultiplier = $derived(
		props.reelSymbol.rawSymbol.name === 'C' && !coinValueHidden
			? props.reelSymbol.rawSymbol.multiplier
			: undefined
	);
	const showWinFrame = $derived(
		props.reelSymbol.symbolState === 'win' && props.reelSymbol.rawSymbol.name !== 'S',
	);
</script>

<!--
	Hidden while the kraken's overlay owns this kind of symbol: the sticky copy on top
	is the one the player sees land, reveal and pay, and drawing the real one as well
	would double it up and pop its value on at the reel stop. Free-spin wilds work the
	same way — but only WHILE MovingWilds actually holds copies: once they are dropped
	at the next spin's start, the board's identical W takes over and spins away like
	any other symbol (an empty condition here left a visible hole in the moving reel).
-->
{#if !(context.stateGame.gameType === 'freegame' && props.reelSymbol.rawSymbol.name === 'W' && context.stateGame.movingWilds.length > 0) && !hiddenByOverlay}
	<!--
		The win frame lives in its OWN wrap at zIndex -1, not inside the symbol's:
		every wrap is a sibling in the board layer's container, so this is what
		puts ALL frames under ALL winning symbols. Nested inside the symbol wrap
		(the old layout), a neighbour's frame could render on top of this symbol —
		whichever symbol entered its win state later sat above the earlier one's
		whole subtree, frame included.
	-->
	{#if showWinFrame}
		<SymbolWrap
			x={getSymbolX(props.reelIndex)}
			y={props.reelSymbol.symbolY()}
			animating={true}
			zIndex={-1}
		>
			<SpineProvider key="payframe" width={WIN_FRAME_WIDTH} height={WIN_FRAME_HEIGHT}>
				<SpineTrack trackIndex={0} animationName="idle" loop />
			</SpineProvider>
		</SymbolWrap>
	{/if}
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
