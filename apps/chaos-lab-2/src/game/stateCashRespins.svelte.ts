import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { BOARD_DIMENSIONS } from './constants';
import type { Position } from './types';
import type { CashSpinItem } from '../components/CashCellSpin.svelte';

/**
 * Chaos Lab 2's Cash Respins grid, shared by the two layers that draw it:
 * CashRespinBoard (under the pipe frame: tiles, frames, spins, coins) and
 * CashRespinFx (over it, like the base game's tumble layer: the bomb's blast,
 * the cloner's cast, the values thrown between cells), so nothing that spills
 * out of a cell is cut by a neighbour or the frame. CashRespinBoard runs it.
 */

// a frame waiting for a coin (Evtim: "it loses opacity")
export const FRAME_DIM = 0.4;

export type CashOccupantKind = 'coin' | 'cloner' | 'bomb';
export type CashFx = { text: string; alpha: Tween<number>; scale: Tween<number> };
export type CashCell = Position & {
	kind: CashOccupantKind | null;
	/** a coin's shown value, x bet (counts up) */
	value: Tween<number>;
	pop: Tween<number>;
	/** the bomb's self-destruct / the cloner's cast, played over the cell (CashRespinFx) */
	rig: 'explode' | 'cast' | null;
	onrig: () => void;
	/** the multiplier frame under the cell, 0 = none */
	frame: number;
	frameAlpha: Tween<number>;
	framePop: Tween<number>;
	/** a multiplier that landed this respin (shown at full strength until it joins the frame) */
	landed: number;
	spin: { items: CashSpinItem[]; p: Tween<number> } | null;
	/** the frame's value rising out of the cell into its coin */
	fx: CashFx | null;
};
// a bomb's value ("x2") thrown onto a coin around it, board-local
export type CashFlight = { id: number; text: string; x: Tween<number>; y: Tween<number>; alpha: Tween<number> };

const makeCell = (reel: number, row: number): CashCell => ({
	reel,
	row,
	kind: null,
	value: new Tween(0),
	pop: new Tween(1),
	rig: null,
	onrig: () => {},
	frame: 0,
	frameAlpha: new Tween(FRAME_DIM),
	framePop: new Tween(1),
	landed: 0,
	spin: null,
	fx: null,
});

export const emptyCashGrid = () =>
	_.range(BOARD_DIMENSIONS.x).flatMap((reel) =>
		_.range(1, BOARD_DIMENSIONS.y + 1).map((row) => makeCell(reel, row)),
	);

export const cashGrid = $state({
	show: false,
	cells: emptyCashGrid(),
	flights: [] as CashFlight[],
});

/** the cell at a book position (rows 1-5) */
export const cashCellAt = (position: Position) =>
	cashGrid.cells[position.reel * BOARD_DIMENSIONS.y + (position.row - 1)];
