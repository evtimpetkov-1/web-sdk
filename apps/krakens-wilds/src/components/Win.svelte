<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnMount, OnHotkey } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import WinAnimation from './WinAnimation.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { goldTextStyle } from '../game/textStyles';

	const context = getContext();

	let show = $state(false);
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
							await waitForTimeout(1000);
							oncomplete();
						}
					}}
				/>

				{#if isBigWin}
					{@const canvas = context.stateLayoutDerived.canvasSizes()}
					{@const spineScale = canvas.width / 1441.6}
					{@const cx = canvas.width / 2}
					{@const cy = canvas.height / 2}
					<!-- Full-screen big/mega win: background + kraken spine + shower spine + text -->
					<WinAnimation {isMega} requestExit={requestExitAnimation} onexit={() => oncomplete()}>
						<Container
							label="WinTextContainer"
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
								y={300}
								scale={Math.min(800 / (stableTextWidth || 1), 1)}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									...goldTextStyle,
									fontSize: 96,
								}}
							/>
						</Container>
					</WinAnimation>
				{:else}
					<!-- Small/medium win: just text centered on board -->
					<MainContainer>
						<Container
							label="WinTextContainer"
							x={context.stateGameDerived.boardLayout().x}
							y={context.stateGameDerived.boardLayout().y}
						>
							<Sprite key="winGlow" anchor={0.5} />
							{@const smallWinMaxWidth = context.stateLayoutDerived.canvasSizes().width /
								context.stateLayoutDerived.mainLayout().scale}
							<!-- Measure final amount once for stable scale -->
							<Container visible={false}>
								<Text
									text={bookEventAmountToCurrencyString(amount)}
									style={{ ...goldTextStyle, fontSize: SYMBOL_SIZE }}
									onresize={(s) => (stableTextWidth = s.width)}
								/>
							</Container>
							<Text
								anchor={0.5}
								scale={Math.min(smallWinMaxWidth / (stableTextWidth || 1), 1)}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									...goldTextStyle,
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
