import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived, winCycleState, type MovingWild } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { SYMBOL_SIZE, REEL_PADDING } from './constants';
import config from './config';

let movingWildIdCounter = 0;
const wildX = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING);
const wildY = (row: number) => (row - 0.5) * SYMBOL_SIZE;

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
	// sfx_countup is stopped by WinCountUpProvider.oncomplete in Win/FreeSpinOutro
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
		// Reset stale anticipation state from previous spin
		for (const reel of stateGame.board) {
			reel.reelState.anticipating = false;
		}
		// Disable anticipation during free spins
		if (bookEvent.gameType === 'freegame') {
			bookEvent.anticipation = bookEvent.anticipation.map(() => 0);
		}
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_reelspin' });

		if (bookEvent.gameType === 'freegame') {
			// Extract wild positions from board data (visible rows 1-3)
			const wildPositions: Position[] = [];
			for (let reelIndex = 0; reelIndex < bookEvent.board.length; reelIndex++) {
				const reel = bookEvent.board[reelIndex];
				for (let symbolIndex = 1; symbolIndex <= 3; symbolIndex++) {
					if (reel[symbolIndex]?.wild) {
						wildPositions.push({ reel: reelIndex, row: symbolIndex });
					}
				}
			}

			// Start reels spinning visually
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});

			// Position wilds while reels spin
			const isFirstFreeSpinReveal = stateGame.movingWilds.length === 0;

			if (isFirstFreeSpinReveal && wildPositions.length > 0) {
				// First free spin: stagger wild appearances while reels spin
				await waitForTimeout(300);
				for (const pos of wildPositions) {
					const wild: MovingWild = {
						id: movingWildIdCounter++,
						x: new Tween(wildX(pos.reel)),
						y: new Tween(wildY(pos.row)),
						reel: pos.reel,
						row: pos.row,
						landed: false,
					};
					stateGame.movingWilds = [...stateGame.movingWilds, wild];
					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_land' });
					await waitForTimeout(200);
				}
				await waitForTimeout(400);
			} else if (wildPositions.length > 0) {
				// Subsequent spins: move existing wilds to new positions
				const updated = [...stateGame.movingWilds];

				// Move existing wilds
				const keepCount = Math.min(updated.length, wildPositions.length);
				for (let i = 0; i < keepCount; i++) {
					updated[i].x.set(wildX(wildPositions[i].reel), { duration: 400 });
					updated[i].y.set(wildY(wildPositions[i].row), { duration: 400 });
					updated[i].reel = wildPositions[i].reel;
					updated[i].row = wildPositions[i].row;
				}

				// Add new wilds if more than before
				for (let i = updated.length; i < wildPositions.length; i++) {
					updated.push({
						id: movingWildIdCounter++,
						x: new Tween(wildX(wildPositions[i].reel)),
						y: new Tween(wildY(wildPositions[i].row)),
						reel: wildPositions[i].reel,
						row: wildPositions[i].row,
						landed: false,
					});
				}

				// Remove extras if fewer
				if (wildPositions.length < updated.length) {
					updated.length = wildPositions.length;
				}

				stateGame.movingWilds = updated;
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_land' });
				await waitForTimeout(1000);
			} else {
				// No wilds this spin — clear all
				stateGame.movingWilds = [];
				await waitForTimeout(2000);
			}

			// Send stop targets — reels begin stopping sequence
			const spinPromise = stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});

			await spinPromise;
		} else {
			await stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});
		}

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
		// Start animations but proceed after 500ms so winbox shows early
		await Promise.race([
			animateSymbols({ positions: allPositions }),
			waitForTimeout(500),
		]);
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
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// Animate retrigger scatters and update the free spin counter
		const extraSpins = bookEvent.totalFs - stateUi.freeSpinCounterTotal;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// Show retrigger screen
		await eventEmitter.broadcastAsync({
			type: 'freeSpinRetriggerShow',
			extraSpins,
		});
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
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
		stateGame.movingWilds = [];
		stateGame.gameType = 'basegame';
		winCycleState.lastWins = null;
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
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

		// Pause during free spins so the player can see their winnings
		if (stateGame.gameType === 'freegame') {
			await waitForTimeout(1000);
		}

		eventEmitter.broadcast({ type: 'winHide' });
		// Board stays dimmed with symbols looping — finalWin picks up seamlessly
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>, { bookEvents }: BookEventContext) => {
		const hasFs = bookEvents.some(
			(e) => e.type === 'freeSpinTrigger' || e.type === 'freeSpinEnd',
		);

		if (hasFs || !winCycleState.lastWins?.length) {
			winCycleState.lastWins = null;
			// Clean up board state left by setWin (dimming + looping symbols)
			eventEmitter.broadcast({ type: 'boardStopLoop' });
			stateGame.winLooping = false;
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
		// winLooping is already true from setWin — board stays dimmed, symbols stay looping
		abortController.signal.addEventListener(
			'abort',
			() => {
				stateGame.winLooping = false;
			},
			{ once: true },
		);

		(async () => {
			while (!abortController.signal.aborted) {
				for (const win of wins) {
					if (abortController.signal.aborted) break;

					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_payline_switch' });
					await eventEmitter.broadcastAsync({
						type: 'boardWithAnimateSymbols',
						symbolPositions: win.positions,
					});

					if (abortController.signal.aborted) break;
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
