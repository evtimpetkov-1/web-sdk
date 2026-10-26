import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateBetDerived, stateUi } from 'state-shared';
import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { getCellKey, playBookEvent, reachesTotalBet } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { CASCADE_STEP_RATES, SCATTERS_TO_TRIGGER, ladderRate } from './constants';
import {
	scatterPendingEnd,
	scatterPendingStart,
	stateGame,
	stateGameDerived,
} from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { GameType, Position, RawSymbol } from './types';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	// the count-up runs over its own loop; Win / FreeSpinOutro stop it with the end hit
	if (winLevelData?.presentDuration) {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_ms_tickup' });
	}
	// the celebration shower is the bed of the big presentations only
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_ms_shower' });
	}
};

const winLevelSoundsStop = () => {
	// the tickup normally stops with its end hit; this catches an aborted count-up
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_ms_tickup' });
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_ms_shower' });
	if (stateGame.gameType === 'freegame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_ms_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_ms_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

// The mascot reacts once per spin: on the first cascade win that brings the
// spin's win to at least the total bet (Evtim, 2026-10-24). Smaller wins and
// later cascade wins in the same spin leave it in its idle loop.
let mascotReacted = false;
// the spin's win so far (earlier cascades + this one) against the total bet
const spinWinReachesTotalBet = (cascadeWin: number) =>
	reachesTotalBet(stateGame.tumbleWin + cascadeWin);
// The laugh is one of five takes at random, never the same one twice running:
// v1 Chuckle + fizz, v2 Cackle, v8 Wheezy chuckle, v12 Wheezy heh-heh,
// v15 Chuckle + hum (Evtim's picks from the audition board).
const MASCOT_LAUGHS = [
	'sfx_ms_mascot_win_1',
	'sfx_ms_mascot_win_2',
	'sfx_ms_mascot_win_3',
	'sfx_ms_mascot_win_4',
	'sfx_ms_mascot_win_5',
] as const;
let lastLaugh = -1;
const playMascotLaugh = () => {
	// uniform over the takes other than the last one
	const pool = MASCOT_LAUGHS.length - (lastLaugh < 0 ? 0 : 1);
	let pick = Math.floor(Math.random() * pool);
	if (lastLaugh >= 0 && pick >= lastLaugh) pick += 1;
	lastLaugh = pick;
	eventEmitter.broadcast({ type: 'soundOnce', name: MASCOT_LAUGHS[pick] });
};

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
// cascade wins of the current spin: the step ladder climbs with each one
let cascadeStep = 0;

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
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
	await eventEmitter.broadcastAsync({ type: 'transitionOpen' });
	eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_fs_intro' });
	eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_ms_freespin' });
	// resolves once the intro has played out and the player pressed through it
	await eventEmitter.broadcastAsync({
		type: 'freeSpinIntroUpdate',
		totalFreeSpins: totalFs,
	});
	eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
	eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
	eventEmitter.broadcast({ type: 'globalMultiplierShow' });
	stateGame.globalMultiplier = multiplier;
	await eventEmitter.broadcastAsync({
		type: 'globalMultiplierUpdate',
		multiplier, // resets when multiplier === 1
	});
	eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
	eventEmitter.broadcast({
		type: 'freeSpinCounterUpdate',
		current: undefined,
		total: totalFs,
	});
	await eventEmitter.broadcastAsync({ type: 'uiShow' });
	await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
	eventEmitter.broadcast({ type: 'drawerFold' });
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		stateGame.tumbleWin = 0;
		mascotReacted = false;
		stateGame.scatterPending = false;
		cascadeStep = 0;
		// base game: the plate's accumulated multiplier belongs to one spin only
		// (free spins carry it via the book's updateGlobalMult events)
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
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_board_dropout' });
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
		} finally {
			stateGame.spinAnticipation = [];
			scatterPendingEnd();
			stateUi.reelsSpinning = false;
		}
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		if (!mascotReacted && spinWinReachesTotalBet(bookEvent.totalWin)) {
			mascotReacted = true;
			eventEmitter.broadcast({ type: 'mascotWin' });
			playMascotLaugh();
		}

		const promise1 = async () => {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_win_cycle' });
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
		void promise2();
		await promise1();
	},
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		stateGame.tumbleWin = bookEvent.amount;
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_ms_cascade_step',
				forcePlay: true,
				rate: ladderRate(CASCADE_STEP_RATES, cascadeStep++),
			});
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
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_scatter_win' });
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
		if (bookEvent.amount > 0) eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_fs_counter' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
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

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		// the outro plays over the free-spins theatre; gameType flips to base only
		// once the curtains are closed, so the dressing swap is never seen
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_fs_outro' });
		winLevelSoundsPlay({ winLevelData });
		// below the big levels the total counts up over its own short bed
		if (winLevelData?.type !== 'big') {
			eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_ms_totalwin' });
		}
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		await eventEmitter.broadcastAsync({ type: 'transitionClose' });
		stateGame.gameType = 'basegame';
		winLevelSoundsStop();
		await eventEmitter.broadcastAsync({ type: 'transitionOpen' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
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
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_mult_activate' });
		await eventEmitter.broadcastAsync({ type: 'multiplierBoardAnimate' });
		eventEmitter.broadcast({ type: 'boardWithMovingMultiplierTexts' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_mult_fly' });
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
		// a bomb tumble bangs on the rig's `detonate` event instead (Symbol.svelte)
		if (!stateGame.bombPending) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_goo_burst' });
		}
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: bookEvent.explodingSymbols,
		});
		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_tumble_drop' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown', anticipation });
		if (anticipation) scatterPendingEnd();
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
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_mult_activate' });
		await eventEmitter.broadcastAsync({ type: 'multiplierBoardAnimate' });
		bookEvent.multipliers.forEach((position) => {
			getReelSymbol(position).rawSymbol = { name: 'M_TAKEN' };
		});
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_mult_fly' });
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
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_fs_retrigger' });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
	},
	// Cloner, on the settled reel board: the original casts and its ghosts fly to
	// the clone cells; each landing splats the cell into a cloner; then every
	// cloner (original + clones) drains out under the flood and the book's symbol
	// lands in its place. Afterwards the reel board matches the math's board.
	clonerActivate: async (bookEvent: BookEventOfType<'clonerActivate'>) => {
		const CAST_RELEASE_MS = 200; // the ghosts peel off ~0.15-0.30s into `cast`
		const BEAT_MS = 250;
		const timeScale = stateBetDerived.timeScale();
		const getReelSymbol = (position: Position) =>
			stateGame.board[position.reel].reelState.symbols[position.row];

		eventEmitter.broadcast({ type: 'boardShow' });
		const origin = getReelSymbol(bookEvent.cloner);

		// 1. cast + flights run together: the flights start CAST_RELEASE_MS into the cast
		const cast = async () => {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_cloner_cast' });
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
			// one splat per ghost, 60ms apart: a varied rate keeps the run from sounding copied
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_ms_clone_splat',
				forcePlay: true,
				rate: 0.92 + 0.2 * Math.random(),
			});
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

		// 4. flood: signs drain out, the covered cells swap to the paying symbol, which lands
		const cloners = [bookEvent.cloner, ...bookEvent.cloned];
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_cloner_flood' });
		await Promise.all(
			cloners.map((position) =>
				waitForResolve((resolve) => {
					const reelSymbol = getReelSymbol(position);
					reelSymbol.symbolState = 'out'; // holds its last frame until the swap
					stateGame.cloneFx[getCellKey(position)] = {
						kind: 'flood',
						onSwap: () => {
							reelSymbol.rawSymbol = { name: bookEvent.symbol };
							reelSymbol.symbolState = 'land'; // completes to 'static' (ReelSymbol)
						},
						oncomplete: resolve,
					};
				}),
			),
		);
		cloners.forEach((position) => delete stateGame.cloneFx[getCellKey(position)]);
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		// a bought round has no trigger: its buyFreeSpins re-dresses the theatre
		const lastBuyFreeSpinsEvent = findLastBookEvent('buyFreeSpins' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		// the trigger replays its scatter celebration: put back the board that
		// triggered it first, or the reload's initial board cells would light up
		const triggerReveal =
			lastFreeSpinTriggerEvent &&
			(_.findLast(
				bookEvents,
				(event) => event.type === 'reveal' && event.index < lastFreeSpinTriggerEvent.index,
			) as BookEventOfType<'reveal'> | undefined);
		if (triggerReveal) eventEmitter.broadcast({ type: 'boardSettle', board: triggerReveal.board });

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		else if (lastBuyFreeSpinsEvent) await playBookEvent(lastBuyFreeSpinsEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
