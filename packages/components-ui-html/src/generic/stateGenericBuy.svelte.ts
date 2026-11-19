/**
 * What the generic shop and the generic bar share about a BOUGHT mode.
 *
 * A bought mode stays selected when its round ends ("armed"), as in the bars the
 * games had before the generic one (Evtim, 2026-10-27, asked back 2026-11-18): the
 * bar's BET and the box on Spin show what the next round would cost, and a press
 * on Spin opens the confirmation again, never a silent second purchase (Stake
 * wants a bought mode confirmed after every round). The bonus button's X leaves it.
 */
export const stateGenericBuy = $state({
	/** the buy mode left selected after its round, as stateBet.activeBetModeKey spells it */
	armedKey: '',
	/** where leaving the buy goes back to: the switch that was on before it, or BASE */
	modeAfterBuy: 'BASE',
	/** the confirmation on screen was opened by Spin, not from the shop: Back closes it */
	confirmFromSpin: false,
});
