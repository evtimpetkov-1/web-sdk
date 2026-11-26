// MADE UP BY THE FRONT END (2026-11-24), NOT MATH. There is no math for 3 Pots Heist
// yet: these rounds only let the game be seen playing (tools/stake-review/play.mjs
// --books, the stories). The shape is the math SDK's standard ways book; the boards,
// wins and amounts are invented and follow no paytable. Coin values use the SDK's
// `multiplier` attribute, which is an assumption. Replace with real books when they exist.
// Each reel = [top padding, rows 1-4, bottom padding]; positions index that padded reel.
// The array below must stay a plain literal: the review tools evaluate it as it stands.
export default [
	{
		id: 1,
		payoutMultiplier: 0,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'H5' }, { name: 'L3' }],
					[{ name: 'H1' }, { name: 'L2' }, { name: 'C', multiplier: 2 }, { name: 'H4' }, { name: 'L5' }, { name: 'L1' }],
					[{ name: 'L4' }, { name: 'P1' }, { name: 'L3' }, { name: 'H2' }, { name: 'L2' }, { name: 'H5' }],
					[{ name: 'L5' }, { name: 'L1' }, { name: 'H1' }, { name: 'C', multiplier: 10 }, { name: 'L4' }, { name: 'H2' }],
					[{ name: 'H3' }, { name: 'L5' }, { name: 'W' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' }],
					[{ name: 'L1' }, { name: 'H2' }, { name: 'L2' }, { name: 'P3' }, { name: 'L5' }, { name: 'H1' }],
				],
				paddingPositions: [3, 11, 20, 7, 31, 14],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0, 0],
			},
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
	},
	{
		id: 2,
		payoutMultiplier: 3.2,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L3' }, { name: 'H1' }, { name: 'L1' }, { name: 'H1' }, { name: 'L4' }, { name: 'L2' }],
					[{ name: 'L5' }, { name: 'L1' }, { name: 'H1' }, { name: 'C', multiplier: 5 }, { name: 'L2' }, { name: 'H3' }],
					[{ name: 'H4' }, { name: 'W' }, { name: 'L3' }, { name: 'L1' }, { name: 'P1' }, { name: 'L5' }],
					[{ name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H5' }, { name: 'L3' }],
					[{ name: 'H2' }, { name: 'L5' }, { name: 'H3' }, { name: 'P2' }, { name: 'L2' }, { name: 'L4' }],
					[{ name: 'L1' }, { name: 'H4' }, { name: 'L3' }, { name: 'L5' }, { name: 'C', multiplier: 2 }, { name: 'H2' }],
				],
				paddingPositions: [9, 2, 27, 18, 5, 33],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 320,
				wins: [
					{
						symbol: 'H1',
						kind: 3,
						win: 200,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 0, row: 3 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 1 },
						],
						meta: { ways: 2, globalMult: 1, winWithoutMult: 200, symbolMult: 0 },
					},
					{
						symbol: 'L1',
						kind: 4,
						win: 120,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 1 },
							{ reel: 2, row: 1 },
							{ reel: 2, row: 3 },
							{ reel: 3, row: 2 },
						],
						meta: { ways: 2, globalMult: 1, winWithoutMult: 120, symbolMult: 0 },
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 320, winLevel: 3 },
			{ index: 3, type: 'setTotalWin', amount: 320 },
			{ index: 4, type: 'finalWin', amount: 320 },
		],
	},
	{
		id: 3,
		payoutMultiplier: 14.5,
		events: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L1' }, { name: 'H2' }, { name: 'H5' }, { name: 'H3' }, { name: 'H4' }, { name: 'L5' }],
					[{ name: 'H1' }, { name: 'H3' }, { name: 'H2' }, { name: 'H5' }, { name: 'L2' }, { name: 'L4' }],
					[{ name: 'L3' }, { name: 'H5' }, { name: 'W' }, { name: 'H4' }, { name: 'H3' }, { name: 'L1' }],
					[{ name: 'L4' }, { name: 'L1' }, { name: 'H2' }, { name: 'H5' }, { name: 'H3' }, { name: 'H1' }],
					[{ name: 'H4' }, { name: 'H3' }, { name: 'L3' }, { name: 'H2' }, { name: 'H5' }, { name: 'L2' }],
					[{ name: 'L5' }, { name: 'H5' }, { name: 'L4' }, { name: 'H1' }, { name: 'H2' }, { name: 'L3' }],
				],
				paddingPositions: [22, 30, 4, 12, 16, 8],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 1450,
				wins: [
					{
						symbol: 'H5',
						kind: 6,
						win: 800,
						positions: [
							{ reel: 0, row: 2 },
							{ reel: 1, row: 3 },
							{ reel: 2, row: 1 },
							{ reel: 2, row: 2 },
							{ reel: 3, row: 3 },
							{ reel: 4, row: 4 },
							{ reel: 5, row: 1 },
						],
						meta: { ways: 2, globalMult: 1, winWithoutMult: 800, symbolMult: 0 },
					},
					{
						symbol: 'H2',
						kind: 6,
						win: 400,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 2 },
							{ reel: 3, row: 2 },
							{ reel: 4, row: 3 },
							{ reel: 5, row: 4 },
						],
						meta: { ways: 1, globalMult: 1, winWithoutMult: 400, symbolMult: 0 },
					},
					{
						symbol: 'H3',
						kind: 5,
						win: 250,
						positions: [
							{ reel: 0, row: 3 },
							{ reel: 1, row: 1 },
							{ reel: 2, row: 2 },
							{ reel: 2, row: 4 },
							{ reel: 3, row: 4 },
							{ reel: 4, row: 1 },
						],
						meta: { ways: 2, globalMult: 1, winWithoutMult: 250, symbolMult: 0 },
					},
				],
			},
			{ index: 2, type: 'setWin', amount: 1450, winLevel: 5 },
			{ index: 3, type: 'setTotalWin', amount: 1450 },
			{ index: 4, type: 'finalWin', amount: 1450 },
		],
	},
];
