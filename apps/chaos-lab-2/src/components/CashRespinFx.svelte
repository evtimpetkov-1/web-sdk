<script lang="ts">
	import { BitmapText, Container } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import Symbol from './Symbol.svelte';
	import { coinTextStyle, multTextStyle } from './CashFace.svelte';
	import { getCellKey, getSymbolX, getSymbolY } from '../game/utils';
	import { cashGrid } from '../game/stateCashRespins.svelte';
	import type { Position } from '../game/types';

	/**
	 * What spills out of a Cash Respins cell, drawn OVER the pipe frame like the
	 * base game's tumble layer (TumbleBoard plays its bomb blasts there): the
	 * bomb's `explode` and the cloner's `cast` rigs, the frame values rising into
	 * their coins, and the bomb's value thrown onto each coin around it. Under the
	 * frame, a bomb on the right column lost its blast to the pipe (Evtim,
	 * 2026-11-03). CashRespinBoard runs the grid (stateCashRespins); this only
	 * draws its effects.
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
		<!-- a frame's value rising into its coin -->
		<Container>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				<Container x={cellX(cell)} y={cellY(cell)}>
					{#if cell.fx}
						<Container alpha={cell.fx.alpha.current} scale={cell.fx.scale.current}>
							<BitmapText anchor={0.5} text={cell.fx.text} style={multTextStyle(cell.frame)} />
						</Container>
					{/if}
				</Container>
			{/each}
		</Container>
		<!-- a bomb's value thrown onto a coin around it -->
		<Container>
			{#each cashGrid.flights as flight (flight.id)}
				<Container x={flight.x.current} y={flight.y.current} alpha={flight.alpha.current}>
					<BitmapText anchor={0.5} text={flight.text} style={coinTextStyle(Number(flight.text.slice(1)))} />
				</Container>
			{/each}
		</Container>
	</BoardContainer>
</Container>
