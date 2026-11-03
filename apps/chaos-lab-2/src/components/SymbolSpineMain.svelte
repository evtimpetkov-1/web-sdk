<script lang="ts">
	import { SpineProvider, SpineTrack, type SpineTrackProps } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import BombHeartbeatLock from './BombHeartbeatLock.svelte';
	import { getSymbolInfo } from '../game/utils';
	import { BOMB_HEARTBEAT, SYMBOL_SIZE } from '../game/constants';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
	};

	const props: Props = $props();
	// the armed bomb's idle is the fuse sound's heartbeat: phase-locked to it and never
	// sped up by turbo (the sound plays at 1x)
	const heartbeat = $derived(
		props.symbolInfo.assetKey === BOMB_HEARTBEAT.assetKey &&
			props.symbolInfo.animationName === BOMB_HEARTBEAT.animation,
	);
</script>

<SpineProvider
	x={props.x}
	y={props.y}
	key={props.symbolInfo.assetKey}
	width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
	height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
>
	<SpineTrack
		loop={props.loop}
		trackIndex={0}
		animationName={props.symbolInfo.animationName}
		timeScale={heartbeat ? 1 : stateBetDerived.timeScale()}
		listener={props.listener}
	/>
	{#if heartbeat}
		<BombHeartbeatLock />
	{/if}
</SpineProvider>
