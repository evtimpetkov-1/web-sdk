<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| {
				type: 'freeSpinOutroCountUp';
				amount: number;
				winLevelData: WinLevelData;
				/** the count's sounds, started and ended with the count itself */
				oncountstart?: () => void;
				oncountend?: () => void;
		  };
</script>

<script lang="ts">
	import { SpineProvider, SpineSlot, SpineTrack, type LoadedSpine } from 'pixi-svelte';
	import { OnMount } from 'components-shared';
	import {
		FadeContainer,
		WinCountUpProvider,
		ResponsiveBitmapText,
		ResponsiveText,
	} from 'components-pixi';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';

	import { getContext } from '../game/context';
	import { reachesTotalBet } from '../game/utils';
	import { ART_STONE, BLACK_OPS_CAP_OFFSET, artTitleText } from '../game/textStyles';
	import { i18nDerived, showsBakedArt } from '../i18n/i18nDerived';
	import {
		POPUP_TITLE_MAX_WIDTH,
		TOTAL_WIN_SIZE,
		hidePopupTitleArt,
		popupBox,
	} from './FreeSpinIntro.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';

	/**
	 * Free-spins outro: the same lamp-and-plate popup as the intro (rig
	 * spines/msFsPopup, outro_* animations, the hazard-bar plate) with the TOTAL
	 * WIN title and the feature total counting up in the tickup-win face inside
	 * the rig's slot_amount. outro_in -> outro_idle -> press (finishes the
	 * count-up first) -> outro_out -> resolve. The count starts as the amount
	 * pops in, before outro_in has ended.
	 * The count's sounds (the handler's oncountstart / oncountend) start and end
	 * with the count, not with the popup. Languages other than English draw
	 * TOTAL WIN as text in the title slot (showsBakedArt, hidePopupTitleArt).
	 */
	type Phase = 'in' | 'idle' | 'out';

	const context = getContext();
	const box = $derived(popupBox(context.stateLayoutDerived.canvasSizes()));
	const bakedArt = showsBakedArt();
	const AMOUNT_SIZE = 130; // rig px; tickup-win cell = cap height
	const AMOUNT_MAX_WIDTH = 860;
	/**
	 * From the popup to the count (Evtim, 2026-10-28: too long, ~2.5 s with the
	 * bar's fade): outro_in plays this much faster than authored (2.1 s), and the
	 * count starts as the amount pops in (rig 1.63 s), not when outro_in ends.
	 * sfx_ms_fs_outro is cut to the authored build (peak at the TOTAL WIN slam,
	 * 1.5 s), so a much faster build would run ahead of it.
	 */
	const OUTRO_IN_SPEED = 1.25;
	const AMOUNT_IN_S = 1.63;

	let show = $state(false);
	let phase = $state<Phase>('in');
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let oncountstart = () => {};
	let oncountend = () => {};
	let startCountUpRequested = $state(false);
	let countTimer: ReturnType<typeof setTimeout> | undefined;

	const animationName = $derived(`outro_${phase}`);

	const beginCount = (startCountUp: () => Promise<void>) => {
		clearTimeout(countTimer);
		if (startCountUpRequested) return;
		startCountUpRequested = true;
		oncountstart();
		startCountUp();
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			if (!bakedArt) hidePopupTitleArt(context.stateApp.loadedAssets?.msFsPopup as LoadedSpine);
			phase = 'in';
			startCountUpRequested = false;
			show = true;
		},
		freeSpinOutroHide: () => {
			clearTimeout(countTimer);
			show = false;
		},
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			oncountstart = emitterEvent.oncountstart ?? (() => {});
			oncountend = emitterEvent.oncountend ?? (() => {});
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
				// the total lands (or was skipped to): the tickup ends on its hit, the bed fades
				oncountend();
			}}
		>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.7} />

				<!-- mounts with the popup, so outro_in starts now: the count is due as the amount pops in -->
				<OnMount
					onmount={() => {
						clearTimeout(countTimer);
						countTimer = setTimeout(
							() => beginCount(startCountUp),
							(AMOUNT_IN_S * 1000) / OUTRO_IN_SPEED,
						);
					}}
				/>

				<SpineProvider key="msFsPopup" x={box.x} y={box.y} width={box.width}>
					<SpineTrack
						trackIndex={0}
						{animationName}
						loop={phase === 'idle'}
						timeScale={phase === 'in' ? OUTRO_IN_SPEED : 1}
						listener={{
							complete: () => {
								if (phase === 'in') {
									phase = 'idle';
									beginCount(startCountUp); // no-op once the timer has started it
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
					{#if !bakedArt}
						<SpineSlot slotName="totalwin">
							<ResponsiveText
								anchor={0.5}
								y={-TOTAL_WIN_SIZE * BLACK_OPS_CAP_OFFSET}
								maxWidth={POPUP_TITLE_MAX_WIDTH}
								text={i18nDerived.totalWin()}
								style={artTitleText(TOTAL_WIN_SIZE, ART_STONE, '#16110d')}
							/>
						</SpineSlot>
					{/if}
				</SpineProvider>

				<!-- no coins for a free-spins total below the total bet (Evtim, 2026-10-24) -->
				{#if reachesTotalBet(amount)}
					<WinCoins emit={startCountUpRequested && !countUpCompleted} levelAlias={winLevelData?.alias} />
				{/if}

				<PressToContinue
					onpress={() => {
						// presses wait for the count; the exit waits for outro_in to end
						if (!startCountUpRequested) return;
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
