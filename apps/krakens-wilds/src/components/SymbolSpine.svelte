<script lang="ts">
	import { SpineProvider, SpineTrack, type SpineTrackProps } from 'pixi-svelte';

	import { WIN_FRAME_WIDTH, WIN_FRAME_HEIGHT } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import SymbolSpineMain from './SymbolSpineMain.svelte';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		showWinFrame: boolean;
		loop?: boolean;
	};

	const props: Props = $props();
</script>

<!-- win frame (behind symbol) -->
{#if props.showWinFrame}
	<SpineProvider
		x={props.x}
		y={props.y}
		key="payframe"
		width={WIN_FRAME_WIDTH}
		height={WIN_FRAME_HEIGHT}
		zIndex={-1}
	>
		<SpineTrack trackIndex={0} animationName={'idle'} loop />
	</SpineProvider>
{/if}

<!-- main symbol (on top) -->
<SymbolSpineMain
	x={props.x}
	y={props.y}
	symbolInfo={props.symbolInfo}
	listener={props.listener}
	loop={props.loop}
/>
