import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import type { MusicName } from './sound';

/**
 * How the book's events are played. The standard events only (typesBookEvent.ts): the
 * reels spin and land, ways wins act, the totals are kept, free spins open and close.
 * The sounds are still Blast Drop's set (sfx_bs_ / bgm_bs_): this game has none of its
 * own yet.
 */

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
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bs_tickup' });
	}
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
	// the tickup normally stops with its end hit; this catches an aborted count-up
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bs_tickup' });
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
const BED_FADE_MS = 700;
const MUSIC_FADE_IN_MS = 1200;
const countEndSounds = ({ bed, music }: { bed?: MusicName; music: () => MusicName | undefined }) => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bs_tickup' });
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


// One animation per CELL: a Wild counted by two ways arrives twice (Board.svelte)
const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	await eventEmitter.broadcastAsync({ type: 'boardWithAnimateSymbols', symbolPositions: positions });
};

// The way into free spins: the curtains close over the base game, the scene dresses
// for free spins behind them, they part on the intro.
const enterFreeSpins = async ({ totalFs }: { totalFs: number }) => {
	await eventEmitter.broadcastAsync({ type: 'uiHide' });
	await eventEmitter.broadcastAsync({ type: 'transitionClose' });
	stateGame.gameType = 'freegame';
	eventEmitter.broadcast({ type: 'winCounterHide' });
	await eventEmitter.broadcastAsync({ type: 'transitionOpen' });
	eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_fs_intro' });
	eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bs_freespin' });
	// resolves once the intro has played out and the player pressed through it
	await eventEmitter.broadcastAsync({ type: 'freeSpinIntroUpdate', totalFreeSpins: totalFs });
	eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
	eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
	// the first spin is next (the counter shows the spin in play, see updateFreeSpin)
	eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', current: 1, total: totalFs });
	await eventEmitter.broadcastAsync({ type: 'uiShow' });
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		// the last round's WIN leaves as this spin starts (it stays up after its round)
		eventEmitter.broadcast({ type: 'winCounterHide' });
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		// the shared spin button turns its STOP icon back into the arrows only when
		// this flips back to false (ButtonBet)
		stateUi.reelsSpinning = true;
		try {
			// already spinning after a press (actor.ts); started here otherwise
			await stateGameDerived.reelsStart(bookEvent.gameType);
			// no reel anticipation: nothing in this game is "one short" on the reels (the
			// pots open at random), whatever the book's array says
			await stateGameDerived.reelsLand({ ...bookEvent, anticipation: bookEvent.board.map(() => 0) });
		} finally {
			stateUi.reelsSpinning = false;
		}
	},
	// Ways wins: every winning cell acts at once (the thieves and the vault play their
	// win, the royals' letters turn to gold) while the WIN line shows what the spin paid.
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_win_cycle' });
		if (stateGame.gameType === 'basegame') {
			eventEmitter.broadcast({ type: 'winCounterShow' });
			eventEmitter.broadcast({ type: 'winCounterUpdate', amount: bookEvent.totalWin });
		}
		await animateSymbols({ positions: _.flatten(bookEvent.wins.map((win) => win.positions)) });
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_scatter_win' });
		eventEmitter.broadcast({ type: 'sceneShake', preset: 'featureTrigger' });
		await animateSymbols({ positions: bookEvent.positions });
		await enterFreeSpins({ totalFs: bookEvent.totalFs });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		// one tick per spin played (the 0 / total that opens the round is silent)
		if (bookEvent.amount > 0) eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_fs_counter' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		// the book sends this BEFORE each spin's reveal with the spins already played
		// (0 ... total - 1): the counter shows the spin in play, 1 / 10 to 10 / 10
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_fs_retrigger' });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_fs_counter' });
		eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', total: bookEvent.totalFs, pop: true });
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		// the bar fades out as the outro builds, not before it
		eventEmitter.broadcast({ type: 'uiHide' });
		// the outro plays over the free-spins scene; gameType flips to base only once
		// the curtains are closed, so the dressing swap is never seen
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_fs_outro' });
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
		await eventEmitter.broadcastAsync({ type: 'transitionClose' });
		stateGame.gameType = 'basegame';
		winLevelSoundsStop();
		await eventEmitter.broadcastAsync({ type: 'transitionOpen' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];
		// The win box is for big wins only: the WIN line already holds every other win,
		// and those end in silence (Evtim, 2026-11-18: no jingle after the round, in any
		// game; the wins were heard as they paid).
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
	// the WIN line stays up with the round's win until the next spin
	finalWin: async () => {},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const entry = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastReveal = findLastBookEvent('reveal' as const);

		if (lastReveal) eventEmitter.broadcast({ type: 'boardSettle', board: lastReveal.board });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (!entry) return;

		// Reloaded inside the free spins: straight back into the spin that was
		// interrupted. No base game, curtains or intro: the scene is dressed at once
		// (Game.svelte already switched gameType behind the intro's exit), the counter,
		// total win and music are restored, and the next event is that spin's reveal
		// (the client records each bonus reveal as the cursor).
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bs_freespin' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		else eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', current: 1, total: entry.totalFs });
	},
};
