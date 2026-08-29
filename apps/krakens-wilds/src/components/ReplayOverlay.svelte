<script lang="ts">
	import { stateBet, stateModal, stateUrlDerived } from 'state-shared';
	import { numberToCurrencyString, numberToWinCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { stateReplay, startReplay } from '../game/stateReplay.svelte';
	import {
		hasReplayRound,
		replayCostMultiplier,
		replayPayoutMultiplier,
		replayTotalCost,
		replayTotalWin,
	} from '../game/replayRound';
	import { i18nDerived } from '../i18n/i18nDerived';

	/**
	 * The replay round card — shown BEFORE the round plays back (with a Start
	 * Replay button) and again AFTER it finishes (with a Replay Again button).
	 *
	 * Plain HTML rather than Pixi: it is a platform-facing information panel,
	 * required by the approval checklist's Replay Support group —
	 *   "UI clearly displays bet cost, including any multiplier applied to the
	 *    bet, and 'real' bet cost"
	 *   "Allows replaying 'event' at the end of replay"
	 * — and the review team asked for it to follow the layout in their example
	 * screenshot. It renders OUTSIDE <App> (from Game.svelte, beside the
	 * modals), so it is an ordinary DOM overlay over the canvas.
	 */
	const context = getContext();
	const isReplay = stateUrlDerived.replay();

	// The round's cost/payout multipliers — see game/replayRound for why they
	// are captured rather than read live. The in-replay HUD reads the same
	// module, so the card and the bar can never disagree.
	const hasReplayData = hasReplayRound();
	const costMultiplier = replayCostMultiplier();
	const payoutMultiplier = replayPayoutMultiplier();

	/**
	 * Mode names in the game's own words, not the raw RGS mode key ('base',
	 * 'ante', 'bonus'), which is what the reviewers saw and asked us to change.
	 *
	 * Each reuses the SAME accessor the rest of the game names that mode with —
	 * chanceX2 for the ante mode, buyFeature for the bought one — so the card
	 * cannot drift from the panels and the rules, and both follow the player's
	 * language and the social-mode word swaps automatically.
	 */
	const MODE_LABELS: Record<string, () => string> = {
		BASE: () => i18nDerived.replayModeBase(),
		ANTE: () => i18nDerived.chanceX2(),
		BONUS: () => i18nDerived.buyFeature(),
	};
	const modeKey = (stateUrlDerived.mode() || 'BASE').toUpperCase();
	// unknown mode: fall back to the raw key rather than rendering nothing
	const modeLabel = $derived(MODE_LABELS[modeKey]?.() ?? modeKey);

	// wageredBetAmount is the BASE bet (the `amount` url param); the cost
	// multiplier is what turns it into what the player actually spent.
	const baseBet = $derived(stateBet.wageredBetAmount);
	const totalCost = $derived(replayTotalCost());
	const totalWin = $derived(replayTotalWin());

	// "1x" / "0.1x" / "100x" — trailing zeros trimmed, as in the reviewer's mock
	const formatMultiplier = (value: number) => `${Number(value.toFixed(2))}x`;

	/**
	 * Round finished: the resume machine has run and the game is back at idle.
	 * Same detection the previous Pixi ReplayComplete overlay used.
	 */
	let hasStartedResuming = $state(false);
	let complete = $state(false);
	$effect(() => {
		// replay only — a normal session resuming an interrupted round runs
		// through exactly the same two states
		if (!isReplay) return;
		if (context.stateXstateDerived.isResumingBet()) hasStartedResuming = true;
		if (hasStartedResuming && context.stateXstateDerived.isIdle()) complete = true;
	});

	const showIntro = $derived(isReplay && hasReplayData && stateReplay.introReady && !complete);
	// never over an error dialog — that one has to stay reachable
	const show = $derived(isReplay && (showIntro || complete) && stateModal.modal === null);

	const onpress = () => {
		if (showIntro) startReplay();
		// Replaying the event = reloading the same replay url from scratch. The
		// round data is fetched again and the whole sequence plays from the top.
		else window.location.reload();
	};
</script>

{#if show}
	<div class="replay-overlay" role="dialog" aria-modal="true" aria-label={i18nDerived.replayTitle()}>
		<div class="card">
			<span class="badge">{i18nDerived.replay()}</span>
			<h2 class="title">{i18nDerived.replayTitle()}</h2>

			<dl class="rows">
				<div class="row">
					<dt>{i18nDerived.replayMode()}</dt>
					<dd class="value gold strong">{modeLabel}</dd>
				</div>

				<div class="divider"></div>

				<div class="row">
					<dt>{i18nDerived.replayBaseBet()}</dt>
					<dd class="value gold strong">{numberToCurrencyString(baseBet)}</dd>
				</div>
				<div class="row">
					<dt>{i18nDerived.replayCostMultiplier()}</dt>
					<dd class="value gold">{formatMultiplier(costMultiplier)}</dd>
				</div>
				<!-- the "real" cost: base bet x cost multiplier, i.e. what the
				     player actually spent on this round -->
				<div class="row highlight cost">
					<dt>{i18nDerived.replayTotalCost()}</dt>
					<dd class="value gold strong">{numberToCurrencyString(totalCost)}</dd>
				</div>

				<div class="divider"></div>

				<div class="row">
					<dt>{i18nDerived.replayPayoutMultiplier()}</dt>
					<dd class="value green">{formatMultiplier(payoutMultiplier)}</dd>
				</div>
				<div class="row highlight win">
					<dt>{i18nDerived.replayTotalWin()}</dt>
					<dd class="value green strong">{numberToWinCurrencyString(totalWin)}</dd>
				</div>
			</dl>

			<button class="cta" type="button" onclick={onpress}>
				<span class="cta-icon" aria-hidden="true">▶</span>
				{showIntro ? i18nDerived.replayStart() : i18nDerived.replayAgain()}
			</button>

			<p class="note">{i18nDerived.replayDisclaimer()}</p>
		</div>
	</div>
{/if}

<style lang="scss">
	/*
	 * Palette and type are deliberately the REVIEW TEAM's, not the game's — this
	 * panel is read by the platform's reviewers and by anyone opening a shared
	 * replay link, and they asked for it to match their reference mock: neutral
	 * dark-navy plate, flat yellow for cost figures, green for payout figures,
	 * Inter throughout (no Cinzel, no gold gradients). Keep it that way.
	 */
	.replay-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		box-sizing: border-box;
		overflow-y: auto;
		font-family: 'Inter', sans-serif;
		background: rgba(4, 8, 18, 0.82);
		animation: overlay-in 220ms ease-out;
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.85rem, 2.2vh, 1.35rem);
		/* wide enough for the one-line note in the reference mock */
		width: min(480px, 100%);
		box-sizing: border-box;
		padding: clamp(1.3rem, 3.4vh, 2.1rem) clamp(1.2rem, 4vw, 2rem);
		border-radius: 20px;
		background: linear-gradient(180deg, #1b2238 0%, #121828 100%);
		border: 1px solid rgba(198, 162, 66, 0.5);
		box-shadow: 0 22px 55px rgba(0, 0, 0, 0.65);
		animation: card-in 300ms ease-out;
	}

	/* flat yellow pill, dark text — no gradient, no shine */
	.badge {
		padding: 0.4rem 1.3rem;
		border-radius: 999px;
		background: #ffd60a;
		color: #17130a;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.title {
		margin: 0;
		text-align: center;
		text-wrap: balance;
		font-family: inherit;
		font-weight: 700;
		font-size: clamp(1.7rem, 6vw, 2.15rem);
		letter-spacing: -0.01em;
		color: #ffffff;
	}

	.rows {
		margin: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.85rem 0.75rem;
		box-sizing: border-box;
		border-radius: 14px;
		background: #141a2b;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0.85rem;
		border-radius: 9px;
	}

	/* the two figures that matter most, each tinted with its own accent */
	.row.highlight.cost {
		background: rgba(255, 214, 10, 0.07);
	}
	.row.highlight.win {
		background: rgba(46, 204, 143, 0.07);
	}

	.row dt {
		color: #8b93a7;
		font-size: clamp(0.9rem, 3.4vw, 1.02rem);
		font-weight: 400;
	}

	.row dd.value {
		margin: 0;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		font-size: clamp(0.95rem, 3.7vw, 1.12rem);
		text-align: right;
	}

	/* currency amounts and the mode read a size up from the multipliers.
	   Selector matches `.row dd.value` exactly so the size actually wins. */
	.row dd.value.strong {
		font-size: clamp(1.1rem, 4.6vw, 1.35rem);
	}
	.value.gold {
		color: #ffd60a;
	}
	.value.green {
		color: #2ecc8f;
	}

	.divider {
		height: 1px;
		margin: 0.55rem 0.85rem;
		background: rgba(255, 255, 255, 0.09);
	}

	.cta {
		width: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 1.05rem 1rem;
		border: none;
		border-radius: 14px;
		background: linear-gradient(90deg, #ffd60a 0%, #ffa000 100%);
		color: #1a1206;
		font-family: inherit;
		font-size: clamp(1.15rem, 4.8vw, 1.45rem);
		font-weight: 700;
		letter-spacing: 0;
		cursor: pointer;
		transition: filter 0.15s ease, transform 0.1s ease;
	}
	.cta:hover {
		filter: brightness(1.06);
	}
	.cta:active {
		transform: translateY(1px);
	}
	.cta:focus-visible {
		outline: 2px solid #ffffff;
		outline-offset: 2px;
	}

	.cta-icon {
		font-size: 0.85em;
		line-height: 1;
	}

	.note {
		margin: 0;
		text-align: center;
		text-wrap: balance;
		font-size: clamp(0.78rem, 3vw, 0.88rem);
		line-height: 1.4;
		color: #6b7385;
	}

	@keyframes overlay-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
