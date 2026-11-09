import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { BOARD_DIMENSIONS } from './constants';
import type { Position } from './types';
import type { BookEvent, CashCellValue } from './typesBookEvent';
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
export type CashCell = Position & {
	kind: CashOccupantKind | null;
	/** a coin's shown value, x bet (counts up) */
	value: Tween<number>;
	/** a coin's colour: 0 = gold, 1 = purple, once a multiplier frame applied to it (Evtim, 2026-11-04) */
	purple: Tween<number>;
	pop: Tween<number>;
	/** the bomb's self-destruct / the cloner's cast, played over the cell (CashRespinFx) */
	rig: 'explode' | 'cast' | null;
	onrig: () => void;
	/** the multiplier frame under the cell, 0 = none (the book's value) */
	frame: number;
	/** the frame's value as drawn (counts up when a multiplier joins it) */
	frameShown: Tween<number>;
	frameAlpha: Tween<number>;
	framePop: Tween<number>;
	/** a multiplier that landed this respin (shown at full strength until it joins the frame) */
	landed: number;
	/**
	 * a multiplier landed on a frame: 0 = the frame alone, centred; 1 = both on
	 * show, the new one above, the frame below (Evtim: the new x2 covered the x10)
	 */
	stack: Tween<number>;
	/** the new multiplier dropping into the frame below it (0 -> 1), and its fade */
	landedDrop: Tween<number>;
	landedAlpha: Tween<number>;
	/**
	 * the frame under a coin / bomb / cloner, not yet applied: a small purple
	 * badge in the cell's corner; `badgeFly` 0 -> 1 throws it into the coin
	 */
	badge: boolean;
	badgeFly: Tween<number>;
	spin: { items: CashSpinItem[]; p: Tween<number> } | null;
};
// a bomb's value ("2x") thrown onto a coin around it, board-local
export type CashFlight = { id: number; text: string; x: Tween<number>; y: Tween<number>; alpha: Tween<number> };
// the bomb's 3x3, clipped to the grid (book positions: rows 1-5)
export type CashArea = { reel0: number; reel1: number; row0: number; row1: number; alpha: Tween<number> };

const makeCell = (reel: number, row: number): CashCell => ({
	reel,
	row,
	kind: null,
	value: new Tween(0),
	purple: new Tween(0),
	pop: new Tween(1),
	rig: null,
	onrig: () => {},
	frame: 0,
	frameShown: new Tween(0),
	frameAlpha: new Tween(FRAME_DIM),
	framePop: new Tween(1),
	landed: 0,
	stack: new Tween(0),
	landedDrop: new Tween(0),
	landedAlpha: new Tween(1),
	badge: false,
	badgeFly: new Tween(0),
	spin: null,
});

export const emptyCashGrid = () =>
	_.range(BOARD_DIMENSIONS.x).flatMap((reel) =>
		_.range(1, BOARD_DIMENSIONS.y + 1).map((row) => makeCell(reel, row)),
	);

export const cashGrid = $state({
	show: false,
	cells: emptyCashGrid(),
	flights: [] as CashFlight[],
	/**
	 * a bomb / cloner acting: the cells it touches (getCellKey) stay lit, every
	 * other cell dims by `dim` (0 -> 1), so the eye follows the action
	 */
	focus: null as string[] | null,
	dim: new Tween(0),
	/** the acting bomb's 3x3, glowing under the coins it boosts */
	area: null as CashArea | null,
});

/** the cell at a book position (rows 1-5) */
export const cashCellAt = (position: Position) =>
	cashGrid.cells[position.reel * BOARD_DIMENSIONS.y + (position.row - 1)];

/** a cell as a resumed round finds it: its frame, and the coin on it */
export type CashCellSnapshot = Position & {
	frame: number;
	coin: { value: number; purple: boolean } | null;
};

/**
 * The grid as these book events leave it: every frame, and every coin with its
 * value and colour (purple once a frame multiplied it; a bomb's add keeps the
 * colour), the same outcome the cashBoard* animations reach. A resumed round
 * rebuilds its board from the respins it already played (createBonusSnapshot);
 * its cursor is always the first event of a respin or the collect, so every
 * respin in here is complete.
 */
export const cashGridAfter = (bookEvents: BookEvent[]): CashCellSnapshot[] => {
	const cells = new Map<string, CashCellSnapshot>();
	const at = (position: Position) => {
		const key = `${position.reel}-${position.row}`;
		let cell = cells.get(key);
		if (!cell) {
			cell = { reel: position.reel, row: position.row, frame: 0, coin: null };
			cells.set(key, cell);
		}
		return cell;
	};
	// a coin as a multiply / cloner / bomb leaves it: its total, purple if framed
	const settle = (coin: CashCellValue) => {
		const cell = at(coin);
		if (coin.frame > 0) cell.frame = coin.frame;
		cell.coin = { value: coin.total, purple: coin.frame > 0 };
	};
	for (const bookEvent of bookEvents) {
		switch (bookEvent.type) {
			case 'cashRespinStart':
				cells.clear();
				for (const frame of bookEvent.frames) at(frame).frame = frame.multiplier;
				break;
			case 'cashRespinLand':
				for (const coin of bookEvent.coins) at(coin).coin = { value: coin.value, purple: false };
				break;
			case 'cashMultiplierFrames':
				for (const mult of bookEvent.multipliers) at(mult).frame = mult.frame;
				break;
			case 'cashCoinsMultiply':
				bookEvent.coins.forEach(settle);
				break;
			case 'cashClonerActivate':
				bookEvent.coins.forEach(settle);
				settle(bookEvent.cloner);
				break;
			case 'cashBombActivate':
				settle(bookEvent.bomb);
				for (const boosted of bookEvent.boosted) {
					const coin = at(boosted).coin;
					if (coin) coin.value = boosted.total;
				}
				break;
		}
	}
	return [...cells.values()];
};
