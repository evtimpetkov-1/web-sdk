<script lang="ts">
	import { SpineProvider, SpineTrack, Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import WildLandDust from './WildLandDust.svelte';
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

	<!--
		After the wild, so the dust is thrown up IN FRONT of it. Emits only while the
		drop plays — `landed` flips on the spine's complete — and the puffs already in
		flight finish their own lifetime, so the cloud settles instead of being cut.
	-->
	<WildLandDust x={wild.x.current} y={wild.y.current} emit={!wild.landed && !isWinning} />
{/each}
