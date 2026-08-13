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
			dialog:
				'Instantly triggers the FREE SPINS feature for 100x your total bet. Sticky Wilds with win multipliers stay locked on the reels for the entire feature.',
			description: 'Instantly trigger the FREE SPINS feature with Sticky Wild multipliers.',
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
