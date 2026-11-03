import { stateI18nDerived, stateUrlDerived } from 'state-shared';

export const i18nDerived = {
	bet: () => stateUrlDerived.social() ? 'PLAY' : stateI18nDerived.translate('BET'),
	max: () => stateI18nDerived.translate('MAX'),
	betMenu: () => stateUrlDerived.social() ? 'PLAY MENU' : stateI18nDerived.translate('BET MENU'),
	selectYourBet: () => stateUrlDerived.social() ? 'SELECT YOUR PLAY' : stateI18nDerived.translate('SELECT YOUR BET'),
	confirm: () => stateI18nDerived.translate('CONFIRM'),
	cost: () => stateI18nDerived.translate('COST'),
	masterVolume: () => stateI18nDerived.translate('MASTER VOLUME'),
	musicVolume: () => stateI18nDerived.translate('MUSIC VOLUME'),
	soundEffectVolume: () => stateI18nDerived.translate('SOUND EFFECT VOLUME'),
	autoSpins: () => stateI18nDerived.translate('AUTO SPINS'),
	numberOfRounds: () => stateI18nDerived.translate('NUMBER OF ROUNDS'),
	advanced: () => stateI18nDerived.translate('ADVANCED'),
	singleWinLimit: () => stateI18nDerived.translate('SINGLE WIN LIMIT'),
	lossLimit: () => stateUrlDerived.social() ? 'STOP LIMIT' : stateI18nDerived.translate('LOSS LIMIT'),
	startAutoplay: () => stateI18nDerived.translate('START AUTOPLAY'),
	notification: () => stateI18nDerived.translate('NOTIFICATION'),
	autoSpinsStopInfo: () => stateI18nDerived.translate('AUTO PLAY HAS STOPPED DUE TO'),
	// Stake review 2026-10-29: "Insufficient Funds", and "Insufficient Balance" on Stake.us
	insufficientFunds: () => stateUrlDerived.social()
		? 'INSUFFICIENT BALANCE TO PLACE THIS PLAY. PLEASE ADD COINS TO YOUR ACCOUNT OR LOWER THE PLAY LEVEL.'
		: stateI18nDerived.translate('INSUFFICIENT FUNDS TO PLACE THIS BET. PLEASE ADD FUNDS TO YOUR ACCOUNT OR LOWER THE BET LEVEL.'),
	insufficientFundsTitle: () => stateUrlDerived.social()
		? 'INSUFFICIENT BALANCE'
		: stateI18nDerived.translate('INSUFFICIENT FUNDS'),
	insufficientFundsAction: () => stateUrlDerived.social()
		? 'PLEASE ADD COINS TO YOUR ACCOUNT OR LOWER THE PLAY LEVEL.'
		: stateI18nDerived.translate('PLEASE ADD FUNDS TO YOUR ACCOUNT OR LOWER THE BET LEVEL.'),
	errorTitle: () => stateI18nDerived.translate('SOMETHING WENT WRONG'),
	errorConnection: () => stateI18nDerived.translate('UNABLE TO CONNECT TO THE GAME SERVER. PLEASE CHECK YOUR CONNECTION AND RELOAD THE GAME.'),
	errorSession: () => stateI18nDerived.translate('YOUR SESSION IS INVALID OR HAS EXPIRED. PLEASE RELOAD THE GAME.'),
	errorGeneric: () => stateI18nDerived.translate('THE GAME IS UNAVAILABLE RIGHT NOW. PLEASE RELOAD THE GAME OR TRY AGAIN LATER.'),
	lossLimitReached: () => stateUrlDerived.social() ? 'STOP LIMIT REACHED' : stateI18nDerived.translate('LOSS LIMIT REACHED'),
	singleWinLimitReached: () => stateI18nDerived.translate('SINGLE WIN LIMIT REACHED'),
	settings: () => stateI18nDerived.translate('SETTINGS'),
};
