import _ from 'lodash';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import config from './config';
import type { BagKey, GameType, RawSymbol } from './types';
import type { BookEventOfType } from './typesBookEvent';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import { FRAME_ART } from './heistArt';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	BOARD_DIMENSIONS,
	FRAME_BOX,
	FRAME_UNIT,
	BAGS_TOP,
	INITIAL_BOARD,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	INITIAL_SYMBOL_STATE,
	REEL_LAND_RATES,
	ladderRate,
} from './constants';

// symbolIndex: the index in the reel's strip when it lands. Only the four cells of
// the window count; the padding cells above and below land with the reel unseen.
const onSymbolLand = ({ rawSymbol, symbolIndex }: { rawSymbol: RawSymbol; symbolIndex: number }) => {
	if (symbolIndex === 0 || symbolIndex > BOARD_DIMENSIONS.y) return;
	// no landing stings yet: the game has no sound set of its own (Blast Drop's cues
	// are still in the sprite), and the feature symbols' sounds come with their features
	void rawSymbol;
};

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForSpinning({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_bs_reel_land',
				forcePlay: !stateBet.isTurbo,
				rate: ladderRate(REEL_LAND_RATES, reelIndex),
			});
		},
		onSymbolLand,
	});

	reel.reelState.spinOptions = () =>
		reel.reelState.spinType === 'fast' ? SPIN_OPTIONS_FAST : SPIN_OPTIONS_DEFAULT;

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	// true while a bet's book is playing (playBet)
	roundActive: false,
	// how full each loot bag is, 1 (empty) to 5 (overflowing): the rigs' levels.
	// Nothing sets these yet: what fills a bag comes with the math's pot events.
	bagLevels: { cash: 1, gem: 1, gold: 1 } as Record<BagKey, number>,
});

/**
 * The stage: where the board group (the bags, the frame, the reels) stands and how
 * large, per layout. The group is laid out in board-local units (origin = the cells'
 * top-left, constants.ts) and scaled as one about the board's centre; everything here
 * is in main-layout units. The stack runs from the top of the tallest loot pile a bag
 * can hold (level 5: nothing is ever cut by the screen's top) to the frame's feet.
 *
 * The generic UI's sizes are measured in the browser (GenericUI.svelte), in standard
 * units (1920x1080; x from the canvas centre, y up from the canvas bottom). Re-measure
 * them if the bar changes.
 * - desktop: a bar along the bottom, with Spin rising over its right end. The frame
 *   comes down to the bar where it is narrower than the gap between the cat's button
 *   and Spin, else it stops above Spin; the larger of the two wins.
 * - landscape (phones, Stake's popouts): a strip along the bottom, the buttons in a
 *   column on the right; the board is centred in what the column leaves.
 * - portrait and tablet: the strip and a row of buttons under the board, which spans
 *   the width and stands on them (the room above is the logo's, when there is one).
 */
const GENERIC_UI = {
	desktop: { barTop: 108, sideLeft: 436, spinTop: 160 },
	landscape: { stripTop: 124, columnLeft: 718 },
	stacked: { top: 540 },
};
const STAGE_TOP = 8; // the screen's top -> the stack
const STAGE_UI_GAP = 6; // the stack -> the UI below it
const STAGE_SIDE = 12; // the frame -> the screen's edge / the buttons beside it
const STAGE_MAX_SCALE = 1.5;
// frame.png: the last opaque row (its two feet end there)
const FRAME_INK_BOTTOM = 908;
const STACK = {
	top: BAGS_TOP,
	bottom: FRAME_BOX.y + FRAME_INK_BOTTOM / FRAME_UNIT,
	left: FRAME_BOX.x,
	right: FRAME_BOX.x + FRAME_BOX.width,
};
const STACK_SIZE = { width: STACK.right - STACK.left, height: STACK.bottom - STACK.top };

const stage = () => {
	const type = stateLayoutDerived.layoutType();
	const main = stateLayoutDerived.mainLayout();
	const canvas = stateLayoutDerived.canvasSizes();
	// main units per standard unit
	const k = stateLayoutDerived.mainLayoutStandard().scale / main.scale;
	const visibleWidth = canvas.width / main.scale;
	const visibleHeight = canvas.height / main.scale;
	const top = (main.height - visibleHeight) / 2 + STAGE_TOP;
	const left = (main.width - visibleWidth) / 2;
	const right = left + visibleWidth;
	const bottomEdge = (main.height + visibleHeight) / 2;
	const centre = main.width / 2;

	type Room = { left: number; right: number; bottom: number };
	const scaleIn = (room: Room) =>
		Math.min(
			STAGE_MAX_SCALE,
			(room.right - room.left) / STACK_SIZE.width,
			(room.bottom - top) / STACK_SIZE.height,
		);
	let room: Room;
	if (type === 'desktop') {
		const ui = GENERIC_UI.desktop;
		const rooms: Room[] = [
			{
				left: centre - ui.sideLeft * k + STAGE_SIDE,
				right: centre + ui.sideLeft * k - STAGE_SIDE,
				bottom: bottomEdge - ui.barTop * k - STAGE_UI_GAP,
			},
			{ left: left + STAGE_SIDE, right: right - STAGE_SIDE, bottom: bottomEdge - ui.spinTop * k - STAGE_UI_GAP },
		];
		room = _.maxBy(rooms, scaleIn) as Room;
	} else if (type === 'landscape') {
		const ui = GENERIC_UI.landscape;
		room = {
			left: left + STAGE_SIDE,
			right: centre + ui.columnLeft * k - STAGE_SIDE,
			bottom: bottomEdge - ui.stripTop * k - STAGE_UI_GAP,
		};
	} else {
		room = { left, right, bottom: bottomEdge - GENERIC_UI.stacked.top * k - STAGE_UI_GAP };
	}
	const scale = scaleIn(room);
	// centred sideways in its room; standing on the UI when stacked, else centred between
	// the screen's top and the UI
	const stackLeft = (room.left + room.right - STACK_SIZE.width * scale) / 2;
	const stacked = type === 'portrait' || type === 'tablet';
	const stackTop = stacked
		? room.bottom - STACK_SIZE.height * scale
		: (top + room.bottom - STACK_SIZE.height * scale) / 2;
	return {
		scale,
		// the board's centre
		x: stackLeft + (BOARD_SIZES.width / 2 - STACK.left) * scale,
		y: stackTop + (BOARD_SIZES.height / 2 - STACK.top) * scale,
	};
};

const boardLayout = () => ({
	...stage(),
	// width/height stay the board-local BOARD_SIZES; `scale` maps them to main units
	anchor: { x: 0.5, y: 0.5 },
	pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
	...BOARD_SIZES,
});

/**
 * The counters (the base game's WIN; FREE SPINS and TOTAL WIN in free spins): one line
 * each on the frame's bottom steel (frame.png rows 832-865). Board-local: `y` the
 * lines' middle, `size` the font size, `maxWidth` what a line may take before it
 * shrinks. The WIN line is centred; in free spins the two share the bar.
 */
const COUNTER_SIZE = SYMBOL_SIZE * 0.24;
const counterLine = () => {
	const steel = { top: FRAME_ART.cells.y + FRAME_ART.cells.height, bottom: 865 };
	return {
		y: FRAME_BOX.y + (steel.top + steel.bottom) / 2 / FRAME_UNIT,
		size: COUNTER_SIZE,
		centre: BOARD_SIZES.width / 2,
		left: BOARD_SIZES.width * 0.25,
		right: BOARD_SIZES.width * 0.75,
		maxWidth: BOARD_SIZES.width * 0.44,
	};
};
export type CounterLine = ReturnType<typeof counterLine>;

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

/**
 * The reels start ONCE per spin and spin on filler (config.paddingReels) until the
 * book's board is known: on the press (actor.ts), or from the reveal on the paths
 * with no press before it (free spins, turbo autoplay, a held Space, a resumed
 * round). A second start on reels already moving would rebuild their strips: a
 * visible stutter.
 */
let reelsStarted = false;
const reelsStart = async (gameType: GameType) => {
	if (reelsStarted) return;
	reelsStarted = true;
	await enhancedBoard.preSpin({ paddingBoard: config.paddingReels[gameType] });
};
/** ... and land on the reveal's board, reel by reel */
const reelsLand = async (revealEvent: BookEventOfType<'reveal'>) => {
	try {
		await enhancedBoard.spin({ revealEvent, paddingBoard: config.paddingReels[revealEvent.gameType] });
	} finally {
		reelsStarted = false;
	}
};
/** put a board up at once (resume, a failed bet); no board = the reels as they stand */
const reelsSettle = (rawBoard?: RawSymbol[][]) => {
	reelsStarted = false;
	enhancedBoard.settle(rawBoard);
};

// win levels

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	boardLayout,
	counterLine,
	boardRaw,
	enhancedBoard,
	reelsStart,
	reelsLand,
	reelsSettle,
	getWinLevelDataByWinLevelAlias,
};
