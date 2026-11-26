import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateBetDerived, stateUi } from 'state-shared';
import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { getCellKey, getSymbolY, playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import {
	BOARD_DIMENSIONS,
	SCATTERS_TO_TRIGGER,
	TURBO_FS_MIN_BOARD_MS,
} from './constants';
import {
	scatterPendingEnd,
	scatterPendingStart,
	stateGame,
	stateGameDerived,
} from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { GameType, Position, RawSymbol } from './types';
import type { MusicName } from './sound';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	// the count-up itself is silent (its ticking loop was removed in the sound review of
	// 2026-11-24); Win / FreeSpinOutro still end it on the landing hit
	// the celebration shower is the bed of the big presentations only
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bs_shower' });
	}
};

// bumped when a presentation's sounds are switched off (winLevelSoundsStop), so a
// late count-end resume (countEndSounds) never fades in music that is already on
let winSoundsRun = 0;
const winLevelSoundsStop = () => {
	winSoundsRun += 1;
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bs_shower' });
	if (stateGame.gameType === 'freegame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bs_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bs_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

/**
 * A count-up's sounds end when its figure lands, skipped or not: the tickup ends
 * on its hit, the shower stops, and the bed fades away, then is stopped so it
 * starts fresh (not silent: a faded music track resumes at its faded volume).
 * The game's music then fades back in, so the hold before the press is not
 * silent. Used by the big win box (Win.svelte, Evtim 2026-10-27: the shower and
 * bed ran on through the hold and the title exit) and the free spins outro.
 */
// into a win's 1 s prewin: when the winning cells throw their gold at the WIN counter
const WIN_GOLD_AT_MS = 640;
const BED_FADE_MS = 700;
const MUSIC_FADE_IN_MS = 1200;
const countEndSounds = ({ bed, music }: { bed?: MusicName; music: () => MusicName | undefined }) => {
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_tickup_end' });
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bs_shower' });
	if (!bed) return;
	const run = winSoundsRun;
	eventEmitter.broadcast({ type: 'soundFade', name: bed, from: 1, to: 0, duration: BED_FADE_MS });
	waitForTimeout(BED_FADE_MS).then(() => {
		eventEmitter.broadcast({ type: 'soundStop', name: bed });
		// the presentation may already be over, with its own music back on
		const name = run === winSoundsRun ? music() : undefined;
		if (!name) return;
		eventEmitter.broadcast({ type: 'soundMusic', name });
		eventEmitter.broadcast({ type: 'soundFade', name, from: 0, to: 1, duration: MUSIC_FADE_IN_MS });
	});
};
// the music under the game right now
const gameMusic = (): MusicName =>
	stateGame.gameType === 'freegame' ? 'bgm_bs_freespin' : 'bgm_bs_main';

/**
 * The free spins outro's count sounds run with the count itself, which starts
 * as the amount pops in (FreeSpinOutro calls `start` and `end`).
 * They used to start with the popup, 2.1 s before the total began to count,
 * and the bed looped on until the curtains closed (Evtim, 2026-10-26). Below
 * the big levels the total counts over its own short bed; big totals take
 * their level's bed and the shower. When the total lands, countEndSounds; the
 * free spins music fades back in under the waiting outro (Evtim, 2026-10-26).
 */
const outroCountSounds = (winLevelData: WinLevelData) => {
	const counts = !!winLevelData?.presentDuration;
	return {
		start: () => {
			winLevelSoundsPlay({ winLevelData });
			if (counts && !winLevelData.sound.bgm) {
				eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bs_totalwin' });
			}
		},
		end: () => {
			if (!counts) return;
			countEndSounds({
				bed: winLevelData.sound?.bgm ?? 'bgm_bs_totalwin',
				// the press may already have taken the game back to base (its own music)
				music: () => (stateGame.gameType === 'freegame' ? 'bgm_bs_freespin' : undefined),
			});
		},
	};
};

// No mascot in this game (Evtim, 2026-11-13: "remove the mascot here, instead we will
// try to animate the background"): the Chemist, his win reaction and his five laughs
// are gone; the mine itself is alive (BackgroundLife).

// The spin's anticipated columns (Evtim, 2026-10-24): a column is anticipated
// when the columns already down hold exactly one Scatter short of a trigger (3
// in the base game, 2 in free spins). The shared reel then makes it wait its
// turn and fall in slowly (SPIN_OPTIONS_ANTICIPATED). The math sends no
// anticipation (all zeros), so it is counted here off the reveal board.
const spinAnticipation = (board: RawSymbol[][], gameType: GameType) => {
	const oneShort = SCATTERS_TO_TRIGGER[gameType] - 1;
	let landed = 0;
	return board.map((reel) => {
		const anticipated = landed === oneShort ? 1 : 0;
		landed += reel.slice(1, -1).filter((rawSymbol) => rawSymbol.name === 'S').length;
		return anticipated;
	});
};

// One Scatter short of a trigger (4 in the base game, 3 retrigger in free spins)?
// Counted on the board a tumble starts from: Scatters are never removed mid-spin,
// so only a tumble's new symbols can bring the missing one.
const isScatterAnticipation = () => {
	const scatters = stateGameDerived
		.boardRaw()
		.flatMap((reel) => reel.slice(1, -1)) // visible rows only, not the padding
		.filter((rawSymbol) => rawSymbol.name === 'S').length;
	return scatters === SCATTERS_TO_TRIGGER[stateGame.gameType] - 1;
};
// The visible rows of each refilling column left empty once a tumble's cleared
// symbols are removed: read off the remaining symbols' positions, not the book's
// explodingSymbols, because a bomb that leaves no Wild empties its cell too.
const emptyRows = (newSymbols: RawSymbol[][]) =>
	stateGame.tumbleBoardBase.map((tumbleReel, reelIndex) =>
		newSymbols[reelIndex]?.length
			? _.range(BOARD_DIMENSIONS.y).filter(
					(row) => !tumbleReel.some((tumbleSymbol) => tumbleSymbol.symbolY.current === getSymbolY(row)),
				)
			: [],
	);
// the free spins total on the counter (entry, updateFreeSpin, retriggers; a
// resume replays updateFreeSpin): a retrigger's +N is its totalFs minus this
let freeSpinsTotal = 0;
// when the last spin's board finished landing (turbo free spins hold it, see reveal)
let boardLandedAt = 0;

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

// the curtains into and out of free spins hide the plate: no shrink, no sound
const clearPlateUnseen = () => {
	stateGame.globalMultiplier = 1;
	eventEmitter.broadcast({ type: 'globalMultiplierUpdate', multiplier: 1, instant: true });
};

// The way into free spins, shared by a scatter trigger and a bought round
// (buyFreeSpins), which arrives here with no base spin before it. `multiplier`
// is the plate's starting value: 1 after a trigger (a base-spin collect is not
// carried over), Overcharged Free Spins' starting multiplier after a buy.
const enterFreeSpins = async ({ totalFs, multiplier }: { totalFs: number; multiplier: number }) => {
	await eventEmitter.broadcastAsync({ type: 'uiHide' });
	// the curtains close over the base game, the theatre dresses for free spins
	// behind them (Background / BoardFrame follow gameType), the curtains part
	await eventEmitter.broadcastAsync({ type: 'transitionClose' });
	stateGame.gameType = 'freegame';
	// the trigger spin's collect goes behind the closed curtains, so the intro
	// already shows an empty plate (Evtim, 2026-10-28: it went on the first spin)
	clearPlateUnseen();
	// free spins are won: light builds behind the curtains and they are thrown open
	// in a burst of light, dust and gold (Transition `celebrate`, 2026-11-24)
	await eventEmitter.broadcastAsync({ type: 'transitionOpen', celebrate: true });
	eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
	eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bs_freespin' });
	// resolves once the intro has played out and the player pressed through it
	await eventEmitter.broadcastAsync({
		type: 'freeSpinIntroUpdate',
		totalFreeSpins: totalFs,
	});
	eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
	eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
	eventEmitter.broadcast({ type: 'globalMultiplierShow' });
	// Overcharged Free Spins' starting multiplier pops onto the empty plate
	stateGame.globalMultiplier = multiplier;
	await eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier });
	eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
	freeSpinsTotal = totalFs;
	// the first spin is next (the counter shows the spin in play, see updateFreeSpin);
	// unset, it kept the last round's final value until the book's 0 / total
	eventEmitter.broadcast({
		type: 'freeSpinCounterUpdate',
		current: 1,
		total: totalFs,
	});
	// the bottom bar stays as it is: the sample folded the portrait drawer here,
	// which pushed the buttons half under the bar (Evtim, 2026-10-26; Kraken never folds)
	await eventEmitter.broadcastAsync({ type: 'uiShow' });
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		// turbo free spins: the last board stays up at least TURBO_FS_MIN_BOARD_MS
		if (bookEvent.gameType === 'freegame' && stateBet.isTurbo) {
			const remaining = TURBO_FS_MIN_BOARD_MS - (performance.now() - boardLandedAt);
			if (remaining > 0) await waitForTimeout(remaining);
		}
		// the last round's WIN leaves as this spin starts (it stays up after its round)
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		stateGame.tumbleWin = 0;
		stateGame.scatterPending = false;
		// base game: the plate's accumulated multiplier belongs to one spin only
		// (free spins carry it via the book's updateGlobalMult events). The press
		// already emptied it (actor.ts onNewGameStart); this covers the rounds the
		// resume flow plays (a reload mid-round, a replay)
		if (bookEvent.gameType === 'basegame') {
			stateGame.globalMultiplier = 1;
			await eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier: 1 });
		}
		// the shared spin button turns its STOP icon back into the arrows only when
		// this flips back to false (ButtonBet) — unset, it stayed STOP until a remount
		stateUi.reelsSpinning = true;
		// the board drops out here unless the pre-spin already did it on the press
		// (actor.ts): free spins and the turbo/space-hold base spins fall out now
		if (stateGame.board[0].reelState.motion !== 'hanging') {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_board_dropout' });
		}
		try {
			// Scatter anticipation on the spin (2026-10-24; it was off since
			// 2026-10-23): the columns after the point where one Scatter is missing
			// fall in one by one and slowly, the landed Scatters play their pending
			// loop (started by onReelStopping). Turbo skips it.
			const anticipation = stateBet.isTurbo
				? bookEvent.board.map(() => 0)
				: spinAnticipation(bookEvent.board, bookEvent.gameType);
			stateGame.spinAnticipation = anticipation;
			await stateGameDerived.enhancedBoard.spin({ revealEvent: { ...bookEvent, anticipation } });
			boardLandedAt = performance.now();
		} finally {
			stateGame.spinAnticipation = [];
			scatterPendingEnd();
			stateUi.reelsSpinning = false;
		}
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		const winStartedAt = performance.now();
		// the winners' sound starts with their animation and builds to their break-up, where
		// tumbleBoard plays its burst (sfx_bs_shatter) and stops this (Evtim's round-6 pick, 2026-11-26)
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_win_build', forcePlay: true });
		const promise1 = async () => {
			await animateSymbols({ positions: _.flatten(bookEvent.wins.map((win) => win.positions)) });
		};

		const promise2 = async () => {
			await eventEmitter.broadcastAsync({
				type: 'showClusterWinAmounts',
				wins: bookEvent.wins.map((win) => {
					return {
						win: win.meta.winWithoutMult,
						mult: win.meta.globalMult,
						result: win.meta.winWithoutMult * win.meta.globalMult,
						reel: win.meta.overlay.reel,
						row: win.meta.overlay.row,
					};
				}),
			});
		};

		// not awaited: the amounts float on over the tumble instead of holding the
		// cascade for their full two seconds; the goo starts the moment the prewins end
		// the winners' gold flies to the WIN counter (GoldFx): thrown late in the prewin,
		// so it lands as the count that follows begins, not after it
		const goldTimer = setTimeout(
			() =>
				eventEmitter.broadcast({
					type: 'winGoldFly',
					positions: _.flatten(bookEvent.wins.map((win) => win.positions)),
				}),
			WIN_GOLD_AT_MS / stateBetDerived.timeScale(),
		);
		void promise2();
		try {
			await promise1();
		} finally {
			// a skipped prewin (turbo, a stop press) ends before the gold was thrown: no stragglers
			if (performance.now() - winStartedAt < WIN_GOLD_AT_MS / stateBetDerived.timeScale()) clearTimeout(goldTimer);
		}
	},
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		stateGame.tumbleWin = bookEvent.amount;
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.amount,
				animate: false,
			});
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		// the running total now includes the spin's cascade win: stop adding it on top
		stateBet.winBookEventAmount = bookEvent.amount;
		stateGame.tumbleWin = 0;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_scatter_win' });
		// the mine rumbles under the Scatters (SceneShake)
		eventEmitter.broadcast({ type: 'sceneShake', preset: 'featureTrigger' });
		await animateSymbols({ positions: bookEvent.positions });
		await enterFreeSpins({ totalFs: bookEvent.totalFs, multiplier: 1 });
	},
	// A bought free spins round opens here: straight into the free-spins theatre, no scatters.
	// Before this handler existed the buy only logged "Missing bookEventHandler"
	// and the round skipped the intro, curtains and music.
	buyFreeSpins: async (bookEvent: BookEventOfType<'buyFreeSpins'>) => {
		await enterFreeSpins({
			totalFs: bookEvent.totalFs,
			multiplier: Math.max(1, bookEvent.initialMultiplier),
		});
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		// one tick per spin played (the 0 / total that opens the round is silent)
		if (bookEvent.amount > 0) eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_fs_counter' });
		freeSpinsTotal = bookEvent.total;
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		// the book sends this BEFORE each spin's reveal with the spins already
		// played (0 ... total - 1): the counter shows the spin in play, so the
		// first reads 1 / 10 and the last 10 / 10 (Evtim, 2026-10-26; it read
		// 0 on the first spin and ended on 9 / 10)
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
	},
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		if (bookEvent.globalMult === 1) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		}
		stateGame.globalMultiplier = bookEvent.globalMult;
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.globalMult, // resets when multiplier === 1
		});
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		// the bar fades out as the outro builds, not before it (Evtim, 2026-10-28:
		// too long from the popup to the count)
		eventEmitter.broadcast({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		// the outro plays over the free-spins theatre; gameType flips to base only
		// once the curtains are closed, so the dressing swap is never seen
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		const countSounds = outroCountSounds(winLevelData);
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
			oncountstart: countSounds.start,
			oncountend: countSounds.end,
		});
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		await eventEmitter.broadcastAsync({ type: 'transitionClose' });
		stateGame.gameType = 'basegame';
		// the round's multiplier stays behind the curtains: the base game opens on
		// an empty plate (Evtim, 2026-10-28)
		clearPlateUnseen();
		winLevelSoundsStop();
		await eventEmitter.broadcastAsync({ type: 'transitionOpen' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
	},
	// Multiplier symbols on the board are collected onto the plate above the reels:
	// they act, fly up, and the plate's value updates. Mad Science flow (Evtim,
	// 2026-09-02): in the base game every cascade step collects its multipliers
	// first, the vacated cells tumble, then the wins of that step pay at the
	// plate's current value (winInfo meta.globalMult). The plate value comes from
	// the book: `globalMult` (proposed for the Mad Science math), else the sample's
	// winInfo.boardMult, else the current value plus the collected symbols.
	boardMultiplierInfo: async (bookEvent: BookEventOfType<'boardMultiplierInfo'>) => {
		const collected = _.sumBy(bookEvent.multInfo.positions, (position) => position.multiplier);
		const multiplier =
			bookEvent.globalMult ?? bookEvent.winInfo?.boardMult ?? stateGame.globalMultiplier + collected;

		if (bookEvent.winInfo) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			await eventEmitter.broadcastAsync({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.winInfo.tumbleWin,
				animate: false,
			});
		}

		eventEmitter.broadcast({ type: 'multiplierBoardShow' });
		eventEmitter.broadcast({ type: 'multiplierBoardInit' });
		await eventEmitter.broadcastAsync({ type: 'multiplierBoardAnimate' });
		eventEmitter.broadcast({ type: 'boardWithMovingMultiplierTexts' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_mult_fly' });
		await eventEmitter.broadcastAsync({ type: 'multiplierBoardMove' });
		eventEmitter.broadcast({ type: 'multiplierBoardReset' });
		eventEmitter.broadcast({ type: 'multiplierBoardHide' });
		stateGame.globalMultiplier = multiplier;
		await eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier });

		if (bookEvent.winInfo) {
			stateGame.tumbleWin = bookEvent.winInfo.totalWin;
			await eventEmitter.broadcastAsync({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.winInfo.totalWin,
				animate: true,
			});
		}
	},
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		// one Scatter short of a trigger (Evtim, 2026-10-24): the Scatters play their
		// pending loop under the anticipation sound and the new symbols drop slower,
		// column by column (TumbleBoard)
		const anticipation = isScatterAnticipation();
		if (anticipation) scatterPendingStart();
		eventEmitter.broadcast({ type: 'boardHide' });
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: bookEvent.newSymbols });
		// the winners' build ends here: at normal speed it is just running out, under turbo or a
		// stop press the break comes early and the burst takes over from it
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bs_win_build' });
		// a bomb tumble bangs on the rig's `detonate` event instead (Symbol.svelte). The
		// break-up's burst (round 6, 2026-11-26: a lighter, brighter cut of the cloners' gold
		// eruption) rings longer than a turbo cascade, and a sound still playing is skipped
		// without forcePlay
		if (!stateGame.bombPending) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_shatter', forcePlay: true });
		}
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: bookEvent.explodingSymbols,
		});
		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		if (anticipation) {
			// only the cells the cascade just emptied crackle, each column until its
			// drop lands (AnticipationField, Evtim 2026-10-27: not the whole reel)
			stateGame.tumbleAnticipation = emptyRows(bookEvent.newSymbols);
		}
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_tumble_drop' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown', anticipation });
		if (anticipation) {
			scatterPendingEnd();
			stateGame.tumbleAnticipation = [];
		}
		eventEmitter.broadcast({
			type: 'boardSettle',
			board: stateGameDerived
				.tumbleBoardCombined()
				.map((tumbleReel) => tumbleReel.map((tumbleSymbol) => tumbleSymbol.rawSymbol)),
		});
		eventEmitter.broadcast({ type: 'tumbleBoardReset' });
		eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		eventEmitter.broadcast({ type: 'boardShow' });
	},
	// Bomb: nothing is drawn here. The blast IS the tumbleBoard that always follows
	// (its explodingSymbols are the cleared cells): TumbleBoard consumes bombPending,
	// plays each bomb's explode rig and leaves a Wild in its cell, and gives the
	// cleared cells the blast in place of the goo.
	bombExplode: async (bookEvent: BookEventOfType<'bombExplode'>) => {
		stateGame.bombPending = { bombs: bookEvent.bombs, wilds: bookEvent.wilds };
	},
	// Every multiplier on the board flies onto the plate before the step's wins pay;
	// the plate takes the book's running total. The tumbleBoard that follows clears
	// the collected cells (bare plates by then).
	collectMultipliers: async (bookEvent: BookEventOfType<'collectMultipliers'>) => {
		const getReelSymbol = (position: Position) =>
			stateGame.board[position.reel].reelState.symbols[position.row];
		// the math's multiplier symbols land as x1; the collect carries their values
		bookEvent.multipliers.forEach(({ multiplier, ...position }) => {
			const reelSymbol = getReelSymbol(position);
			reelSymbol.rawSymbol = { ...reelSymbol.rawSymbol, multiplier };
		});

		eventEmitter.broadcast({ type: 'multiplierBoardShow' });
		eventEmitter.broadcast({ type: 'multiplierBoardInit' });
		await eventEmitter.broadcastAsync({ type: 'multiplierBoardAnimate' });
		bookEvent.multipliers.forEach((position) => {
			getReelSymbol(position).rawSymbol = { name: 'M_TAKEN' };
		});
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_mult_fly' });
		await eventEmitter.broadcastAsync({ type: 'multiplierBoardMove' });
		eventEmitter.broadcast({ type: 'multiplierBoardReset' });
		eventEmitter.broadcast({ type: 'multiplierBoardHide' });
		stateGame.globalMultiplier = bookEvent.totalMultiplier;
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.totalMultiplier,
		});
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// the Scatters fire as on the trigger; the retrigger's own cue goes with
		// the +N stamp (FreeSpinRetrigger), where the Scatters no longer drown it
		// (Evtim, 2026-10-27: the reveal was silent)
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_scatter_win' });
		await animateSymbols({ positions: bookEvent.positions });
		// the +N stamps over the board and flies onto the counter, which then pops
		// (Evtim, 2026-10-26); an unknown previous total just updates the counter
		const added = bookEvent.totalFs - freeSpinsTotal;
		if (freeSpinsTotal > 0 && added > 0) {
			await eventEmitter.broadcastAsync({ type: 'freeSpinRetriggerShow', added });
		}
		freeSpinsTotal = bookEvent.totalFs;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_fs_counter' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
			pop: true,
		});
	},
	// Cloner, on the settled reel board: the original casts and its ghosts fly to
	// the clone cells; each landing splats the cell into a cloner; then every
	// cloner (original + clones) drains out under the flood and the book's symbol
	// lands in its place. Afterwards the reel board matches the math's board.
	clonerActivate: async (bookEvent: BookEventOfType<'clonerActivate'>) => {
		const CAST_RELEASE_MS = 200; // the ghosts peel off ~0.15-0.30s into `cast`
		const FLOOD_BURST_MS = 600; // clonefx `flood`: the white-hot tiles fall to shards
		const BEAT_MS = 250;
		const timeScale = stateBetDerived.timeScale();
		const getReelSymbol = (position: Position) =>
			stateGame.board[position.reel].reelState.symbols[position.row];

		eventEmitter.broadcast({ type: 'boardShow' });
		const origin = getReelSymbol(bookEvent.cloner);

		// 1. cast + flights run together: the flights start CAST_RELEASE_MS into the cast
		const cast = async () => {
			origin.symbolState = 'cast';
			await waitForResolve((resolve) => (origin.oncomplete = resolve));
		};
		// 2. per clone, a promise released by that cell's splat; registered on arrival
		const splats = bookEvent.cloned.map((clone) => {
			let resolve = () => {};
			const done = new Promise<void>((r) => (resolve = r));
			return { clone, resolve, done };
		});
		const onArrive = (to: Position) => {
			const splat = splats.find(({ clone }) => clone.reel === to.reel && clone.row === to.row);
			if (!splat) return;
			const reelSymbol = getReelSymbol(to);
			// one hit per clone, 60ms apart, in the cloner's own landing sound (Evtim's sound
			// review, 2026-11-24: "use cloner land sound"); a varied rate keeps the run from
			// sounding copied
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_bs_cloner_land',
				forcePlay: true,
				rate: 0.92 + 0.2 * Math.random(),
			});
			eventEmitter.broadcast({ type: 'sceneShake', preset: 'cloneStrike' });
			stateGame.cloneFx[getCellKey(to)] = {
				kind: 'splat',
				onSwap: () => {
					reelSymbol.rawSymbol = { name: 'C' };
					reelSymbol.symbolState = 'in'; // completes to 'static' (ReelSymbol)
				},
				oncomplete: splat.resolve,
			};
		};
		const flights = async () => {
			await waitForTimeout(CAST_RELEASE_MS / timeScale);
			await eventEmitter.broadcastAsync({
				type: 'clonesFly',
				from: bookEvent.cloner,
				to: bookEvent.cloned,
				onArrive,
			});
		};
		await Promise.all([cast(), flights(), ...splats.map(({ done }) => done)]);
		bookEvent.cloned.forEach((clone) => delete stateGame.cloneFx[getCellKey(clone)]);

		// 3. a beat with every cloner on the board
		await waitForTimeout(BEAT_MS / timeScale);

		// 4. flood: signs drain out, the covered cells swap to the paying symbol, which lands.
		// The landings are awaited too: they outlast the flood, and with no win after the
		// clone this is the round's last event, so a turbo / Space-hold / autoplay spin
		// dropped the board mid-landing (Evtim, 2026-10-26)
		const cloners = [bookEvent.cloner, ...bookEvent.cloned];
		const landings: Promise<void>[] = [];
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_cloner_flood' });
		// one quake and one blast for all of them, on the frame they burst. The blast is a
		// gold eruption (Evtim's round-5 pick, 2026-11-26); its hit is at its very start
		void waitForTimeout(FLOOD_BURST_MS / timeScale).then(() => {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_clone_burst', forcePlay: true });
			eventEmitter.broadcast({ type: 'sceneShake', preset: 'clonerBurst' });
		});
		await Promise.all(
			cloners.map((position) =>
				waitForResolve((resolve) => {
					const reelSymbol = getReelSymbol(position);
					reelSymbol.symbolState = 'out'; // holds its last frame until the swap
					stateGame.cloneFx[getCellKey(position)] = {
						kind: 'flood',
						onSwap: () => {
							reelSymbol.rawSymbol = { name: bookEvent.symbol };
							landings.push(waitForResolve((landed) => (reelSymbol.oncomplete = landed)));
							reelSymbol.symbolState = 'land'; // completes to 'static' (ReelSymbol)
						},
						oncomplete: resolve,
					};
				}),
			),
		);
		cloners.forEach((position) => delete stateGame.cloneFx[getCellKey(position)]);
		await Promise.all(landings);
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];
		// The win box is for big wins only: the WIN counter over the reels already
		// holds every other win (Evtim, 2026-11-04). Those end in SILENCE: the small /
		// medium win jingle that used to play here, after the last cascade while the
		// game settles for the next spin, is gone (Evtim, 2026-11-18: "very very
		// annoying sounds which are played after the round finished ... I want these
		// sounds removed from all games"). The wins were already heard as they paid.
		if (winLevelData?.type !== 'big') return;

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
			oncountend: () => {
				if (!winLevelData?.presentDuration) return;
				countEndSounds({ bed: winLevelData.sound?.bgm, music: gameMusic });
			},
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	// the WIN counter stays up with the round's win until the next spin (reveal)
	finalWin: async () => {},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		// a scatter trigger, or a bought round's buyFreeSpins
		const entry =
			findLastBookEvent('freeSpinTrigger' as const) ?? findLastBookEvent('buyFreeSpins' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		// only the free spins' own plate: a base spin's collect before the trigger is not carried over
		const lastUpdateGlobalMultEvent = _.findLast(
			bookEvents,
			(event) => event.type === 'updateGlobalMult' && !!entry && event.index > entry.index,
		) as BookEventOfType<'updateGlobalMult'> | undefined;
		const lastReveal = _.findLast(bookEvents, (event) => event.type === 'reveal') as
			| BookEventOfType<'reveal'>
			| undefined;

		if (lastReveal) eventEmitter.broadcast({ type: 'boardSettle', board: lastReveal.board });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (!entry) return;

		// Reloaded inside the free spins (Evtim, 2026-10-26): straight back into the
		// spin that was interrupted, as Kraken does. No base game, curtains, scatter
		// celebration or intro: the theatre is dressed at once (Game.svelte already
		// switched gameType behind the intro's exit), the plate, counter, total win,
		// glow, music and the free-spins bar are restored, and the next event is
		// that spin's reveal (the client records each bonus reveal as the cursor).
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bs_freespin' });
		if (lastUpdateGlobalMultEvent) {
			playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
		} else {
			// nothing collected yet: the round's starting value (Overcharged Free Spins)
			const multiplier = entry.type === 'buyFreeSpins' ? Math.max(1, entry.initialMultiplier) : 1;
			eventEmitter.broadcast({ type: 'globalMultiplierShow' });
			stateGame.globalMultiplier = multiplier;
			eventEmitter.broadcast({ type: 'globalMultiplierUpdate', multiplier });
		}
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		freeSpinsTotal = entry.totalFs;
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		else eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', current: 1, total: entry.totalFs });
	},
};
