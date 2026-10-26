<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { SpineProvider, SpineSlot, SpineTrack } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';

	import { getContext } from '../game/context';
	import { reachesTotalBet } from '../game/utils';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';

	/**
	 * Free-spins outro: the same lamp-and-plate popup as the intro (rig
	 * spines/msFsPopup, outro_* animations, the hazard-bar plate) with the TOTAL
	 * WIN title and the feature total counting up in the tickup-win face inside
	 * the rig's slot_amount. outro_in -> outro_idle (the count-up starts as the
	 * idle begins) -> press (finishes the count-up first) -> outro_out -> resolve.
	 */
	type Phase = 'in' | 'idle' | 'out';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const width = $derived(Math.min(canvas.width, canvas.height * 1.55));
	const AMOUNT_SIZE = 130; // rig px; tickup-win cell = cap height
	const AMOUNT_MAX_WIDTH = 860;

	let show = $state(false);
	let phase = $state<Phase>('in');
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let startCountUpRequested = $state(false);

	const animationName = $derived(`outro_${phase}`);

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			phase = 'in';
			startCountUpRequested = false;
			show = true;
		},
		freeSpinOutroHide: () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider
			{amount}
			{duration}
			oncomplete={() => {
				// the total lands (or was skipped to): the tickup ends on its hit
				context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_ms_tickup' });
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_tickup_end' });
			}}
		>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.7} />

				<SpineProvider key="msFsPopup" x={canvas.width / 2} y={canvas.height / 2} {width}>
					<SpineTrack
						trackIndex={0}
						{animationName}
						loop={phase === 'idle'}
						listener={{
							complete: () => {
								if (phase === 'in') {
									phase = 'idle';
									if (!startCountUpRequested) {
										startCountUpRequested = true;
										startCountUp();
									}
								} else if (phase === 'out') oncomplete();
							},
						}}
					/>
					<SpineSlot slotName="slot_amount">
						<ResponsiveBitmapText
							anchor={0.5}
							maxWidth={AMOUNT_MAX_WIDTH}
							text={bookEventAmountToWinCurrencyString(countUpAmount)}
							style={{ fontFamily: 'tickup-win', fontSize: AMOUNT_SIZE, align: 'center', letterSpacing: 0, fill: 0xffffff }}
						/>
					</SpineSlot>
				</SpineProvider>

				<!-- no coins for a free-spins total below the total bet (Evtim, 2026-10-24) -->
				{#if reachesTotalBet(amount)}
					<WinCoins emit={phase === 'idle' && !countUpCompleted} levelAlias={winLevelData?.alias} />
				{/if}

				<PressToContinue
					onpress={() => {
						if (phase === 'in') return;
						if (!countUpCompleted) finishCountUp();
						else if (phase === 'idle') {
							phase = 'out';
							context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_popup_out' });
						}
					}}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
