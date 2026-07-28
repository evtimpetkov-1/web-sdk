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

	import { getContext } from '../game/context';
	import WinAnimation from './WinAnimation.svelte';
	import WinCoins from './WinCoins.svelte';
	import PressToContinue from './PressToContinue.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const spineScale = $derived(Math.min(canvas.width / 850, canvas.height / 1100));

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
		freeSpinOutroHide: async () => (show = false),
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
		{@const duration = winLevelData.presentDuration}
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
					<Container
						label="TotalWinTextContainer"
						x={cx}
						y={cy * 0.85}
						scale={spineScale}
					>
						<ResponsiveBitmapText
							anchor={0.5}
							y={300}
							maxWidth={2130}
							text={bookEventAmountToCurrencyString(countUpAmount)}
							style={{
								fontFamily: 'cinzel-bold-gold',
								fontSize: 96,
								align: 'center',
								letterSpacing: 0,
							}}
						/>
					</Container>
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
