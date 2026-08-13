<script lang="ts">
	import { SpineProvider, SpineTrack, Container } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, SYMBOL_INFO_MAP } from '../game/constants';

	const context = getContext();
	const wSpineScale = SYMBOL_INFO_MAP.W.land.scale;
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
			width={SYMBOL_SIZE * 1.2}
			zIndex={-1}
		>
			<SpineTrack trackIndex={0} animationName="win" loop />
		</SpineProvider>
	{/if}

	<Container alpha={isDimmed ? 0.4 : 1}>
		<SpineProvider
			x={wild.x.current}
			y={wild.y.current}
			key="W"
			scale={wSpineScale}
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
