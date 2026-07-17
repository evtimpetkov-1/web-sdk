/**
 * Dev mode books — small-scale math output in the real book format.
 * Used when no RGS is connected (dev mode).
 *
 * Board format: board[reel][symbolIndex] where:
 *   symbolIndex 0 = padding above viewport
 *   symbolIndex 1 = visible row 0 (top)
 *   symbolIndex 2 = visible row 1 (middle)
 *   symbolIndex 3 = visible row 2 (bottom)
 *   symbolIndex 4 = padding below viewport
 *
 * Paylines use visible row indices (0-2).
 * Position.row in winInfo = visible row + 1 (index into the 5-symbol array).
 *
 * Win amounts are in bet units (betAmount * paytable multiplier * 100).
 * A bet of 1.00 = 100 units. payoutMultiplier = totalWinAmount / 100.
 */

import type { BookEvent } from './typesBookEvent';

type DevBook = {
	id: number;
	payoutMultiplier: number;
	events: BookEvent[];
	criteria: string;
	baseGameWins: number;
	freeGameWins: number;
};

// Helper: create a reel array [paddingTop, row0, row1, row2, paddingBottom]
type S = { name: string; wild?: boolean; scatter?: boolean };
const r = (top: S, r0: S, r1: S, r2: S, bot: S): S[] => [top, r0, r1, r2, bot];
const s = (name: string): S => ({ name });
const w = (): S => ({ name: 'W', wild: true });
const sc = (): S => ({ name: 'S', scatter: true });

const devBooks: DevBook[] = [
	// ─── Book 1: No win ───
	{
		id: 1,
		payoutMultiplier: 0.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					//         pad    row0     row1     row2     pad
					r(s('L2'), s('H1'), s('L3'), s('H4'), s('L1')),
					r(s('H3'), s('L4'), s('H2'), s('L1'), s('H4')),
					r(s('L1'), s('H3'), s('L4'), s('H1'), s('L2')),
					r(s('H4'), s('L2'), s('H3'), s('L3'), s('H2')),
					r(s('L3'), s('H2'), s('L1'), s('L4'), s('H3')),
				],
				paddingPositions: [12, 45, 78, 102, 150],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
		criteria: '0',
		baseGameWins: 0.0,
		freeGameWins: 0.0,
	},

	// ─── Book 2: No win ───
	{
		id: 2,
		payoutMultiplier: 0.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('H1'), s('L3'), s('H4'), s('L2'), s('H2')),
					r(s('L4'), s('H1'), s('L2'), s('H3'), s('L1')),
					r(s('H2'), s('L1'), s('H3'), s('L4'), s('H4')),
					r(s('L3'), s('H2'), s('L1'), s('H4'), s('L2')),
					r(s('H3'), s('L4'), s('H2'), s('L1'), s('L3')),
				],
				paddingPositions: [30, 88, 145, 67, 200],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
		criteria: '0',
		baseGameWins: 0.0,
		freeGameWins: 0.0,
	},

	// ─── Book 3: No win ───
	{
		id: 3,
		payoutMultiplier: 0.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('L1'), s('H4'), s('L3'), s('H2'), s('L4')),
					r(s('H3'), s('L2'), s('H1'), s('L4'), s('H3')),
					r(s('H2'), s('L1'), s('L4'), s('H1'), s('L2')),
					r(s('L4'), s('H3'), s('L2'), s('L3'), s('H4')),
					r(s('L3'), s('H2'), s('H4'), s('L1'), s('H1')),
				],
				paddingPositions: [55, 110, 22, 180, 90],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
		criteria: '0',
		baseGameWins: 0.0,
		freeGameWins: 0.0,
	},

	// ─── Book 4: No win ───
	{
		id: 4,
		payoutMultiplier: 0.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('H4'), s('L3'), s('H2'), s('L1'), s('L4')),
					r(s('L2'), s('H1'), s('L4'), s('H3'), s('H2')),
					r(s('L1'), s('H4'), s('L3'), s('L2'), s('H3')),
					r(s('H1'), s('L2'), s('H3'), s('H4'), s('L1')),
					r(s('L3'), s('L4'), s('H1'), s('L3'), s('H4')),
				],
				paddingPositions: [99, 33, 160, 15, 130],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
		criteria: '0',
		baseGameWins: 0.0,
		freeGameWins: 0.0,
	},

	// ─── Book 5: No win ───
	{
		id: 5,
		payoutMultiplier: 0.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('L3'), s('H2'), s('L1'), s('H4'), s('L2')),
					r(s('H1'), s('L4'), s('H3'), s('L1'), s('H2')),
					r(s('H4'), s('L2'), s('L4'), s('H3'), s('L1')),
					r(s('L2'), s('H3'), s('H1'), s('L4'), s('H4')),
					r(s('H2'), s('L1'), s('L3'), s('H1'), s('L3')),
				],
				paddingPositions: [77, 140, 50, 190, 25],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
		criteria: '0',
		baseGameWins: 0.0,
		freeGameWins: 0.0,
	},

	// ─── Book 6: Small win — 3x L4 on line 1 = 0.2x ───
	// Line 1: [0,0,0,0,0] → visible row 0 = board index 1
	// Reels 0,1,2 have L4 at index 1
	{
		id: 6,
		payoutMultiplier: 0.2,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					//         pad    row0=L4  row1     row2     pad
					r(s('H3'), s('L4'), s('H1'), s('L2'), s('L1')),
					r(s('L1'), s('L4'), s('H3'), s('H4'), s('H2')),
					r(s('H2'), s('L4'), s('L1'), s('H3'), s('L3')),
					r(s('L4'), s('H2'), s('L3'), s('H1'), s('H4')),
					r(s('H1'), s('L1'), s('H4'), s('L3'), s('L2')),
				],
				paddingPositions: [20, 60, 100, 140, 180],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 20,
				wins: [
					{
						symbol: 'L4',
						kind: 3,
						win: 20,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 1, row: 1 },
							{ reel: 2, row: 1 },
						],
						meta: {
							lineIndex: 1,
							multiplier: 1,
							winWithoutMult: 20,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 20, winLevel: 2 },
			{ index: 3, type: 'setTotalWin', amount: 20 },
			{ index: 4, type: 'finalWin', amount: 20 },
		],
		criteria: 'basegame',
		baseGameWins: 0.2,
		freeGameWins: 0.0,
	},

	// ─── Book 7: Small win — 3x L1 on line 2 = 0.5x ───
	// Line 2: [1,1,1,1,1] → visible row 1 = board index 2
	{
		id: 7,
		payoutMultiplier: 0.5,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('H3'), s('L4'), s('L1'), s('H2'), s('L3')),
					r(s('L2'), s('H4'), s('L1'), s('L3'), s('H1')),
					r(s('H1'), s('H2'), s('L1'), s('L4'), s('H3')),
					r(s('L4'), s('L3'), s('H3'), s('H1'), s('L2')),
					r(s('H4'), s('H1'), s('L4'), s('L2'), s('H2')),
				],
				paddingPositions: [35, 72, 115, 155, 195],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 50,
				wins: [
					{
						symbol: 'L1',
						kind: 3,
						win: 50,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 2 },
						],
						meta: {
							lineIndex: 2,
							multiplier: 1,
							winWithoutMult: 50,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 50, winLevel: 2 },
			{ index: 3, type: 'setTotalWin', amount: 50 },
			{ index: 4, type: 'finalWin', amount: 50 },
		],
		criteria: 'basegame',
		baseGameWins: 0.5,
		freeGameWins: 0.0,
	},

	// ─── Book 8: Small win — 3x H4 on line 3 = 1.0x ───
	// Line 3: [2,2,2,2,2] → visible row 2 = board index 3
	{
		id: 8,
		payoutMultiplier: 1.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('L3'), s('H2'), s('L1'), s('H4'), s('L2')),
					r(s('H1'), s('L4'), s('H3'), s('H4'), s('L3')),
					r(s('L2'), s('H3'), s('L4'), s('H4'), s('H1')),
					r(s('H4'), s('L1'), s('H2'), s('L3'), s('L4')),
					r(s('L4'), s('H1'), s('L3'), s('H1'), s('H3')),
				],
				paddingPositions: [42, 88, 130, 175, 210],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 100,
				wins: [
					{
						symbol: 'H4',
						kind: 3,
						win: 100,
						positions: [
							{ reel: 0, row: 3 },
							{ reel: 1, row: 3 },
							{ reel: 2, row: 3 },
						],
						meta: {
							lineIndex: 3,
							multiplier: 1,
							winWithoutMult: 100,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 100, winLevel: 2 },
			{ index: 3, type: 'setTotalWin', amount: 100 },
			{ index: 4, type: 'finalWin', amount: 100 },
		],
		criteria: 'basegame',
		baseGameWins: 1.0,
		freeGameWins: 0.0,
	},

	// ─── Book 9: Medium win — 4x L1 on line 2 = 1.0x ───
	// Line 2: [1,1,1,1,1] → board index 2
	{
		id: 9,
		payoutMultiplier: 1.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('H2'), s('L3'), s('L1'), s('H3'), s('L4')),
					r(s('L4'), s('H1'), s('L1'), s('L2'), s('H2')),
					r(s('H3'), s('L4'), s('L1'), s('H4'), s('L3')),
					r(s('L2'), s('H4'), s('L1'), s('H1'), s('H3')),
					r(s('H1'), s('L2'), s('H4'), s('L3'), s('L1')),
				],
				paddingPositions: [15, 50, 95, 135, 170],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 100,
				wins: [
					{
						symbol: 'L1',
						kind: 4,
						win: 100,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 2 },
							{ reel: 3, row: 2 },
						],
						meta: {
							lineIndex: 2,
							multiplier: 1,
							winWithoutMult: 100,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 100, winLevel: 3 },
			{ index: 3, type: 'setTotalWin', amount: 100 },
			{ index: 4, type: 'finalWin', amount: 100 },
		],
		criteria: 'basegame',
		baseGameWins: 1.0,
		freeGameWins: 0.0,
	},

	// ─── Book 10: Multi-line win — 3x H3 on line 1 + 3x L3 on line 3 = 2.3x ───
	// Line 1: row 0 → index 1: H3, H3, H3
	// Line 3: row 2 → index 3: L3, L3, L3
	{
		id: 10,
		payoutMultiplier: 2.3,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					//         pad    row0=H3  row1     row2=L3  pad
					r(s('L1'), s('H3'), s('L4'), s('L3'), s('H2')),
					r(s('H2'), s('H3'), s('H1'), s('L3'), s('L4')),
					r(s('L4'), s('H3'), s('H2'), s('L3'), s('H1')),
					r(s('H4'), s('L1'), s('L2'), s('H4'), s('L2')),
					r(s('L2'), s('L4'), s('H4'), s('H1'), s('H3')),
				],
				paddingPositions: [8, 42, 80, 120, 160],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 230,
				wins: [
					{
						symbol: 'H3',
						kind: 3,
						win: 200,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 1, row: 1 },
							{ reel: 2, row: 1 },
						],
						meta: {
							lineIndex: 1,
							multiplier: 1,
							winWithoutMult: 200,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
					{
						symbol: 'L3',
						kind: 3,
						win: 30,
						positions: [
							{ reel: 0, row: 3 },
							{ reel: 1, row: 3 },
							{ reel: 2, row: 3 },
						],
						meta: {
							lineIndex: 3,
							multiplier: 1,
							winWithoutMult: 30,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 230, winLevel: 3 },
			{ index: 3, type: 'setTotalWin', amount: 230 },
			{ index: 4, type: 'finalWin', amount: 230 },
		],
		criteria: 'basegame',
		baseGameWins: 2.3,
		freeGameWins: 0.0,
	},

	// ─── Book 11: Wild win — W subs for H2 on line 4 = 3.0x ───
	// Line 4: [0,1,2,1,0] → indices: (0,1),(1,2),(2,3),(3,2),(4,1)
	// W at (0,1), H2 at (1,2), H2 at (2,3) → 3x H2 = 3.0x
	{
		id: 11,
		payoutMultiplier: 3.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					//         pad    row0=W   row1     row2     pad
					r(s('L2'),     w(), s('H3'), s('L1'), s('H4')),
					r(s('H1'), s('L3'), s('H2'), s('L4'), s('L2')),
					r(s('L4'), s('H1'), s('L3'), s('H2'), s('H3')),
					r(s('H3'), s('L4'), s('H1'), s('L2'), s('L1')),
					r(s('L1'), s('H4'), s('L2'), s('H3'), s('L3')),
				],
				paddingPositions: [65, 120, 48, 190, 85],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 300,
				wins: [
					{
						symbol: 'H2',
						kind: 3,
						win: 300,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 3 },
						],
						meta: {
							lineIndex: 4,
							multiplier: 1,
							winWithoutMult: 300,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 300, winLevel: 3 },
			{ index: 3, type: 'setTotalWin', amount: 300 },
			{ index: 4, type: 'finalWin', amount: 300 },
		],
		criteria: 'basegame',
		baseGameWins: 3.0,
		freeGameWins: 0.0,
	},

	// ─── Book 12: 5x L1 on line 2 = 5.0x ───
	// Line 2: [1,1,1,1,1] → index 2
	{
		id: 12,
		payoutMultiplier: 5.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('H4'), s('L3'), s('L1'), s('H2'), s('L4')),
					r(s('L2'), s('H3'), s('L1'), s('L4'), s('H1')),
					r(s('H1'), s('H4'), s('L1'), s('L3'), s('H2')),
					r(s('L3'), s('L2'), s('L1'), s('H4'), s('H3')),
					r(s('H2'), s('H1'), s('L1'), s('L2'), s('L3')),
				],
				paddingPositions: [105, 35, 165, 80, 215],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 500,
				wins: [
					{
						symbol: 'L1',
						kind: 5,
						win: 500,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 2 },
							{ reel: 3, row: 2 },
							{ reel: 4, row: 2 },
						],
						meta: {
							lineIndex: 2,
							multiplier: 1,
							winWithoutMult: 500,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 500, winLevel: 4 },
			{ index: 3, type: 'setTotalWin', amount: 500 },
			{ index: 4, type: 'finalWin', amount: 500 },
		],
		criteria: 'basegame',
		baseGameWins: 5.0,
		freeGameWins: 0.0,
	},

	// ─── Book 13: 4x H1 with Wild on line 1 = 10.0x ───
	// Line 1: [0,0,0,0,0] → index 1
	// W at (0,1), H1 at (1,1),(2,1),(3,1) → 4x H1 = 10.0x
	{
		id: 13,
		payoutMultiplier: 10.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('L2'),     w(), s('L4'), s('H3'), s('H2')),
					r(s('L3'), s('H1'), s('H2'), s('L1'), s('L4')),
					r(s('H4'), s('H1'), s('L3'), s('L2'), s('H3')),
					r(s('L1'), s('H1'), s('H4'), s('L3'), s('L2')),
					r(s('H3'), s('L3'), s('H2'), s('L4'), s('H4')),
				],
				paddingPositions: [50, 100, 150, 200, 30],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 1000,
				wins: [
					{
						symbol: 'H1',
						kind: 4,
						win: 1000,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 1, row: 1 },
							{ reel: 2, row: 1 },
							{ reel: 3, row: 1 },
						],
						meta: {
							lineIndex: 1,
							multiplier: 1,
							winWithoutMult: 1000,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 1000, winLevel: 5 },
			{ index: 3, type: 'setTotalWin', amount: 1000 },
			{ index: 4, type: 'finalWin', amount: 1000 },
		],
		criteria: 'basegame',
		baseGameWins: 10.0,
		freeGameWins: 0.0,
	},

	// ─── Book 14: Free spins trigger — 3 scatters ───
	// Scatters at reel 0 row 1 (idx 2), reel 2 row 0 (idx 1), reel 4 row 2 (idx 3)
	// Anticipation: after 2nd scatter (reel 2), reels 3,4 get anticipation
	{
		id: 14,
		payoutMultiplier: 5.3,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('H3'), s('L4'),    sc(), s('L1'), s('H2')),
					r(s('L2'), s('H2'), s('L3'), s('H4'), s('L1')),
					r(s('L1'),    sc(), s('H4'), s('H1'), s('H3')),
					r(s('H4'), s('L3'), s('H1'), s('L2'), s('L4')),
					r(s('L3'), s('H1'), s('L4'),    sc(), s('H2')),
				],
				paddingPositions: [25, 70, 110, 155, 195],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 1, 2],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{
				index: 2,
				type: 'freeSpinTrigger',
				totalFs: 8,
				positions: [
					{ reel: 0, row: 2 },
					{ reel: 2, row: 1 },
					{ reel: 4, row: 3 },
				],
			},
			{ index: 3, type: 'updateFreeSpin', amount: 0, total: 8 },
			// FS spin 1: no win
			{
				index: 4,
				type: 'reveal',
				board: [
					r(s('L3'), s('H4'), s('L1'), s('H2'), s('L4')),
					r(s('H1'), s('L2'), s('H3'), s('L3'), s('H4')),
					r(s('L2'), s('H1'), s('L4'), s('H3'), s('L1')),
					r(s('H4'), s('L3'), s('H2'), s('L1'), s('H2')),
					r(s('L1'), s('H3'), s('L2'), s('L4'), s('L3')),
				],
				paddingPositions: [140, 55, 175, 20, 90],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 5, type: 'setTotalWin', amount: 0 },
			{ index: 6, type: 'updateFreeSpin', amount: 1, total: 8 },
			// FS spin 2: wild lands, 3x H3 on line 2 (index 2)
			{
				index: 7,
				type: 'reveal',
				board: [
					r(s('L4'), s('H2'),     w(), s('L1'), s('H3')),
					r(s('H1'), s('L3'), s('H3'), s('L4'), s('L2')),
					r(s('L3'), s('H1'), s('H3'), s('L2'), s('H4')),
					r(s('H2'), s('L1'), s('L4'), s('H3'), s('L3')),
					r(s('L2'), s('H4'), s('L1'), s('H2'), s('L4')),
				],
				paddingPositions: [80, 130, 45, 185, 60],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 8,
				type: 'winInfo',
				totalWin: 200,
				wins: [
					{
						symbol: 'H3',
						kind: 3,
						win: 200,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 2 },
						],
						meta: {
							lineIndex: 2,
							multiplier: 1,
							winWithoutMult: 200,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 9, type: 'setWin', amount: 200, winLevel: 2 },
			{ index: 10, type: 'setTotalWin', amount: 200 },
			{ index: 11, type: 'updateFreeSpin', amount: 2, total: 8 },
			// FS spin 3: no win
			{
				index: 12,
				type: 'reveal',
				board: [
					r(s('H2'), s('L1'), s('L3'), s('H4'), s('L2')),
					r(s('L4'), s('H3'), s('H1'), s('L2'), s('H3')),
					r(s('L1'), s('H4'), s('L2'), s('H1'), s('L4')),
					r(s('H3'), s('L2'), s('H4'), s('L3'), s('H2')),
					r(s('L2'), s('L3'), s('H2'), s('H3'), s('L1')),
				],
				paddingPositions: [170, 95, 30, 205, 120],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 13, type: 'setTotalWin', amount: 200 },
			{ index: 14, type: 'updateFreeSpin', amount: 3, total: 8 },
			// FS spin 4: no win
			{
				index: 15,
				type: 'reveal',
				board: [
					r(s('L2'), s('H3'), s('H1'), s('L4'), s('H2')),
					r(s('H4'), s('L1'), s('L3'), s('H3'), s('L4')),
					r(s('H1'), s('L4'), s('H2'), s('L1'), s('H3')),
					r(s('L3'), s('H2'), s('L1'), s('L2'), s('L1')),
					r(s('H4'), s('L3'), s('L4'), s('H4'), s('H1')),
				],
				paddingPositions: [40, 80, 160, 100, 200],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 16, type: 'setTotalWin', amount: 200 },
			{ index: 17, type: 'updateFreeSpin', amount: 4, total: 8 },
			// FS spin 5: 3x L2 on line 1 (index 1) = 30
			{
				index: 18,
				type: 'reveal',
				board: [
					r(s('H1'), s('L2'), s('H3'), s('L4'), s('H2')),
					r(s('L3'), s('L2'), s('H1'), s('H4'), s('L1')),
					r(s('H4'), s('L2'), s('L3'), s('H2'), s('L4')),
					r(s('L1'), s('H1'), s('L4'), s('L3'), s('H3')),
					r(s('H2'), s('H4'), s('H2'), s('L1'), s('L2')),
				],
				paddingPositions: [60, 110, 35, 185, 150],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 19,
				type: 'winInfo',
				totalWin: 30,
				wins: [
					{
						symbol: 'L2',
						kind: 3,
						win: 30,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 1, row: 1 },
							{ reel: 2, row: 1 },
						],
						meta: {
							lineIndex: 1,
							multiplier: 1,
							winWithoutMult: 30,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 20, type: 'setWin', amount: 30, winLevel: 2 },
			{ index: 21, type: 'setTotalWin', amount: 230 },
			{ index: 22, type: 'updateFreeSpin', amount: 5, total: 8 },
			// FS spin 6: no win
			{
				index: 23,
				type: 'reveal',
				board: [
					r(s('H1'), s('L3'), s('H4'), s('L2'), s('H2')),
					r(s('L4'), s('H2'), s('L1'), s('H3'), s('L3')),
					r(s('H3'), s('L1'), s('L2'), s('L4'), s('H4')),
					r(s('L2'), s('H4'), s('H3'), s('H1'), s('L1')),
					r(s('L1'), s('L4'), s('H1'), s('L3'), s('H3')),
				],
				paddingPositions: [90, 150, 70, 130, 45],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 24, type: 'setTotalWin', amount: 230 },
			{ index: 25, type: 'updateFreeSpin', amount: 6, total: 8 },
			// FS spin 7: no win
			{
				index: 26,
				type: 'reveal',
				board: [
					r(s('L4'), s('H1'), s('H3'), s('L1'), s('H4')),
					r(s('H2'), s('L2'), s('L4'), s('H3'), s('L3')),
					r(s('L3'), s('H4'), s('H2'), s('L2'), s('L1')),
					r(s('H3'), s('L1'), s('L3'), s('H4'), s('H2')),
					r(s('L2'), s('L3'), s('H1'), s('L4'), s('L4')),
				],
				paddingPositions: [115, 45, 200, 70, 165],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 27, type: 'setTotalWin', amount: 230 },
			{ index: 28, type: 'updateFreeSpin', amount: 7, total: 8 },
			// FS spin 8: 3x H2 on line 3 (index 3) = 300
			{
				index: 29,
				type: 'reveal',
				board: [
					r(s('H4'), s('L1'), s('H3'), s('H2'), s('L2')),
					r(s('L3'), s('H3'), s('L2'), s('H2'), s('H4')),
					r(s('L1'), s('L4'), s('H4'), s('H2'), s('L3')),
					r(s('H2'), s('L2'), s('H1'), s('L4'), s('H3')),
					r(s('H1'), s('H4'), s('L1'), s('L3'), s('L1')),
				],
				paddingPositions: [180, 30, 95, 155, 210],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 30,
				type: 'winInfo',
				totalWin: 300,
				wins: [
					{
						symbol: 'H2',
						kind: 3,
						win: 300,
						positions: [
							{ reel: 0, row: 3 },
							{ reel: 1, row: 3 },
							{ reel: 2, row: 3 },
						],
						meta: {
							lineIndex: 3,
							multiplier: 1,
							winWithoutMult: 300,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 31, type: 'setWin', amount: 300, winLevel: 2 },
			{ index: 32, type: 'setTotalWin', amount: 530 },
			// End free spins
			{ index: 33, type: 'freeSpinEnd', amount: 530, winLevel: 4 },
			{ index: 34, type: 'finalWin', amount: 530 },
		],
		criteria: 'basegame',
		baseGameWins: 0.0,
		freeGameWins: 5.3,
	},

	// ─── Book 15: No win ───
	{
		id: 15,
		payoutMultiplier: 0.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					r(s('H2'), s('L4'), s('H3'), s('L1'), s('H1')),
					r(s('L1'), s('H3'), s('L2'), s('H4'), s('L3')),
					r(s('L3'), s('H1'), s('H4'), s('L2'), s('H2')),
					r(s('H4'), s('L2'), s('L1'), s('H3'), s('L4')),
					r(s('L2'), s('H4'), s('L3'), s('L4'), s('H3')),
				],
				paddingPositions: [145, 75, 195, 38, 115],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
		criteria: '0',
		baseGameWins: 0.0,
		freeGameWins: 0.0,
	},

	// ─── Book 16: 3x L3 on line 5 = 0.3x ───
	// Line 5: [2,1,0,1,2] → indices: (0,3),(1,2),(2,1),(3,2),(4,3)
	{
		id: 16,
		payoutMultiplier: 0.3,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					//         pad    row0     row1     row2=L3  pad
					r(s('H1'), s('H4'), s('H2'), s('L3'), s('L4')),
					r(s('L2'), s('H1'), s('L3'), s('L4'), s('H3')),
					r(s('H3'), s('L3'), s('H2'), s('H4'), s('L1')),
					r(s('L4'), s('L1'), s('H3'), s('H2'), s('L2')),
					r(s('H2'), s('H3'), s('L4'), s('L1'), s('H4')),
				],
				paddingPositions: [60, 130, 85, 200, 45],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 30,
				wins: [
					{
						symbol: 'L3',
						kind: 3,
						win: 30,
						positions: [
							{ reel: 0, row: 3 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 1 },
						],
						meta: {
							lineIndex: 5,
							multiplier: 1,
							winWithoutMult: 30,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 30, winLevel: 2 },
			{ index: 3, type: 'setTotalWin', amount: 30 },
			{ index: 4, type: 'finalWin', amount: 30 },
		],
		criteria: 'basegame',
		baseGameWins: 0.3,
		freeGameWins: 0.0,
	},
];

export default devBooks;
