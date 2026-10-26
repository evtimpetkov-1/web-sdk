export const stateBuy = $state({
	// the shop offer the confirm dialog is showing (buyOptions.ts key)
	selectedOptionKey: '',
	// the ante that was on when free spins were bought: switched back on when
	// the bought round ends (the SDK would otherwise drop to BASE)
	anteAfterBuy: '',
});
