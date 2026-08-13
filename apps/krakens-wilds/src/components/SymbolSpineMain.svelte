<script lang="ts">
	import { SpineProvider, SpineTrack, type SpineTrackProps } from 'pixi-svelte';

	import { getSymbolInfo } from '../game/utils';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
	};

	const props: Props = $props();
</script>

<SpineProvider
	x={props.x}
	y={props.y}
	key={props.symbolInfo.assetKey}
	scale={props.symbolInfo.scale}
>
	<SpineTrack
		loop={props.loop}
		trackIndex={0}
		animationName={props.symbolInfo.animationName}
		timeScale={1}
		listener={props.listener}
	/>
</SpineProvider>
