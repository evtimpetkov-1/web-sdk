export default {
	providerName: 'royal_cat_gaming',
	gameName: 'krakens_wilds',
	gameID: '0_0_krakens_wilds',
	rtp: 0.965,
	numReels: 5,
	numRows: [3, 3, 3, 3, 3],
	// Per-mode RTP and max win are the UPLOADED v2.1 math's dashboard figures
	// (2026-08-24): base 96.52% / 1,890.6x, ante 96.46% / 1,978x, bonus 96.42%
	// / 2,536.7x. The rules quote all three RTPs; the max win the rules display
	// is the BASE figure only (studio decision 2026-08-24) — that string in the
	// i18n files is where a future math retune must be reflected too.
	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.9652,
			max_win: 1890.6,
		},
		// Ante Bet (spec v2.1): doubles the total bet; wins are still calculated on
		// the original bet (the RGS charges betAmount x cost and pays
		// payoutMultiplier x betAmount); doubles the chance of Kraken Spins and of
		// triggering Free Spins. The math-sdk must register the same mode name the
		// FE sends — 'ANTE' (see betModeMeta).
		ante: {
			cost: 2.0,
			feature: true,
			buyBonus: false,
			rtp: 0.9646,
			max_win: 1978,
		},
		bonus: {
			// Spec v2.1: "For 100 x total bet, a direct access to the Free Spins
			// Feature can be purchased." (was 80x in the review-2 build). The RGS
			// charges whatever the MATH config says, so this has to stay in step
			// with the math-sdk bet mode cost.
			cost: 100.0,
			feature: false,
			buyBonus: true,
			rtp: 0.9642,
			max_win: 2536.7,
		},
	},
	paylines: {
		'1': [1, 1, 1, 1, 1],
		'2': [0, 0, 0, 0, 0],
		'3': [2, 2, 2, 2, 2],
		'4': [0, 1, 2, 1, 0],
		'5': [2, 1, 0, 1, 2],
		'6': [1, 0, 0, 0, 1],
		'7': [1, 2, 2, 2, 1],
		'8': [0, 0, 1, 2, 2],
		'9': [2, 2, 1, 0, 0],
		'10': [1, 2, 1, 0, 1],
		'11': [1, 0, 1, 2, 1],
		'12': [0, 1, 1, 1, 0],
		'13': [2, 1, 1, 1, 2],
		'14': [0, 1, 0, 1, 0],
		'15': [2, 1, 2, 1, 2],
		'16': [1, 1, 0, 1, 1],
		'17': [1, 1, 2, 1, 1],
		'18': [0, 0, 2, 0, 0],
		'19': [2, 2, 0, 2, 2],
		'20': [0, 2, 2, 2, 0],
	},
	// Spec v2.1 paytable. The spec quotes values "for 20 x total bet" (per-line
	// units); these are total-bet multipliers, i.e. spec value / 20.
	symbols: {
		W: {
			paytable: [
				{
					'5': 50,
				},
				{
					'4': 10,
				},
				{
					'3': 2.5,
				},
			],
			special_properties: ['wild'],
		},
		H1: {
			paytable: [
				{
					'5': 50,
				},
				{
					'4': 10,
				},
				{
					'3': 2.5,
				},
			],
		},
		H2: {
			paytable: [
				{
					'5': 25,
				},
				{
					'4': 5,
				},
				{
					'3': 1.5,
				},
			],
		},
		H3: {
			paytable: [
				{
					'5': 10,
				},
				{
					'4': 2.5,
				},
				{
					'3': 1,
				},
			],
		},
		H4: {
			paytable: [
				{
					'5': 5,
				},
				{
					'4': 1.5,
				},
				{
					'3': 0.6,
				},
			],
		},
		L1: {
			paytable: [
				{
					'5': 3,
				},
				{
					'4': 0.8,
				},
				{
					'3': 0.4,
				},
			],
		},
		L2: {
			paytable: [
				{
					'5': 3,
				},
				{
					'4': 0.8,
				},
				{
					'3': 0.4,
				},
			],
		},
		L3: {
			paytable: [
				{
					'5': 2,
				},
				{
					'4': 0.5,
				},
				{
					'3': 0.2,
				},
			],
		},
		L4: {
			paytable: [
				{
					'5': 2,
				},
				{
					'4': 0.5,
				},
				{
					'3': 0.2,
				},
			],
		},
		S: {
			special_properties: ['scatter'],
		},
		// Coin/cash symbol. Pays by its own `multiplier` (a multiple of the total
		// bet), not by a paytable — the book sends the value per landed coin and
		// emits a single winInfo with meta.coinMultipliers.
		C: {
			special_properties: ['coin', 'multiplier'],
		},
	},
	paddingReels: {
		// Real reel strips from the math config_fe drop (2026-08-22) — the
		// spin-by filler players see while reels are in motion.
		basegame: [
			[{ name: 'L1' }, { name: 'L2' }, { name: 'H2' }, { name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'H4' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'H2' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }, { name: 'S' }, { name: 'H3' }, { name: 'L4' }, { name: 'H4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L3' }, { name: 'H4' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L4' }, { name: 'L4' }, { name: 'W' }, { name: 'L3' }, { name: 'L1' }, { name: 'H1' }, { name: 'L2' }, { name: 'L1' }, { name: 'H3' }, { name: 'S' }, { name: 'L3' }, { name: 'L2' }, { name: 'H2' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L4' }, { name: 'H1' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'H1' }, { name: 'S' }, { name: 'L2' }, { name: 'H2' }],
			[{ name: 'H4' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'H3' }, { name: 'H1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'H1' }, { name: 'L4' }, { name: 'W' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'S' }, { name: 'H3' }, { name: 'H4' }, { name: 'L1' }, { name: 'L3' }, { name: 'H3' }, { name: 'L4' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'S' }, { name: 'L3' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'L3' }, { name: 'H2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L2' }, { name: 'H1' }, { name: 'L3' }, { name: 'L4' }, { name: 'H4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'H2' }, { name: 'H1' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'H4' }, { name: 'L2' }, { name: 'H4' }, { name: 'H2' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'H1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }],
			[{ name: 'H4' }, { name: 'L2' }, { name: 'W' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }, { name: 'L3' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'S' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'H2' }, { name: 'L4' }, { name: 'L2' }, { name: 'H4' }, { name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }, { name: 'H3' }, { name: 'S' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'L1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'W' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'H3' }, { name: 'H1' }, { name: 'H4' }, { name: 'L4' }, { name: 'S' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'W' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }],
			[{ name: 'H4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'H2' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }, { name: 'L3' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'H2' }, { name: 'L4' }, { name: 'W' }, { name: 'L3' }, { name: 'L2' }, { name: 'H2' }, { name: 'L4' }, { name: 'H4' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }, { name: 'H3' }, { name: 'S' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'S' }, { name: 'L3' }, { name: 'W' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'L3' }, { name: 'S' }, { name: 'H4' }, { name: 'L1' }, { name: 'L2' }, { name: 'H4' }, { name: 'L3' }, { name: 'L4' }, { name: 'H4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'H1' }, { name: 'H4' }, { name: 'L4' }, { name: 'L2' }, { name: 'H3' }, { name: 'L3' }, { name: 'L4' }, { name: 'H4' }, { name: 'W' }, { name: 'L2' }, { name: 'L4' }, { name: 'L2' }, { name: 'H2' }, { name: 'L4' }, { name: 'H4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'H1' }, { name: 'W' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'W' }],
			[{ name: 'H4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'W' }, { name: 'L3' }, { name: 'H3' }, { name: 'H4' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'H4' }, { name: 'L4' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'W' }, { name: 'L3' }, { name: 'L2' }, { name: 'H2' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'L3' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'H1' }, { name: 'L3' }, { name: 'L4' }, { name: 'H3' }, { name: 'H2' }, { name: 'L3' }, { name: 'H3' }, { name: 'H1' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'W' }, { name: 'L3' }, { name: 'H2' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'H2' }, { name: 'H4' }, { name: 'H2' }, { name: 'L4' }, { name: 'S' }, { name: 'H4' }, { name: 'L2' }, { name: 'L1' }, { name: 'H4' }, { name: 'H3' }, { name: 'L4' }, { name: 'W' }, { name: 'L2' }, { name: 'H1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H3' }, { name: 'W' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L4' }, { name: 'L4' }, { name: 'W' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'H1' }, { name: 'L2' }, { name: 'H2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'S' }, { name: 'H1' }, { name: 'L2' }, { name: 'L4' }, { name: 'W' }, { name: 'L3' }, { name: 'H3' }, { name: 'L2' }, { name: 'L4' }, { name: 'H4' }, { name: 'H2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H2' }, { name: 'H3' }, { name: 'L4' }, { name: 'W' }, { name: 'H2' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'L3' }, { name: 'H4' }, { name: 'L4' }, { name: 'H1' }, { name: 'L3' }, { name: 'H2' }],
		],
		freegame: [
			[{ name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'H2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'H4' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H4' }, { name: 'L4' }, { name: 'L1' }, { name: 'H2' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'H4' }, { name: 'L4' }, { name: 'L3' }, { name: 'H4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'H2' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'H3' }, { name: 'L1' }, { name: 'H2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H3' }, { name: 'L1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L4' }, { name: 'H4' }, { name: 'L3' }, { name: 'L1' }, { name: 'H2' }, { name: 'H1' }, { name: 'L4' }, { name: 'L3' }],
			[{ name: 'L3' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'H3' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'H2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'H1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'H4' }, { name: 'H2' }, { name: 'L1' }, { name: 'L3' }, { name: 'H3' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'H2' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'H2' }, { name: 'L2' }, { name: 'H4' }, { name: 'H1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'H1' }, { name: 'L4' }, { name: 'L2' }],
			[{ name: 'L2' }, { name: 'H3' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'H3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'H2' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'H3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'H2' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'H1' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'H3' }, { name: 'L3' }, { name: 'L1' }, { name: 'H1' }, { name: 'L2' }, { name: 'H2' }, { name: 'H1' }, { name: 'H4' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'H1' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'H3' }, { name: 'H2' }],
			[{ name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'H1' }, { name: 'L2' }, { name: 'H2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'H3' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'H3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'H1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'H2' }, { name: 'L2' }, { name: 'H1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'H1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'H1' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'H4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'H3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'H3' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'H2' }, { name: 'H4' }, { name: 'L3' }, { name: 'H1' }, { name: 'H2' }, { name: 'L2' }, { name: 'L1' }, { name: 'H1' }],
			[{ name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'H4' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'H2' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'H3' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'H3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }, { name: 'L2' }, { name: 'L4' }, { name: 'L3' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L1' }, { name: 'L4' }, { name: 'H4' }, { name: 'L3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'L4' }, { name: 'L1' }, { name: 'H1' }, { name: 'L4' }, { name: 'H3' }, { name: 'L1' }, { name: 'L4' }, { name: 'L2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H4' }, { name: 'H2' }, { name: 'H1' }, { name: 'H3' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' }, { name: 'L4' }],
		],
	},
};
