import _ from 'lodash';
import { stateBet, stateBetDerived } from 'state-shared';
import { bookEventAmountToNormalisedAmount } from 'utils-shared/amount';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { SYMBOL_SIZE, SYMBOL_WIDTH, SYMBOL_INFO_MAP, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import { stateGame } from './stateGame.svelte';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { Position, RawSymbol, SymbolState } from './types';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });

export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
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
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
];

/**
 * Where a resumed round picks up: the last event the client recorded with
 * /bet/event (free spins only). A round with none recorded, e.g. a base-game
 * win refreshed mid-spin, comes back from /authenticate WITHOUT an `event`
 * field: Number(undefined) is NaN, which matched no event at all, so the round
 * was ended without being shown (Stake review 2026-10-29). It replays from the
 * start instead.
 */
const getResumingIndex = (bet: Bet) => {
	const index = Number(bet.event);
	return Number.isInteger(index) && index > 0 ? index : 0;
};

export const convertTorResumableBet = (betToResume: Bet) => {
	const resumingIndex = getResumingIndex(betToResume);
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
 * The free spins entry of a bet being resumed, when the player left it inside
 * the free spins: the entry lies before the server's event cursor. Undefined
 * otherwise.
 */
export const getResumedFreeSpinsEntry = (bet: Bet | null) => {
	if (!bet?.active) return undefined;
	const resumingIndex = getResumingIndex(bet);
	const bookEventsBeforeResume = bet.state.filter((_, eventIndex) => eventIndex < resumingIndex);
	return _.findLast(bookEventsBeforeResume, (bookEvent) => bookEvent.type === 'freeSpinTrigger') as
		| BookEventOfType<'freeSpinTrigger'>
		| undefined;
};

// other utils
export const getSymbolX = (reelIndex: number) => SYMBOL_WIDTH * (reelIndex + 0.5);
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

// Book positions index the PADDED reel (rows 1..4 are the visible cells), so the reel
// board's symbols array index is the row itself.
export const getCellKey = (position: Position) => `${position.reel}-${position.row}`;

/**
 * Does a win (book units) reach the total bet (the BET in the bar)? Only such wins
 * count up and are celebrated; smaller ones just show.
 */
export const reachesTotalBet = (bookAmount: number) =>
	bookEventAmountToNormalisedAmount(bookAmount) >= stateBetDerived.betCost() - 1e-9;

export const getSymbolInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => SYMBOL_INFO_MAP[rawSymbol.name][state];

/**
 * A Coin's value (x total bet), or undefined for a coin without one (the filler that
 * spins by) and for every other symbol. The ONE place that reads the book's field.
 */
export const coinValue = (rawSymbol: RawSymbol) =>
	rawSymbol.name === 'C' ? rawSymbol.multiplier : undefined;

// Objects that spill over their cell (the Collect plate, the pot symbols) and the
// thieves' heads sort above the plain tiles; a Coin's value is never under a neighbour.
const Z_INDEX: Partial<Record<RawSymbol['name'], number>> = { CL: 2, C: 2, P1: 1, P2: 1, P3: 1, W: 1 };
export const getSymbolZIndex = ({ rawSymbol }: { rawSymbol: RawSymbol }) => Z_INDEX[rawSymbol.name] ?? 0;
