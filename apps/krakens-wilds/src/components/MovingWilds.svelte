<script lang="ts">
	import { SpineProvider, SpineTrack, Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import {
		SYMBOL_INFO_MAP,
		SYMBOL_SIZE,
		WIN_FRAME_WIDTH,
		WIN_FRAME_HEIGHT,
	} from '../game/constants';

	const context = getContext();
	const wSpineSizes = {
		width: SYMBOL_SIZE * SYMBOL_INFO_MAP.W.land.sizeRatios.width,
		height: SYMBOL_SIZE * SYMBOL_INFO_MAP.W.land.sizeRatios.height,
	};
</script>

{#each context.stateGame.movingWilds as wild (wild.id)}
	{@const isWinning = context.stateGame.movingWildWinSet.has(wild.id)}
	{@const isDimmed = context.stateGame.winAnimating && !isWinning}
	{@const animName = isWinning ? 'wild_win' : (wild.landed ? 'wild_idle' : 'wild_land')}

	{#if isWinning}
		<SpineProvider
			x={wild.x.current}
			y={wild.y.current}
			key="payframe"
			width={WIN_FRAME_WIDTH}
			height={WIN_FRAME_HEIGHT}
			zIndex={-1}
		>
			<SpineTrack trackIndex={0} animationName="idle" loop />
		</SpineProvider>
	{/if}

	<Container alpha={isDimmed ? 0.4 : 1}>
		<SpineProvider
			x={wild.x.current}
			y={wild.y.current}
			key="W"
			width={wSpineSizes.width}
			height={wSpineSizes.height}
		>
			<SpineTrack
				trackIndex={0}
				animationName={animName}
				loop={isWinning || wild.landed}
				listener={{
					complete: () => {
						if (!wild.landed) wild.landed = true;
					},
				}}
			/>
		</SpineProvider>
	</Container>
{/each}
