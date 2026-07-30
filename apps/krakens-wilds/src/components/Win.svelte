<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnMount, OnHotkey } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import WinAnimation from './WinAnimation.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

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
					{@const isLandscape = context.stateLayoutDerived.layoutType() !== 'portrait'}
					{@const spineScale = Math.min(canvas.width / 850, canvas.height / 1100)}
					{@const cx = canvas.width / 2}
					{@const cy = canvas.height / 2}
					<WinAnimation {isMega} requestExit={requestExitAnimation} onexit={() => oncomplete()}>
						{#snippet behindSpines()}
							<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />
						{/snippet}
						<Container
							label="WinTextContainer"
							x={cx}
							y={cy * (isLandscape ? 0.95 : 1.0)}
							scale={spineScale}
						>
							<ResponsiveBitmapText
								anchor={0.5}
								y={isLandscape ? 240 : 280}
								maxWidth={canvas.width / spineScale * 0.9}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									fontFamily: 'cinzel-bold-gold',
									fontSize: 160,
									align: 'center',
									letterSpacing: 0,
								}}
							/>
						</Container>
					</WinAnimation>
				{:else}
					<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />
					<!-- Small/medium win: just text centered on board -->
					<MainContainer>
						<Container
							label="WinTextContainer"
							x={context.stateGameDerived.boardLayout().x}
							y={context.stateGameDerived.boardLayout().y - 40}
						>
							<Sprite key="winGlow" anchor={0.5} y={40} />
							<ResponsiveBitmapText
								anchor={0.5}
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									fontFamily: 'cinzel-bold-gold',
									fontSize: SYMBOL_SIZE,
									align: 'center',
									letterSpacing: 0,
								}}
							/>
						</Container>
					</MainContainer>
				{/if}

				{#if !countUpCompleted}
					<OnPressFullScreen onpress={() => finishCountUp()} />
					<OnHotkey hotkey="Space" onpress={() => finishCountUp()} />
				{/if}
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
