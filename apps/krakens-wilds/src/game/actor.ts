import _ from 'lodash';

import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet, stateUrlDerived } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGame, stateGameDerived, winCycleState } from './stateGame.svelte';
import { eventEmitter } from './eventEmitter';
import config from './config';
import devBooks from './devBooks';
import { loadMathFiles, selectRandomBook } from './devMath';

// Dev mode: try math-sdk files first (static/assets/math/), fall back to devBooks
const isDevMode = !stateUrlDerived.rgsUrl();
let devBookIndex = 0;
let mathReady: boolean | null = null;
let devPendingPayout = 0;

const devRequestBet = async () => {
	// Load math files only when ?math is in URL, otherwise use devBooks
	if (mathReady === null) {
		const useMath = new URLSearchParams(window.location.search).has('math');
		mathReady = useMath ? await loadMathFiles() : false;
	}

	let payoutMultiplier: number;
	let events: typeof devBooks[number]['events'];

	if (mathReady) {
		const selected = selectRandomBook();
		payoutMultiplier = selected.payoutMultiplier;
		events = selected.events;
	} else {
		const book = devBooks[devBookIndex % devBooks.length];
		devBookIndex++;
		payoutMultiplier = book.payoutMultiplier;
		events = book.events;
	}

	const betAmount = stateBet.betAmount;
	const payout = payoutMultiplier * betAmount;

	// Deduct bet now, store payout for after animations finish
	const postDeductionBalance = stateBet.balanceAmount - betAmount;
	devPendingPayout = payout;

	return {
		balance: {
			amount: postDeductionBalance * API_AMOUNT_MULTIPLIER,
			currency: stateBet.currency || 'USD',
		},
		round: {
			roundID: Date.now(),
			amount: betAmount * API_AMOUNT_MULTIPLIER,
			payout,
			payoutMultiplier,
			active: events.some((e) => e.type === 'freeSpinTrigger'),
			mode: 'BASE',
			state: events,
		},
	};
};

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

		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType],
		});
	},
	onNewGameError: () => stateGameDerived.enhancedBoard.settle(),
	onPlayGame: async (bet) => {
		await playBet(bet);
		// Dev mode: apply payout after all animations finish (mimics RGS endRound)
		if (isDevMode && devPendingPayout > 0) {
			stateBet.balanceAmount += devPendingPayout;
			devPendingPayout = 0;
		}
	},
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
	...(isDevMode && { onRequestBet: devRequestBet }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
