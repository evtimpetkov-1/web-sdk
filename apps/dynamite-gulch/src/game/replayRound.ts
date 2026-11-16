import { stateBet } from 'state-shared';

/**
 * The /bet/replay response, which Authenticate spreads into
 * stateBet.betToResume.
 *
 * Captured on FIRST READ and then held: the xstate resume flow nulls
 * stateBet.betToResume the moment playback starts, so anything reading it
 * afterwards sees nothing. Every replay surface (the round card, the in-replay
 * HUD) goes through here so they can never disagree about what the round cost
 * or paid.
 *
 * The first read happens when <Game> mounts, which is after Authenticate has
 * resolved its fetch and well before the loading screen is dismissed and the
 * resume begins.
 */
type ReplayRound = { costMultiplier?: number; payoutMultiplier?: number };

let captured: ReplayRound | null | undefined;

const replayRound = () => {
	if (captured === undefined) captured = stateBet.betToResume as unknown as ReplayRound | null;
	return captured;
};

export const hasReplayRound = () => replayRound() !== null;
/** what the base bet was multiplied by to reach the real cost of the round */
export const replayCostMultiplier = () => replayRound()?.costMultiplier ?? 1;
/** payout / base bet, i.e. what the round returned */
export const replayPayoutMultiplier = () => replayRound()?.payoutMultiplier ?? 0;
/** the "real" cost — the amount the player actually spent on this round */
export const replayTotalCost = () => stateBet.wageredBetAmount * replayCostMultiplier();
export const replayTotalWin = () => stateBet.wageredBetAmount * replayPayoutMultiplier();
