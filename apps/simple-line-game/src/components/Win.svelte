<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import WinCoins from './WinCoins.svelte';
	import WinAnimation from './WinAnimation.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { winTextStyle } from '../game/textStyles';

	const context = getContext();

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});
	let requestExitAnimation = $state(false);

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => (show = false),
		winUpdate: async (emitterEvent) => {
			requestExitAnimation = false;
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const isMega = winLevelData.alias === 'mega' || winLevelData.alias === 'epic' || winLevelData.alias === 'max' || winLevelData.alias === 'superwin'}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount
					onmount={async () => {
						await startCountUp();
						if (isBigWin) {
							await waitForTimeout(300);
							requestExitAnimation = true;
						} else {
							oncomplete();
						}
					}}
				/>

				{#if isBigWin}
					<!-- Full-screen big/mega win: background + kraken spine + shower spine + text -->
					<WinAnimation {isMega} requestExit={requestExitAnimation} onexit={() => oncomplete()}>
						<MainContainer>
							<Container
								label="WinTextContainer"
								x={context.stateLayoutDerived.canvasSizes().width / 2 / context.stateLayoutDerived.mainLayout().scale}
								y={context.stateLayoutDerived.canvasSizes().height * 0.7 / context.stateLayoutDerived.mainLayout().scale}
							>
								<ResponsiveText
									anchor={0.5}
									maxWidth={context.stateLayoutDerived.canvasSizes().width / context.stateLayoutDerived.mainLayout().scale}
									text={bookEventAmountToCurrencyString(countUpAmount)}
									style={{
										...winTextStyle,
										fontSize: SYMBOL_SIZE * 0.7,
									}}
								/>
							</Container>
						</MainContainer>
					</WinAnimation>
				{:else}
					<!-- Small/medium win: just text centered on board -->
					<MainContainer>
						<Container
							label="WinTextContainer"
							x={context.stateGameDerived.boardLayout().x}
							y={context.stateGameDerived.boardLayout().y}
						>
							<ResponsiveText
								anchor={0.5}
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									...winTextStyle,
									fontSize: SYMBOL_SIZE,
								}}
							/>
						</Container>
					</MainContainer>
				{/if}

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				{#if !countUpCompleted}
					<OnPressFullScreen onpress={() => finishCountUp()} />
					<OnHotkey hotkey="Space" onpress={() => finishCountUp()} />
				{/if}
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
