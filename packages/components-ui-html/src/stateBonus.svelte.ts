import { stateMeta } from 'state-shared';

export const stateBonus = $state({
	selectedBetModeKey: 'BASE',
	/**
	 * When true, the buy-bonus shop (ModalBuyBonus) lists ONLY the buy-type
	 * modes — no activate cards. Set by game UI that offers a dedicated
	 * feature-buy entry point (e.g. a BUY panel beside the reels); the game is
	 * responsible for clearing it once its modal flow ends, so the regular
	 * buy-bonus button keeps showing the full shop.
	 */
	shopBuyOnly: false,
});

export const stateBonusDerived = {
	selectedBetModeData: () => stateMeta.betModeMeta[stateBonus.selectedBetModeKey],
};
