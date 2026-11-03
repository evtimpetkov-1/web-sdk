<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, SYMBOL_OVERFLOW } from '../game/constants';

	type Props = { debug?: boolean };

	const props: Props = $props();
	const context = getContext();
</script>

{#if props.debug}
	<Rectangle
		alpha={0.5}
		backgroundColor={0xffffff}
		width={context.stateGameDerived.boardLayout().width}
		height={context.stateGameDerived.boardLayout().height}
	/>
{/if}

<!-- headroom above/below the reel window: what shows there sits under the pipe frame -->
<Rectangle
	isMask
	x={-SYMBOL_SIZE}
	y={-SYMBOL_OVERFLOW}
	width={context.stateGameDerived.boardLayout().width + SYMBOL_SIZE * 2}
	height={context.stateGameDerived.boardLayout().height + SYMBOL_OVERFLOW * 2}
/>
