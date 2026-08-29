import { stateI18nDerived, stateUrlDerived } from 'state-shared';

import { i18nDerived as i18nDerivedUiPixi } from 'components-ui-pixi';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

const t = (key: string) => stateI18nDerived.translate(key);
/**
 * Social mode (stake.us) forbids gambling terms — bet, buy, bought, purchase,
 * bonus buy... — and is English-only (LoadI18n forces the en catalog), so the
 * replacements are plain English strings, same as the SDK's own i18nDerived.
 * Restricted list: stake-engine.com/docs/reference/social-mode
 */
const social = (socialText: string, key: string) =>
	stateUrlDerived.social() ? socialText : t(key);

export const i18nDerived = {
	...i18nDerivedUiPixi,
	...i18nDerivedUiHtml,
	home: () => t('HOME'),
	// PressToContinue
	pressAnywhere: () => t('PRESS ANYWHERE TO CONTINUE'),
	// FreeSpinIntro
	congratulations: () => t('CONGRATULATIONS!'),
	youWon: () => t('YOU WON'),
	// FS intro card (v4) — badge captions
	fsIntroKraken: () => t('EVERY SPIN IS A KRAKEN SPIN'),
	fsIntroMult: () => t('MULTIPLIERS UP TO x10'),
	fsIntroBonus: () => t('EACH BONUS AWARDS +1 SPIN'),
	// BoardFrame
	totalWin: () => t('TOTAL WIN'),
	// LoadingScreen
	krakenSpin: () => t('KRAKEN SPIN'),
	loadingFsDesc: () => t('Land 3, 4 or 5 Bonus symbols anywhere on the reels to win 6, 12 or 18 Free Spins. Every Free Spin is a Kraken Spin.'),
	loadingKrakenDesc: () => social(
		'The Krakos can strike any spin, adding Wilds, Coins or extra winning symbols to the reels.',
		'The Kraken can strike any spin, adding Wilds, Coins or extra paying symbols to the reels.',
	),
	// AnteBuyPanels
	buyWord: () => social('PLAY', 'BUY'),
	onWord: () => t('ON'),
	offWord: () => t('OFF'),
	// "win feature" is on the restricted list
	anteTagline: () => social('DOUBLE CHANCE TO\nTRIGGER ALL FEATURES', 'DOUBLE CHANCE TO WIN FEATURES'),
	// BuyShop — ante card header fallback (EN draws the CHANCE X2 art)
	chanceX2: () => t('CHANCE X2'),
	// BoardFrame — kraken spin multiplier plate
	multiplierLabel: () => t('MULTIPLIER'),
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
	coin: () => t('Coin'),
	// PayTable — descriptions
	wildDesc: () => t('Substitutes for all symbols except Bonus and Coin. A Wild Kraken Spin adds 1 to 10 Wild symbols to the reels.'),
	bonusDesc: () => t('3 Bonus = 6 Free Spins\n4 Bonus = 12 Free Spins\n5 Bonus = 18 Free Spins'),
	coinDesc: () => t('Carries a value of __0__ the total __1__. All Coin values on the reels are totalled and awarded in addition to any line win.'),
	paylinesDesc: () => t('20 fixed paylines. Wins pay from left to right on consecutive reels, starting from the leftmost reel. Bonus symbols award Free Spins in any position.'),
	winlinesDesc: () => t('20 fixed winlines. Wins count from left to right on consecutive reels, starting from the leftmost reel. Bonus symbols award Free Spins in any position.'),
	// Replay
	replay: () => t('REPLAY'),
	noWin: () => t('NO WIN'),
	playAgain: () => t('PLAY AGAIN'),
	/**
	 * Replay intro/outro card (ReplayOverlay). The three social replacements
	 * below were named by the reviewer verbatim: Base Bet -> Base Play, Cost
	 * Multiplier -> Feature Multiplier, Payout Multiplier -> Final Multiplier.
	 * The title and the cost row follow the same bet -> play swap the rest of
	 * the game already uses in social mode.
	 */
	replayTitle: () => social('Play Replay', 'Bet Replay'),
	/**
	 * Mode row. Only BASE needs its own string; ANTE and BONUS reuse the
	 * accessors the rest of the game names those modes with (chanceX2 and
	 * buyFeature), so they can never drift apart.
	 */
	replayModeBase: () => t('BASE GAME'),
	replayMode: () => t('Mode'),
	replayBaseBet: () => social('Base Play', 'Base Bet'),
	replayCostMultiplier: () => social('Feature Multiplier', 'Cost Multiplier'),
	replayTotalCost: () => social('Total Play Cost', 'Total Bet Cost'),
	replayPayoutMultiplier: () => social('Final Multiplier', 'Payout Multiplier'),
	replayTotalWin: () => t('Total Win'),
	replayStart: () => t('Start Replay'),
	replayAgain: () => t('Replay Again'),
	replayDisclaimer: () => social(
		'This is a replay of a previous round. No plays will be placed.',
		'This is a replay of a previous bet round. No bets will be placed.',
	),
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
	coinSymbol: () => t('Coin Symbol'),
	krakenSpinHeader: () => t('Kraken Spin'),
	bonusFreeSpins: () => t('Bonus & Free Spins'),
	// The ante mode is called "Chance X2" now. The strings below stay as the
	// stable translation IDs — every locale's VALUE for them is the Chance X2
	// wording (see messagesMap).
	anteBetHeader: () => t('Ante Bet'),
	buyFeature: () => social('Free Spins Feature', 'Buy Feature'),
	generalRules: () => t('General Rules'),
	uiGuide: () => t('User Interface Guide'),
	disclaimer: () => t('Disclaimer'),
	// GameRules — paragraphs
	overviewDesc: () => t("Kraken's Wilds is a 5-reel, 3-row video slot with 20 fixed __0__. Winning combinations form from left to right on consecutive reels, starting from the leftmost reel. Only the highest win on each __1__ is __2__."),
	// Per-mode RTPs + max wins, per the uploaded v2.1 math (see
	// config.betModes). Numbers are baked into each locale's translation in its
	// own number format — a math retune means rotating this key in all 17 files.
	betModeRtp: () => social(
		'The theoretical return to player (RTP) of the base game is 96.52%. With Chance X2 active the RTP is 96.46%. The RTP of the Free Spins Feature is 96.42%. The maximum win is 1,890.60x the total __0__ in the base game, 1,978.00x with Chance X2 active and 2,536.70x in the Free Spins Feature.',
		'The theoretical return to player (RTP) of the base game is 96.52%. With Ante Bet active the RTP is 96.46%. The RTP of the Buy Feature is 96.42%. The maximum win is 1,890.60x the total __0__.',
	),
	betModeMultiplier: () => t('All __0__ values are shown as multipliers of the total __1__ amount.'),
	wildSymbolDesc: () => t('The Wild (Kraken) substitutes for all symbols except the Bonus and Coin symbols. Wild combinations award their own __0__ values.'),
	coinSymbolDesc: () => t('Each Coin symbol carries a value of __0__ the total __1__, shown on the coin. Coin symbols do not form line combinations; their values are totalled and awarded as an additional __2__.'),
	krakenSpinDesc: () => t('Any base game spin may trigger a Kraken Spin. When it does, the Kraken places additional symbols on the reels before they come to rest, in one of three forms:'),
	// "paying" is the -ing form of a restricted term (pay -> win), so social mode
	// takes the same swap the rest of the copy uses: paylines -> winlines,
	// paying symbol -> winning symbol.
	krakenSpinSymbol: () => social(
		'Symbol — one regular winning symbol is chosen and its copies are added to the reels. All __0__ are evaluated once the copies are in place.',
		'Symbol — one regular paying symbol is chosen and its copies are added to the reels. All __0__ are evaluated once the copies are in place.',
	),
	krakenSpinWild: () => t('Wild — 1 to 10 Wild symbols are added to the reels. All __0__ are evaluated once they are in place, and any win is __1__.'),
	krakenSpinCoin: () => t('Coin — 1 to 10 Coin symbols are added to the reels. __0__ are evaluated first; the values of all Coin symbols are then totalled and awarded in addition.'),
	krakenSpinFs: () => t('Every spin during the Free Spins feature is a Kraken Spin.'),
	fs3Bonus: () => t('3 Bonus symbols anywhere on the reels award 6 Free Spins.'),
	fs4Bonus: () => t('4 Bonus symbols award 12 Free Spins.'),
	fs5Bonus: () => t('5 Bonus symbols award 18 Free Spins.'),
	fsDesc: () => social(
		'Every Free Spin is a Krakos Spin, adding Wild, Coin or winning-symbol copies to the reels before they come to rest. Each Bonus symbol landing during Free Spins awards 1 additional Free Spin, with no limit on retriggers.',
		'Every Free Spin is a Kraken Spin, adding Wild, Coin or paying-symbol copies to the reels before they come to rest. Each Bonus symbol landing during Free Spins awards 1 additional Free Spin, with no limit on retriggers.',
	),
	fsMultiplierDesc: () => t('On any Free Spin, the Kraken can also award a win multiplier for that spin. It applies to all wins from that spin, including Coin wins.'),
	anteBetCost: () => social(
		'Chance X2 doubles the total __0__ (x2). It can be turned on or off at any time while the game is idle.',
		'Ante Bet doubles the total __0__ (x2). It can be turned on or off at any time while the game is idle.',
	),
	anteBetChance: () => social(
		'While Chance X2 is active, the chance of triggering a Krakos Spin is doubled, and the chance of triggering Free Spins is doubled.',
		'While Ante Bet is active, the chance of triggering a Kraken Spin is doubled, and the chance of triggering Free Spins is doubled.',
	),
	anteBetWins: () => t('All __0__ values remain multiples of the base (non-doubled) __1__ amount.'),
	buyFeatureDesc: () => social(
		'The Free Spins feature can be instantly triggered for __0__ the total __1__. An instantly triggered feature plays exactly as one triggered by Bonus symbols.',
		'The Free Spins feature can be bought directly for __0__ the total __1__. A purchased feature plays exactly as one triggered by Bonus symbols, and the return to player is the same.',
	),
	grHighestWin: () => t('Only the highest win per __0__ is __1__.'),
	grSimultaneous: () => t('Simultaneous wins on different __0__ are added together.'),
	grLineBonus: () => t('__0__ wins and Bonus wins are added together.'),
	grBonusAny: () => t('Bonus symbols award Free Spins in any position; they do not need to land on a __0__.'),
	// GameRules — UI guide
	uiSpin: () => t('Spin — Start a spin at the current __0__ amount.'),
	uiStop: () => t('Stop — Stop the reels early during a spin.'),
	uiAutoSpin: () => t('Auto Spin — Automatically spin a set number of times.'),
	uiTurbo: () => t('Turbo — Speed up reel animations.'),
	uiBuyBonus: () => social(
		'Feature (chest) — Opens the Free Spins feature menu.',
		'Bonus Buy (chest) — Opens the Free Spins buy menu.',
	),
	uiAnte: () => social(
		'Chance X2 (toggle) — Turn Chance X2 on or off.',
		'Ante Bet (toggle) — Turn Ante Bet on or off.',
	),
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
