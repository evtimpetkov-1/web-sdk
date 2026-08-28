import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { lineWinLabelCell } from './lineWinLabels';
import { stateGame, stateGameDerived, winCycleState, type MovingWild } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { GameType, Position } from './types';
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

/**
 * A SYMBOL kraken spin's bounty: the cells the kraken actually stamped, read
 * off the reveal's `positions` (padded rows 1..3, same convention as winInfo).
 * Only THOSE present as kraken-placed mid-spin; any natural copies of the same
 * symbol land with the reel stop like any other symbol — presenting every
 * board instance as placed (the previous behaviour) read as rigged, because
 * the result was fully known before the reels stopped. Each listed cell is
 * checked against the board; a book without a usable list (hand-authored
 * preview books) falls back to every visible instance.
 */
const readReplicated = (
	board: BookEventOfType<'reveal'>['board'],
	stampSymbol: BookEventOfType<'reveal'>['symbol'],
	listed: BookEventOfType<'reveal'>['positions'],
) => {
	const positions: Position[] = [];
	if (!stampSymbol) return positions;
	for (const pos of listed ?? []) {
		const onBoard =
			pos.row >= 1 && pos.row <= BOARD_DIMENSIONS.y && board[pos.reel]?.[pos.row]?.name === stampSymbol;
		if (onBoard && !positions.some((p) => p.reel === pos.reel && p.row === pos.row)) {
			positions.push({ reel: pos.reel, row: pos.row });
		}
	}
	if (positions.length > 0) return positions;
	for (let reel = 0; reel < board.length; reel++) {
		for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
			if (board[reel]?.[row]?.name === stampSymbol) positions.push({ reel, row });
		}
	}
	return positions;
};

let overlayIdCounter = 0;
/**
 * Puts the kraken's bounty on screen over the still-spinning reels. The reels are
 * shaded behind it so it reads as sitting in front of the spin. Coins go on blank
 * and reveal their value here, mid-spin (see SpecialOverlay).
 */
const showOverlay = (
	symbols: {
		name: keyof typeof config.symbols;
		reel: number;
		row: number;
		multiplier?: number;
	}[],
) => {
	stateGame.overlaySymbols = symbols.map((symbol) => ({
		id: overlayIdCounter++,
		// Neither kind reveals behind the dust. The wild used to land straight away
		// here and was finished before the cloud thinned; both now wait for a clear
		// view (see revealOverlayWilds / revealOverlayCoins).
		revealing: false,
		valueShown: false,
		landed: false,
		...symbol,
	}));
};

/**
 * The coins' reveal, paced against the kraken's attack rather than against nothing.
 *
 * `krakenAttack` resolves on the spine's `reelsCovered` event, but the cloud stays at
 * full coverage for ~0.6s after that and only thins away by ~1.3s. The reveal used to
 * run inside that window, so it happened entirely behind the dust and the coins
 * emerged with their values already on. They now sit blank until the reels are in
 * clear view, and only then turn over.
 *
 * The reveal is `coin_win`, whose flip lands the coin face-on at 0.52s — that is the
 * beat the value belongs on. Its remaining ~1.5s of glint and shine plays on while
 * the reels stop, so the spin is not held for the full animation.
 */
const DUST_CLEAR_MS = 1200; // dust is all but gone, the reels are in clear view
const COIN_VALUE_AT_MS = 520; // the flip lands face-on — the value fades in with it
const COIN_REVEAL_TAIL_MS = 400; // the fade finishes before the reels start stopping
// `wild_land` is 0.6s; the rest is a beat of headroom so the drop has settled
// before the reels start stopping under it.
const WILD_LAND_MS = 800;

const revealOverlayCoins = async () => {
	const coins = stateGame.overlaySymbols.filter((symbol) => symbol.name === 'C');
	if (coins.length === 0) return;
	await waitForTimeout(DUST_CLEAR_MS);
	// The landing sound belongs to THIS beat — the callers used to play it at
	// overlay placement, a full DUST_CLEAR_MS before anything visibly landed,
	// so coins audibly "landed" ~1.2s before wilds did on the same feature.
	// TODO: no coin-specific sfx exists yet — sounds.json only has
	// sfx_wild_land / sfx_wild_explode. Swap in a coin sound when one lands.
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_coin_reveal', forcePlay: true });
	for (const coin of coins) coin.revealing = true;
	await waitForTimeout(COIN_VALUE_AT_MS);
	for (const coin of coins) coin.valueShown = true;
	await waitForTimeout(COIN_REVEAL_TAIL_MS);
};

/**
 * The wild's landing, paced the same way the coins' reveal is.
 *
 * The wilds used to be placed the moment `krakenAttack` resolved — which is full
 * dust coverage — so the whole 0.6s `wild_land` played behind the cloud and the
 * wilds were already looping `wild_idle` by the time it thinned. They read as
 * having simply appeared. Holding them until the reels are back in view means the
 * drop itself is what the player sees, and `wild_idle` takes over after it.
 */
const revealOverlayWilds = async () => {
	const wilds = stateGame.overlaySymbols.filter((symbol) => symbol.name === 'W');
	if (wilds.length === 0) return;
	await waitForTimeout(DUST_CLEAR_MS);
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_kw_wild_land', forcePlay: true });
	for (const wild of wilds) wild.revealing = true;
	await waitForTimeout(WILD_LAND_MS);
};

// The stamped symbols' reveal is their win animation (they have no land/idle of
// their own); its opening punch is the beat that matters, the tail plays out
// while the reels stop — same deal as the coins' glint.
const SYMBOL_STAMP_MS = 800;

/**
 * A SYMBOL kraken spin's reveal: the replicated symbol's copies stamp onto the
 * still-spinning reels, paced exactly like the wilds' drop — held until the
 * kraken's dust has thinned so the stamping is watched, not hidden.
 */
const revealOverlaySymbols = async () => {
	const stamped = stateGame.overlaySymbols.filter(
		(symbol) => symbol.name !== 'W' && symbol.name !== 'C',
	);
	if (stamped.length === 0) return;
	await waitForTimeout(DUST_CLEAR_MS);
	// TODO: no stamp-specific sfx exists yet — sounds.json only has
	// sfx_wild_land / sfx_wild_explode. Swap in a dedicated sound when one lands.
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_kw_symbol_reveal', forcePlay: true });
	for (const symbol of stamped) symbol.revealing = true;
	await waitForTimeout(SYMBOL_STAMP_MS);
};

/**
 * Hands the cells back to the real symbols. Called at the START of a spin, not at the
 * reel stop: the overlay copy owns its cell for the whole spin (the real one is hidden
 * under it), so there is nothing to hand over until the next spin begins — and by then
 * both look identical, which is what makes the swap invisible.
 */
const clearOverlay = () => {
	stateGame.overlaySymbols = [];
	stateGame.naturalStampCells = [];
	stateGame.stampEchoes = [];
};

/**
 * Hands the reels back at the REEL STOP, keeping on the overlay only what still
 * has a job to do — the coins, which the kraken collects from there in setWin.
 *
 * Everything else (stamped symbol copies, base-game wilds) gives its cell back
 * to the identical board symbol. That is what lets them take part in the win
 * presentation like any other symbol: win frame, win animation, dimming, and
 * crucially an `oncomplete` the payline cycle can await.
 *
 * While a wild stayed on the overlay, ReelSymbol hid the board wild underneath
 * it, so that component never mounted and never reported completion —
 * `boardWithAnimateSymbols` then waited forever and finalWin's per-payline cycle
 * froze on its first line. (winInfo's own animation races a 500ms timeout, which
 * is why the first pass looked fine and only the cycling was stuck.)
 *
 * A released wild is settled to `idle`: its landing already played on the
 * overlay mid-spin, and left in `land` the board copy would play `wild_land` a
 * second time.
 */
const releaseOverlayAfterStop = () => {
	if (stateGame.overlaySymbols.length === 0) return;

	for (const symbol of stateGame.overlaySymbols) {
		if (symbol.name !== 'W') continue;
		const reelSymbol = stateGame.board[symbol.reel]?.reelState.symbols[symbol.row];
		if (reelSymbol?.rawSymbol.name === 'W') reelSymbol.symbolState = 'idle';
	}

	stateGame.overlaySymbols = stateGame.overlaySymbols.filter((symbol) => symbol.name === 'C');
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
	// The coin rain is the bed for the big presentations only — under a 0.6s
	// 'standard' win it would be cut off before it read as anything.
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_coin_shower' });
	}
};

/**
 * Restores the ambient track after a win presentation.
 *
 * `gameType` must be passed explicitly where the caller is in the middle of changing
 * it. freeSpinEnd calls this while `stateGame.gameType` is still 'freegame' — the
 * board and background are not switched back until later, under the transition — so
 * reading the state here restarted bgm_freespin just as the feature ended, and the
 * base game then ran on free-spin music until the player's next win happened to call
 * this again.
 */
const winLevelSoundsStop = ({
	gameType = stateGame.gameType,
	winLevelData,
}: { gameType?: GameType; winLevelData?: WinLevelData } = {}) => {
	// sfx_countup is stopped by WinCountUpProvider.oncomplete in Win/FreeSpinOutro
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_coin_shower' });
	// Only the big presentations get a wind-down; the small ones have nothing to
	// wind down from.
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_win_end' });
	}
	eventEmitter.broadcast({
		type: 'soundMusic',
		name: gameType === 'freegame' ? 'bgm_kw_freespin' : 'bgm_kw_main',
	});
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
		// The previous spin's kraken wilds leave at SPIN START, exactly like the
		// overlay coins: with them gone, ReelSymbol un-hides the identical board
		// wilds underneath, which then spin away like any other symbol. They
		// used to be dropped only when the next attack's cloud covered the
		// reels, so they sat frozen on top of the spin-up.
		stateGame.movingWilds = [];
		stateGame.reelsShaded = false;

		// The previous spin's kraken multiplier is spent — the badge (a plate in
		// BoardFrame, rendered while this is > 1) leaves as the new spin starts.
		stateGame.spinMultiplier = 1;

		stateGame.gameType = bookEvent.gameType;
		stateGame.spinType = bookEvent.spinType;
		// The math does not set `isSpecialSpin` — every book we have carries it as
		// false and marks the attack with `spinType` instead ('WILD' | 'COIN', set on
		// every free-spin reveal). Keying off the flag alone meant the base game never
		// took its kraken-spin path at all and free-spin coin spins were treated as
		// ordinary spins. `spinType` leads; the flag is still honoured if it appears.
		const isSpecialSpin = Boolean(bookEvent.spinType) || Boolean(bookEvent.isSpecialSpin);
		stateGame.isSpecialSpin = isSpecialSpin;
		stateUi.reelsSpinning = true;
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_reel_spin' });

		const { wilds: wildPositions, coins: coinPositions } = readSpecials(bookEvent.board);
		// The math names the replicated symbol `symbol` on the reveal and lists the
		// cells it stamped in `positions` — see typesBookEvent.
		const stampSymbol = bookEvent.spinType === 'SYMBOL' ? bookEvent.symbol : undefined;
		const stampPositions = readReplicated(bookEvent.board, stampSymbol, bookEvent.positions);
		// the stamped symbol's natural copies — every visible instance the list
		// left out. They land with the reels and puff the kraken's dust on landing.
		stateGame.naturalStampCells = readReplicated(bookEvent.board, stampSymbol, undefined).filter(
			(cell) => !stampPositions.some((p) => p.reel === cell.reel && p.row === cell.row),
		);
		// The kraken's per-spin win multiplier (free spins only, spec v2.1) —
		// `globalMult` on the reveal, riding on any attack kind.
		const spinMultiplier =
			bookEvent.gameType === 'freegame' ? Math.max(1, bookEvent.globalMult ?? 1) : 1;

		// Remember the last base-game board: if this round triggers the feature, this is
		// the board the free spins are entered from and the one to come back to.
		if (bookEvent.gameType === 'basegame') stateGame.triggerBoard = bookEvent.board;

		// The actor already preSpins the reels at button press (onNewGameStart),
		// so the FIRST reveal of a bet arrives with the reels in motion. Calling
		// preSpin again on spinning reels re-inserts padding and re-runs the
		// per-reel stagger — a visible stutter that only kraken spins had.
		// Free-spin reveals 2..N have no actor callback, so THEY still need it.
		const reelsAlreadySpinning = stateGame.board.some(
			(reel) => reel.reelState.motion === 'spinning',
		);

		if (bookEvent.gameType === 'freegame') {
			// Start reels spinning visually
			if (!reelsAlreadySpinning) {
				await stateGameDerived.enhancedBoard.preSpin({
					paddingBoard: config.paddingReels[bookEvent.gameType],
				});
			}

			// Every free spin is a Kraken Spin (spec v2.1): the kraken attacks before
			// the reels stop and puts Wilds, Coins or copies of one paying Symbol on
			// them. Wilds are placed FRESH each spin — they are not sticky and do not
			// travel between positions, so the previous batch is dropped and the new
			// one spawns behind the dust cloud. The kraken can also award a win
			// multiplier for the spin — that too is presented as part of the attack.
			const attacks =
				wildPositions.length > 0 ||
				coinPositions.length > 0 ||
				stampPositions.length > 0 ||
				spinMultiplier > 1;
			// how long the reels keep spinning with the bounty on top of them
			let hold = 2000; // nothing to show — just let the reels run

			if (attacks) {
				await waitForTimeout(300);
				// resolves on the spine's `reelsCovered` event: the dust cloud now
				// hides the reels, so whatever we place next appears behind it and is
				// revealed as the cloud thins. Reels spin underneath throughout.
				await eventEmitter.broadcastAsync({ type: 'krakenAttack' });
			}

			// The multiplier badge surfaces with the attack, as the kraken's award for
			// this spin. The book's win amounts already include it — the state drives
			// the MULTIPLIER plate in BoardFrame, presentation only.
			if (spinMultiplier > 1) {
				stateGame.spinMultiplier = spinMultiplier;
			}

			// The previous batch goes before the new one lands — wilds are not sticky.
			stateGame.movingWilds = [];

			if (wildPositions.length > 0) {
				// Held until the cloud has thinned, for the same reason the overlay
				// wilds are (see revealOverlayWilds): spawning at `reelsCovered` ran
				// the entire 0.6s `wild_land` behind the dust, so the wilds surfaced
				// already idling instead of being seen to drop.
				await waitForTimeout(DUST_CLEAR_MS);
				stateGame.movingWilds = wildPositions.map((pos): MovingWild => ({
					id: movingWildIdCounter++,
					x: new Tween(wildX(pos.reel)),
					y: new Tween(wildY(pos.row)),
					reel: pos.reel,
					row: pos.row,
					landed: false,
				}));
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_kw_wild_land', forcePlay: true });
				hold = WILD_LAND_MS; // let the drop finish before the reels stop
			}

			if (coinPositions.length > 0) {
				// Coin spin: blank coins are placed behind the cloud on the overlay layer
				// and ride the still-spinning reels. They reveal only once the dust has
				// cleared (revealOverlayCoins), and they keep their cells for the rest of
				// the spin — the real C symbols stay hidden underneath.
				showOverlay(coinPositions.map((coin) => ({ name: 'C' as const, ...coin })));
				// landing sound plays inside revealOverlayCoins, on the reveal beat
				hold = 0; // revealOverlayCoins below paces this spin instead
			}

			if (stampPositions.length > 0 && stampSymbol) {
				// Symbol spin: copies of the chosen paying symbol stamp onto the reels,
				// on the overlay layer like the coins — they own their cells until the
				// next spin, the identical board symbols stay hidden underneath.
				showOverlay(stampPositions.map((pos) => ({ name: stampSymbol, ...pos })));
				hold = 0; // revealOverlaySymbols below paces this spin instead
			}

			// Shade the reels behind whatever is sitting on top of them.
			stateGame.reelsShaded =
				stateGame.overlaySymbols.length > 0 || stateGame.movingWilds.length > 0;

			await waitForTimeout(hold);
			// blank coins sit through the dust, then reveal in the open
			await revealOverlayCoins();
			// stamped symbol copies do the same (one attack kind per spin — only one
			// of these ever has anything to do)
			await revealOverlaySymbols();

			// Send stop targets — reels begin stopping sequence
			await stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});

			// the overlay stays up — it owns those cells until the next spin
			stateGame.reelsShaded = false;
		} else if (isSpecialSpin) {
			// Base-game kraken spin: same beats as the free-spin path. The wilds,
			// coins and stamped symbol copies are REAL symbols already in this
			// reveal's board, but the overlay copies are what the player sees —
			// ReelSymbol hides a board symbol for as long as the overlay holds one of
			// its kind, so the two never double up.
			if (!reelsAlreadySpinning) {
				await stateGameDerived.enhancedBoard.preSpin({
					paddingBoard: config.paddingReels[bookEvent.gameType],
				});
			}
			await waitForTimeout(300);
			// resolves on the spine's `reelsCovered` event — cloud now covers the reels
			await eventEmitter.broadcastAsync({ type: 'krakenAttack' });
			showOverlay([
				...wildPositions.map((pos) => ({ name: 'W' as const, ...pos })),
				...coinPositions.map((coin) => ({ name: 'C' as const, ...coin })),
				...(stampSymbol ? stampPositions.map((pos) => ({ name: stampSymbol, ...pos })) : []),
			]);
			stateGame.reelsShaded = stateGame.overlaySymbols.length > 0;
			// Keep spinning as the cloud thins, then play the landing/reveal in the
			// clear. A kraken spin carries exactly one kind of bounty.
			if (coinPositions.length > 0) {
				// landing sound plays inside revealOverlayCoins, on the reveal beat
				await revealOverlayCoins();
			} else if (wildPositions.length > 0) {
				await revealOverlayWilds();
			} else if (stampPositions.length > 0) {
				await revealOverlaySymbols();
			} else {
				await waitForTimeout(DUST_CLEAR_MS);
			}
			await stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});
			// the overlay stays up — it owns those cells until the next spin
			stateGame.reelsShaded = false;
		} else {
			await stateGameDerived.enhancedBoard.spin({
				revealEvent: bookEvent,
				paddingBoard: config.paddingReels[bookEvent.gameType],
			});
		}

		// The reels have stopped — everything but the coins gives way to the
		// identical board symbols so the win presentation can treat them like any
		// other symbol.
		releaseOverlayAfterStop();

		stateUi.reelsSpinning = false;
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_reel_spin' });
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
		// animate. On a kraken coin spin the overlay copy is the one on screen and it
		// already sits above the dim; this covers the board symbol for any spin where
		// the overlay is not up, by parking it in `postWinStatic` — which renders in the
		// unmasked layer for as long as a win presentation runs.
		for (const position of coinPositions) {
			const reelSymbol = stateGame.board[position.reel]?.reelState.symbols[position.row];
			if (reelSymbol) reelSymbol.symbolState = 'postWinStatic';
		}

		// Base game: winning wilds fly into the kraken (session tension build-up).
		// Skipped on a kraken spin — the kraken spawned those wilds this very spin.
		if (stateGame.gameType === 'basegame' && !stateGame.isSpecialSpin) {
			const board = stateGameDerived.boardRaw();
			const wildPositions = allPositions.filter(
				(pos) => board[pos.reel]?.[pos.row]?.name === 'W',
			);
			if (wildPositions.length > 0) {
				eventEmitter.broadcast({ type: 'krakenCollect', positions: wildPositions });
			}
		}

		// No per-line amounts on this beat. Every winning line lights up at once
		// here, and a plate on each of them reads as clutter the moment a spin hits
		// more than a couple — they belong to finalWin's cycle, where one line is
		// walked at a time and the figure has something to attach to.
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
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bonus_trigger' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// the kraken finally attacks — the fed-wilds tension is released
		stateGame.krakenCollects = 0;
		// the kraken rears up to full size and slams; the fullscreen burst is
		// fired mid-slam (not after) so its cloud merges with the kraken's own
		// slam dust into one continuous eruption
		eventEmitter.broadcast({ type: 'krakenAttack' });
		await waitForTimeout(1200);
		// resolves at full coverage — and STAYS there: the cloud is the intro's
		// backdrop (2026-08-26 rework), held frozen until the player presses
		// through the intro. fsCloudRelease below is what lets it dissipate.
		await eventEmitter.broadcastAsync({ type: 'fsCloudBurst', hold: true });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_kw_fs_intro' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_kw_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		// the intro fades out while the held cloud runs on to dissipation,
		// revealing the free-spins board underneath
		eventEmitter.broadcast({ type: 'fsCloudRelease' });
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
		// Beat 1 gets the landing celebration; the award cue belongs to beat 2, with
		// the card. Firing sfx_fs_retrigger here instead meant it played a second or
		// more BEFORE the "+N FREE SPINS" splash it announces, leaving the card
		// itself silent.
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win' });
		// Two SEQUENTIAL beats (they used to overlap, and the splash's full-screen
		// shade buried the bonus symbol's celebration under the RETRIGGER card):
		//
		// beat 1 — the landed Bonus symbol celebrates in the clear, with its "+1"
		// chip (rendered by ReelSymbol while retriggerExtra is set).
		await animateSymbols({ positions: bookEvent.positions });
		stateGame.retriggerExtra = 0;

		// beat 2 — the RETRIGGER splash. Awaited so the queue holds until the
		// card has left the screen — otherwise the next free spin spins up
		// behind the dimmed card (visible on autoplay).
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fs_retrigger', forcePlay: true });
		const splashShown = eventEmitter.broadcastAsync({
			type: 'freeSpinRetriggerShow',
			extraSpins,
			positions: [],
		});
		// Counter ticks up to the new total while the card is on screen — that
		// pairing is the point of the beat.
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await splashShown;
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fs_counter', forcePlay: true });
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
		// Before the outro, not after: a multiplier awarded on the LAST free spin
		// never strikes if that spin paid nothing, and it was still on screen —
		// drawn over the TOTAL WIN card — because it was only cleared once the
		// outro had finished.
		stateGame.spinMultiplier = 1;
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fs_outro' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_totalwin_panel' });
		// A bed of its own under the feature total, rather than leaving the free-spin
		// track running while the round is plainly over.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_totalwin' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			// The TOTAL WIN the outro shows must match every other total in the
			// round: bookEvent.amount is the FREE-SPINS-SESSION sum only, but the
			// bet's running total (set by setTotalWin, shown in the TOTAL WIN
			// counter) also includes the base-game winnings of the triggering
			// spin. Count to that instead; fall back to the event amount if the
			// running total is somehow behind it.
			amount: Math.max(stateBet.winBookEventAmount, bookEvent.amount),
			winLevelData,
		});
		// the feature is over — the ambient goes back to the base game track even though
		// gameType does not flip until the transition below
		winLevelSoundsStop({ gameType: 'basegame', winLevelData });

		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;

		// Put the base game back: the board swaps to the trigger board, the sticky wilds
		// and coins go, and the frame/background revert. This is timed to land under the
		// transition — its black overlay comes up at 0.7 and the screen shakes — because
		// the outro no longer hides it. The outro used to sit on an opaque painted
		// background and this ran while that covered the canvas; it is a screen shade
		// now, so the swap would have been visible straight through it.
		//
		// The overlay MUST be cleared here. It is otherwise only cleared at the start of
		// the next reveal — correct while the feature is running, since the overlay copy
		// is the visible symbol and has to hold its cell until the next spin — but the
		// feature ending is the one exit that replaces the board without a reveal. Left
		// alone, the last free spin's coins sat on top of the restored trigger board and
		// stayed there until the player spun again.
		stateGame.movingWilds = [];
		clearOverlay();
		stateGame.gameType = 'basegame';
		restoreTriggerBoard();

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
		const allWins = winCycleState.lastWins ?? [];
		const coinWins = allWins.filter((win) => win.symbol === 'C');
		const lineWins = allWins.filter((win) => win.symbol !== 'C');
		const coins = coinWins.flatMap((win) =>
			win.positions.map((pos, i) => ({
				reel: pos.reel,
				row: pos.row,
				multiplier: win.meta?.coinMultipliers?.[i] ?? 0,
			})),
		);
		const coinAmount = coinWins.reduce((sum, win) => sum + win.win, 0);
		const lineAmount = bookEvent.amount - coinAmount;

		/**
		 * The kraken's per-spin multiplier (free spins).
		 *
		 * The book's amounts ALREADY include it, so the presentation counts to the
		 * unmultiplied figures first and lets the multiplier strike at the end —
		 * it has to be last, because a coin spin adds its coin total after the
		 * payline wins and anything earlier would multiply half a win.
		 *
		 * The pre-strike figures are READ from the book (`meta.winWithoutMult`,
		 * verified against a real book as sum(winWithoutMult) x globalMult ===
		 * setWin.amount) rather than divided out, so nothing drifts by a cent.
		 * Coin faces need no adjustment: they carry their raw values, which is
		 * exactly the pre-multiplier total the kraken hands over.
		 */
		const hasMultiplier = stateGame.spinMultiplier > 1;
		const baseOf = (win: (typeof allWins)[number]) => win.meta?.winWithoutMult ?? win.win;
		const lineShown = hasMultiplier ? lineWins.reduce((sum, win) => sum + baseOf(win), 0) : lineAmount;
		const coinShown = hasMultiplier ? coinWins.reduce((sum, win) => sum + baseOf(win), 0) : coinAmount;
		const totalShown = hasMultiplier ? lineShown + coinShown : bookEvent.amount;
		// The big-win spectacle belongs to the FINAL figure — a small win that the
		// multiplier turns into a big one must not spend its reveal early. Anything
		// shown before the strike is demoted to the highest non-big level.
		const preStrikeLevelData =
			hasMultiplier && winLevelData?.type === 'big' ? winLevelMap[5] : winLevelData;

		// On a coins-only spin there is no beat 1, so there is no amount to show
		// while the coins fly. Showing the winbox anyway left the PREVIOUS spin's
		// figure on screen for the whole collect — a 29x coin spin sat behind
		// "$0.80" from the spin before it. The box waits for its number instead.
		const coinsOnly = coins.length > 0 && lineShown <= 0;

		if (!coinsOnly) {
			eventEmitter.broadcast({ type: 'winShow' });
			winLevelSoundsPlay({ winLevelData: preStrikeLevelData });
		}

		if (coins.length > 0) {
			// beat 1 — line wins only (skipped when the spin is coins-only).
			// Never with the big-win presentation, even when the TOTAL is big-level:
			// the spectacle belongs to the full amount in beat 3. Passing the big
			// level here also stalled the book for good — WinAnimation's exit state
			// machine is one-shot, so after beat 1's exit beat 3 could never exit
			// again and the spin hung under the leftover smoke.
			if (lineShown > 0) {
				const beat1LevelData =
					preStrikeLevelData?.type === 'big' ? winLevelMap[5] : preStrikeLevelData;
				await eventEmitter.broadcastAsync({
					type: 'winUpdate',
					amount: lineShown,
					winLevelData: beat1LevelData,
				});
			}
			// beat 2 — coins into the kraken, total flies to the winbox
			await eventEmitter.broadcastAsync({ type: 'coinCollect', coins });
		}

		if (coinsOnly) {
			// the kraken has just handed the total over — the box opens on it
			eventEmitter.broadcast({ type: 'winShow' });
			winLevelSoundsPlay({ winLevelData: preStrikeLevelData });
		} else if (coins.length > 0 && preStrikeLevelData?.presentDuration) {
			// beat 1 ended its count-up, which stopped the loop — beat 3 needs it back
			eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_countup' });
		}

		// beat 3 (or the only beat on a normal spin) — everything the spin paid,
		// before the kraken's multiplier
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: totalShown,
			winLevelData: preStrikeLevelData,
		});

		if (hasMultiplier) {
			// beat 4 — the multiplier dives into the box and multiplies what is in
			// it. Only now does the real win level get its say, so a small win
			// promoted to a big one gets the full presentation on the true figure.
			await eventEmitter.broadcastAsync({ type: 'spinMultiplierStrike' });
			if (winLevelData?.type === 'big') {
				winLevelSoundsPlay({ winLevelData });
			} else if (winLevelData?.presentDuration) {
				// the previous beat's count-up stopped the loop on completion
				eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_countup' });
			}
			await eventEmitter.broadcastAsync({
				type: 'winUpdate',
				amount: bookEvent.amount,
				winLevelData,
			});
		}

		winLevelSoundsStop({ winLevelData });

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
		// The settled board decides which symbol on each line carries its amount.
		const labelBoard = stateGameDerived.boardRaw();
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

					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_win_line_tick' });
					// the line being walked is the only one carrying a plate, at its
					// full value — the multiplier has already struck by now
					const cell = lineWinLabelCell(win, labelBoard);
					eventEmitter.broadcast(
						cell
							? { type: 'lineWinLabelsShow', labels: [{ ...cell, amount: win.win }] }
							: { type: 'lineWinLabelsHide' },
					);
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
			eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_kw_freespin' });
		}
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
