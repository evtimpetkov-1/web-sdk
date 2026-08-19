import { stateMeta, stateI18nDerived, type BetModeMeta } from 'state-shared';

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
 *
 * Built as a FUNCTION, not a module const: the strings go through the
 * translator, and translations are only loaded once LoadI18n has run —
 * applyBetModeMeta() is called from Game's onMount, which is inside it.
 */
const buildBetModeMeta = (): BetModeMeta => {
	const t = (key: string) => stateI18nDerived.translate(key);
	return {
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
			title: t('FREE SPINS'),
			// Describes what the feature actually does. The previous copy promised
			// "Sticky Wilds with win multipliers ... locked on the reels for the entire
			// feature" — wrong on all three counts: wilds are placed per spin, they do
			// not carry multipliers, and the values belong to the Coin symbol.
			dialog: t(
				'Instantly triggers the FREE SPINS feature for 80x your total bet. Every Free Spin is a Kraken Spin, adding Wild or Coin symbols to the reels. Coin values are awarded in addition to any line wins.',
			),
			description: t('Instantly trigger the FREE SPINS feature, where every spin is a Kraken Spin.'),
			button: t('BUY'),
			betAmountLabel: 'BONUS BUY',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'BONUS BUY ACTIVATED',
		},
		maxWin: config.betModes.bonus.max_win,
	},
	};
};

export function applyBetModeMeta() {
	stateMeta.betModeMeta = buildBetModeMeta();
}
