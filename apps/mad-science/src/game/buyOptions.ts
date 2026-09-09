import config from './config';

/**
 * The feature-buy shop's offers (BuyShop / BuyConfirm).
 *
 * DESIGN SCAFFOLD (2026-09-03): the final feature set comes from the math, so
 * only FREE SPINS is a real, purchasable mode (RGS 'BONUS'). The rest are
 * PLACEHOLDERS that exercise the 4-6 card layout and the confirm flow; their
 * CONFIRM closes the dialog without betting. Each option will get its own
 * generated image once the features are known — the symbol art stands in.
 */
export type BuyOption = {
	key: string;
	/** RGS bet mode this option buys; undefined = placeholder, cannot be bought */
	betModeKey?: 'BONUS';
	title: string;
	/** one-liner under the title */
	description: string;
	/** 1-5, drawn as lightning bolts */
	volatility: number;
	/** x total bet */
	costMultiplier: number;
	image: string;
};

// URL-relative like assets.ts (the static folder is served at the root; a
// root-absolute path breaks under Stake Engine's subpath — see Kraken's notes)
const symbol = (file: string) =>
	new URL(`../../assets/madscience/symbols/raw/${file}`, import.meta.url).href;

export const BUY_OPTIONS: BuyOption[] = [
	{
		key: 'FREE_SPINS',
		betModeKey: 'BONUS',
		title: 'FREE SPINS',
		description: 'Instantly triggers the Free Spins feature. The multiplier plate keeps every collected multiplier for the whole feature.',
		volatility: 3,
		costMultiplier: config.betModes.bonus.cost,
		image: symbol('bonus.png'),
	},
	{
		key: 'EXTRA_CHANCE',
		title: 'EXTRA CHANCE',
		description: 'Spins trigger Free Spins more often while active.',
		volatility: 2,
		costMultiplier: 3,
		image: symbol('wild.png'),
	},
	{
		key: 'CLONER_LAB',
		title: 'CLONER LAB',
		description: 'A guaranteed Cloner on the trigger spin.',
		volatility: 3,
		costMultiplier: 120,
		image: symbol('cloner.png'),
	},
	{
		key: 'DETONATION',
		title: 'DETONATION',
		description: 'Free Spins with a Bomb on every cascade.',
		volatility: 4,
		costMultiplier: 300,
		image: symbol('bomb.png'),
	},
	{
		key: 'OVERCHARGED',
		title: 'OVERCHARGED',
		description: 'Free Spins starting at a x10 plate multiplier.',
		volatility: 5,
		costMultiplier: 500,
		image: symbol('mult_symbol_plate.png'),
	},
	{
		key: 'BRAIN_BONUS',
		title: 'BRAIN BONUS',
		description: 'Free Spins with high symbols only.',
		volatility: 5,
		costMultiplier: 1000,
		image: symbol('h1.png'),
	},
];

export const getBuyOption = (key: string) => BUY_OPTIONS.find((option) => option.key === key);
