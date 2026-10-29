import { stateMeta, stateUrlDerived, type BetModeData, type BetModeMeta } from 'state-shared';

import config from './config';
import { ANTE_OPTIONS, BUY_OPTIONS, type ShopOffer } from './buyOptions';

const NO_ASSETS = { icon: '', dialogImage: '', dialogVolatility: '', volatility: '', button: '' };
const NO_TEXT = { title: '', dialog: '', button: '', betAmountLabel: '', tickerIdle: '', tickerSpin: '' };

/**
 * Bet-mode metadata for the SDK's bet-mode plumbing: the mode name sent to the
 * RGS, the cost multiplier ('activate' modes charge bet x cost on every spin),
 * and the bottom-bar label shown while a mode is active. Replaces the SDK
 * sample defaults. The shop SCREENS (BuyShop/BuyConfirm) draw from
 * buyOptions.ts, which is also where these modes' titles and costs come from.
 *
 * A function, not a module const: social-mode wording depends on the URL state.
 */
const buildBetModeMeta = (): BetModeMeta => {
	const social = stateUrlDerived.social();
	const mode = (
		option: ShopOffer,
		type: BetModeData['type'],
		text: Partial<BetModeData['text']>,
	): [string, BetModeData] => [
		option.key,
		{
			mode: option.key,
			costMultiplier: option.costMultiplier,
			type,
			parent: '',
			children: '',
			assets: { ...NO_ASSETS, dialogImage: option.image },
			text: { ...NO_TEXT, title: option.title(), description: option.description(), ...text },
			maxWin: option.maxWin,
		},
	];
	return {
		BASE: {
			mode: 'BASE',
			costMultiplier: config.betModes.base.cost,
			type: 'default',
			parent: '',
			children: '',
			assets: NO_ASSETS,
			text: NO_TEXT,
			maxWin: config.betModes.base.max_win,
		},
		// betAmountLabel only shows through the SDK's LabelBet, which the
		// layouts don't use: the bar reads "BET" plus bet x cost
		// (stateBetDerived.betCost), the real per-spin cost Stake wants on screen
		...Object.fromEntries(
			ANTE_OPTIONS.map((option) =>
				mode(option, 'activate', { betAmountLabel: option.title() }),
			),
		),
		...Object.fromEntries(
			BUY_OPTIONS.map((option) =>
				mode(option, 'buy', {
					button: social ? 'PLAY' : 'BUY',
					betAmountLabel: social ? 'FEATURE' : 'BONUS BUY',
					tickerIdle: social ? 'COME AND PLAY' : 'PLACE YOUR BET',
					tickerSpin: social ? 'FEATURE ACTIVATED' : 'BONUS BUY ACTIVATED',
				}),
			),
		),
	};
};

export function applyBetModeMeta() {
	stateMeta.betModeMeta = buildBetModeMeta();
}
