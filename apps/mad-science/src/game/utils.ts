import _ from 'lodash';
import { stateBet, stateBetDerived } from 'state-shared';
import { bookEventAmountToNormalisedAmount } from 'utils-shared/amount';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import {
	SYMBOL_SIZE,
	SYMBOL_WIDTH,
	REEL_PADDING,
	SYMBOL_INFO_MAP,
	BOARD_DIMENSIONS,
} from './constants';
import { eventEmitter } from './eventEmitter';
import { stateGame } from './stateGame.svelte';
import type { Bet, BookEvent, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { Position, RawSymbol, SymbolState } from './types';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });

// The math's multiplier symbols land as x1; only the collectMultipliers right after
// the event that landed them carries their values. Write each value back onto the
// landed symbol so it shows on landing: the reveal's board, or the tumble's
// newSymbols (newSymbols[reel][i] settles on padded row i). A multiplier that drops
// in from an older padding row is not in either and keeps the collect-time patch.
const revealMultiplierValues = (bookEvents: BookEvent[]) => {
	bookEvents.forEach((bookEvent, index) => {
		if (bookEvent.type !== 'collectMultipliers') return;
		const landing = bookEvents[index - 1];
		bookEvent.multipliers.forEach(({ reel, row, multiplier }) => {
			const rawSymbol =
				landing?.type === 'reveal'
					? landing.board[reel]?.[row]
					: landing?.type === 'tumbleBoard'
						? landing.newSymbols[reel]?.[row]
						: undefined;
			if (rawSymbol?.name === 'M') rawSymbol.multiplier = multiplier;
		});
	});
};

export const playBet = async (bet: Bet) => {
	revealMultiplierValues(bet.state);
	stateBet.winBookEventAmount = 0;
	// scatters run their idle loop while the book plays (ReelSymbol/TumbleSymbol)
	stateGame.roundActive = true;
	try {
		await playBookEvents(bet.state);
	} finally {
		stateGame.roundActive = false;
	}
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
};

// resume bet
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	// the snapshot settles the board that triggered the free spins
	'reveal',
	'updateGlobalMult',
	'freeSpinTrigger',
	// a bought round's entry (no trigger, no base reveal)
	'buyFreeSpins',
	'updateFreeSpin',
	'setTotalWin',
];

export const convertTorResumableBet = (betToResume: Bet) => {
	const resumingIndex = Number(betToResume.event);
	const bookEventsBeforeResume = betToResume.state.filter(
		(_, eventIndex) => eventIndex < resumingIndex,
	);
	const bookEventsAfterResume = betToResume.state.filter(
		(_, eventIndex) => eventIndex >= resumingIndex,
	);

	const bookEventToCreateSnapshot: BookEventOfType<'createBonusSnapshot'> = {
		index: 0,
		type: 'createBonusSnapshot',
		bookEvents: bookEventsBeforeResume.filter((bookEvent) =>
			BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT.includes(bookEvent.type),
		),
	};

	const stateToResume = [bookEventToCreateSnapshot, ...bookEventsAfterResume];

	return { ...betToResume, state: stateToResume };
};

/**
 * The free spins entry (freeSpinTrigger, or buyFreeSpins for a bought round) of
 * a bet being resumed, when the player left it inside the free spins: the entry
 * lies before the server's event cursor. Undefined otherwise.
 */
export const getResumedFreeSpinsEntry = (bet: Bet | null) => {
	if (!bet?.active) return undefined;
	const bookEventsBeforeResume = bet.state.filter((_, eventIndex) => eventIndex < Number(bet.event));
	return _.findLast(
		bookEventsBeforeResume,
		(bookEvent) => bookEvent.type === 'freeSpinTrigger' || bookEvent.type === 'buyFreeSpins',
	) as BookEventOfType<'freeSpinTrigger' | 'buyFreeSpins'> | undefined;
};

// other utils
export const getSymbolX = (reelIndex: number) => SYMBOL_WIDTH * (reelIndex + REEL_PADDING);
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

// per-cell key of stateGame.cloneFx / idleHold. Book positions index the PADDED reel
// (rows 1..5 are the visible cells, like every other position in the book), so the
// reel board's symbols array index is the row itself.
export const getCellKey = (position: Position) => `${position.reel}-${position.row}`;

// the multiplier's value is drawn at runtime, so one 'M' entry serves every value
export const getSymbolKey = ({ rawSymbol }: { rawSymbol: RawSymbol }) =>
	rawSymbol.name as keyof typeof SYMBOL_INFO_MAP;

/**
 * Does a win (book units) reach the total bet: the BET in the bar, i.e. the base
 * bet x the Chaos Mode / Free Spins Boost cost (a bought round compares to its
 * base bet)? Only such wins are celebrated (Evtim, 2026-10-24): the mascot's
 * laugh, and the coin showers on the win box and the free-spins total.
 */
export const reachesTotalBet = (bookAmount: number) =>
	bookEventAmountToNormalisedAmount(bookAmount) >= stateBetDerived.betCost() - 1e-9;

export const getSymbolInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => {
	const symbolKey = getSymbolKey({ rawSymbol });
	return SYMBOL_INFO_MAP[symbolKey][state];
};

// symbols drawn larger than their cell (the bonus disc) sort above their neighbours
export const getSymbolZIndex = ({ rawSymbol }: { rawSymbol: RawSymbol }) =>
	rawSymbol.name === 'S' ? 1 : 0;

export const getSymbolBackgroundInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => {
	// no symbol has a separate background layer any more (the sample's multiplier did)
	void rawSymbol;
	void state;
	return null;
};
