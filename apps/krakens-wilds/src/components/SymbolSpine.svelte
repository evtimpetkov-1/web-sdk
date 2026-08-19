<script lang="ts">
	import { type SpineTrackProps } from 'pixi-svelte';

	import { getSymbolInfo } from '../game/utils';
	import SymbolSpineMain from './SymbolSpineMain.svelte';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
	};

	const props: Props = $props();
</script>

<!-- The win frame is NOT drawn here: ReelSymbol hoists it into its own wrap at
     zIndex -1 so every frame sorts under every winning symbol, not just its own. -->
<SymbolSpineMain
	x={props.x}
	y={props.y}
	symbolInfo={props.symbolInfo}
	listener={props.listener}
	loop={props.loop}
/>
