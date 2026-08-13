import { stateI18nDerived } from 'state-shared';

import { i18nDerived as i18nDerivedUiPixi } from 'components-ui-pixi';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

const t = (key: string) => stateI18nDerived.translate(key);

export const i18nDerived = {
	...i18nDerivedUiPixi,
	...i18nDerivedUiHtml,
	home: () => t('HOME'),
	// PressToContinue
	pressAnywhere: () => t('PRESS ANYWHERE TO CONTINUE'),
	// FreeSpinIntro
	congratulations: () => t('CONGRATULATIONS!'),
	youWon: () => t('YOU WON'),
	// BoardFrame
	totalWin: () => t('TOTAL WIN'),
	// LoadingScreen
	randomWilds: () => t('RANDOM WILDS'),
	loadingFsDesc: () => t('3 or more Bonus symbols anywhere on the reels trigger Free Spins'),
	loadingWildsDesc: () => t('Each Free Spin guarantees 1 to 10 Random Wilds on the reels'),
	// PayTable — headers
	specialSymbols: () => t('Special Symbols'),
	symbolPayouts: () => t('Symbol Payouts'),
	symbolWins: () => t('Symbol Wins'),
	payLinesHeader: () => t('Pay Lines'),
	winLinesHeader: () => t('Win Lines'),
	// PayTable — symbol names
	wild: () => t('Wild'),
	bonus: () => t('Bonus'),
	trident: () => t('Trident'),
	ship: () => t('Ship'),
	anchor: () => t('Anchor'),
	bottle: () => t('Message in a Bottle'),
	// PayTable — descriptions
	wildDesc: () => t('Substitutes for all symbols except Bonus. During Free Spins, 1, 2, 3, 4, 5, 6, 7, 8, 9, or 10 Random Wilds are placed on the reels each spin.'),
	bonusDesc: () => t('3 Bonus = 6 Free Spins\n4 Bonus = 12 Free Spins\n5 Bonus = 18 Free Spins'),
	paylinesDesc: () => t('20 fixed paylines, left to right. Only symbols on adjacent reels starting from the leftmost reel count. This does not apply to Bonus symbols.'),
	winlinesDesc: () => t('20 fixed winlines, left to right. Only symbols on adjacent reels starting from the leftmost reel count. This does not apply to Bonus symbols.'),
	// Replay
	replay: () => t('REPLAY'),
	noWin: () => t('NO WIN'),
	playAgain: () => t('PLAY AGAIN'),
	// GameRules — social mode words
	betWord: () => t('bet'),
	playWord: () => t('play'),
	payoutWord: () => t('payout'),
	winWord: () => t('win'),
	paylineWord: () => t('payline'),
	winlineWord: () => t('winline'),
	paylinesWord: () => t('paylines'),
	winlinesWord: () => t('winlines'),
	paidWord: () => t('paid'),
	wonWord: () => t('won'),
	// GameRules — headers
	gameOverview: () => t('Game Overview'),
	betMode: () => t('Bet Mode'),
	playMode: () => t('Play Mode'),
	wildSymbol: () => t('Wild Symbol'),
	bonusFreeSpins: () => t('Bonus & Free Spins'),
	generalRules: () => t('General Rules'),
	uiGuide: () => t('User Interface Guide'),
	disclaimer: () => t('Disclaimer'),
	// GameRules — paragraphs
	overviewDesc: () => t("Kraken's Wilds is a 5-reel, 3-row video slot with 20 fixed __0__. Wins are evaluated from left to right on each __1__, starting from the leftmost reel. Only symbols on adjacent reels count. The highest win per __1__ is __2__."),
	betModeRtp: () => t('Base game: RTP 96.50%. Maximum win: 5,000x total __0__.'),
	betModeMultiplier: () => t('All __0__ values are shown as multipliers of the total __1__ amount.'),
	wildSymbolDesc: () => t('The Wild (Kraken) substitutes for all symbols except the Bonus symbol. Wild has its own __0__ values.'),
	fs3Bonus: () => t('3 Bonus symbols anywhere on the reels award 6 Free Spins.'),
	fs4Bonus: () => t('4 Bonus symbols award 12 Free Spins.'),
	fs5Bonus: () => t('5 Bonus symbols award 18 Free Spins.'),
	fsDesc: () => t('During Free Spins, 1, 2, 3, 4, 5, 6, 7, 8, 9, or 10 Random Wilds are placed on the reels at the start of each spin. Every Bonus symbol that lands during Free Spins awards +1 additional Free Spin. There is no limit on retriggers.'),
	grHighestWin: () => t('Only the highest win per __0__ is __1__.'),
	grSimultaneous: () => t('Simultaneous wins on different __0__ are added together.'),
	grLineBonus: () => t('__0__ wins and Bonus wins are added together.'),
	grBonusAny: () => t('Bonus symbols __0__ in any position (not limited to __1__).'),
	// GameRules — UI guide
	uiSpin: () => t('Spin — Start a spin at the current __0__ amount.'),
	uiStop: () => t('Stop — Stop the reels early during a spin.'),
	uiAutoSpin: () => t('Auto Spin — Automatically spin a set number of times.'),
	uiTurbo: () => t('Turbo — Speed up reel animations.'),
	uiPlusMinus: () => t('+/− — Increase or decrease the __0__ amount.'),
	uiMenu: () => t('Menu (☰) — Open the settings menu.'),
	uiPaytable: () => t('__0__ — View symbol __1__ values and __2__.'),
	uiGameRules: () => t('Game Rules — View the game rules and disclaimer.'),
	uiSound: () => t('Sound — Toggle game sounds on or off.'),
	uiSettings: () => t('Settings — Adjust game settings.'),
	payTableLabel: () => t('Pay Table'),
	winTableLabel: () => t('Win Table'),
	// GameRules — disclaimer
	disclaimerText: () => t('Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser.'),
};
