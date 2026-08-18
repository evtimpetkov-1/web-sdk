import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, RawSymbol, SymbolState } from './types';
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
 * reels (see SpecialOverlay.svelte). The real symbol is already in the reveal's
 * board and lands underneath when the reels stop, at which point the overlay is
 * cleared and the two swap seamlessly.
 *
 * Free-spin wilds are NOT overlay symbols — they are sticky and move between
 * spins, which is what `movingWilds` exists for.
 */
export type OverlaySymbol = {
	id: number;
	name: 'W' | 'C';
	reel: number;
	row: number;
	/** Coins only. Struck onto the coin when its reveal animation completes. */
	multiplier?: number;
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
	// when the reels stop.
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
	// base special spin: the kraken has just spawned those wilds, so flying them
	// straight back into it reads as the kraken eating its own gift.
	isSpecialSpin: false,
	spinType: undefined as 'WILD' | 'COIN' | undefined,
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
	// Offset board upward in landscape/desktop to account for the bottom bar
	const yOffset =
		layout === 'portrait' ? -50 : layout === 'landscape' ? -20 : layout === 'desktop' ? -30 : 0;
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
