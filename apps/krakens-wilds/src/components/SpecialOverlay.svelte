<script lang="ts">
	import { SpineProvider, SpineTrack, Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_INFO_MAP, SYMBOL_SIZE, CELL_W, CELL_H, REEL_PADDING } from '../game/constants';
	import CoinValue from './CoinValue.svelte';

	const context = getContext();

	/**
	 * The wilds and coins the kraken drops onto the reels mid-spin. They are drawn
	 * here, over the still-spinning (and shaded) board, and land with their own
	 * animation instead of arriving with the reel stop. The real symbols are in the
	 * reveal's board underneath; the handler clears this list the moment the reels
	 * stop, so the overlay hands over to them.
	 *
	 * Coins arrive BLANK and reveal their value HERE, while the reels are still
	 * spinning: `coin_land` plays as the reveal and the value is struck on when it
	 * completes. The real coin underneath therefore must NOT replay that reveal at
	 * the stop — the handler settles those cells so the value simply stays put
	 * (see clearOverlay in bookEventHandlerMap).
	 *
	 * Sizes come from the same SYMBOL_INFO_MAP entries ReelSymbol uses for the land
	 * spine, which is what makes that hand-over invisible.
	 */
	const sizes = (name: 'W' | 'C') => ({
		width: SYMBOL_SIZE * SYMBOL_INFO_MAP[name].land.sizeRatios.width,
		height: SYMBOL_SIZE * SYMBOL_INFO_MAP[name].land.sizeRatios.height,
	});
	const ANIMATIONS = {
		W: { land: 'wild_land', idle: 'wild_idle' },
		C: { land: 'coin_land', idle: 'coin_idle' },
	} as const;
</script>

{#each context.stateGame.overlaySymbols as symbol (symbol.id)}
	{@const size = sizes(symbol.name)}
	{@const anims = ANIMATIONS[symbol.name]}
	<Container x={CELL_W * (symbol.reel + REEL_PADDING)} y={(symbol.row - 0.5) * CELL_H}>
		<SpineProvider key={symbol.name} width={size.width} height={size.height}>
			<SpineTrack
				trackIndex={0}
				animationName={symbol.landed ? anims.idle : anims.land}
				loop={symbol.landed}
				listener={{
					complete: () => {
						if (!symbol.landed) symbol.landed = true;
					},
				}}
			/>
		</SpineProvider>
		<!-- the reveal has finished — strike the value on -->
		{#if symbol.multiplier !== undefined && symbol.landed}
			<CoinValue multiplier={symbol.multiplier} size={SYMBOL_SIZE} pop />
		{/if}
	</Container>
{/each}
