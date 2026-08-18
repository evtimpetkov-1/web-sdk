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
	/**
	 * Bumped by every `winUpdate` so each one gets its own count-up.
	 *
	 * A spin can update the box more than once — a coin spin counts the payline wins
	 * first, then the kraken hands over the coin total and the box counts on to the
	 * full win. The count-up was kicked off from `OnMount`, which runs once per mount,
	 * so a second `winUpdate` neither animated NOR resolved its `oncomplete`: the box
	 * froze on the first figure and the book stalled there for good. Re-keying just
	 * the OnMount re-runs the count-up while leaving WinCountUpProvider mounted, so
	 * its tween keeps its value and beat two counts on from where beat one stopped.
	 */
	let countUpRun = $state(0);

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => (show = false),
		winUpdate: async (emitterEvent) => {
			requestExitAnimation = false;
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			countUpRun += 1;
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
				{#key countUpRun}
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
				{/key}

				{#if isBigWin}
					{@const canvas = context.stateLayoutDerived.canvasSizes()}
					{@const isLandscape = context.stateLayoutDerived.layoutType() !== 'portrait'}
					{@const cx = canvas.width / 2}
					{@const cy = canvas.height / 2}
					<WinAnimation {isMega} requestExit={requestExitAnimation} onexit={() => oncomplete()}>
						{#snippet behindSpines()}
							<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />
						{/snippet}
						<!-- `scale` comes from WinAnimation so the amount tracks the fitted title -->
						{#snippet children({ scale })}
							<Container
								label="WinTextContainer"
								x={cx}
								y={cy * (isLandscape ? 0.95 : 1.0)}
								{scale}
							>
								<ResponsiveBitmapText
									anchor={0.5}
									y={isLandscape ? 300 : 340}
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
