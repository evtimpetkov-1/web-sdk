<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';

	import { Container, Rectangle, Sprite } from 'pixi-svelte';
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
	import { reachesTotalBet } from '../game/utils';

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
	// the final figure stays up this long before the box leaves (a press skips it)
	const FINAL_AMOUNT_HOLD_MS = 2000;

	/**
	 * Readability of the (non-big) winbox: its stone glyphs share the royals'
	 * look, so on a board of low symbols the amount melted into them. The reel
	 * window dims, the amount sits on a soft black ellipse (msWinShadow), and
	 * it pops in with an overshoot instead of just fading up.
	 */
	const WIN_DIM_ALPHA = 0.45;
	const POP_FROM = 0.4;
	const POP_MS = 420;
	const popScale = new Tween(1);
	const board = $derived(context.stateGameDerived.boardLayout());

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
			popScale.set(POP_FROM, { duration: 0 });
			popScale.set(1, { duration: POP_MS, easing: backOut });
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
						const run = winRun;
						await startCountUp();
						// the final figure lands (or was skipped to): the tickup ends on its hit
						if (duration) {
							context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_ms_tickup' });
							context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_tickup_end' });
						}
						await waitForTimeout(FINAL_AMOUNT_HOLD_MS);
						// skipped by a press meanwhile: this timer must not close a later win
						if (run !== winRun) return;
						// big wins: the titles play out next (onexit -> oncomplete)
						if (isBigWin) requestExitAnimation = true;
						else oncomplete();
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
											fill: 0xffffff,
										}}
									/>
								</WinAnimation>
							{/key}
						{:else}
							<Rectangle
								anchor={0.5}
								width={board.width}
								height={board.height}
								backgroundColor={0x000000}
								backgroundAlpha={WIN_DIM_ALPHA}
							/>
							<Container scale={popScale.current}>
								<Sprite
									key="msWinShadow"
									anchor={0.5}
									width={board.width * 1.05}
									height={SYMBOL_SIZE * 2}
								/>
								<!-- held inside the reel window, on the shadow -->
								<ResponsiveBitmapText
									anchor={0.5}
									maxWidth={board.width * 0.92}
									text={bookEventAmountToWinCurrencyString(countUpAmount)}
									style={{
										fontFamily: WIN_FONT,
										fontSize: SYMBOL_SIZE,
										align: 'center',
										letterSpacing: 0,
										fill: 0xffffff,
									}}
								/>
							</Container>
						{/if}
					</Container>
				</MainContainer>

				<!-- no coins for a win below the total bet (Evtim, 2026-10-24) -->
				{#if reachesTotalBet(amount)}
					<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />
				{/if}

				<!-- tap anywhere still skips the count-up / closes the box, but no
				     prompt: it read as clutter over a counting win -->
				<PressToContinue
					showText={false}
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
