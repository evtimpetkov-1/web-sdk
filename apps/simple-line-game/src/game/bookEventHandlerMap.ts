import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived, winCycleState } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.presentDuration) {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_countup' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_countup' });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_countup_end' });
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			// Clean up previous spin's win state so Win.svelte unmounts and re-mounts
			eventEmitter.broadcast({ type: 'winHide' });
			eventEmitter.broadcast({ type: 'boardResetSymbols' });
			winCycleState.lastWins = null;

			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_reelspin' });
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_reelspin' });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });

		// Breathing room for no-win free spins so player can see the board
		if (bookEvent.gameType === 'freegame') {
			const nextEvent = bookEvents[bookEvent.index + 1];
			if (nextEvent?.type !== 'winInfo') {
				await waitForTimeout(1000);
			}
		}
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		winCycleState.lastWins = bookEvent.wins;

		// All win symbols animate once simultaneously
		const allPositions = _.uniqWith(
			bookEvent.wins.flatMap((win) => win.positions),
			_.isEqual,
		);

		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_win_line' });
		await animateSymbols({ positions: allPositions });
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winHide' });
		eventEmitter.broadcast({ type: 'boardResetSymbols' });
		winCycleState.lastWins = null;
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_totalwin_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		// Start looping all win symbols during countup
		if (winCycleState.lastWins) {
			const allPositions = _.uniqWith(
				winCycleState.lastWins.flatMap((win) => win.positions),
				_.isEqual,
			);
			eventEmitter.broadcast({ type: 'boardLoopSymbols', symbolPositions: allPositions });
			stateGame.winLooping = true;
		}

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();

		// Stop looping — winbox stays visible, hidden later by finalWin
		eventEmitter.broadcast({ type: 'boardStopLoop' });
		stateGame.winLooping = false;
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>, { bookEvents }: BookEventContext) => {
		const hasFs = bookEvents.some(
			(e) => e.type === 'freeSpinTrigger' || e.type === 'freeSpinEnd',
		);

		if (hasFs || !winCycleState.lastWins?.length) {
			winCycleState.lastWins = null;
			eventEmitter.broadcast({ type: 'winHide' });
			return;
		}

		const wins = winCycleState.lastWins;
		const abortController = new AbortController();
		winCycleState.abortController = abortController;

		// Hide winbox after 2s (cancellable)
		const hideTimeout = setTimeout(() => eventEmitter.broadcast({ type: 'winHide' }), 2000);
		abortController.signal.addEventListener(
			'abort',
			() => {
				clearTimeout(hideTimeout);
				eventEmitter.broadcast({ type: 'winHide' });
			},
			{ once: true },
		);

		// Second cycle: per-winline animation (fire-and-forget)
		(async () => {
			const abortableWait = (ms: number) =>
				new Promise<void>((resolve) => {
					if (abortController.signal.aborted) {
						resolve();
						return;
					}
					const t = setTimeout(resolve, ms);
					abortController.signal.addEventListener(
						'abort',
						() => {
							clearTimeout(t);
							resolve();
						},
						{ once: true },
					);
				});

			// Brief pause before starting cycle
			await abortableWait(500);

			while (!abortController.signal.aborted) {
				for (const win of wins) {
					if (abortController.signal.aborted) break;

					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_payline_switch' });
					await eventEmitter.broadcastAsync({
						type: 'boardWithAnimateSymbols',
						symbolPositions: win.positions,
					});

					if (abortController.signal.aborted) break;

					await abortableWait(500);
				}
			}
		})();
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
