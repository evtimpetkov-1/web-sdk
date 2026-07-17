<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveText } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { winTextStyle } from '../game/textStyles';
	import { SYMBOL_SIZE } from '../game/constants';
	import WinAnimation from './WinAnimation.svelte';
	import WinCoins from './WinCoins.svelte';
	import PressToContinue from './PressToContinue.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const mainScale = $derived(context.stateLayoutDerived.mainLayout().scale);

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});
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
						await waitForTimeout(300);
						requestExitAnimation = true;
					}}
				/>

				<WinAnimation isMega={false} isTotal requestExit={requestExitAnimation} onexit={() => oncomplete()}>
					<MainContainer>
						<Container
							label="TotalWinTextContainer"
							x={canvas.width / 2 / mainScale}
							y={canvas.height * 0.7 / mainScale}
						>
							<ResponsiveText
								anchor={0.5}
								maxWidth={canvas.width / mainScale}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									...winTextStyle,
									fontSize: SYMBOL_SIZE * 0.7,
								}}
							/>
						</Container>
					</MainContainer>
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
