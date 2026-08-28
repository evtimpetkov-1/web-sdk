<script lang="ts">
	import { SpineProvider, SpineTrack, Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_INFO_MAP, SYMBOL_SIZE, CELL_W, CELL_H, REEL_PADDING } from '../game/constants';
	import CoinValue from './CoinValue.svelte';
	import Symbol from './Symbol.svelte';
	import WildLandDust from './WildLandDust.svelte';

	const context = getContext();

	/**
	 * The wilds and coins the kraken drops onto the reels mid-spin, drawn over the
	 * still-spinning (and shaded) board. These OWN their cells: the real symbols
	 * underneath are hidden for as long as this list holds one of their kind, so what
	 * the player watches land, reveal and pay is always this copy. The list survives
	 * the reel stop and is cleared at the start of the next reveal.
	 *
	 * A coin's life here: placed BLANK (the plain sprite) while the kraken's dust
	 * still covers the reels -> the handler starts the reveal once the dust has
	 * thinned -> `coin_win` flips it over and the value fades in as it lands face-on
	 * -> it settles into `coin_idle`. Revealing any earlier wastes the whole beat
	 * behind the cloud, which is exactly what it used to do.
	 *
	 * Sizes come from the same SYMBOL_INFO_MAP entries the board uses, so both the
	 * blank sprite and the hand-over at the next spin are invisible swaps.
	 */
	// land and win carry the same ratios for both symbols — the spine's art is measured
	// onto the static's plate, which is what keeps the blank/revealing swap still
	const sizes = (name: 'W' | 'C') => ({
		width: SYMBOL_SIZE * SYMBOL_INFO_MAP[name].land.sizeRatios.width,
		height: SYMBOL_SIZE * SYMBOL_INFO_MAP[name].land.sizeRatios.height,
	});
	/**
	 * The coin's reveal is `coin_win`, not `coin_land`. Only coin_win performs the
	 * flip — `flip_b` scaleX runs 1 -> 0.05 -> -1 -> -0.05 -> 1 and lands face-on at
	 * 0.52s, which is the coin turning over to show what it is worth. coin_land just
	 * tilts and drops in ("slaps down square-on"), which is a landing, not a reveal.
	 * The wild's reveal is its own drop-in.
	 *
	 * Any OTHER name is a SYMBOL kraken spin's stamped copy — rendered through
	 * <Symbol> below, so this map stays W/C only.
	 */
	const ANIMATIONS = {
		W: { reveal: 'wild_land', idle: 'wild_idle' },
		C: { reveal: 'coin_win', idle: 'coin_idle' },
	} as const;
	const isBespoke = (name: string): name is 'W' | 'C' => name === 'W' || name === 'C';
</script>

{#each context.stateGame.overlaySymbols as symbol (symbol.id)}
	{@const blank = SYMBOL_INFO_MAP[symbol.name].static}
	<Container x={CELL_W * (symbol.reel + REEL_PADDING)} y={(symbol.row - 0.5) * CELL_H}>
		{#if !isBespoke(symbol.name)}
			<!--
				A stamped paying symbol (SYMBOL kraken spin). Like the wild it draws
				NOTHING until its reveal: the stamp is the appearance. The reveal is its
				win animation — the only animated state a regular symbol has — and it
				settles to the same static sprite the board draws. Unlike W/C, stamps
				leave the overlay at the REEL STOP (see clearStampOverlay in the book
				handlers): the settled stamp is pixel-identical to the board symbol
				beneath, so the swap is invisible — and the winning stamps then get the
				REGULAR win treatment (frame, win animation, dim) like any naturally
				landed symbol. <Symbol> supplies sizing/yOffset for both.
			-->
			{#if symbol.revealing}
				<Symbol
					state={symbol.landed ? 'static' : 'win'}
					rawSymbol={{ name: symbol.name }}
					oncomplete={() => {
						if (!symbol.landed) symbol.landed = true;
					}}
				/>
			{/if}
		{:else if symbol.revealing}
			{@const size = sizes(symbol.name)}
			{@const anims = ANIMATIONS[symbol.name]}
			<SpineProvider key={symbol.name} width={size.width} height={size.height}>
				<SpineTrack
					trackIndex={0}
					animationName={symbol.landed ? anims.idle : anims.reveal}
					loop={symbol.landed}
					listener={{
						complete: () => {
							if (!symbol.landed) symbol.landed = true;
						},
					}}
				/>
			</SpineProvider>
		{:else if symbol.name === 'C'}
			<!--
				Blank pose, coins only: the plain symbol sprite, the same one the board
				draws at rest. NOT a spine animation — `coin_static` has no timelines at
				all, and swapping a zero-length animation out for the reveal left the
				track ended and the reveal never played. Mounting the spine only when the
				reveal starts gives it a clean start.

				A wild deliberately draws NOTHING until it reveals. It has no face-down
				state to sit in the way a coin does, so showing its finished sprite here
				and then playing `wild_land` over it made the wild land on top of itself.
				It now drops into an empty cell, which is what the landing is for.
			-->
			<Sprite
				key={blank.assetKey}
				anchor={0.5}
				width={SYMBOL_SIZE * blank.sizeRatios.width}
				height={SYMBOL_SIZE * blank.sizeRatios.height}
			/>
		{/if}
		<!-- the reveal is finishing — fade the value onto the coin -->
		{#if symbol.multiplier !== undefined && symbol.valueShown}
			<CoinValue multiplier={symbol.multiplier} size={SYMBOL_SIZE} reveal />
		{/if}

		<!--
			Base-game wilds kick up the same dust as the free-spin ones. Rendered last
			so it sits IN FRONT of the wild it is thrown up by.
		-->
		{#if symbol.name === 'W'}
			<WildLandDust x={0} y={0} emit={symbol.revealing && !symbol.landed} zIndex={10} />
		{:else}
			<!--
				Coins get the same purple reveal smoke as the wilds — it is the kraken's
				dust either way. Unlike the wild (which draws NOTHING until it reveals),
				the coin sits on screen as a blank face from placement, so its dust must
				start at placement too: it boils unseen behind the kraken's cloud, and as
				the cloud thins the dust is the first thing over every coin.

				Stamped symbol copies (SYMBOL kraken spins) take this branch too: they
				also draw nothing until the reveal, so the dust marks their cells from
				placement and dies out as the stamp plays in the clear.

				It stops emitting the moment the flip STARTS — not when the value shows —
				so the beats read in order: dust, then the flip plays in the clear as the
				last puffs die out, then the value fades on at face-on (~0.52s), then the
				glint tail and coin_idle.
			-->
			<WildLandDust x={0} y={0} emit={!symbol.revealing} zIndex={10} />
		{/if}
	</Container>
{/each}

<!--
	A SYMBOL kraken spin's NATURAL copies (the board instances the book did not
	list as stamped) land with the reels, in the open. Each gets the same puff
	of the kraken's dust the stamped copies had, at the moment it lands, so the
	full set reads as the kraken's doing. Entries are dropped by onSymbolLand
	once the dust has drained; the container stays mounted until then.
-->
{#each context.stateGame.stampEchoes as echo (echo.id)}
	<Container x={CELL_W * (echo.reel + REEL_PADDING)} y={(echo.row - 0.5) * CELL_H}>
		<WildLandDust x={0} y={0} emit={echo.emit} lifetimeScale={0.5} zIndex={10} />
	</Container>
{/each}
