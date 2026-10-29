import { stateBet } from 'state-shared';

export const stateBuy = $state({
	// the shop offer the confirm dialog is showing (buyOptions.ts key)
	selectedOptionKey: '',
	// the ante that was on when free spins were bought: switched back on when
	// the player leaves the armed buy (the SDK would otherwise drop to BASE)
	anteAfterBuy: '',
	/**
	 * The bought mode kept selected after its round (Evtim, 2026-10-27): the
	 * next spin press opens its confirm card instead of a base spin (Stake wants
	 * a buy confirmed after every round). Set when a bought round ends, cleared
	 * by a new confirm, the X on the buy slot, or any other mode change.
	 */
	armedKey: '',
	// the confirm card was opened by the spin press: back/X close it, no shop
	confirmFromSpin: false,
});

/** Leave the armed buy: back to the ante the player had before buying, or BASE. */
export const disarmBuy = () => {
	const ante = stateBuy.anteAfterBuy;
	stateBuy.armedKey = '';
	stateBuy.anteAfterBuy = '';
	stateBet.activeBetModeKey = ante || 'BASE';
};
