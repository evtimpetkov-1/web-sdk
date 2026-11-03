<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/<GooBurst>',
	});
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import GooBurst from '../components/GooBurst.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { RawSymbol } from '../game/types';
	import assets from '../game/assets';

	// the burst looping over static plates (in the game the plate also pops and collapses, see TumbleSymbol)
	const CELLS: RawSymbol[] = [{ name: 'H2' }, { name: 'L1' }, { name: 'C' }, { name: 'H1' }];
</script>

<Story name="burst (loop)">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container x={150} y={200} scale={2}>
				{#each CELLS as rawSymbol, i}
					<Symbol x={i * SYMBOL_SIZE * 1.3} y={0} {rawSymbol} state="static" />
				{/each}
				{#each CELLS as _, i}
					<GooBurst x={i * SYMBOL_SIZE * 1.3} y={0} loop />
				{/each}
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
