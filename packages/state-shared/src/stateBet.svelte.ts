import type { BaseBet } from 'utils-bet';
import { stateMeta } from './stateMeta.svelte';
import { stateConfig } from './stateConfig.svelte';

export type Currency = string;
export type BetToResume = BaseBet | null;
export type BetModeKey = string;

export const stateBet = $state({
	currency: 'USD' as Currency,
	balanceAmount: 0,
	betAmount: 1,
	wageredBetAmount: 1,
	betToResume: null as BetToResume,
	activeBetModeKey: 'BASE' as BetModeKey,
	winBookEventAmount: 0,
	autoSpinsLoss: 0,
	autoSpinsCounter: 0,
	autoSpinsLossLimitAmount: Infinity,
	autoSpinsSingleWinLimitAmount: Infinity,
	isSpaceHold: false,
	isTurbo: false,
	/**
	 * The player's turbo setting: what the turbo button shows and toggles, and what
	 * isTurbo returns to after a slam-stopped spin (a temporary turbo). Reactive so
	 * the button can display it: it used to keep a private copy, which a Space-hold
	 * release (it forced turbo off) left lit with turbo off (2026-10-26).
	 */
	isTurboPersistent: false,
	/**
	 * Opt-in hook for a spin press (button or Space) while the active mode is a
	 * 'buy'. Unset, the press drops the mode to BASE and spins, as it always has.
	 * A game that keeps a bought mode armed between rounds sets it and returns
	 * true when it handled the press itself (Mad Science opens its confirm card:
	 * Stake wants a buy confirmed again after every round).
	 */
	onBuyModeBet: null as null | (() => boolean),
});

const correctBetAmount = (value: number) => {
	if (value <= 0) return 0;
	const costMultiplier = betCostMultiplier();
	if (costMultiplier === 0) return 0;
	const max = stateBet.balanceAmount / costMultiplier;
	if (value >= max) {
		/**
		 * Snap DOWN to the largest LEGAL bet level the balance covers — never to
		 * the raw division. Clamping to `max` itself minted bet amounts that
		 * exist nowhere in betAmountOptions (balance 14.9 + "+" -> bet 14.9),
		 * which the RGS would refuse. If even the smallest level is out of
		 * reach, return that smallest level: the bet stays valid and the
		 * affordability gates are what stop the spin.
		 */
		const options = [...stateConfig.betAmountOptions].sort((a, b) => a - b);
		const affordable = options.filter((option) => option <= max);
		if (affordable.length > 0) return affordable[affordable.length - 1];
		return options[0] ?? 0;
	}
	return value;
};

const setBetAmount = (value: number) => {
	stateBet.betAmount = correctBetAmount(value);
};

const updateBetAmount = (update: (value: number) => number) => {
	stateBet.betAmount = correctBetAmount(update(stateBet.betAmount));
};

const updateIsTurbo = (value: boolean, options: { persistent: boolean }) => {
	const { persistent } = options;

	// a temporary change (a slam stop, its reset at the round's end) never
	// overrides turbo the player switched on
	if (!persistent && stateBet.isTurboPersistent) return;
	if (persistent) stateBet.isTurboPersistent = value;

	stateBet.isTurbo = value;
};

const activeBetMode = () => stateMeta.betModeMeta?.[stateBet.activeBetModeKey.toUpperCase()]
	?? stateMeta.betModeMeta?.[stateBet.activeBetModeKey.toLowerCase()]
	?? null;
const isContinuousBet = () => stateBet.autoSpinsCounter > 1 || stateBet.isSpaceHold;
const timeScale = () => (stateBet.isTurbo ? 2 : 1);
const betCostMultiplier = () =>
	stateBetDerived.activeBetMode().type === 'activate'
		? stateBetDerived.activeBetMode().costMultiplier
		: 1;
const betCost = () => stateBet.betAmount * betCostMultiplier();
const isBetCostAvailable = () => betCost() > 0 && betCost() <= stateBet.balanceAmount;
const hasAutoBetCounter = () => stateBet.autoSpinsCounter !== 0;

export const stateBetDerived = {
	setBetAmount,
	updateBetAmount,
	updateIsTurbo,
	activeBetMode,
	isContinuousBet,
	timeScale,
	betCost,
	isBetCostAvailable,
	hasAutoBetCounter,
};
