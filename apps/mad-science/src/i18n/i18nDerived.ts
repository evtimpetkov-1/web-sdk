import { stateI18nDerived, stateUrlDerived } from 'state-shared';

import { i18nDerived as i18nDerivedUiPixi } from 'components-ui-pixi';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

const t = (key: string) => stateI18nDerived.translate(key);
/**
 * Social mode (stake.us) forbids gambling terms and is English-only (LoadI18n
 * forces the en catalog), so the replacement is a plain English string.
 * Wording: the operator's social terms table (Buy -> Play, Cost -> Value,
 * Paytable -> Win Table) ahead of stake-engine.com/docs/reference/social-mode.
 * The mode names (Evtim, 2026-10-24) carry no restricted word.
 */
const social = (socialText: string, key: string) =>
	stateUrlDerived.social() ? socialText : t(key);

export const i18nDerived = {
	...i18nDerivedUiPixi,
	...i18nDerivedUiHtml,
	home: () => t('HOME'),
	notTranslated: () => t('NOT TRANSLATED'),
	pressToContinue: () => t('PRESS ANYWHERE TO CONTINUE'),

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
	rulesFreeSpins: () => t('Free Spins'),
	rulesSwitchModes: () => t('Chaos Mode and Free Spins Boost'),
	rulesBuyModes: () => social('Feature Play', 'Buy Feature'),
	rulesGeneral: () => t('General Rules'),
	rulesUiGuide: () => t('User Interface Guide'),
	rulesDisclaimer: () => t('Disclaimer'),
	// mode names
	modeBase: () => t('Main game'),
	modeChaos: () => t('Chaos Mode'),
	modeBoost: () => t('Free Spins Boost'),
	modeOperation: () => t('Operation Free Spins'),
	modeMutant: () => t('Mutant Free Spins'),
	modeOvercharged: () => t('Overcharged Free Spins'),
	// table headers
	colMode: () => t('Mode'),
	colCost: () => social('Value', 'Cost'),
	colRtp: () => t('RTP'),
	colMaxWin: () => t('Max win'),
	// Game Overview
	rulesOverviewText: () =>
		social(
			'Mad Science is a 6-reel, 5-row cascading slot. There are 9 regular symbols, 4 high and 5 low, and 5 special symbols: Wild, Scatter, Multiplier, Bomb and Cloner.',
			'Mad Science is a 6-reel, 5-row cascading slot. There are 9 paying symbols, 4 high and 5 low, and 5 special symbols: Wild, Scatter, Multiplier, Bomb and Cloner.',
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
		t('After every win, the winning symbols are removed. The remaining symbols fall down and new symbols drop in from above to fill the empty positions. This repeats for as long as new wins appear.'),
	// Wild
	rulesWildText: () =>
		social(
			'A Wild is created only when a Bomb explodes. It substitutes for every regular symbol at the same time and counts toward each of them, so one Wild can be part of several wins. Wilds alone do not form a win.',
			'A Wild is created only when a Bomb explodes. It substitutes for every paying symbol at the same time and counts toward each of them, so one Wild can be part of several wins. Wilds alone do not form a win.',
		),
	// Scatter
	rulesScatterText: () =>
		t('Scatters do not form wins and are never removed during a spin. The number of Scatters on the screen when the spin ends decides the free spins, including Scatters that dropped in during tumbles:'),
	rulesScatter4: () => t('4 Scatters award 10 free spins.'),
	rulesScatter5: () => t('5 Scatters award 15 free spins.'),
	rulesScatter6: () => t('6 or more Scatters award 20 free spins.'),
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
	rulesMultFs: () =>
		t('Free spins: the total multiplier lasts for the whole free spins round (see Free Spins).'),
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
			'The Cloner turns itself and 4 to 11 regular symbols on the screen into one regular symbol.',
			'The Cloner turns itself and 4 to 11 paying symbols on the screen into one paying symbol.',
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
	// Free Spins
	rulesFreeSpinsText: () =>
		t('4, 5, or 6 or more Scatters at the end of a base game spin award 10, 15 or 20 free spins, played with a total multiplier that keeps growing for the whole round. Free spins follow all base game rules, with these differences:'),
	rulesFsPersistent: () =>
		t('Persistent multiplier: the total multiplier is not reset between free spins. Every Multiplier collected during the round adds to it, and it multiplies every win until the round ends. A multiplier collected on the triggering base game spin is not carried into free spins.'),
	rulesFsFeatures: () =>
		t('Features: Multipliers, Bombs and Cloners appear more often than in the base game.'),
	rulesFsRetrigger: () =>
		t('Retrigger: 3 or more Scatters at the end of a free spin award 5 extra free spins. There is no limit on retriggers.'),
	// Chaos Mode + Free Spins Boost (the RGS ante modes): __0__ = cost,
	// __1__ = betWord. No statistics here or anywhere in the rules: RTP and max
	// win are the only math figures a player sees (rulesData.ts)
	rulesSwitchModesText: () =>
		t('Chaos Mode and Free Spins Boost are switched on and off in the feature menu while the game is idle. Only one can be on at a time. While one is on, each spin is played at the multiple of the base __0__ shown below, and wins stay multiples of the base __0__.'),
	rulesChaos: () =>
		t('Chaos Mode: __0__ the base __1__ per spin. Multipliers, Bombs and Cloners appear more often in the base game.'),
	rulesBoost: () =>
		t('Free Spins Boost: __0__ the base __1__ per spin. Free spins trigger more often, and triggers with 5 or more Scatters, which award more free spins, become more likely. The base game is otherwise the same as the main game.'),
	// the three bought free spins modes: __0__ = cost, __1__ = betWord; the
	// intro's __0__ = the possible free-spins counts, Overcharged's __2__ = the
	// possible starting multipliers (values only, never their chances)
	rulesBuyModesText: () =>
		t('Each of these three modes goes straight into free spins, without a base game spin, and asks for confirmation before it starts. The number of free spins is drawn at random: __0__.'),
	rulesOperation: () =>
		t('__0__ the base __1__. The free spins are the same as in the main game.'),
	rulesMutant: () =>
		t('__0__ the base __1__. Free spins where Multipliers, Bombs and Cloners appear much more often than in the main game.'),
	rulesOvercharged: () =>
		t('__0__ the base __1__. Free spins that start with a persistent total multiplier already active, drawn at random from __2__. Multipliers collected during the round add to it.'),
	// General Rules
	rulesGeneral1: () =>
		t("Wins from tumbles, features and free spins in one round are added together into the round's total win."),
	rulesGeneral2: () => t('Scatters award free spins in any position.'),
	rulesGeneral3: () =>
		t('The maximum win of each mode, listed under Game Modes, is the highest win that mode can award.'),
	// User Interface Guide (__0__ = betWord)
	uiSpin: () => t('Spin: Start a spin at the current __0__ amount.'),
	uiStop: () => t('Stop: Stop the reels early during a spin.'),
	uiAutoplay: () => t('Autoplay: Spin automatically a set number of times.'),
	uiTurbo: () => t('Turbo: Speed up animations.'),
	uiFeature: () =>
		social(
			'Feature Play (Scatter disc): Open the feature menu with the three free spins modes and the Chaos Mode and Free Spins Boost switches.',
			'Buy Feature (Scatter disc): Open the feature menu with the three free spins modes and the Chaos Mode and Free Spins Boost switches.',
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
	ptScatter: () =>
		t('4 Scatters = 10 Free Spins\n5 Scatters = 15 Free Spins\n6 or more = 20 Free Spins\n3 or more during Free Spins = 5 more Free Spins'),
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
