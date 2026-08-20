import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { waitForTimeout } from 'utils-shared/wait';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGame, stateGameDerived, winCycleState } from './stateGame.svelte';
import { eventEmitter } from './eventEmitter';
import config from './config';

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => convertTorResumableBet(betToResume),
	onResumeGameInactive: (betToResume) => {
		const lastRevealEvent = _.findLast(
			betToResume.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);

		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},
	onNewGameStart: async () => {
		// Cancel any running win cycle
		winCycleState.cancel();
		eventEmitter.broadcast({ type: 'boardResetSymbols' });

		// The kraken's overlay owns its cells only until the next spin STARTS.
		// It used to be cleared when the next reveal arrived — i.e. after the
		// RGS round-trip — so its wilds/coins sat frozen on top of already
		// spinning reels for the whole network wait. Clearing at press hands
		// the cells back to the identical real board symbols, which then spin
		// away like any other symbol. (The reveal handler still clears too, as
		// the safety net for spins this callback skips.)
		stateGame.overlaySymbols = [];
		stateGame.reelsShaded = false;

		// Reset anticipation flags immediately — the Anticipation component's
		// 300ms fade oncomplete may not have fired yet from the previous spin.
		for (const reel of stateGame.board) {
			reel.reelState.anticipating = false;
		}

		// No-win turbo delay — breathing room between spins
		if (stateBet.isTurbo && stateBet.winBookEventAmount === 0) {
			await waitForTimeout(150);
		}

		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) {
			return;
		}
		stateBet.winBookEventAmount = 0;
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType],
		});
	},
	onNewGameError: () => stateGameDerived.enhancedBoard.settle(),
	onPlayGame: async (bet) => {
		await playBet(bet);
	},
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
