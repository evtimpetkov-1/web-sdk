import { stateMeta, type BetModeMeta } from 'state-shared';

import config from './config';

const NO_ASSETS = {
	icon: '',
	dialogImage: '',
	dialogVolatility: '',
	volatility: '',
	button: '',
};

/**
 * Game-specific bet mode metadata for the buy-bonus UI (cards + confirm
 * dialog). Replaces the SDK's sample defaults (which list demo modes with
 * placeholder CDN art). Keys must match config.betModes / the RGS mode names.
 */
const KRAKENS_WILDS_BET_MODE_META: BetModeMeta = {
	BASE: {
		mode: 'BASE',
		costMultiplier: config.betModes.base.cost,
		type: 'default',
		parent: '',
		children: '',
		assets: NO_ASSETS,
		text: {
			title: '',
			dialog: '',
			button: '',
			betAmountLabel: '',
			tickerIdle: '',
			tickerSpin: '',
		},
		maxWin: config.betModes.base.max_win,
	},
	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		assets: {
			...NO_ASSETS,
			dialogImage: '/assets/sprites/betmodes/bonus_card.webp',
		},
		text: {
			title: 'FREE SPINS',
			// Describes what the feature actually does. The previous copy promised
			// "Sticky Wilds with win multipliers ... locked on the reels for the entire
			// feature" — wrong on all three counts: wilds are placed per spin, they do
			// not carry multipliers, and the values belong to the Coin symbol.
			dialog:
				'Instantly triggers the FREE SPINS feature for 80x your total bet. Every Free Spin is a Special Spin, adding Wild or Coin symbols to the reels. Coin values are awarded in addition to any line wins.',
			description: 'Instantly trigger the FREE SPINS feature, where every spin is a Special Spin.',
			button: 'BUY',
			betAmountLabel: 'BONUS BUY',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'BONUS BUY ACTIVATED',
		},
		maxWin: config.betModes.bonus.max_win,
	},
};

export function applyBetModeMeta() {
	stateMeta.betModeMeta = KRAKENS_WILDS_BET_MODE_META;
}
