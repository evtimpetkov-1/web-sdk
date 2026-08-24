import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, RawSymbol, SymbolName, SymbolState } from './types';
import type { BookEventOfType } from './typesBookEvent';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	CELL_H,
	BOARD_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({
	rawSymbol,
	symbolIndex,
}: {
	rawSymbol: RawSymbol;
	symbolIndex: number;
}) => {
	// Skip padding rows (index 0 = top padding, index BOARD_DIMENSIONS.y + 1 = bottom padding)
	if (symbolIndex === 0 || symbolIndex > BOARD_DIMENSIONS.y) return;

	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	if (rawSymbol.name === 'W' && stateGame.gameType !== 'freegame') {
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_wild_land',
			forcePlay: true,
		});
	}
};

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForSpinning({
		reelIndex,
		symbolHeight: CELL_H,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			// The kraken-spin shade lifts the moment the FIRST reel begins stopping,
			// not after the whole board settles — the 400ms fade-out then runs while
			// the remaining reels stop. Fires per reel; repeat writes are harmless.
			// (The clears after enhancedBoard.spin() in bookEventHandlerMap stay as
			// the safety net — a stop-button interrupt can skip this callback.)
			stateGame.reelsShaded = false;
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_reel_stop',
				forcePlay: !stateBet.isTurbo,
			});
		},
		onSymbolLand,
	});

	reel.reelState.spinOptions = () => {
		if (reel.reelState.spinType === 'fast') return SPIN_OPTIONS_FAST;
		if (reel.reelState.anticipating) {
			return { ...SPIN_OPTIONS_DEFAULT, reelSpinSpeed: SPIN_OPTIONS_DEFAULT.reelSpinSpeed / 2 };
		}
		return SPIN_OPTIONS_DEFAULT;
	};

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export type MultiplierSymbol = {
	initX: number;
	initY: number;
	symbolX: Tween<number>;
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export type MovingWild = {
	id: number;
	x: Tween<number>;
	y: Tween<number>;
	reel: number;
	row: number;
	landed: boolean;
};

/**
 * A symbol the kraken puts on screen DURING a spin, drawn over the still-spinning
 * reels (see SpecialOverlay.svelte). It OWNS its cell for the rest of the spin: the
 * real symbol underneath is hidden for as long as this list holds one of its kind
 * (see ReelSymbol), exactly as free-spin wilds hide the board's W. The list is
 * cleared at the start of the next reveal, where the two swap unseen.
 *
 * Free-spin wilds are not in this list — `movingWilds` owns those.
 */
export type OverlaySymbol = {
	id: number;
	/**
	 * W and C have bespoke reveal/idle beats; any other name is a SYMBOL kraken
	 * spin's replicated paying symbol — it reveals with its win animation and
	 * settles to its static sprite (regular symbols have no idle).
	 */
	name: SymbolName;
	reel: number;
	row: number;
	/** Coins only. Faded onto the coin as its reveal animation finishes. */
	multiplier?: number;
	/**
	 * The kraken's dust cloud still covers the reels for ~1.3s after the symbols are
	 * placed, so a coin holds a blank pose until the handler starts its reveal — the
	 * whole point of the reveal is that it is watched. Wilds are placed already
	 * revealing: they have nothing to show but themselves.
	 */
	revealing: boolean;
	/** the value has started fading in (as coin_win's flip lands face-on) */
	valueShown: boolean;
	landed: boolean;
};

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	multiplierBoard: [] as (MultiplierSymbol | undefined)[][],
	movingWilds: [] as MovingWild[],
	movingWildWinSet: new Set<number>() as Set<number>,
	// symbols the kraken drops onto the spinning reels (see OverlaySymbol)
	overlaySymbols: [] as OverlaySymbol[],
	// dims the reels while overlay symbols sit on top of them, so the kraken's
	// bounty reads as being in front of the spin rather than part of it. Cleared
	// once the reels have stopped.
	reelsShaded: false,
	scatterCounter: 0,
	/**
	 * The last base-game board seen this round — i.e. the board that triggered the
	 * feature. The reels themselves are live state that every reveal overwrites, so by
	 * the time the free spins end they hold the LAST free spin's board; this is the
	 * only copy of the one the player should come back to. Stashed from the book, not
	 * from the reels (see the reveal + createBonusSnapshot handlers).
	 */
	triggerBoard: null as RawSymbol[][] | null,
	winLooping: false,
	winAnimating: false,
	retriggerExtra: 0,
	// winning wilds fed to the kraken this session (base game tension build-up);
	// purely presentational — resets when the kraken attacks (free spins trigger)
	krakenCollects: 0,
	// set from the current reveal. Used to suppress the wild-feeding collect on a
	// base kraken spin: the kraken has just spawned those wilds, so flying them
	// straight back into it reads as the kraken eating its own gift.
	isSpecialSpin: false,
	spinType: undefined as 'WILD' | 'COIN' | 'SYMBOL' | undefined,
	// The kraken's per-spin win multiplier (free spins, spec v2.1). 1 = none.
	// Set from the reveal, cleared at the next reveal / feature end. The book's
	// win amounts already include it — this drives the badge only.
	spinMultiplier: 1,
});

// Win cycle state — persists across book event handlers and into idle
export const winCycleState = {
	lastWins: null as BookEventOfType<'winInfo'>['wins'] | null,
	abortController: null as AbortController | null,
	cancel() {
		this.abortController?.abort();
		this.abortController = null;
		this.lastWins = null;
	},
};

const boardLayout = () => {
	const w = stateLayoutDerived.mainLayout().width;
	const h = stateLayoutDerived.mainLayout().height;
	const layout = stateLayoutDerived.layoutType();
	// Offset board upward in landscape/desktop to account for the bottom bar.
	// Portrait lifts the whole assembly (logo, kraken, frame, reels — they are
	// all board-anchored) high enough that the ante/buy panels under the reels
	// clear the spin-button cluster; -50 left them overlapping it.
	const yOffset =
		layout === 'portrait' ? -95 : layout === 'landscape' ? -20 : layout === 'desktop' ? -30 : 0;
	// Per-layout board sizing. Portrait is 1 (unscaled) — the outer MainContainer
	// already fits the board to the screen, and the extra 1.15 was pushing the
	// reels wider than the viewport on phones.
	const scale = layout === 'portrait' ? 1 : layout === 'landscape' ? 1.16 : 0.9;
	return {
		x: w * 0.5,
		y: h * 0.5 + yOffset,
		scale,
		anchor: { x: 0.5, y: 0.5 },
		pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
		...BOARD_SIZES,
	};
};

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 3) return 3;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3;
};

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	boardLayout,
	boardRaw,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
