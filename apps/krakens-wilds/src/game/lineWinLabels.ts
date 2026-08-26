import config from './config';
import type { BookEventOfType } from './typesBookEvent';
import type { Position, RawSymbol } from './types';

type Win = BookEventOfType<'winInfo'>['wins'][number];

/** A single amount plate: one cell, one figure. Rows are BOOK rows (padding included). */
export type LineWinLabel = Position & { amount: number };

/**
 * The symbols a plate may not sit on: W, S and C — the only three config gives
 * `special_properties` (wild / scatter / coin). They are the ones with bespoke
 * presentations to cover up (the wild's drop and idle, the scatter's win, the
 * coin's flip and its own value text), so the paying high/low symbols carry the
 * amounts instead. Derived from the config rather than a hardcoded list, so a
 * new special is covered the moment it is declared there.
 */
const SPECIAL_SYMBOLS = new Set<string>(
	Object.entries(config.symbols)
		.filter(([, symbol]) => 'special_properties' in symbol)
		.map(([name]) => name),
);

/**
 * Which of a winning line's symbols carries its payout.
 *
 * Only ONE line is ever labelled at a time — the plates belong to finalWin's
 * per-line cycle and nothing else (showing every line's amount at once, during
 * the simultaneous beat, read as clutter on a spin that hit several lines). So
 * there is no cell contention to resolve: each line simply takes the rightmost
 * cell it is allowed. An earlier version ran a bipartite matching to hand every
 * line a distinct cell; that only existed to stop plates colliding, which cannot
 * happen with one on screen.
 *
 * Rightmost because that is where the winning run ends, and because it is the
 * furthest from the reel-0 symbol every line shares. Specials are skipped, so a
 * wild-substituted line labels its paying symbol; a line made ENTIRELY of
 * specials (an all-wild win, a real paying combination) falls back to its
 * rightmost cell rather than going unlabelled.
 *
 * Returns undefined only for a win with no positions, which the caller treats as
 * "no plate this beat".
 */
export const lineWinLabelCell = (win: Win, board: RawSymbol[][]): Position | undefined => {
	const cells = [...win.positions].sort((a, b) => b.reel - a.reel);
	const isPlain = (cell: Position) => {
		const name = board[cell.reel]?.[cell.row]?.name;
		return name !== undefined && !SPECIAL_SYMBOLS.has(name);
	};
	return cells.find(isPlain) ?? cells[0];
};
