<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		/** something hit the box — knock it. Fired by SpinMultiplier on impact. */
		| { type: 'winBoxImpact' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';
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
		// The coin rain is bound to `!countUpCompleted` on WinCoins, so its sound has
		// to end on the same signal. Leaving it to winLevelSoundsStop meant the loop
		// carried on after the counter had stopped and the coins had gone — audible
		// on the free-spins outro, which waits for a press before it tears down.
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_coin_shower' });
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

	/**
	 * The knock the box takes when the kraken's multiplier lands on it.
	 *
	 * Starts at full displacement and decays, because that is what being hit does
	 * — a shake that eases IN reads as the box deciding to wobble rather than as
	 * something striking it. x and y run at different frequencies so it rattles
	 * instead of sliding along one diagonal.
	 *
	 * Deliberately scoped to this container and not the stage: playEarthquake
	 * moves the whole scene, which is right for a scene transition and wrong for
	 * one element being struck.
	 */
	const SHAKE_MS = 280;
	const SHAKE_PX = 15;
	let shake = $state({ x: 0, y: 0 });
	let shakeRaf: number | undefined;

	const knockWinBox = () => {
		if (shakeRaf !== undefined) cancelAnimationFrame(shakeRaf);
		const start = performance.now();
		const tick = () => {
			const t = (performance.now() - start) / SHAKE_MS;
			if (t >= 1) {
				shake = { x: 0, y: 0 };
				shakeRaf = undefined;
				return;
			}
			// squared falloff: most of the movement is in the first third
			const damp = (1 - t) ** 2;
			shake = {
				x: Math.cos(t * Math.PI * 9) * SHAKE_PX * damp,
				y: Math.cos(t * Math.PI * 7) * SHAKE_PX * 0.65 * damp,
			};
			shakeRaf = requestAnimationFrame(tick);
		};
		shakeRaf = requestAnimationFrame(tick);
	};

	// A shake left mid-flight would keep writing state after the box has gone.
	$effect(() => () => {
		if (shakeRaf !== undefined) cancelAnimationFrame(shakeRaf);
	});

	context.eventEmitter.subscribeOnMount({
		winBoxImpact: () => knockWinBox(),
		winShow: () => (show = true),
		winHide: () => {
			show = false;
			// the box is gone, so the count-up loop goes with it. It was only ever
			// stopped when the count-up finished, so a presentation cut short — a new
			// spin, an abort — left sfx_countup looping under the game.
			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_countup' });
			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_coin_shower' });
		},
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
							<!--
								The amount's POSITION stays in spine units below the title (the
								reworked letters span to spine -190), but its GLYPHS get their
								own portrait boost on top of the spine scale — the offset is
								applied outside the scaled container so boosting the text does
								not push it further down. maxWidth stays in canvas terms, so
								long amounts still shrink before spilling.
							-->
							{@const amountBoost = isLandscape ? 1.35 : 1.55}
							<Container
								label="WinTextContainer"
								x={cx}
								y={cy * (isLandscape ? 0.95 : 1.0) + (isLandscape ? 375 : 385) * scale}
								scale={scale * amountBoost}
							>
								<ResponsiveBitmapText
									anchor={0.5}
									maxWidth={(canvas.width / (scale * amountBoost)) * 0.9}
									text={bookEventAmountToWinCurrencyString(countUpAmount)}
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
							x={context.stateGameDerived.boardLayout().x + shake.x}
							y={context.stateGameDerived.boardLayout().y - 40 + shake.y}
						>
							<Sprite key="winGlow" anchor={0.5} y={40} />
							<ResponsiveBitmapText
								anchor={0.5}
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToWinCurrencyString(countUpAmount)}
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
