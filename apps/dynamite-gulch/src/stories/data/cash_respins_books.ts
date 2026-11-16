// Chaos Lab 2 Cash Respins: two real books from the math (2026-11-03).
// [0] 3135032: 4 Scatters, empty grid; cloner + bomb + two multiplier frames, 41x.
// [1] 3964721: 5 Scatters, 5 starting frames; cloner + bomb in one respin, 57x.
export default [
	{
		"id": 3135032,
		"payoutMultiplier": 4300,
		"events": [
			{
				"index": 0,
				"type": "reveal",
				"board": [
					[
						{
							"name": "L3"
						},
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "L2"
						},
						{
							"name": "L2"
						},
						{
							"name": "L2"
						},
						{
							"name": "H2"
						},
						{
							"name": "H2"
						}
					],
					[
						{
							"name": "L5"
						},
						{
							"name": "H1"
						},
						{
							"name": "H1"
						},
						{
							"name": "H1"
						},
						{
							"name": "H1"
						},
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "H4"
						}
					],
					[
						{
							"name": "L5"
						},
						{
							"name": "L1"
						},
						{
							"name": "H3"
						},
						{
							"name": "H1"
						},
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "L2"
						},
						{
							"name": "L4"
						}
					],
					[
						{
							"name": "L5"
						},
						{
							"name": "L3"
						},
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "H3"
						},
						{
							"name": "H3"
						},
						{
							"name": "H3"
						},
						{
							"name": "H4"
						}
					],
					[
						{
							"name": "L2"
						},
						{
							"name": "H3"
						},
						{
							"name": "L1"
						},
						{
							"name": "L1"
						},
						{
							"name": "L1"
						},
						{
							"name": "H1"
						},
						{
							"name": "H1"
						}
					],
					[
						{
							"name": "L1"
						},
						{
							"name": "L3"
						},
						{
							"name": "H1"
						},
						{
							"name": "H1"
						},
						{
							"name": "H2"
						},
						{
							"name": "H2"
						},
						{
							"name": "L4"
						}
					]
				],
				"paddingPositions": [
					52,
					64,
					14,
					46,
					54,
					55
				],
				"gameType": "basegame",
				"anticipation": [
					0,
					0,
					0,
					0,
					0,
					0
				]
			},
			{
				"index": 1,
				"type": "winInfo",
				"totalWin": 200,
				"wins": [
					{
						"symbol": "H1",
						"win": 200,
						"positions": [
							{
								"reel": 1,
								"row": 1
							},
							{
								"reel": 1,
								"row": 2
							},
							{
								"reel": 5,
								"row": 2
							},
							{
								"reel": 1,
								"row": 3
							},
							{
								"reel": 2,
								"row": 3
							},
							{
								"reel": 5,
								"row": 3
							},
							{
								"reel": 1,
								"row": 4
							},
							{
								"reel": 4,
								"row": 5
							}
						],
						"meta": {
							"globalMult": 1,
							"clusterMult": 1,
							"winWithoutMult": 200,
							"overlay": {
								"reel": 2,
								"row": 3
							}
						}
					}
				]
			},
			{
				"index": 2,
				"type": "updateTumbleWin",
				"amount": 200
			},
			{
				"index": 3,
				"type": "tumbleBoard",
				"newSymbols": [
					[],
					[
						{
							"name": "H4"
						},
						{
							"name": "H4"
						},
						{
							"name": "L5"
						},
						{
							"name": "L5"
						}
					],
					[
						{
							"name": "L5"
						}
					],
					[],
					[
						{
							"name": "L2"
						}
					],
					[
						{
							"name": "L4"
						},
						{
							"name": "L5"
						}
					]
				],
				"explodingSymbols": [
					{
						"reel": 1,
						"row": 1
					},
					{
						"reel": 1,
						"row": 2
					},
					{
						"reel": 1,
						"row": 3
					},
					{
						"reel": 1,
						"row": 4
					},
					{
						"reel": 2,
						"row": 3
					},
					{
						"reel": 4,
						"row": 5
					},
					{
						"reel": 5,
						"row": 2
					},
					{
						"reel": 5,
						"row": 3
					}
				]
			},
			{
				"index": 4,
				"type": "setWin",
				"amount": 200,
				"winLevel": 4
			},
			{
				"index": 5,
				"type": "setTotalWin",
				"amount": 200
			},
			{
				"index": 6,
				"type": "cashRespinTrigger",
				"scatters": 4,
				"variant": 4,
				"positions": [
					{
						"reel": 0,
						"row": 1
					},
					{
						"reel": 1,
						"row": 5
					},
					{
						"reel": 2,
						"row": 4
					},
					{
						"reel": 3,
						"row": 2
					}
				]
			},
			{
				"index": 7,
				"type": "cashRespinStart",
				"variant": 4,
				"respins": 3,
				"frames": []
			},
			{
				"index": 8,
				"type": "cashRespinLand",
				"multipliers": [],
				"coins": [
					{
						"reel": 1,
						"row": 3,
						"value": 2
					}
				],
				"cloners": [],
				"bombs": []
			},
			{
				"index": 9,
				"type": "cashCoinsMultiply",
				"coins": [
					{
						"reel": 1,
						"row": 3,
						"value": 2,
						"frame": 0,
						"total": 2
					}
				]
			},
			{
				"index": 10,
				"type": "cashRespinUpdate",
				"respin": 1,
				"respinsLeft": 3,
				"totalCash": 2
			},
			{
				"index": 11,
				"type": "cashRespinUpdate",
				"respin": 2,
				"respinsLeft": 2,
				"totalCash": 2
			},
			{
				"index": 12,
				"type": "cashRespinUpdate",
				"respin": 3,
				"respinsLeft": 1,
				"totalCash": 2
			},
			{
				"index": 13,
				"type": "cashRespinLand",
				"multipliers": [
					{
						"reel": 5,
						"row": 1,
						"multiplier": 5
					},
					{
						"reel": 4,
						"row": 4,
						"multiplier": 4
					}
				],
				"coins": [
					{
						"reel": 0,
						"row": 1,
						"value": 1
					}
				],
				"cloners": [],
				"bombs": [
					{
						"reel": 1,
						"row": 1
					}
				]
			},
			{
				"index": 14,
				"type": "cashMultiplierFrames",
				"multipliers": [
					{
						"reel": 5,
						"row": 1,
						"multiplier": 5,
						"frame": 5
					},
					{
						"reel": 4,
						"row": 4,
						"multiplier": 4,
						"frame": 4
					}
				]
			},
			{
				"index": 15,
				"type": "cashCoinsMultiply",
				"coins": [
					{
						"reel": 0,
						"row": 1,
						"value": 1,
						"frame": 0,
						"total": 1
					}
				]
			},
			{
				"index": 16,
				"type": "cashBombActivate",
				"bomb": {
					"reel": 1,
					"row": 1,
					"value": 1,
					"frame": 0,
					"total": 1
				},
				"boosted": [
					{
						"reel": 0,
						"row": 1,
						"add": 1,
						"total": 2
					}
				]
			},
			{
				"index": 17,
				"type": "cashRespinUpdate",
				"respin": 4,
				"respinsLeft": 3,
				"totalCash": 5
			},
			{
				"index": 18,
				"type": "cashRespinLand",
				"multipliers": [],
				"coins": [
					{
						"reel": 4,
						"row": 4,
						"value": 1
					}
				],
				"cloners": [
					{
						"reel": 5,
						"row": 5
					}
				],
				"bombs": []
			},
			{
				"index": 19,
				"type": "cashCoinsMultiply",
				"coins": [
					{
						"reel": 4,
						"row": 4,
						"value": 1,
						"frame": 4,
						"total": 4
					}
				]
			},
			{
				"index": 20,
				"type": "cashClonerActivate",
				"cloner": {
					"reel": 5,
					"row": 5,
					"value": 3,
					"frame": 0,
					"total": 3
				},
				"coins": [
					{
						"reel": 0,
						"row": 5,
						"value": 1,
						"frame": 0,
						"total": 1
					},
					{
						"reel": 5,
						"row": 1,
						"value": 5,
						"frame": 5,
						"total": 25
					},
					{
						"reel": 5,
						"row": 3,
						"value": 2,
						"frame": 0,
						"total": 2
					},
					{
						"reel": 3,
						"row": 1,
						"value": 1,
						"frame": 0,
						"total": 1
					}
				]
			},
			{
				"index": 21,
				"type": "cashRespinUpdate",
				"respin": 5,
				"respinsLeft": 3,
				"totalCash": 41
			},
			{
				"index": 22,
				"type": "cashRespinUpdate",
				"respin": 6,
				"respinsLeft": 2,
				"totalCash": 41
			},
			{
				"index": 23,
				"type": "cashRespinUpdate",
				"respin": 7,
				"respinsLeft": 1,
				"totalCash": 41
			},
			{
				"index": 24,
				"type": "cashRespinUpdate",
				"respin": 8,
				"respinsLeft": 0,
				"totalCash": 41
			},
			{
				"index": 25,
				"type": "cashRespinEnd",
				"amount": 4100,
				"coins": 9,
				"respinsPlayed": 8
			},
			{
				"index": 26,
				"type": "setTotalWin",
				"amount": 4300
			},
			{
				"index": 27,
				"type": "finalWin",
				"amount": 4300
			}
		],
		"criteria": "natural",
		"baseGameWins": 2.0,
		"freeGameWins": 41.0
	},
	{
		"id": 3964721,
		"payoutMultiplier": 5740,
		"events": [
			{
				"index": 0,
				"type": "reveal",
				"board": [
					[
						{
							"name": "H1"
						},
						{
							"name": "H3"
						},
						{
							"name": "L5"
						},
						{
							"name": "L5"
						},
						{
							"name": "L5"
						},
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "H4"
						}
					],
					[
						{
							"name": "H1"
						},
						{
							"name": "H2"
						},
						{
							"name": "L4"
						},
						{
							"name": "L4"
						},
						{
							"name": "L4"
						},
						{
							"name": "H4"
						},
						{
							"name": "H4"
						}
					],
					[
						{
							"name": "L5"
						},
						{
							"name": "L5"
						},
						{
							"name": "L1"
						},
						{
							"name": "H3"
						},
						{
							"name": "H1"
						},
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "L2"
						}
					],
					[
						{
							"name": "L3"
						},
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "H3"
						},
						{
							"name": "L4"
						},
						{
							"name": "H4"
						},
						{
							"name": "H4"
						},
						{
							"name": "H1"
						}
					],
					[
						{
							"name": "S",
							"scatter": true
						},
						{
							"name": "H2"
						},
						{
							"name": "L1"
						},
						{
							"name": "H1"
						},
						{
							"name": "L4"
						},
						{
							"name": "L4"
						},
						{
							"name": "L5"
						}
					],
					[
						{
							"name": "L3"
						},
						{
							"name": "H4"
						},
						{
							"name": "H4"
						},
						{
							"name": "H3"
						},
						{
							"name": "L4"
						},
						{
							"name": "L4"
						},
						{
							"name": "L4"
						}
					]
				],
				"paddingPositions": [
					0,
					82,
					13,
					95,
					45,
					26
				],
				"gameType": "basegame",
				"anticipation": [
					0,
					0,
					0,
					0,
					0,
					0
				]
			},
			{
				"index": 1,
				"type": "winInfo",
				"totalWin": 40,
				"wins": [
					{
						"symbol": "L4",
						"win": 40,
						"positions": [
							{
								"reel": 1,
								"row": 2
							},
							{
								"reel": 1,
								"row": 3
							},
							{
								"reel": 3,
								"row": 3
							},
							{
								"reel": 1,
								"row": 4
							},
							{
								"reel": 4,
								"row": 4
							},
							{
								"reel": 5,
								"row": 4
							},
							{
								"reel": 4,
								"row": 5
							},
							{
								"reel": 5,
								"row": 5
							}
						],
						"meta": {
							"globalMult": 1,
							"clusterMult": 1,
							"winWithoutMult": 40,
							"overlay": {
								"reel": 3,
								"row": 3
							}
						}
					}
				]
			},
			{
				"index": 2,
				"type": "updateTumbleWin",
				"amount": 40
			},
			{
				"index": 3,
				"type": "tumbleBoard",
				"newSymbols": [
					[],
					[
						{
							"name": "L5"
						},
						{
							"name": "L5"
						},
						{
							"name": "L5"
						}
					],
					[],
					[
						{
							"name": "H2"
						}
					],
					[
						{
							"name": "L3"
						},
						{
							"name": "H3"
						}
					],
					[
						{
							"name": "H2"
						},
						{
							"name": "S",
							"scatter": true
						}
					]
				],
				"explodingSymbols": [
					{
						"reel": 1,
						"row": 2
					},
					{
						"reel": 1,
						"row": 3
					},
					{
						"reel": 1,
						"row": 4
					},
					{
						"reel": 3,
						"row": 3
					},
					{
						"reel": 4,
						"row": 4
					},
					{
						"reel": 4,
						"row": 5
					},
					{
						"reel": 5,
						"row": 4
					},
					{
						"reel": 5,
						"row": 5
					}
				]
			},
			{
				"index": 4,
				"type": "setWin",
				"amount": 40,
				"winLevel": 2
			},
			{
				"index": 5,
				"type": "setTotalWin",
				"amount": 40
			},
			{
				"index": 6,
				"type": "cashRespinTrigger",
				"scatters": 5,
				"variant": 5,
				"positions": [
					{
						"reel": 0,
						"row": 5
					},
					{
						"reel": 2,
						"row": 5
					},
					{
						"reel": 3,
						"row": 2
					},
					{
						"reel": 4,
						"row": 2
					},
					{
						"reel": 5,
						"row": 1
					}
				]
			},
			{
				"index": 7,
				"type": "cashRespinStart",
				"variant": 5,
				"respins": 3,
				"frames": [
					{
						"reel": 0,
						"row": 3,
						"multiplier": 5
					},
					{
						"reel": 0,
						"row": 5,
						"multiplier": 3
					},
					{
						"reel": 2,
						"row": 1,
						"multiplier": 15
					},
					{
						"reel": 4,
						"row": 2,
						"multiplier": 10
					},
					{
						"reel": 5,
						"row": 3,
						"multiplier": 3
					}
				]
			},
			{
				"index": 8,
				"type": "cashRespinLand",
				"multipliers": [],
				"coins": [
					{
						"reel": 4,
						"row": 2,
						"value": 2
					}
				],
				"cloners": [],
				"bombs": []
			},
			{
				"index": 9,
				"type": "cashCoinsMultiply",
				"coins": [
					{
						"reel": 4,
						"row": 2,
						"value": 2,
						"frame": 10,
						"total": 20
					}
				]
			},
			{
				"index": 10,
				"type": "cashRespinUpdate",
				"respin": 1,
				"respinsLeft": 3,
				"totalCash": 20
			},
			{
				"index": 11,
				"type": "cashRespinUpdate",
				"respin": 2,
				"respinsLeft": 2,
				"totalCash": 20
			},
			{
				"index": 12,
				"type": "cashRespinUpdate",
				"respin": 3,
				"respinsLeft": 1,
				"totalCash": 20
			},
			{
				"index": 13,
				"type": "cashRespinLand",
				"multipliers": [
					{
						"reel": 3,
						"row": 4,
						"multiplier": 3
					}
				],
				"coins": [],
				"cloners": [
					{
						"reel": 1,
						"row": 4
					}
				],
				"bombs": [
					{
						"reel": 1,
						"row": 5
					}
				]
			},
			{
				"index": 14,
				"type": "cashMultiplierFrames",
				"multipliers": [
					{
						"reel": 3,
						"row": 4,
						"multiplier": 3,
						"frame": 3
					}
				]
			},
			{
				"index": 15,
				"type": "cashClonerActivate",
				"cloner": {
					"reel": 1,
					"row": 4,
					"value": 1,
					"frame": 0,
					"total": 1
				},
				"coins": [
					{
						"reel": 2,
						"row": 2,
						"value": 1,
						"frame": 0,
						"total": 1
					},
					{
						"reel": 2,
						"row": 1,
						"value": 2,
						"frame": 15,
						"total": 30
					},
					{
						"reel": 3,
						"row": 4,
						"value": 1,
						"frame": 3,
						"total": 3
					}
				]
			},
			{
				"index": 16,
				"type": "cashBombActivate",
				"bomb": {
					"reel": 1,
					"row": 5,
					"value": 1,
					"frame": 0,
					"total": 1
				},
				"boosted": [
					{
						"reel": 1,
						"row": 4,
						"add": 1,
						"total": 2
					}
				]
			},
			{
				"index": 17,
				"type": "cashRespinUpdate",
				"respin": 4,
				"respinsLeft": 3,
				"totalCash": 57
			},
			{
				"index": 18,
				"type": "cashRespinUpdate",
				"respin": 5,
				"respinsLeft": 2,
				"totalCash": 57
			},
			{
				"index": 19,
				"type": "cashRespinUpdate",
				"respin": 6,
				"respinsLeft": 1,
				"totalCash": 57
			},
			{
				"index": 20,
				"type": "cashRespinUpdate",
				"respin": 7,
				"respinsLeft": 0,
				"totalCash": 57
			},
			{
				"index": 21,
				"type": "cashRespinEnd",
				"amount": 5700,
				"coins": 6,
				"respinsPlayed": 7
			},
			{
				"index": 22,
				"type": "setTotalWin",
				"amount": 5740
			},
			{
				"index": 23,
				"type": "finalWin",
				"amount": 5740
			}
		],
		"criteria": "natural",
		"baseGameWins": 0.4,
		"freeGameWins": 57.0
	}
];
