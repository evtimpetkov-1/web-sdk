<script lang="ts">
	import { BitmapText, Container } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import Symbol from './Symbol.svelte';
	import { coinTextStyle } from './CashFace.svelte';
	import { getCellKey, getSymbolX, getSymbolY } from '../game/utils';
	import { cashGrid } from '../game/stateCashRespins.svelte';
	import type { Position } from '../game/types';

	/**
	 * What spills out of a Cash Respins cell, drawn OVER the pipe frame like the
	 * base game's tumble layer (TumbleBoard plays its bomb blasts there): the
	 * bomb's `explode` and the cloner's `cast` rigs, and the bomb's value thrown
	 * onto each coin around it. Under the frame, a bomb on the right column lost
	 * its blast to the pipe (Evtim, 2026-11-03). CashRespinBoard runs the grid
	 * (stateCashRespins); this only draws its effects.
	 */
	const cellX = (position: Position) => getSymbolX(position.reel);
	const cellY = (position: Position) => getSymbolY(position.row - 1);
</script>

<Container visible={cashGrid.show}>
	<BoardContainer>
		<Container>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				<Container x={cellX(cell)} y={cellY(cell)} scale={cell.pop.current}>
					{#if cell.rig === 'explode'}
						<Symbol state="explode" rawSymbol={{ name: 'B' }} oncomplete={() => cell.onrig()} />
					{:else if cell.rig === 'cast'}
						<Symbol state="cast" rawSymbol={{ name: 'C' }} oncomplete={() => cell.onrig()} />
					{/if}
				</Container>
			{/each}
		</Container>
		<!-- a bomb's value ("2x") thrown onto a coin around it -->
		<Container>
			{#each cashGrid.flights as flight (flight.id)}
				<Container x={flight.x.current} y={flight.y.current} alpha={flight.alpha.current}>
					<BitmapText anchor={0.5} text={flight.text} style={coinTextStyle(parseInt(flight.text, 10))} />
				</Container>
			{/each}
		</Container>
	</BoardContainer>
</Container>
