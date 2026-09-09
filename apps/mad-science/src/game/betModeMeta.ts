import { stateMeta, stateUrlDerived, type BetModeMeta } from 'state-shared';

import config from './config';

const NO_ASSETS = { icon: '', dialogImage: '', dialogVolatility: '', volatility: '', button: '' };

/**
 * Bet-mode metadata for the SDK's bet-mode plumbing (bottom-bar label, ticker,
 * active-mode bookkeeping). Replaces the SDK sample defaults, which list demo
 * modes with placeholder CDN art. Keys must match config.betModes / the RGS
 * mode names. The buy SCREENS themselves (BuyShop/BuyConfirm) are driven by
 * buyOptions.ts, not by these cards.
 *
 * A function, not a module const: social-mode wording depends on the URL state.
 */
const buildBetModeMeta = (): BetModeMeta => {
	const social = stateUrlDerived.social();
	return {
		BASE: {
			mode: 'BASE',
			costMultiplier: config.betModes.base.cost,
			type: 'default',
			parent: '',
			children: '',
			assets: NO_ASSETS,
			text: { title: '', dialog: '', button: '', betAmountLabel: '', tickerIdle: '', tickerSpin: '' },
			maxWin: config.betModes.base.max_win,
		},
		BONUS: {
			mode: 'BONUS',
			costMultiplier: config.betModes.bonus.cost,
			type: 'buy',
			parent: '',
			children: '',
			assets: NO_ASSETS,
			text: {
				title: 'FREE SPINS',
				dialog: '',
				button: social ? 'PLAY' : 'BUY',
				betAmountLabel: social ? 'FEATURE' : 'BONUS BUY',
				tickerIdle: social ? 'COME AND PLAY' : 'PLACE YOUR BET',
				tickerSpin: social ? 'FEATURE ACTIVATED' : 'BONUS BUY ACTIVATED',
			},
			maxWin: config.betModes.bonus.max_win,
		},
	};
};

export function applyBetModeMeta() {
	stateMeta.betModeMeta = buildBetModeMeta();
}
