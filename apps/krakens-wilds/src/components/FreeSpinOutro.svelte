<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { OnMount } from 'components-shared';

	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import WinAnimation from './WinAnimation.svelte';
	import WinCoins from './WinCoins.svelte';
	import PressToContinue from './PressToContinue.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isLandscape = $derived(context.stateLayoutDerived.layoutType() !== 'portrait');

	/**
	 * The total win deserves a slower count than an ordinary spin. The win-level
	 * table is tuned for the in-game winbox, where the same figures are shown over
	 * and over (0.6s at level 2, 2s at level 5), and against a full-screen TOTAL WIN
	 * panel that reads as a flicker. This is a FLOOR, not a fixed value: the big-win
	 * levels already count for 6-32s alongside their music, and those stay as they
	 * are. Skipped entirely for a feature that won nothing, or the outro would hold
	 * a $0.00 counter on screen for three seconds.
	 */
	const MIN_COUNT_UP = 3 * SECOND;

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {
		if (winLevelData?.presentDuration) {
			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_countup' });
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_countup_end' });
		}
	});
	let requestExitAnimation = $state(false);

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => {
			show = false;
			// same as Win.svelte: never leave the count-up loop running behind the game
			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_countup' });
		},
		freeSpinOutroCountUp: async (emitterEvent) => {
			requestExitAnimation = false;
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = amount > 0 ? Math.max(winLevelData.presentDuration, MIN_COUNT_UP) : winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount
					onmount={async () => {
						await startCountUp();
					}}
				/>

				{@const cx = canvas.width / 2}
				{@const cy = canvas.height / 2}
				<WinAnimation isMega={false} isTotal requestExit={requestExitAnimation} onexit={() => oncomplete()}>
					{#snippet behindSpines()}
						<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />
					{/snippet}
					<!-- `scale` comes from WinAnimation so the amount tracks the fitted title -->
					{#snippet children({ scale })}
						<Container
							label="TotalWinTextContainer"
							x={cx}
							y={cy * (isLandscape ? 0.95 : 1.0)}
							{scale}
						>
							<!--
								y is in the bigwin skeleton's own units (1500x1300). Was
								240/280, which sat the amount tight under the TOTAL WIN
								lettering; +50 opens the gap and lines it up with the in-game
								big-win amount, which already sits at 300/340 in this space.
							-->
							<ResponsiveBitmapText
								anchor={0.5}
								y={isLandscape ? 290 : 330}
								maxWidth={(canvas.width / scale) * 0.9}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									fontFamily: 'cinzel-bold-gold',
									fontSize: 160,
									align: 'center',
									letterSpacing: 0,
								}}
							/>
						</Container>
					{/snippet}
				</WinAnimation>

				<PressToContinue
					onpress={() => {
						if (countUpCompleted) {
							requestExitAnimation = true;
						} else {
							finishCountUp();
						}
					}}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
