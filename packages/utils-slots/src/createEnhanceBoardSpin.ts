import { stateBet } from 'state-shared';
import { waitForResolve, waitForFrames } from 'utils-shared/wait';

import { stateSlots } from './stateSlots.svelte';
import type { Reel, GetRawSymbolFromReel } from './types';

export function createEnhanceBoardSpin<TReel extends Reel<any, any>>({
	board,
}: {
	board: TReel[];
}) {
	type TRawSymbol = GetRawSymbolFromReel<TReel>;

	type BaseRevealEvent = {
		index: number;
		type: 'reveal';
		board: TRawSymbol[][];
		anticipation: number[];
		paddingPositions?: number[];
	};

	// Set by the board's stop(), so a reel still waiting its turn in the
	// staggered start below goes immediately instead of sitting out its frames.
	let stopRequested = false;
	const notifyStop = () => (stopRequested = true);

	/**
	 * Holds a reel back for `frames` frames before it builds its spin strip,
	 * bailing out early if the player hits stop.
	 *
	 * Each reel assembles target + padding + previous symbols the moment it
	 * starts, and the padding ACCUMULATES reel by reel (6/12/18/24/30 on a
	 * normal spin, far more behind an anticipation). The symbol array therefore
	 * grows by that padding, and since it is rendered by an unkeyed `{#each}`,
	 * every added slot MOUNTS a component: ~90 in one frame on a normal spin and
	 * ~220 behind an anticipation, precisely as the bet response arrives — the
	 * hitch felt at the moment the reels are cleared to stop. Spreading the
	 * builds over consecutive frames keeps each one small. Reels that have not
	 * started yet simply carry on pre-spinning, so nothing stalls, and the added
	 * offset is a few milliseconds against a stop cadence already staggered by
	 * 100ms per reel.
	 */
	const waitForTurn = async (frames: number) => {
		for (let frame = 0; frame < frames; frame += 1) {
			if (stopRequested) return;
			await waitForFrames(1);
		}
	};

	async function spin<RevealEvent extends BaseRevealEvent>({
		revealEvent,
		paddingBoard,
	}: {
		revealEvent: RevealEvent;
		paddingBoard?: TRawSymbol[][];
	}) {
		stopRequested = false;

		if (stateSlots.isPreSpinning) {
			await Promise.all(
				board.map(async (reel) => {
					await waitForResolve((resolve) => (reel.reelState.readyToSpin = resolve));
				}),
			);
		}

		stateSlots.isPreSpinning = false;

		const globalSpinType = stateBet.isTurbo ? 'fast' : 'normal';
		const globalHasAnticipation = revealEvent.anticipation.some(Boolean);
		const firstAnticipatedReelIndex = revealEvent.anticipation.findIndex(Boolean);
		const getSpinType = ({
			noStop,
			isAnticipated,
		}: {
			noStop: boolean;
			isAnticipated: boolean;
		}) => {
			if (isAnticipated) return 'anticipated';
			if (noStop) return 'normal';
			return globalSpinType;
		};

		// a 'fast' (turbo) reel adds no padding at all, so it has no strip to build
		// and no reason to give up frames waiting its turn
		const spinTypes: ReturnType<typeof getSpinType>[] = [];

		board.reduce((previousPaddingSize, reel, reelIndex) => {
			const noStop = globalHasAnticipation && reelIndex >= firstAnticipatedReelIndex;
			const isAnticipated = (revealEvent.anticipation?.[reelIndex] || 0) > 0;
			const spinType = getSpinType({ noStop, isAnticipated });
			spinTypes[reelIndex] = spinType;
			const symbols = revealEvent.board[reelIndex] as TRawSymbol[];
			const paddingReel = paddingBoard?.[reelIndex];
			const paddingPosition = revealEvent?.paddingPositions?.[reelIndex];

			const paddingSize = reel.prepareToSpin({
				noStop,
				spinType,
				symbols,
				// @ts-ignore Ignored because paddingReel is not required by createCascadingReel
				paddingReel,
				// @ts-ignore Ignored because paddingPosition is not required by createCascadingReel
				paddingPosition,
				previousPaddingSize,
				onSpinFinishing: () => {
					reel.onReelStopping();
					const nextReelIndex = reelIndex + 1;
					const isNextReelAnticipated = (revealEvent.anticipation?.[nextReelIndex] || 0) > 0;
					if (isNextReelAnticipated) board[nextReelIndex].reelState.anticipating = true;
				},
			});

			return paddingSize;
		}, 0);

		await Promise.all(
			board.map(async (reel, reelIndex) => {
				// one frame of headroom per reel — see waitForTurn
				await waitForTurn(spinTypes[reelIndex] === 'fast' ? 0 : reelIndex);
				await reel.spin();
			}),
		);
	}

	return { spin, notifyStop };
}
