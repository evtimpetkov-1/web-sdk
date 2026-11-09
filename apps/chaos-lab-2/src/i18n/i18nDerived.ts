import { stateI18nDerived, stateUrlDerived } from 'state-shared';

import { i18nDerived as i18nDerivedUiPixi } from 'components-ui-pixi';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

/**
 * stake.us restricts "cash" (docs/reference/social-mode: cash -> coins), so in
 * social mode the feature reads COIN RESPINS: every string this file returns
 * passes through here. English only (social forces the en catalog).
 */
const socialWords = (text: string) =>
	text.replace(/\bCASH\b/g, 'COIN').replace(/\bCash\b/g, 'Coin').replace(/\bcash\b/g, 'coin');
const t = (key: string) => {
	const text = stateI18nDerived.translate(key);
	return stateUrlDerived.social() ? socialWords(text) : text;
};
/**
 * Social mode (stake.us) forbids gambling terms and is English-only (LoadI18n
 * forces the en catalog), so the replacement is a plain English string.
 * Wording: the operator's social terms table (Buy -> Play, Cost -> Value,
 * Paytable -> Win Table) ahead of stake-engine.com/docs/reference/social-mode.
 * The mode names (Evtim, 2026-10-24) carry no restricted word.
 */
const social = (socialText: string, key: string) =>
	stateUrlDerived.social() ? socialWords(socialText) : t(key);

/** a game key, translated (and social-safe): for keys held in data, e.g. the intro's PANELS */
export const translateGame = t;

/**
 * English and social draw the baked English title art (the FS popup's titles,
 * the FREE SPINS word, the intro's WIN UP TO banner); every other language
 * draws the matching key as text in its place (Kraken's pattern). The big win
 * titles stay art in every language, as Kraken's did.
 */
export const showsBakedArt = () => stateUrlDerived.social() || stateUrlDerived.lang() === 'en';

export const i18nDerived = {
	...i18nDerivedUiPixi,
	...i18nDerivedUiHtml,
	pressToContinue: () => t('PRESS ANYWHERE TO CONTINUE'),

	/**
	 * In-game texts. FREE SPINS, WIN, BET and CONFIRM are the SDK's keys
	 * (freeSpins / win / bet / confirm, spread in above), already translated
	 * there; the SDK's catalogs merge last, so the game never redefines them.
	 */
	// the art's words, for the languages without the art (showsBakedArt)
	congratulations: () => t('CONGRATULATIONS!'),
	youWon: () => t('YOU WON'),
	// __0__ = the top max win of all modes, formatted per locale
	winUpTo: () => t('WIN UP TO __0__'),
	// FreeSpinTotalWin + the FS outro
	totalWin: () => t('TOTAL WIN'),
	// the intro's fourth panel title (Chaos Lab's read the SDK's FREE SPINS)
	cashRespinsTitle: () => t('CASH RESPINS'),
	// Cash Respins (Chaos Lab 2): the FS counter's label, and the intro's count
	// word where there is no title art (showsBakedArt). English only so far: the
	// other catalogs fall back to these keys until the translation pass.
	respinsLeft: () => t('RESPINS LEFT'),
	respins: () => t('RESPINS'),
	// the respins intro's line under "3 RESPINS", when the grid starts with frames
	withFrames: () => t('WITH __0__ MULTIPLIER FRAMES'),

	/**
	 * BuyShop + BuyConfirm. Titles and pitches carry no restricted word, so
	 * they render as-is in social mode; figures are __n__ placeholders filled
	 * from config / rulesData / buyOptions.
	 */
	shopTitle: () => social('FEATURE PLAY', 'BUY FEATURE'),
	// the title when the jurisdiction switches feature buying off
	shopBoostModes: () => t('BOOST MODES'),
	perSpin: () => t('PER SPIN'),
	on: () => t('ON'),
	off: () => t('OFF'),
	buyWord: () => social('PLAY', 'BUY'),
	// Chaos Lab 2's modes (its Game Rules Specification, 2026-11-04): the three
	// buys go straight into Cash Respins
	offerOperation: () => t('OPERATION RESPINS'),
	offerMutant: () => t('MUTANT RESPINS'),
	offerOvercharged: () => t('OVERCHARGED RESPINS'),
	offerChaos: () => t('CHAOS MODE'),
	offerBoost: () => t('BONUS BOOST'),
	offerOperationText: () =>
		t('Straight into Cash Respins. They start at random as the 4, 5 or 6 Scatter version.'),
	// __0__ = the positions framed at the start (10), __1__ / __2__ = the lowest /
	// highest starting frame ("×2" / "×50")
	offerMutantText: () =>
		t('Cash Respins with __0__ multiplier frames from the start, __1__ to __2__.'),
	// __0__ / __1__ = the lowest / highest starting frame ("×2" / "×100")
	offerOverchargedText: () =>
		t('Cash Respins with every position framed from the start, __0__ to __1__.'),
	// __0__ / __1__ = "2.7×" / "1.3×" (buyOptions.ts)
	offerChaosText: () =>
		t('Multipliers, Cloners & Bombs appear __0__ more often. Cash Respins trigger __1__ more often.'),
	offerBoostText: () => t('Cash Respins trigger __0__ more often.'),

	/**
	 * GameRules + PayTable. English sentences are the keys. Every figure is a
	 * __n__ placeholder filled from config / rulesData (format.ts), never typed
	 * into a translation. A lone "bet" swaps through betWord(); a sentence with
	 * other restricted words has a social literal. Social says "regular symbol"
	 * for "paying symbol" ("winning symbol" would clash with "winning symbols
	 * are removed"), and both modes say "award" where the spec says "pay".
	 */
	betWord: () => social('play', 'bet'),
	// section headers
	rulesOverview: () => t('Game Overview'),
	rulesGameModes: () => t('Game Modes'),
	rulesWinAnywhere: () => t('Win Anywhere'),
	rulesTumbles: () => t('Tumbles'),
	rulesWild: () => t('Wild'),
	rulesScatter: () => t('Scatter'),
	rulesMultiplier: () => t('Multiplier'),
	rulesBomb: () => t('Bomb'),
	rulesCloner: () => t('Cloner'),
	rulesOrderOfPlay: () => t('Order of Play'),
	rulesCashRespins: () => t('Cash Respins'),
	rulesSwitchModes: () => t('Chaos Mode and Bonus Boost'),
	rulesBuyModes: () => social('Feature Play', 'Buy Feature'),
	rulesGeneral: () => t('General Rules'),
	rulesUiGuide: () => t('User Interface Guide'),
	rulesDisclaimer: () => t('Disclaimer'),
	// mode names
	modeBase: () => t('Main game'),
	modeChaos: () => t('Chaos Mode'),
	modeBoost: () => t('Bonus Boost'),
	modeOperation: () => t('Operation Respins'),
	modeMutant: () => t('Mutant Respins'),
	modeOvercharged: () => t('Overcharged Respins'),
	// table headers
	colMode: () => t('Mode'),
	colCost: () => social('Value', 'Cost'),
	colRtp: () => t('RTP'),
	colMaxWin: () => t('Max win'),
	// Game Overview
	rulesOverviewText: () =>
		social(
			'Chaos Lab 2 is a 6-reel, 5-row cascading slot. There are 9 regular symbols, 4 high and 5 low, and 5 special symbols: Wild, Scatter, Multiplier, Bomb and Cloner. Its feature is Cash Respins: Coins land on the grid, and Multipliers, Cloners and Bombs grow them into one total win.',
			'Chaos Lab 2 is a 6-reel, 5-row cascading slot. There are 9 paying symbols, 4 high and 5 low, and 5 special symbols: Wild, Scatter, Multiplier, Bomb and Cloner. Its feature is Cash Respins: Coins land on the grid, and Multipliers, Cloners and Bombs grow them into one total win.',
		),
	// Game Modes
	rulesGameModesText: () =>
		social(
			'The game has six modes. Each mode can be played for a multiple of the base play, and in every mode all wins are multiples of the base play. The RTP is the theoretical return to player, calculated over many rounds.',
			'The game has six modes. Each mode costs a multiple of the base bet, and in every mode all wins are multiples of the base bet. The RTP is the theoretical return to player, calculated over many rounds.',
		),
	// Win Anywhere + Tumbles
	rulesWinAnywhereText: () =>
		social(
			'A regular symbol wins when 8 or more of it are on the screen at the same time, in any positions. The win depends on how many there are: 8–9, 10–11, or 12 or more (see the Win Table). Several symbols can win at the same time, and their wins are added together.',
			'A paying symbol wins when 8 or more of it are on the screen at the same time, in any positions. The win depends on how many there are: 8–9, 10–11, or 12 or more (see the Paytable). Several symbols can win at the same time, and their wins are added together.',
		),
	rulesTumblesText: () =>
		t('After every win, the winning symbols and all Wilds are removed. The remaining symbols fall down and new symbols drop in from above to fill the empty positions. This repeats for as long as new wins appear.'),
	// Wild
	rulesWildText: () =>
		social(
			'A Wild is created only when a Bomb explodes. It substitutes for every regular symbol at the same time and counts toward each of them, so one Wild can be part of several wins. Wilds alone do not form a win.',
			'A Wild is created only when a Bomb explodes. It substitutes for every paying symbol at the same time and counts toward each of them, so one Wild can be part of several wins. Wilds alone do not form a win.',
		),
	// Scatter
	// __0__ = how many positions start framed (5 / 10)
	rulesScatterText: () =>
		t('Scatters do not form wins and are never removed during a spin. 4 or more Scatters on the screen when the spin ends start Cash Respins, including Scatters that dropped in during tumbles. Their number decides how the grid starts:'),
	rulesScatter4: () => t('4 Scatters: the grid starts empty.'),
	rulesScatter5: () => t('5 Scatters: __0__ positions start with a multiplier frame.'),
	rulesScatter6: () => t('6 or more Scatters: __0__ positions start with a multiplier frame.'),
	// Multiplier
	rulesMultiplierText: () =>
		t('Multipliers are collected into a total multiplier that multiplies every win awarded after them. Multipliers, Bombs and Cloners can appear on the first screen of a spin or among the new symbols that drop in during tumbles.'),
	rulesMultValues: () => t('Values: each Multiplier is worth __0__.'),
	rulesMultLanding: () => t('Landing: one to three Multipliers can appear at the same time.'),
	rulesMultCollection: () =>
		t('Collection: whenever Multipliers are on the screen, they are all collected before any win is awarded. They are removed, their values are added to the total multiplier, and new symbols drop in to fill their positions.'),
	rulesMultTotal: () =>
		t('Total multiplier: the sum of all Multiplier values collected. It multiplies every win awarded after it is collected. Wins awarded earlier in the spin are not multiplied. With no Multiplier collected, wins are not multiplied.'),
	rulesMultBase: () =>
		t('Base game: the total multiplier starts empty on every spin and lasts only for that spin.'),
	rulesMultCash: () =>
		t('Cash Respins: Multipliers work differently there, as multiplier frames (see Cash Respins).'),
	// Bomb
	rulesBombText: () =>
		social(
			'A Bomb clears the regular symbols around it and turns into a Wild.',
			'A Bomb clears the paying symbols around it and turns into a Wild.',
		),
	rulesBombLanding: () => t('Landing: one or two Bombs can appear at the same time.'),
	rulesBombWhen: () =>
		t('When it explodes: only when there is no winning combination on the screen. All Bombs on the screen explode at the same time.'),
	rulesBombClears: () =>
		social(
			'What it clears: every regular symbol in the 3×3 area centred on the Bomb. At the edges of the screen the area is smaller. Scatters, Wilds, Cloners and other Bombs in the area are not cleared.',
			'What it clears: every paying symbol in the 3×3 area centred on the Bomb. At the edges of the screen the area is smaller. Scatters, Wilds, Cloners and other Bombs in the area are not cleared.',
		),
	rulesBombAfter: () =>
		t('After it explodes: each Bomb stays in place as a Wild. The remaining symbols fall down, new symbols drop in, and the spin continues in the order of play.'),
	// Cloner
	rulesClonerText: () =>
		social(
			'The Cloner turns itself and 4 to 11 regular symbols on the screen into one regular symbol, to create or grow a win.',
			'The Cloner turns itself and 4 to 11 paying symbols on the screen into one paying symbol, to create or grow a win.',
		),
	rulesClonerWhen: () =>
		t('When it activates: only when there is no winning combination on the screen and no Bomb is left to explode.'),
	rulesClonerWhat: () =>
		social(
			'What it does: one regular symbol is chosen at random. The Cloner and 4 to 11 randomly selected regular symbols on the screen all turn into that symbol.',
			'What it does: one paying symbol is chosen at random. The Cloner and 4 to 11 randomly selected paying symbols on the screen all turn into that symbol.',
		),
	rulesClonerNot: () => t('What it does not change: Scatters, Wilds, Bombs and Multipliers.'),
	rulesClonerAfter: () =>
		t('After it activates: wins are checked again and the spin continues in the order of play.'),
	rulesClonerOne: () => t('Only one Cloner can be on the screen at a time.'),
	// Order of Play
	rulesOrderText: () => t('Each step of a spin resolves in this order, until nothing applies:'),
	rulesOrder1: () => t('All Multipliers on the screen are collected.'),
	rulesOrder2: () => t('Winning symbols are awarded and the screen tumbles.'),
	rulesOrder3: () => t('If there is no win, all Bombs explode.'),
	rulesOrder4: () => t('If there is no win and no Bomb, the Cloner activates.'),
	rulesOrder5: () => t('When there is no win, no Bomb and no Cloner, the spin ends.'),
	// Cash Respins (Chaos Lab 2's feature). __n__ = values from rulesData
	// (lists formatted per locale), the bet word, the respin count
	rulesCashText: () =>
		t('4 or more Scatters at the end of a base game spin start Cash Respins on the 6×5 grid with __0__ respins. Only Coins, Multipliers, Cloners and Bombs land during Cash Respins.'),
	rulesCashStart: () =>
		t('Start: the number of Scatters decides how the grid starts (see Scatter). Starting multiplier frames are worth __0__. Mutant Respins and Overcharged Respins always start with frames, as described below.'),
	// (not rulesCashRespins: that is the section's header, and a second key of
	// that name silently replaced it, so the header showed this sentence)
	rulesCashRespinsRule: () =>
		t('Respins: new symbols land on empty positions, all at the same time. Every respin where a symbol lands resets the respins to __0__.'),
	rulesCashCoin: () =>
		t('Coin: worth __0__ the base __1__. It stays on the grid until the end and is multiplied by the frame under it.'),
	rulesCashMultiplier: () =>
		t('Multiplier: worth __0__. It leaves a frame on its position, or adds its value to the frame already there. Frame values add up, to a maximum of __1__, and frames stay for the whole feature.'),
	rulesCashCloner: () =>
		t('Cloner: it turns into a coin and spreads __0__ to __1__ more coins onto empty positions, fewer if the grid is nearly full, each with its own value. Each coin is multiplied by the frame it lands on.'),
	// __2__ = Overcharged Respins' extra Bomb value (×50)
	rulesCashBomb: () =>
		t('Bomb: worth __0__ the base __1__ (in Overcharged Respins, also __2__), multiplied by the frame under it. It turns into a coin of that value and adds the same value to every coin in the 3×3 area around it.'),
	rulesCashOrderText: () => t('After the symbols of a respin land, they act in this order:'),
	rulesCashOrder1: () => t('Multipliers leave or grow their frames and disappear.'),
	rulesCashOrder2: () => t('Coins are multiplied by the frame under them.'),
	rulesCashOrder3: () => t('The Cloner turns into a coin and spreads its coins.'),
	rulesCashOrder4: () => t('Bombs turn into coins and add their value to the coins around them.'),
	rulesCashEnd: () =>
		t('End: the feature ends when no respins are left or all __0__ positions hold a coin. The win is the total of all coin values, as a multiple of the base __1__.'),
	// Chaos Mode + Bonus Boost (the RGS ante modes): __0__ = cost,
	// __1__ = betWord. No statistics here or anywhere in the rules: RTP and max
	// win are the only math figures a player sees (rulesData.ts)
	rulesSwitchModesText: () =>
		t('Chaos Mode and Bonus Boost are switched on and off in the feature menu while the game is idle. Only one can be on at a time. While one is on, each spin is played at the multiple of the base __0__ shown below, and wins stay multiples of the base __0__.'),
	rulesChaos: () =>
		t('Chaos Mode: __0__ the base __1__ per spin. Multipliers, Bombs and Cloners appear more often in the base game, and Cash Respins trigger more often.'),
	rulesBoost: () =>
		t('Bonus Boost: __0__ the base __1__ per spin. Cash Respins trigger more often. The base game is otherwise the same as the main game.'),
	// the three bought modes: __0__ = cost, __1__ = betWord. Mutant: __2__ = the
	// positions framed at the start, __3__ = their possible values. Overcharged:
	// __2__ = all positions, __3__ = the possible frame values, __4__ = its extra
	// Bomb value (values only, never their chances; 'more often' / 'more likely'
	// is as far as the text goes)
	rulesBuyModesText: () =>
		t('Each of these three modes goes straight into Cash Respins, without a base game spin, and asks for confirmation before it starts.'),
	rulesOperation: () =>
		t('__0__ the base __1__. Cash Respins start at random as the 4, 5, or 6 or more Scatter version and are the same as in the main game.'),
	rulesMutant: () =>
		t('__0__ the base __1__. Cash Respins where __2__ positions always start with a multiplier frame, each worth __3__. Multipliers and Bombs land more often than in Operation Respins, and Multipliers are more likely to land on the highest frames.'),
	rulesOvercharged: () =>
		t('__0__ the base __1__. Cash Respins where all __2__ positions start with a multiplier frame, each worth __3__. Multipliers, Cloners and Bombs land more often on every respin, Multipliers are more likely to have high values, and Bombs can also be worth __4__.'),
	// General Rules
	rulesGeneral1: () =>
		t("Wins from tumbles, features and Cash Respins in one round are added together into the round's total win."),
	rulesGeneral2: () => t('Scatters start Cash Respins in any position.'),
	rulesGeneral3: () =>
		t('The maximum win of each mode, listed under Game Modes, is the highest win that mode can award.'),
	// User Interface Guide (__0__ = betWord)
	uiSpin: () => t('Spin: Start a spin at the current __0__ amount.'),
	uiStop: () => t('Stop: Stop the reels early during a spin.'),
	uiAutoplay: () => t('Autoplay: Spin automatically a set number of times.'),
	uiTurbo: () => t('Turbo: Speed up animations.'),
	uiFeature: () =>
		social(
			'Feature Play (Scatter disc): Open the feature menu with the three Cash Respins modes and the Chaos Mode and Bonus Boost switches.',
			'Buy Feature (Scatter disc): Open the feature menu with the three Cash Respins modes and the Chaos Mode and Bonus Boost switches.',
		),
	uiPlusMinus: () => t('+/−: Increase or decrease the __0__ amount.'),
	uiMenu: () => t('Menu (☰): Open the menu.'),
	uiPaytable: () =>
		social('Win Table: View the symbol win values.', 'Paytable: View the symbol payout values.'),
	uiGameRules: () => t('Game Rules: View the game rules and the disclaimer.'),
	uiSound: () => t('Sound: Turn game sounds on or off.'),
	uiSettings: () => t('Settings: Adjust game settings.'),
	// Disclaimer (Stake's template; the copyright line is not translated)
	rulesDisclaimerText: () =>
		t('Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser.'),

	// PayTable
	ptTitle: () => social('Win Table', 'Paytable'),
	ptIntro: () =>
		t('Values are shown for the current base __0__. A symbol wins when 8 or more of it are on the screen, in any positions.'),
	ptSpecialSymbols: () => t('Special Symbols'),
	ptSymbolPayouts: () => social('Symbol Wins', 'Symbol Payouts'),
	ptWild: () =>
		social(
			'Created only when a Bomb explodes. Substitutes for every regular symbol and counts toward each of them. Wilds alone do not form a win.',
			'Created only when a Bomb explodes. Substitutes for every paying symbol and counts toward each of them. Wilds alone do not form a win.',
		),
	// __0__ / __1__ = the positions framed at the start (5 / 10)
	ptScatter: () =>
		t('4 Scatters = Cash Respins\n5 Scatters = Cash Respins with __0__ multiplier frames\n6 or more = Cash Respins with __1__ multiplier frames'),
	// the Cash Respins symbols' group (Chaos Lab 2): __n__ = values from rulesData
	ptCashSymbols: () => t('Cash Respins Symbols'),
	ptCoinName: () => t('Coin'),
	ptCoin: () =>
		t('Worth __0__ the base __1__. Stays on the grid until Cash Respins end, multiplied by the frame under it.'),
	ptCashMultiplier: () =>
		t('Worth __0__. Leaves a frame on its position, or adds to the frame there, up to __1__.'),
	ptCashCloner: () =>
		t('Turns into a coin and spreads __0__ to __1__ coins onto empty positions, fewer if the grid is nearly full.'),
	// __1__ = Overcharged Respins' extra Bomb value (×50)
	ptCashBomb: () =>
		t('Worth __0__ (in Overcharged Respins, also __1__), multiplied by its frame. Turns into a coin and adds its value to every coin around it.'),
	ptMultiplier: () =>
		t('Worth __0__. Collected into the total multiplier before any win is awarded.'),
	ptBomb: () =>
		social(
			'When there is no win, it clears the regular symbols in the 3×3 area around it and stays as a Wild.',
			'When there is no win, it clears the paying symbols in the 3×3 area around it and stays as a Wild.',
		),
	ptCloner: () =>
		social(
			'When there is no win and no Bomb, it turns itself and 4 to 11 regular symbols into one regular symbol chosen at random.',
			'When there is no win and no Bomb, it turns itself and 4 to 11 paying symbols into one paying symbol chosen at random.',
		),
	// symbol names (image alt text)
	symBrainJar: () => t('Brain Jar'),
	symHeart: () => t('Heart'),
	symEyeball: () => t('Eyeball'),
	symHand: () => t('Hand'),

	/**
	 * Replay card + HUD (ReplayOverlay / ReplayHud), as in Kraken's Wilds. The
	 * social replacements are the ones Kraken's reviewer named verbatim: Base
	 * Bet -> Base Play, Cost Multiplier -> Feature Multiplier, Payout
	 * Multiplier -> Final Multiplier; Cost -> Value per the operator table. The
	 * mode row reads modeNames.ts, the names the rules use.
	 */
	replay: () => t('REPLAY'),
	replayTitle: () => social('Play Replay', 'Bet Replay'),
	replayMode: () => t('Mode'),
	replayBaseBet: () => social('Base Play', 'Base Bet'),
	replayCostMultiplier: () => social('Feature Multiplier', 'Cost Multiplier'),
	replayTotalCost: () => social('Total Play Value', 'Total Bet Cost'),
	replayPayoutMultiplier: () => social('Final Multiplier', 'Payout Multiplier'),
	replayTotalWin: () => t('Total Win'),
	replayStart: () => t('Start Replay'),
	replayAgain: () => t('Replay Again'),
	replayDisclaimer: () =>
		social(
			'This is a replay of a previous round. No plays will be placed.',
			'This is a replay of a previous bet round. No bets will be placed.',
		),
};
