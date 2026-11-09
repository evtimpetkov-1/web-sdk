const pays = (eight: number, ten: number, twelve: number) => ({
	paytable: Array.from({ length: 23 }, (_, i) => {
		const count = i + 8;
		return { [count]: count >= 12 ? twelve : count >= 10 ? ten : eight };
	}),
});

export default {
	// identity (metadata: nothing reads these at runtime). gameID = the Stake
	// game id / url slug; provider + the snake_case name follow Kraken's config.
	// Chaos Lab 2 (the math's "Mad Science 2"): chaos-lab-2 until Stake assigns
	// the slug at registration.
	providerName: 'royal_cat_gaming',
	gameName: 'chaos_lab_2',
	gameID: 'chaos-lab-2',
	rtp: 0.9636,
	numReels: 6,
	numRows: [5, 5, 5, 5, 5, 5],
	// The six RGS modes (names as the math uploads them, Chaos Lab's). The FE
	// sends them uppercase — Kraken's ANTE/BONUS against lowercase math names,
	// and the RGS reports this game's base spins back as 'BASE'.
	// cost / rtp / max_win (x base bet) from Chaos Lab 2's Game Rules
	// Specification (Mad Science 2, 2026-11-04). Re-check max_win against the
	// Stake dashboard's top win per mode once the math is uploaded.
	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.9636,
			max_win: 19345,
			description: 'main game',
		},
		ante_1: {
			cost: 2.0,
			feature: true,
			buyBonus: false,
			rtp: 0.9628,
			max_win: 19336,
			description: 'Chaos Mode: base game features 2.7x more often, Cash Respins 1.3x more often',
		},
		ante_2: {
			cost: 2.0,
			feature: true,
			buyBonus: false,
			rtp: 0.9605,
			max_win: 17585,
			description: 'Bonus Boost: Cash Respins 3.7x more often',
		},
		lucky_draw_free_spins: {
			cost: 100,
			feature: false,
			buyBonus: true,
			rtp: 0.9639,
			max_win: 25128,
			description: 'Operation Respins: buys Cash Respins, a random 4 / 5 / 6 Scatter version',
		},
		lucky_draw_feature_heavy: {
			cost: 250,
			feature: false,
			buyBonus: true,
			rtp: 0.962,
			max_win: 28292,
			description: 'Mutant Respins: Cash Respins starting with 10 multiplier frames (x2-x50), more Multipliers and Bombs',
		},
		super_lucky_draw_free_spins: {
			cost: 500,
			feature: false,
			buyBonus: true,
			rtp: 0.963,
			max_win: 31445,
			description: 'Overcharged Respins: Cash Respins with every position framed (x2-x100), more Multipliers, Cloners and Bombs, Bombs up to x50',
		},
	},
	// Game Rules Specification pays: 8-9 / 10-11 / 12+ of a kind anywhere, in
	// base-bet multiples, listed per count up to the 30-cell board
	symbols: {
		H1: pays(2, 5, 15),
		H2: pays(1.5, 4, 10),
		H3: pays(1.2, 3, 7),
		H4: pays(1, 2, 5),
		L1: pays(0.8, 1.5, 4),
		L2: pays(0.6, 1.2, 3),
		L3: pays(0.5, 1, 2.5),
		L4: pays(0.4, 0.8, 2),
		L5: pays(0.3, 0.6, 1.5),
		M: {
			special_properties: ['multiplier'],
		},
		W: {
			special_properties: ['wild'],
		},
		S: {
			special_properties: ['scatter'],
		},
		// provisional codes — confirm with math book contract
		C: {
			special_properties: ['cloner'],
		},
		B: {
			special_properties: ['bomb'],
		},
	},
	paddingReels: {
		basegame: [
			[
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'S',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'S',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'S',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'S',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'S',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'S',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'S',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'S',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'S',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'S',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'S',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'S',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'S',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'S',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'S',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'S',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'S',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'S',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'S',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
			],
		],
		freeSpins: [
			[
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'M',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'M',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'M',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'M',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'M',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'M',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'M',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'M',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'M',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'M',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
			],
			[
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'M',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'M',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H1',
				},
				{
					name: 'L2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'H2',
				},
				{
					name: 'H1',
				},
				{
					name: 'H1',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'L1',
				},
				{
					name: 'H3',
				},
				{
					name: 'H3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H4',
				},
				{
					name: 'L2',
				},
				{
					name: 'H4',
				},
				{
					name: 'H1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'H2',
				},
				{
					name: 'H2',
				},
				{
					name: 'L1',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L2',
				},
				{
					name: 'L3',
				},
				{
					name: 'L3',
				},
			],
		],
	},
};
