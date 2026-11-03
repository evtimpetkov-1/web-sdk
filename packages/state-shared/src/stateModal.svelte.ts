type ModalEmpty = null;

type ModalError = {
	name: 'error';
	error: any;
};

type ModalBetMenu = {
	name: 'betAmountMenu';
};

type ModalBuyBonus = {
	name: 'buyBonus';
};

type ModalBuyBonusConfirm = {
	name: 'buyBonusConfirm';
};

type ModalAutoSpin = {
	name: 'autoSpin';
};

type ModalAutoSpinMessage = {
	name: 'autoSpinMessage';
	message: 'insufficientFunds' | 'lossLimitReached' | 'singleWinLimitReached';
};

/** A bet pressed (button, Space) while its cost is over the balance. */
type ModalInsufficientFunds = {
	name: 'insufficientFunds';
};

type ModalPayTable = {
	name: 'payTable';
};

type ModalGameRules = {
	name: 'gameRules';
};

type ModalSettings = {
	name: 'settings';
};

type Modal =
	| ModalEmpty
	| ModalError
	| ModalBetMenu
	| ModalBuyBonus
	| ModalBuyBonusConfirm
	| ModalAutoSpin
	| ModalAutoSpinMessage
	| ModalInsufficientFunds
	| ModalPayTable
	| ModalGameRules
	| ModalSettings;

export const stateModal = $state({
	modal: null as Modal,
});
