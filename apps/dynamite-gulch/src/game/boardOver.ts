import { getContext, setContext } from 'svelte';

/**
 * The board's third layer: over the reel frame's timber (BoardOver.svelte). The two
 * layers of Board.svelte lie UNDER the frame, so a top-row hat is covered by the top
 * beam; what moves here stands in front of the frame (Evtim, 2026-11-26: "when symbols are
 * winning can they get over the reels frame", then "move the idle animations on top of
 * the reels frame too"; OVER_FRAME in constants.ts says what). A SymbolWrap asks which
 * layer it is being mounted in.
 */
const KEY = 'dg-board-over';

export const setBoardOver = () => setContext(KEY, true);
export const isBoardOver = () => getContext(KEY) === true;
