/**
 * 3 Pots Heist. THERE IS NO MATH YET (2026-11-24): everything below the identity is a
 * front-end placeholder so the game can be built and seen, and is replaced by the
 * math's own config when it exists:
 * - `betModes`: the base mode only, with no RTP or max win (0 = not known);
 * - `symbols`: the symbol set of Evtim's brief with made-up ways pays (3 to 6 of a
 *   kind on adjacent reels from the left);
 * - `paddingReels`: made-up strips, used only as the filler that passes while the
 *   reels spin. They decide nothing: every landing comes from the book.
 */

// x total bet for 3 / 4 / 5 / 6 of a kind (PLACEHOLDER figures)
const pays = (three: number, four: number, five: number, six: number) => ({
	paytable: [{ 6: six }, { 5: five }, { 4: four }, { 3: three }],
});

// A fixed pseudo-random strip per reel (mulberry32), drawn from `weights`: the same
// filler on every load, no symbol twice in a row.
const strip = <T extends string>(seed: number, weights: Record<T, number>, length = 60) => {
	let state = seed;
	const random = () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const bag = (Object.keys(weights) as T[]).flatMap((name) => Array<T>(weights[name]).fill(name));
	const symbols: { name: T }[] = [];
	while (symbols.length < length) {
		const name = bag[Math.floor(random() * bag.length)];
		if (symbols[symbols.length - 1]?.name !== name) symbols.push({ name });
	}
	return symbols;
};

const FILLER_WEIGHTS = {
	L1: 9, L2: 9, L3: 9, L4: 9, L5: 9,
	H1: 5, H2: 5, H3: 5, H4: 5, H5: 4,
	W: 2, C: 4, CL: 1, P1: 1, P2: 1, P3: 1,
}; // prettier-ignore

const NUM_REELS = 6;
const fillerReels = (seed: number) =>
	Array.from({ length: NUM_REELS }, (_, reelIndex) => strip(seed + reelIndex * 97, FILLER_WEIGHTS));

export default {
	// identity (metadata: nothing reads these at runtime). gameID = the Stake game id /
	// url slug, ours until Stake assigns one.
	providerName: 'royal_cat_gaming',
	gameName: '3_pots_heist',
	gameID: '3-pots-heist',
	rtp: 0,
	numReels: NUM_REELS,
	numRows: [4, 4, 4, 4, 4, 4],
	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0,
			max_win: 0,
			description: 'main game',
		},
	},
	symbols: {
		// the four thieves and the vault (Evtim's T1-T5)
		H1: pays(1, 2.5, 5, 10),
		H2: pays(0.8, 2, 4, 8),
		H3: pays(0.6, 1.5, 3, 6),
		H4: pays(0.5, 1.2, 2.5, 5),
		H5: pays(0.4, 1, 2, 4),
		// A K Q J 10
		L1: pays(0.3, 0.6, 1.2, 2.5),
		L2: pays(0.3, 0.6, 1.2, 2.5),
		L3: pays(0.2, 0.5, 1, 2),
		L4: pays(0.2, 0.5, 1, 2),
		L5: pays(0.2, 0.4, 0.8, 1.5),
		W: { special_properties: ['wild'] },
		// Coin: carries a value (x total bet); Collect awards the sum of the Coins in view
		C: { special_properties: ['coin'] },
		CL: { special_properties: ['collect'] },
		// the pot symbols: cash, gems, gold. Each fills its bag over the reels.
		P1: { special_properties: ['pot'] },
		P2: { special_properties: ['pot'] },
		P3: { special_properties: ['pot'] },
	},
	paddingReels: {
		basegame: fillerReels(11),
		freegame: fillerReels(4242),
	},
};
