import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived, winCycleState, type MovingWild } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { CELL_W, CELL_H, REEL_PADDING, BOARD_DIMENSIONS } from './constants';
import config from './config';

let movingWildIdCounter = 0;
const wildX = (reel: number) => CELL_W * (reel + REEL_PADDING);
const wildY = (row: number) => (row - 0.5) * CELL_H;

/**
 * Reads the kraken's bounty out of a reveal's board. Both wilds and coins are real
 * symbols on the board (`wild: true` / `coin: true` + `multiplier`); only the
 * VISIBLE rows count — index 0 and 4 are the spin padding.
 *
 * The board is authoritative, not `spinType`: the flag says which kind of attack
 * the book intended, the board says where it landed.
 */
const readSpecials = (board: BookEventOfType<'reveal'>['board']) => {
	const wilds: Position[] = [];
	const coins: (Position & { multiplier: number })[] = [];
	for (let reel = 0; reel < board.length; reel++) {
		for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
			const symbol = board[reel]?.[row];
			if (!symbol) continue;
			if (symbol.wild) wilds.push({ reel, row });
			if (symbol.coin) coins.push({ reel, row, multiplier: symbol.multiplier ?? 0 });
		}
	}
	return { wilds, coins };
};

let overlayIdCounter = 0;
/**
 * Puts the kraken's bounty on screen over the still-spinning reels. The reels are
 * shaded behind it so it reads as sitting in front of the spin. Coins go on blank
 * and reveal their value here, mid-spin (see SpecialOverlay).
 */
const showOverlay = (
	symbols: { name: 'W' | 'C'; reel: number; row: number; multiplier?: number }[],
) => {
	stateGame.overlaySymbols = symbols.map((symbol) => ({
		id: overlayIdCounter++,
		landed: false,
		...symbol,
	}));
};

/**
 * The reels have stopped, so the overlay hands over to the real symbols underneath.
 *
 * Those symbols are in `land` and would play their reveal animation now — but the
 * overlay copy already played it mid-spin, and ReelSymbol hides a coin's value while
 * it is landing. Replaying it would pop the coin a second time and blink the value
 * off for 0.6s. So each covered cell is put straight into the resting state it would
 * have reached on its own (see ReelSymbol's land oncomplete), which keeps the value
 * exactly where the overlay left it.
 */
const clearOverlay = () => {
	for (const symbol of stateGame.overlaySymbols) {
		const reelSymbol = stateGame.board[symbol.reel]?.reelState.symbols[symbol.row];
		if (reelSymbol?.symbolState !== 'land') continue;
		reelSymbol.symbolState = symbol.name === 'W' ? 'idle' : 'static';
	}
	stateGame.overlaySymbols = [];
};

/**
 * Puts the feature's trigger board back on the reels.
 *
 * `settle` rebuilds every reel symbol in the initial `static` state, so the wilds and
 * scatters are nudged back to `idle` — the state they would have been left in when
 * they landed. Without it the chest that triggered the feature sits frozen.
 *
 * No-ops when there is no stashed board (a resumed round whose trigger reveal is not
 * in the resumable state, or a bought bonus that never played a base spin): the reels
 * then keep whatever they are showing, which is the current behaviour.
 */
const restoreTriggerBoard = () => {
	if (!stateGame.triggerBoard) return;
	stateGameDerived.enhancedBoard.settle(stateGame.triggerBoard);
	for (const reel of stateGame.board) {
		for (const reelSymbol of reel.reelState.symbols) {
			const name = reelSymbol.rawSymbol.name;
			if (name === 'S' || name === 'W') reelSymbol.symbolState = 'idle';
		}
	}
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.presentDuration) {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_countup' });
	}
};

const winLevelSoundsStop = () => {
	// sfx_countup is stopped by WinCountUpProvider.oncomplete in Win/FreeSpinOutro
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			// Clean up previous spin's win state so Win.svelte unmounts and re-mounts
			eventEmitter.broadcast({ type: 'winHide' });
			eventEmitter.broadcast({ type: 'boardResetSymbols' });
			winCycleState.lastWins = null;

			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		// A spin cut short (stop button, replay teardown) can leave the overlay up
		clearOverlay();
		stateGame.reelsShaded = false;

		stateGame.gameType = bookEvent.gameType;
		stateGame.spinType = bookEvent.spinType;
		// The math does not set `isSpecialSpin` — every book we have carries it as
		// false and marks the attack with `spinType` instead ('WILD' | 'COIN', set on
		// every free-spin reveal). Keying off the flag alone meant the base game never
		// took its special-spin path at all and free-spin coin spins were treated as
		// ordinary spins. `spinType` leads; the flag is still honoured if it appears.
		const isSpecialSpin = Boolean(bookEvent.spinType) || Boolean(bookEvent.isSpecialSpin);
		stateGame.isSpecialSpin = isSpecialSpin;
		stateUi.reelsSpinning = true;
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_reelspin' });

		const { wilds: wildPositions, coins: coinPositions } = readSpecials(bookEvent.board);

		// Remember the last base-game board: if this round triggers the feature, this is
		// the board the free spins are entered from and the one to come back to.
		if (bookEvent.gameType === 'basegame') stateGame.triggerBoard = bookEvent.board;

		if (bookEvent.gameType === 'freegame') {
			// Start reels spinning visually
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});

			// Position wilds while reels spin
			const isFirstFreeSpinReveal = stateGame.movingWilds.length === 0;
			const spawnsWilds = isFirstFreeSpinReveal && wildPositions.length > 0;
			// The kraken attacks when it has something NEW to put on the reels: the
			// first batch of sticky wilds, or a coin spin. Sliding wilds that are
			// already on screen is not an attack.
			const attacks = spawnsWilds || coinPositions.length > 0;
			// how long the reels keep spinning with the bounty on top of them
			let hold = 2000; // nothing to show — just let the reels run

			if (attacks) {
				await waitForTimeout(300);
				// resolves on the spine's `reelsCovered` event: the dust cloud now
				// hides the reels, so whatever we place next appears behind it and is
				// revealed as the cloud thins. Reels spin underneath throughout.
				await eventEmitter.broadcastAsync({ type: 'krakenAttack' });
			}

			if (spawnsWilds) {
				// First free spin: the sticky wilds spawn hidden behind the cloud.
				for (const pos of wildPositions) {
					const wild: MovingWild = {
						id: movingWildIdCounter++,
						x: new Tween(wildX(pos.reel)),
						y: new Tween(wildY(pos.row)),
						reel: pos.reel,
						row: pos.row,
						landed: false,
					};
					stateGame.movingWilds = [...stateGame.movingWilds, wild];
				}
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_land', forcePlay: true });
				hold = 1200; // while the cloud thins and the wilds emerge
			} else if (wildPositions.length > 0) {
				// Subsequent spins: move existing wilds to new positions
				const updated = [...stateGame.movingWilds];
				const existingCount = updated.length;

				// Move existing wilds (no sound — just repositioning)
				const keepCount = Math.min(existingCount, wildPositions.length);
				for (let i = 0; i < keepCount; i++) {
					updated[i].x.set(wildX(wildPositions[i].reel), { duration: 400 });
					updated[i].y.set(wildY(wildPositions[i].row), { duration: 400 });
					updated[i].reel = wildPositions[i].reel;
					updated[i].row = wildPositions[i].row;
				}

				// Add new wilds if more than before
				const newWildCount = wildPositions.length - existingCount;
				for (let i = existingCount; i < wildPositions.length; i++) {
					updated.push({
						id: movingWildIdCounter++,
						x: new Tween(wildX(wildPositions[i].reel)),
						y: new Tween(wildY(wildPositions[i].row)),
						reel: wildPositions[i].reel,
						row: wildPositions[i].row,
						landed: false,
					});
				}

				// Remove extras if fewer
				if (wildPositions.length < existingCount) {
					updated.length = wildPositions.length;
				}

				stateGame.movingWilds = updated;
				// Only play landing sound for newly added wilds
				for (let i = 0; i < newWildCount; i++) {
					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_land', forcePlay: true });
					if (i < newWildCount - 1) await waitForTimeout(150);
				}
				hold = 1000;
			} else {
				// No wilds this spin — clear all
				stateGame.movingWilds = [];
			}

			if (coinPositions.length > 0) {
				// Coin spin: blank coins appear behind the cloud on the overlay layer,
				// ride the still-spinning reels and reveal their values there, exactly
				// like the wilds above. The real C symbols are in this reveal's board and
				// take over at the stop with the values already on them.
				showOverlay(coinPositions.map((coin) => ({ name: 'C' as const, ...coin })));
				// TODO: no coin-specific sfx exists yet — sounds.json only has
				// sfx_wild_land / sfx_wild_explode. Swap in a coin sound when one lands.
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_land', forcePlay: true });
				hold = 1200; // while the cloud thins and the coins emerge
			}

			// Shade the reels behind whatever is sitting on top of them.
			stateGame.reelsShaded =
				stateGame.overlaySymbols.length > 0 || stateGame.movingWilds.length > 0;

			await waitForTimeout(hold);

			// Send stop targets — reels begin stopping sequence
			await stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});

			clearOverlay();
			stateGame.reelsShaded = false;
		} else if (isSpecialSpin) {
			// Base-game special spin: same beats as the free-spin path. The wilds and
			// coins are REAL symbols already in this reveal's board, so the overlay
			// copies are what the player sees arrive mid-spin and the real ones take
			// over at the stop (`clearOverlay`). None of the freegame-only gates
			// (which hide board `W` so the overlay is the only wild) apply here.
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});
			await waitForTimeout(300);
			// resolves on the spine's `reelsCovered` event — cloud now covers the reels
			await eventEmitter.broadcastAsync({ type: 'krakenAttack' });
			showOverlay([
				...wildPositions.map((pos) => ({ name: 'W' as const, ...pos })),
				...coinPositions.map((coin) => ({ name: 'C' as const, ...coin })),
			]);
			// TODO: no coin-specific sfx exists yet — sounds.json only has
			// sfx_wild_land / sfx_wild_explode. Swap in a coin sound when one lands.
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_land', forcePlay: true });
			stateGame.reelsShaded = stateGame.overlaySymbols.length > 0;
			// keep spinning as the cloud thins and reveals the bounty, then stop
			await waitForTimeout(1200);
			await stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});
			clearOverlay();
			stateGame.reelsShaded = false;
		} else {
			await stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});
		}

		stateUi.reelsSpinning = false;
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_reelspin' });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });

		// Breathing room for no-win free spins so player can see the board
		if (bookEvent.gameType === 'freegame') {
			const nextEvent = bookEvents[bookEvent.index + 1];
			if (nextEvent?.type !== 'winInfo') {
				await waitForTimeout(1000);
			}
		}
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		winCycleState.lastWins = bookEvent.wins;

		// The coin win is NOT part of the board's win animation — coins are gathered
		// by the kraken in setWin's second beat. A spin can carry both (the math emits
		// the payline wins and one `symbol: 'C'` win in the same winInfo), and lumping
		// them together made a coin celebrate alongside the payline symbols and then
		// get collected again.
		const lineWins = bookEvent.wins.filter((win) => win.symbol !== 'C');
		const coinPositions = _.uniqWith(
			bookEvent.wins.filter((win) => win.symbol === 'C').flatMap((win) => win.positions),
			_.isEqual,
		);
		// All payline symbols animate once simultaneously
		const allPositions = _.uniqWith(
			lineWins.flatMap((win) => win.positions),
			_.isEqual,
		);

		// Winning coins stay BRIGHT while the paylines celebrate, they just don't
		// animate: `postWinStatic` renders in the unmasked layer for as long as a win
		// presentation is running, so the coin sits at rest above the dim overlay with
		// its value on, waiting for the kraken.
		for (const position of coinPositions) {
			const reelSymbol = stateGame.board[position.reel]?.reelState.symbols[position.row];
			if (reelSymbol) reelSymbol.symbolState = 'postWinStatic';
		}

		// Base game: winning wilds fly into the kraken (session tension build-up).
		// Skipped on a special spin — the kraken spawned those wilds this very spin.
		if (stateGame.gameType === 'basegame' && !stateGame.isSpecialSpin) {
			const board = stateGameDerived.boardRaw();
			const wildPositions = allPositions.filter(
				(pos) => board[pos.reel]?.[pos.row]?.name === 'W',
			);
			if (wildPositions.length > 0) {
				eventEmitter.broadcast({ type: 'krakenCollect', positions: wildPositions });
			}
		}

		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_win_line' });
		// Nothing to animate on a coins-only spin — skip it rather than dimming the
		// board for an empty position list, so the coins are collected off a clean board
		if (allPositions.length === 0) return;
		// Start animations but proceed after 500ms so winbox shows early
		await Promise.race([animateSymbols({ positions: allPositions }), waitForTimeout(500)]);
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// the kraken finally attacks — the fed-wilds tension is released
		stateGame.krakenCollects = 0;
		// the kraken rears up to full size and slams; the fullscreen burst is
		// fired mid-slam (not after) so its cloud merges with the kraken's own
		// slam dust into one continuous eruption
		eventEmitter.broadcast({ type: 'krakenAttack' });
		await waitForTimeout(1200);
		// resolves at full coverage; the intro then fades in underneath while
		// the cloud dissipates
		await eventEmitter.broadcastAsync({ type: 'fsCloudBurst' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// Animate retrigger scatters with "+N" overlay on each bonus symbol
		const extraSpins = bookEvent.totalFs - stateUi.freeSpinCounterTotal;
		stateGame.retriggerExtra = extraSpins;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// RETRIGGER splash text over the board; per-scatter "+1" labels are
		// rendered by ReelSymbol, so no positions are passed here.
		eventEmitter.broadcast({ type: 'freeSpinRetriggerShow', extraSpins, positions: [] });
		await animateSymbols({ positions: bookEvent.positions });
		stateGame.retriggerExtra = 0;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winHide' });
		eventEmitter.broadcast({ type: 'boardResetSymbols' });
		winCycleState.lastWins = null;
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_totalwin_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();

		// Put the base game back while the outro is still opaque and covering the whole
		// canvas: the board swaps to the trigger board, the sticky wilds go, and the
		// frame/background revert — all of it unseen. Done after the outro starts fading
		// (or after the transition, as it was) these would pop one by one on screen.
		stateGame.movingWilds = [];
		stateGame.gameType = 'basegame';
		restoreTriggerBoard();

		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'stopButtonEnable' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		// Loop the payline symbols during the countup. Coins are excluded for the same
		// reason as in winInfo — the kraken collects them, they never celebrate in place.
		if (winCycleState.lastWins) {
			const allPositions = _.uniqWith(
				winCycleState.lastWins.filter((win) => win.symbol !== 'C').flatMap((win) => win.positions),
				_.isEqual,
			);
			if (allPositions.length > 0) {
				eventEmitter.broadcast({ type: 'boardLoopSymbols', symbolPositions: allPositions });
				stateGame.winLooping = true;
			}
		}

		// Coin spins present in three beats: the payline wins count up first, then each
		// coin flies into the kraken with its multiplier summing above it, then that
		// total is handed to the winbox, which counts ON from the payline figure to the
		// full spin win. The two winUpdates give exactly that because Win.svelte runs a
		// fresh count-up per update while keeping the provider's tween — see countUpRun
		// there; before that, the second beat silently never ran.
		const coinWins = (winCycleState.lastWins ?? []).filter((win) => win.symbol === 'C');
		const coins = coinWins.flatMap((win) =>
			win.positions.map((pos, i) => ({
				reel: pos.reel,
				row: pos.row,
				multiplier: win.meta?.coinMultipliers?.[i] ?? 0,
			})),
		);
		const coinAmount = coinWins.reduce((sum, win) => sum + win.win, 0);
		const lineAmount = bookEvent.amount - coinAmount;
		// On a coins-only spin there is no beat 1, so there is no amount to show
		// while the coins fly. Showing the winbox anyway left the PREVIOUS spin's
		// figure on screen for the whole collect — a 29x coin spin sat behind
		// "$0.80" from the spin before it. The box waits for its number instead.
		const coinsOnly = coins.length > 0 && lineAmount <= 0;

		if (!coinsOnly) {
			eventEmitter.broadcast({ type: 'winShow' });
			winLevelSoundsPlay({ winLevelData });
		}

		if (coins.length > 0) {
			// beat 1 — line wins only (skipped when the spin is coins-only)
			if (lineAmount > 0) {
				await eventEmitter.broadcastAsync({
					type: 'winUpdate',
					amount: lineAmount,
					winLevelData,
				});
			}
			// beat 2 — coins into the kraken, total flies to the winbox
			await eventEmitter.broadcastAsync({ type: 'coinCollect', coins });
		}

		if (coinsOnly) {
			// the kraken has just handed the total over — the box opens on it
			eventEmitter.broadcast({ type: 'winShow' });
			winLevelSoundsPlay({ winLevelData });
		} else if (coins.length > 0 && winLevelData?.presentDuration) {
			// beat 1 ended its count-up, which stopped the loop — beat 3 needs it back
			eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_countup' });
		}

		// beat 3 (or the only beat on a normal spin) — count up to the full win
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();

		// Pause during free spins so the player can see their winnings
		if (stateGame.gameType === 'freegame') {
			await waitForTimeout(1000);
		}

		eventEmitter.broadcast({ type: 'winHide' });
		// Board stays dimmed with symbols looping — finalWin picks up seamlessly
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>, { bookEvents }: BookEventContext) => {
		const hasFs = bookEvents.some((e) => e.type === 'freeSpinTrigger' || e.type === 'freeSpinEnd');
		// The per-winline cycle walks paylines; the coin win is not a line (no
		// `meta.lineIndex`) and its symbols were already collected by the kraken.
		const lineWins = winCycleState.lastWins?.filter((win) => win.symbol !== 'C') ?? [];

		if (hasFs || lineWins.length === 0) {
			winCycleState.lastWins = null;
			// Clean up board state left by setWin (dimming + looping symbols)
			eventEmitter.broadcast({ type: 'boardStopLoop' });
			stateGame.winLooping = false;
			eventEmitter.broadcast({ type: 'winHide' });
			return;
		}

		const wins = lineWins;
		const abortController = new AbortController();
		winCycleState.abortController = abortController;

		// Hide winbox after 2s (cancellable)
		const hideTimeout = setTimeout(() => eventEmitter.broadcast({ type: 'winHide' }), 2000);
		abortController.signal.addEventListener(
			'abort',
			() => {
				clearTimeout(hideTimeout);
				eventEmitter.broadcast({ type: 'winHide' });
			},
			{ once: true },
		);

		// Second cycle: per-winline animation (fire-and-forget)
		// winLooping is already true from setWin — board stays dimmed, symbols stay looping
		abortController.signal.addEventListener(
			'abort',
			() => {
				stateGame.winLooping = false;
			},
			{ once: true },
		);

		(async () => {
			while (!abortController.signal.aborted) {
				for (const win of wins) {
					if (abortController.signal.aborted) break;

					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_payline_switch' });
					await eventEmitter.broadcastAsync({
						type: 'boardWithAnimateSymbols',
						symbolPositions: win.positions,
					});

					if (abortController.signal.aborted) break;
				}
			}
		})();
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
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		// On a resumed round the trigger reveal is BEFORE the resume point, so its
		// handler never runs and the board would be lost. These reserved reveals are the
		// only place it survives — stash it so freeSpinEnd can still restore it.
		const lastBaseGameReveal = _.findLast(
			bookEvents,
			(event) => event.type === 'reveal' && event.gameType === 'basegame',
		) as BookEventOfType<'reveal'> | undefined;
		if (lastBaseGameReveal) stateGame.triggerBoard = lastBaseGameReveal.board;

		// Restore FS state without animations (skip intro popup on resume)
		if (lastFreeSpinTriggerEvent) {
			stateGame.gameType = 'freegame';
			eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
			eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
			stateUi.freeSpinCounterShow = true;
			eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		}
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
