import _ from 'lodash';

import { stateBet, stateBetDerived } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { eventEmitter } from './eventEmitter';

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
		// the plate's multiplier belongs to the round that collected it: it empties
		// on the press, every spin and buy (Evtim, 2026-10-28; it emptied on the
		// reveal, after the RGS reply, a beat after the board had gone)
		if (stateGame.globalMultiplier !== 1) {
			stateGame.globalMultiplier = 1;
			eventEmitter.broadcast({ type: 'globalMultiplierUpdate', multiplier: 1 });
		}
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
		// a bought round has no base spin: buyFreeSpins closes the curtains over the
		// board as it stands, and the first free spin's reveal drops it (Evtim, 2026-10-26)
		if (stateBetDerived.activeBetMode()?.type === 'buy') return;
		// the board drops out on the press (the reveal plays it when there is no pre-spin)
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_board_dropout' });
		await stateGameDerived.enhancedBoard.preSpin({});
	},
	onNewGameError: () => stateGameDerived.enhancedBoard.settle(),
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
