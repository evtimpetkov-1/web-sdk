<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { goldTextStyle } from '../game/textStyles';
	import { SYMBOL_SIZE } from '../game/constants';
	import WinAnimation from './WinAnimation.svelte';
	import WinCoins from './WinCoins.svelte';
	import PressToContinue from './PressToContinue.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

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
	let stableTextWidth = $state(0);

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

				{@const spineScale = canvas.width / 1441.6}
				{@const cx = canvas.width / 2}
				{@const cy = canvas.height / 2}
				<WinAnimation isMega={false} isTotal requestExit={requestExitAnimation} onexit={() => oncomplete()}>
					<Container
						label="TotalWinTextContainer"
						x={cx}
						y={cy - 100}
						scale={spineScale}
					>
						<!-- Measure final amount once for stable scale -->
						<Container visible={false}>
							<Text
								text={bookEventAmountToCurrencyString(amount)}
								style={{ ...goldTextStyle, fontSize: 96 }}
								onresize={(s) => (stableTextWidth = s.width)}
							/>
						</Container>
						<Text
							anchor={0.5}
							y={250}
							scale={Math.min(800 / (stableTextWidth || 1), 1)}
							text={bookEventAmountToCurrencyString(countUpAmount)}
							style={{
								...goldTextStyle,
								fontSize: 96,
							}}
						/>
					</Container>
				</WinAnimation>

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

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
