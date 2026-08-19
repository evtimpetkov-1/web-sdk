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

	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import WinAnimation from './WinAnimation.svelte';
	import WinCoins from './WinCoins.svelte';
	import PressToContinue from './PressToContinue.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	/**
	 * The total win deserves a slower count than an ordinary spin. The win-level
	 * table is tuned for the in-game winbox, where the same figures are shown over
	 * and over (0.6s at level 2, 2s at level 5), and against a full-screen TOTAL WIN
	 * panel that reads as a flicker. This is a FLOOR, not a fixed value: the big-win
	 * levels already count for 6-32s alongside their music, and those stay as they
	 * are. Skipped entirely for a feature that won nothing, or the outro would hold
	 * a $0.00 counter on screen for three seconds.
	 */
	const MIN_COUNT_UP = 3 * SECOND;

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
		freeSpinOutroHide: async () => {
			show = false;
			// same as Win.svelte: never leave the count-up loop running behind the game
			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_countup' });
		},
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
		{@const duration = amount > 0 ? Math.max(winLevelData.presentDuration, MIN_COUNT_UP) : winLevelData.presentDuration}
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
					<!-- `scale` comes from WinAnimation so the amount tracks the fitted title -->
					{#snippet children({ scale })}
						<!--
							The amount centres VERTICALLY between the TOTAL WIN lettering and
							the press-anywhere bar, instead of hanging at a fixed offset under
							the title with dead space below.
							- title bottom: the letters are centred at spine y -40 with 300-unit
							  tall glyphs, and the spine origin sits at canvas centre, so the
							  bottom edge lands at cy + 190 * scale.
							- bar top: PressToContinue's strip is 70 tall centred at
							  layout.height - 100, bottom-aligned -> canvas.height - 135 in its
							  layout units, mapped by the main layout scale.
						-->
						{@const titleBottom = cy + 190 * scale}
						{@const barTop =
							canvas.height - 135 * context.stateLayoutDerived.mainLayout().scale}
						<!--
							Portrait reads the amount small (the spine scale is width-bound
							there), so it gets its own boost on top of the spine's scale. The
							maxWidth stays expressed in CANVAS terms (divided by the full
							effective scale), so ResponsiveBitmapText still shrinks any long
							amount/currency down before it can spill off screen.
						-->
						{@const isPortraitOutro = context.stateLayoutDerived.layoutType() === 'portrait'}
						<!-- matches the in-game big/mega amount boosts (Win.svelte) -->
						{@const amountBoost = isPortraitOutro ? 1.55 : 1.35}
						<!--
							Landscape: dead centre of the title->bar gap. Portrait's gap is
							much taller, so dead centre stranded the amount — it sits at 35%
							of the gap instead, closer under the title.
						-->
						{@const gapFraction = isPortraitOutro ? 0.25 : 0.5}
						<Container
							label="TotalWinTextContainer"
							x={cx}
							y={titleBottom + (barTop - titleBottom) * gapFraction}
							scale={scale * amountBoost}
						>
							<ResponsiveBitmapText
								anchor={0.5}
								maxWidth={(canvas.width / (scale * amountBoost)) * 0.9}
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
