import _ from 'lodash';
import { stateBet } from 'state-shared';
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
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { Position, RawSymbol, SymbolState } from './types';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });
export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
	// scatters run their pending loop while the book plays (ReelSymbol/TumbleSymbol)
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
	'updateGlobalMult',
	'freeSpinTrigger',
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

// other utils
export const getSymbolX = (reelIndex: number) => SYMBOL_WIDTH * (reelIndex + REEL_PADDING);
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

// stateGame.cloneFx key. Book positions index the PADDED reel (rows 1..5 are the
// visible cells, like every other position in the book), so the reel board's
// symbols array index is the row itself.
export const getCloneFxKey = (position: Position) => `${position.reel}-${position.row}`;

// the multiplier's value is drawn at runtime, so one 'M' entry serves every value
export const getSymbolKey = ({ rawSymbol }: { rawSymbol: RawSymbol }) =>
	rawSymbol.name as keyof typeof SYMBOL_INFO_MAP;

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
