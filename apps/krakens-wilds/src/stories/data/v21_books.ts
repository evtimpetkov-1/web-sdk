/**
 * Hand-authored preview books for the spec v2.1 mechanics: SYMBOL kraken
 * spins (base game + free spins) and the kraken's per-spin win multiplier.
 * Field names follow the REAL books (measured 2026-08-24):
 * `spinType: 'SYMBOL'` + `symbol`, and `globalMult` on the reveal.
 *
 * Units follow the real books: amounts are hundredths of the total bet
 * (500 = 5x), positions use PADDED rows 1..3, and win amounts already include
 * the spin multiplier (mirrored in meta.globalMult).
 */
export default [
	{
		// Base-game SYMBOL kraken spin: the kraken stamps H2 across the reels,
		// completing a 4-of-a-kind on the middle line (5x total bet).
		id: 9001,
		payoutMultiplier: 5.0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'H2' }, { name: 'L4' }, { name: 'L1' }],
					[{ name: 'H1' }, { name: 'H2' }, { name: 'H2' }, { name: 'H3' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'L1' }, { name: 'H2' }, { name: 'H4' }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'H2' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H2' }, { name: 'H1' }],
				],
				paddingPositions: [216, 205, 195, 16, 65],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
				spinType: 'SYMBOL',
				symbol: 'H2',
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 500,
				wins: [
					{
						symbol: 'H2',
						kind: 4,
						win: 500,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 2 },
							{ reel: 3, row: 2 },
						],
						meta: {
							lineIndex: 0,
							multiplier: 1,
							winWithoutMult: 500,
							globalMult: 1,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 500, winLevel: 5 },
			{ index: 3, type: 'setTotalWin', amount: 500 },
			{ index: 4, type: 'finalWin', amount: 500 },
		],
		criteria: 'basegame',
		baseGameWins: 5.0,
		freeGameWins: 0.0,
	},
	{
		// Free spins showing all three kraken forms plus the per-spin multiplier:
		// spin 1 SYMBOL stamp with x3, spin 2 WILD (no win), spin 3 COIN with x2
		// (coin values doubled by it), spins 4-6 quiet WILD spins.
		id: 9002,
		payoutMultiplier: 19.5,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'S', scatter: true }, { name: 'H2' }, { name: 'L1' }],
					[{ name: 'H1' }, { name: 'L1' }, { name: 'L2' }, { name: 'S', scatter: true }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'S', scatter: true }, { name: 'L3' }, { name: 'H4' }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H1' }, { name: 'H1' }],
				],
				paddingPositions: [216, 205, 195, 16, 65],
				gameType: 'basegame',
				anticipation: [0, 0, 1, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{
				index: 2,
				type: 'freeSpinTrigger',
				totalFs: 6,
				positions: [
					{ reel: 0, row: 2 },
					{ reel: 1, row: 3 },
					{ reel: 2, row: 1 },
				],
			},
			{ index: 3, type: 'updateFreeSpin', amount: 0, total: 6 },
			{
				index: 4,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }],
					[{ name: 'L1' }, { name: 'H1' }, { name: 'H1' }, { name: 'H3' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'L1' }, { name: 'H1' }, { name: 'H4' }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H1' }, { name: 'L2' }],
				],
				paddingPositions: [16, 25, 35, 46, 55],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
				spinType: 'SYMBOL',
				symbol: 'H1',
				globalMult: 3,
			},
			{
				index: 5,
				type: 'winInfo',
				totalWin: 750,
				wins: [
					{
						symbol: 'H1',
						kind: 3,
						win: 750,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 2 },
						],
						meta: {
							lineIndex: 0,
							multiplier: 3,
							winWithoutMult: 250,
							globalMult: 3,
							lineMultiplier: 1.0,
						},
					},
				],
			},
			{ index: 6, type: 'setWin', amount: 750, winLevel: 5 },
			{ index: 7, type: 'setTotalWin', amount: 750 },
			{ index: 8, type: 'updateFreeSpin', amount: 1, total: 6 },
			{
				index: 9,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }],
					[{ name: 'H1' }, { name: 'L1' }, { name: 'W', wild: true }, { name: 'H3' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'L1' }, { name: 'L3' }, { name: 'W', wild: true }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H1' }, { name: 'H1' }],
				],
				paddingPositions: [116, 105, 95, 116, 165],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
				spinType: 'WILD',
			},
			{ index: 10, type: 'setTotalWin', amount: 750 },
			{ index: 11, type: 'updateFreeSpin', amount: 2, total: 6 },
			{
				index: 12,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'C', coin: true, multiplier: 1 }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }],
					[{ name: 'H1' }, { name: 'L1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'L1' }, { name: 'C', coin: true, multiplier: 2 }, { name: 'H4' }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'C', coin: true, multiplier: 3 }, { name: 'H1' }, { name: 'H1' }],
				],
				paddingPositions: [16, 205, 95, 46, 165],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
				spinType: 'COIN',
				globalMult: 2,
				coinMultipliers: [
					{ reel: 0, row: 1, multiplier: 1 },
					{ reel: 2, row: 2, multiplier: 2 },
					{ reel: 4, row: 2, multiplier: 3 },
				],
			},
			{
				index: 13,
				type: 'winInfo',
				totalWin: 1200,
				wins: [
					{
						symbol: 'C',
						kind: 3,
						win: 1200,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 2, row: 2 },
							{ reel: 4, row: 2 },
						],
						meta: {
							multiplier: 2,
							winWithoutMult: 600,
							globalMult: 2,
							lineMultiplier: 1.0,
							coinMultipliers: [1, 2, 3],
						},
					},
				],
			},
			{ index: 14, type: 'setWin', amount: 1200, winLevel: 5 },
			{ index: 15, type: 'setTotalWin', amount: 1950 },
			{ index: 16, type: 'updateFreeSpin', amount: 3, total: 6 },
			{
				index: 17,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }],
					[{ name: 'H1' }, { name: 'L1' }, { name: 'W', wild: true }, { name: 'H3' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'L1' }, { name: 'L3' }, { name: 'H4' }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H1' }, { name: 'H1' }],
				],
				paddingPositions: [26, 15, 45, 36, 25],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
				spinType: 'WILD',
			},
			{ index: 18, type: 'setTotalWin', amount: 1950 },
			{ index: 19, type: 'updateFreeSpin', amount: 4, total: 6 },
			{
				index: 20,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }],
					[{ name: 'H1' }, { name: 'L1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'L1' }, { name: 'W', wild: true }, { name: 'H4' }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H1' }, { name: 'H1' }],
				],
				paddingPositions: [56, 65, 75, 86, 95],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
				spinType: 'WILD',
			},
			{ index: 21, type: 'setTotalWin', amount: 1950 },
			{ index: 22, type: 'updateFreeSpin', amount: 5, total: 6 },
			{
				index: 23,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }],
					[{ name: 'H1' }, { name: 'L1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'L1' }, { name: 'L3' }, { name: 'W', wild: true }, { name: 'L4' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L1' }],
					[{ name: 'H3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H1' }, { name: 'H1' }],
				],
				paddingPositions: [96, 85, 15, 26, 35],
				gameType: 'freegame',
				anticipation: [0, 0, 0, 0, 0],
				spinType: 'WILD',
			},
			{ index: 24, type: 'setTotalWin', amount: 1950 },
			{ index: 25, type: 'updateFreeSpin', amount: 6, total: 6 },
			{ index: 26, type: 'freeSpinEnd', amount: 1950, winLevel: 6 },
			{ index: 27, type: 'finalWin', amount: 1950 },
		],
		criteria: 'freegame',
		baseGameWins: 0.0,
		freeGameWins: 19.5,
	},
];
