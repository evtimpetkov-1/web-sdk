// Chaos Lab 2 Cash Respins rounds as the RGS returned them (verbatim).
// [0] betID 340324515, SUPER_LUCKY_DRAW_FREE_SPINS (Overcharged Respins buy),
//     from Evtim's reload mid-feature (2026-11-06): opens with buyCashRespins,
//     all 30 positions framed, 7 respins, 8 coins, 139x. The reload carried no
//     `event` cursor (nothing was recorded before the fix), so the resume story
//     sets one.
export default [
	{
		"betID": 340324515,
		"amount": 1000000,
		"payout": 139000000,
		"payoutMultiplier": 139.0,
		"active": true,
		"mode": "SUPER_LUCKY_DRAW_FREE_SPINS",
		"state": [
			{
				"index": 0,
				"type": "buyCashRespins",
				"variant": 4,
				"allFrames": true
			},
			{
				"index": 1,
				"type": "cashRespinStart",
				"variant": 4,
				"respins": 3,
				"frames": [
					{
						"reel": 0,
						"row": 1,
						"multiplier": 3
					},
					{
						"reel": 0,
						"row": 2,
						"multiplier": 2
					},
					{
						"reel": 0,
						"row": 3,
						"multiplier": 3
					},
					{
						"reel": 0,
						"row": 4,
						"multiplier": 2
					},
					{
						"reel": 0,
						"row": 5,
						"multiplier": 50
					},
					{
						"reel": 1,
						"row": 1,
						"multiplier": 2
					},
					{
						"reel": 1,
						"row": 2,
						"multiplier": 5
					},
					{
						"reel": 1,
						"row": 3,
						"multiplier": 50
					},
					{
						"reel": 1,
						"row": 4,
						"multiplier": 3
					},
					{
						"reel": 1,
						"row": 5,
						"multiplier": 25
					},
					{
						"reel": 2,
						"row": 1,
						"multiplier": 2
					},
					{
						"reel": 2,
						"row": 2,
						"multiplier": 2
					},
					{
						"reel": 2,
						"row": 3,
						"multiplier": 2
					},
					{
						"reel": 2,
						"row": 4,
						"multiplier": 10
					},
					{
						"reel": 2,
						"row": 5,
						"multiplier": 10
					},
					{
						"reel": 3,
						"row": 1,
						"multiplier": 2
					},
					{
						"reel": 3,
						"row": 2,
						"multiplier": 10
					},
					{
						"reel": 3,
						"row": 3,
						"multiplier": 50
					},
					{
						"reel": 3,
						"row": 4,
						"multiplier": 5
					},
					{
						"reel": 3,
						"row": 5,
						"multiplier": 2
					},
					{
						"reel": 4,
						"row": 1,
						"multiplier": 10
					},
					{
						"reel": 4,
						"row": 2,
						"multiplier": 10
					},
					{
						"reel": 4,
						"row": 3,
						"multiplier": 3
					},
					{
						"reel": 4,
						"row": 4,
						"multiplier": 2
					},
					{
						"reel": 4,
						"row": 5,
						"multiplier": 10
					},
					{
						"reel": 5,
						"row": 1,
						"multiplier": 10
					},
					{
						"reel": 5,
						"row": 2,
						"multiplier": 5
					},
					{
						"reel": 5,
						"row": 3,
						"multiplier": 2
					},
					{
						"reel": 5,
						"row": 4,
						"multiplier": 25
					},
					{
						"reel": 5,
						"row": 5,
						"multiplier": 3
					}
				]
			},
			{
				"index": 2,
				"type": "cashRespinLand",
				"multipliers": [],
				"coins": [
					{
						"reel": 1,
						"row": 1,
						"value": 1
					},
					{
						"reel": 0,
						"row": 5,
						"value": 1
					}
				],
				"cloners": [],
				"bombs": []
			},
			{
				"index": 3,
				"type": "cashCoinsMultiply",
				"coins": [
					{
						"reel": 1,
						"row": 1,
						"value": 1,
						"frame": 2,
						"total": 2
					},
					{
						"reel": 0,
						"row": 5,
						"value": 1,
						"frame": 50,
						"total": 50
					}
				]
			},
			{
				"index": 4,
				"type": "cashRespinUpdate",
				"respin": 1,
				"respinsLeft": 3,
				"totalCash": 52
			},
			{
				"index": 5,
				"type": "cashRespinUpdate",
				"respin": 2,
				"respinsLeft": 2,
				"totalCash": 52
			},
			{
				"index": 6,
				"type": "cashRespinLand",
				"multipliers": [],
				"coins": [],
				"cloners": [
					{
						"reel": 5,
						"row": 2
					}
				],
				"bombs": []
			},
			{
				"index": 7,
				"type": "cashClonerActivate",
				"cloner": {
					"reel": 5,
					"row": 2,
					"value": 1,
					"frame": 5,
					"total": 5
				},
				"coins": [
					{
						"reel": 1,
						"row": 5,
						"value": 1,
						"frame": 25,
						"total": 25
					},
					{
						"reel": 3,
						"row": 5,
						"value": 1,
						"frame": 2,
						"total": 2
					}
				]
			},
			{
				"index": 8,
				"type": "cashRespinUpdate",
				"respin": 3,
				"respinsLeft": 3,
				"totalCash": 84
			},
			{
				"index": 9,
				"type": "cashRespinLand",
				"multipliers": [
					{
						"reel": 3,
						"row": 2,
						"multiplier": 5
					}
				],
				"coins": [
					{
						"reel": 0,
						"row": 4,
						"value": 1
					},
					{
						"reel": 1,
						"row": 3,
						"value": 1
					},
					{
						"reel": 0,
						"row": 3,
						"value": 1
					}
				],
				"cloners": [],
				"bombs": []
			},
			{
				"index": 10,
				"type": "cashMultiplierFrames",
				"multipliers": [
					{
						"reel": 3,
						"row": 2,
						"multiplier": 5,
						"frame": 15
					}
				]
			},
			{
				"index": 11,
				"type": "cashCoinsMultiply",
				"coins": [
					{
						"reel": 0,
						"row": 4,
						"value": 1,
						"frame": 2,
						"total": 2
					},
					{
						"reel": 1,
						"row": 3,
						"value": 1,
						"frame": 50,
						"total": 50
					},
					{
						"reel": 0,
						"row": 3,
						"value": 1,
						"frame": 3,
						"total": 3
					}
				]
			},
			{
				"index": 12,
				"type": "cashRespinUpdate",
				"respin": 4,
				"respinsLeft": 3,
				"totalCash": 139
			},
			{
				"index": 13,
				"type": "cashRespinUpdate",
				"respin": 5,
				"respinsLeft": 2,
				"totalCash": 139
			},
			{
				"index": 14,
				"type": "cashRespinUpdate",
				"respin": 6,
				"respinsLeft": 1,
				"totalCash": 139
			},
			{
				"index": 15,
				"type": "cashRespinUpdate",
				"respin": 7,
				"respinsLeft": 0,
				"totalCash": 139
			},
			{
				"index": 16,
				"type": "cashRespinEnd",
				"amount": 13900,
				"coins": 8,
				"respinsPlayed": 7
			},
			{
				"index": 17,
				"type": "setTotalWin",
				"amount": 13900
			},
			{
				"index": 18,
				"type": "finalWin",
				"amount": 13900
			}
		]
	}
];
