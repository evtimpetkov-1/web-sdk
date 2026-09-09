<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import WinAnimation, { WIN_TIERS, type WinTier } from './WinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	const context = getContext();

	/**
	 * Big wins climb the title tiers as the count-up progresses: the count-up is
	 * split evenly between the tiers up to the level's own (winLevelMap.tier), so
	 * an epic win shows BIG for the first third, MEGA for the second and EPIC for
	 * the last. Skipping the count-up jumps to the top tier; WinAnimation then
	 * plays the upgrades back to back.
	 */
	const tierAt = (countUpAmount: number): WinTier => {
		const top = winLevelData?.tier ?? 'big';
		const steps = WIN_TIERS.indexOf(top) + 1;
		const progress = amount > 0 ? countUpAmount / amount : 1;
		return WIN_TIERS[Math.min(steps - 1, Math.floor(progress * steps))];
	};

	/**
	 * The winbox face: static/assets/madscience/tickup-win (asset `tickupWin`).
	 * Wins are formatted with the WIN string, not the balance one — payouts are
	 * multiples of 0.1x, so sub-$0.10 bets pay in thousandths and two decimals
	 * rendered them as $0.00 (Stake raised this against Kraken's shipped build).
	 */
	const WIN_FONT = 'tickup-win';

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});
	/** big wins: set once the count-up is done (or the player presses) — the titles play out, then oncomplete */
	let requestExitAnimation = $state(false);
	/** bumped per win so each big win gets a fresh WinAnimation (its phases are one-way) */
	let winRun = $state(0);

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => (show = false),
		winUpdate: async (emitterEvent) => {
			requestExitAnimation = false;
			winRun += 1;
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<!-- dark enough for the additive rays to read; the board stays faintly visible -->
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.7} />
				{/if}

				<OnMount
					onmount={async () => {
						await startCountUp();
						if (isBigWin) {
							// hold the final figure a beat, then the titles play out (onexit -> oncomplete)
							await waitForTimeout(600);
							requestExitAnimation = true;
						} else {
							await waitForTimeout(300);
							oncomplete();
						}
					}}
				/>

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x}
						y={context.stateGameDerived.boardLayout().y}
					>
						{#if isBigWin}
							{#key winRun}
								<WinAnimation
									tier={tierAt(countUpAmount)}
									requestExit={requestExitAnimation}
									onexit={() => oncomplete()}
								>
									<!--
										Sits in the rig's slot_win_count bone (1600 world px wide rig,
										amount 250 below the origin). maxWidth keeps long amounts
										narrower than the titles.
									-->
									<ResponsiveBitmapText
										anchor={0.5}
										maxWidth={1200}
										text={bookEventAmountToWinCurrencyString(countUpAmount)}
										style={{
											fontFamily: WIN_FONT,
											fontSize: SYMBOL_SIZE * 2.0,
											align: 'center',
											letterSpacing: 0,
										}}
									/>
								</WinAnimation>
							{/key}
						{:else}
							<ResponsiveBitmapText
								anchor={0.5}
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToWinCurrencyString(countUpAmount)}
								style={{
									fontFamily: WIN_FONT,
									fontSize: SYMBOL_SIZE,
									align: 'center',
									letterSpacing: 0,
								}}
							/>
						{/if}
					</Container>
				</MainContainer>

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<PressToContinue
					onpress={() => {
						if (!countUpCompleted) finishCountUp();
						else if (isBigWin) requestExitAnimation = true;
						else oncomplete();
					}}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
