import type { BaseBet } from 'utils-bet';
import { stateMeta } from './stateMeta.svelte';

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

/**
 * The bar's bet steppers move through the RGS bet levels whatever the balance,
 * as the bet menu does; a bet the balance cannot cover is answered when it is
 * PRESSED, with the insufficient-funds popup (ButtonBetProvider). Every step
 * used to be clamped to what the balance covered, so on a low balance "+"
 * snapped straight back (or stepped down) and the stepper looked dead, while
 * Stake wants every level from /authenticate selectable (2026-10-29). The
 * callers pass levels from betAmountOptions, so nothing off-level is minted.
 */
const setBetAmount = (value: number) => {
	stateBet.betAmount = Math.max(value, 0);
};

const updateBetAmount = (update: (value: number) => number) => {
	stateBet.betAmount = Math.max(update(stateBet.betAmount), 0);
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
