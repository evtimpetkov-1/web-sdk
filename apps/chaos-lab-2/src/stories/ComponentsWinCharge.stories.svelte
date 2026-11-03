<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/<WinCharge>',
	});
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import WinCharge from '../components/WinCharge.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { RawSymbol } from '../game/types';
	import assets from '../game/assets';

	// a 3x3 cluster of winners, drawn the way ReelSymbol layers them:
	// all halos under, all plates, all arcs over
	const CELLS: RawSymbol[] = [
		{ name: 'H1' },
		{ name: 'L1' },
		{ name: 'W' },
		{ name: 'H3' },
		{ name: 'B' },
		{ name: 'C' },
		{ name: 'H2' },
		{ name: 'L3' },
		{ name: 'H4' },
	];
	const cellX = (i: number) => (i % 3) * SYMBOL_SIZE;
	const cellY = (i: number) => Math.floor(i / 3) * SYMBOL_SIZE;
</script>

{#snippet cluster(phase: 'charge' | 'hold')}
	<StoryPixiApp {assets}>
		<Container x={150} y={120} scale={2}>
			{#each CELLS as _, i}
				<WinCharge layer="under" {phase} loop x={cellX(i)} y={cellY(i)} />
			{/each}
			{#each CELLS as rawSymbol, i}
				<Symbol x={cellX(i)} y={cellY(i)} {rawSymbol} state="static" />
			{/each}
			{#each CELLS as _, i}
				<WinCharge layer="over" {phase} loop x={cellX(i)} y={cellY(i)} />
			{/each}
		</Container>
	</StoryPixiApp>
{/snippet}

<Story name="charge (loop)">
	{#snippet template()}
		{@render cluster('charge')}
	{/snippet}
</Story>

<Story name="hold (loop)">
	{#snippet template()}
		{@render cluster('hold')}
	{/snippet}
</Story>
