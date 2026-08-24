import { stateMeta, stateI18nDerived, type BetModeMeta } from 'state-shared';

import config from './config';

// Resolved the same way assets.ts resolves everything (relative to the module,
// which the bundle rewrites to the script's own URL). A root-absolute string
// ('/assets/...') worked on localhost only: on Stake Engine the client is
// served under a subpath, and the browser resolved the leading slash against
// the CDN origin — 404, broken image on both buy-bonus popups.
const bonusCardImg = new URL(
	'../../assets/sprites/betmodes/bonus_card.webp',
	import.meta.url,
).href;

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
	// Ante Bet (spec v2.1) — an 'activate' mode: it persists across spins until
	// the player turns it off (via the panel beside the reels, the chest's shop
	// card, or this card's toggle). The RGS charges betAmount x2 and pays wins on
	// the base bet.
	ANTE: {
		mode: 'ANTE',
		costMultiplier: config.betModes.ante.cost,
		type: 'activate',
		parent: '',
		children: '',
		assets: NO_ASSETS,
		text: {
			title: t('ANTE BET'),
			dialog: t(
				'Double your total bet for double the chance of triggering Kraken Spins and Free Spins. Ante Bet stays active until you turn it off.',
			),
			description: t('Doubles the chance of Kraken Spins and Free Spins.'),
			button: t('ACTIVATE'),
			betAmountLabel: 'ANTE BET',
			tickerIdle: 'ANTE BET IS ACTIVE',
			tickerSpin: 'GOOD LUCK',
		},
		maxWin: config.betModes.ante.max_win,
	},
	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		assets: {
			...NO_ASSETS,
			dialogImage: bonusCardImg,
		},
		text: {
			title: t('FREE SPINS'),
			// The card (shop) carries the full feature explanation; the confirm
			// dialog is a short purchase question — the modal itself restates the
			// concrete cost next to CONFIRM. The cost is spliced in from config so
			// the copy can never drift from what the RGS charges.
			dialog: t('Buy 6, 12 or 18 Free Spins for __0__x your total bet?').replace(
				'__0__',
				`${config.betModes.bonus.cost}`,
			),
			description: t(
				'Instantly triggers 6, 12 or 18 Free Spins. Every Free Spin is a Kraken Spin: the Kraken adds Wilds, Coins or copies of one paying symbol to the reels, and can award a win multiplier for the spin.',
			),
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
