import { stateMeta, stateI18nDerived, stateUrlDerived, type BetModeMeta } from 'state-shared';

import config from './config';

// Resolved the same way assets.ts resolves everything (relative to the module,
// which the bundle rewrites to the script's own URL). A root-absolute string
// ('/assets/...') worked on localhost only: on Stake Engine the client is
// served under a subpath, and the browser resolved the leading slash against
// the CDN origin — 404, broken image on both buy-bonus popups.
// The cards and the confirm dialog lead with these, art-panel-on-top.
// buy_bonus_x3 is the bonus symbol three times over a quiet navy gradient
// (the trigger, literally); the ante card is the full loading-screen kraken.
const buyCardImg = new URL('../../assets/sprites/betmodes/buy_bonus_x3.webp', import.meta.url).href;
// the ante card leads with the SAME full kraken art as the loading screen —
// one asset, no per-surface crop (the 840x360 ante_card band is retired)
const anteCardImg = new URL(
	'../../assets/sprites/loading/kraken_intro.webp',
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
	// social mode (stake.us) bans bet/buy/bought/purchase/"place your bets" and
	// is English-only, so the replacements are plain strings — see
	// stake-engine.com/docs/reference/social-mode. betAmountLabel lands in the
	// SDK's bottom bar (LabelBet) whenever the mode is active, so it counts too.
	const social = (socialText: string, key: string) =>
		stateUrlDerived.social() ? socialText : t(key);
	const isSocial = stateUrlDerived.social();
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
		assets: {
			...NO_ASSETS,
			dialogImage: anteCardImg,
		},
		text: {
			title: social('ANTE PLAY', 'ANTE BET'),
			dialog: social(
				'Double your total play for double the chance of triggering Kraken Spins and Free Spins. Ante Play stays active until you turn it off.',
				'Double your total bet for double the chance of triggering Kraken Spins and Free Spins. Ante Bet stays active until you turn it off.',
			),
			description: t('Doubles the chance of Kraken Spins and Free Spins.'),
			button: t('ACTIVATE'),
			betAmountLabel: isSocial ? 'ANTE PLAY' : 'ANTE BET',
			tickerIdle: isSocial ? 'ANTE PLAY IS ACTIVE' : 'ANTE BET IS ACTIVE',
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
			dialogImage: buyCardImg,
		},
		text: {
			title: t('FREE SPINS'),
			// Swapped 2026-08-26: the SHOP card is the hero now — big art, title,
			// price, one short line — and the CONFIRM carries the full feature
			// explanation before the player commits. Same two translation keys as
			// before, exchanged, so no locale churn. The cost is spliced in from
			// config so the copy can never drift from what the RGS charges.
			dialog: t(
				'Instantly triggers 6, 12 or 18 Free Spins. Every Free Spin is a Kraken Spin: the Kraken adds Wilds, Coins or copies of one paying symbol to the reels, and can award a win multiplier for the spin.',
			),
			description: social(
				'Play the Free Spins Feature for __0__x your total play.\nThe Bonus trigger spin awards 6, 12 or 18 Free Spins.',
				'Buy the Free Spins Feature for __0__x your total bet. The Bonus trigger spin awards 6, 12 or 18 Free Spins.',
			).replace('__0__', `${config.betModes.bonus.cost}`),
			button: social('PLAY', 'BUY'),
			betAmountLabel: isSocial ? 'FEATURE' : 'BONUS BUY',
			tickerIdle: isSocial ? 'COME AND PLAY' : 'PLACE YOUR BET',
			tickerSpin: isSocial ? 'FEATURE ACTIVATED' : 'BONUS BUY ACTIVATED',
		},
		maxWin: config.betModes.bonus.max_win,
	},
	};
};

export function applyBetModeMeta() {
	stateMeta.betModeMeta = buildBetModeMeta();
}
