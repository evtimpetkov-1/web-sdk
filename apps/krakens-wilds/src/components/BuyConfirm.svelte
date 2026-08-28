<script lang="ts">
	import { stateBet, stateMeta, stateModal, stateUi, INFINITY_MARK } from 'state-shared';
	import { stateBonus } from 'components-ui-html';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';

	const freeSpinsTextImg = new URL(
		'../../assets/sprites/loading/free_spins_text_en.webp',
		import.meta.url,
	).href;
	// the baked art is the FREE SPINS lettering — only the buy mode's title
	const useTitleArt = $derived(
		(stateUrlDerived.social() || stateUrlDerived.lang() === 'en') && stateBonus.selectedBetModeKey === 'BONUS',
	);

	/**
	 * The purchase confirmation, from scratch (2026-08-26) — same fullscreen
	 * language as BuyShop, resolved with the genre's universal pair of round
	 * verdict buttons: red ✗ back, green ✓ commit. Covers the shared
	 * ModalBuyBonusConfirm entirely (same override pattern as PayTable).
	 */
	const context = getContext();

	const open = $derived(stateModal.modal?.name === 'buyBonusConfirm');
	const mode = $derived(stateMeta.betModeMeta[stateBonus.selectedBetModeKey]);
	const cost = $derived(
		numberToCurrencyString(stateBet.betAmount * (mode?.costMultiplier ?? 0)),
	);
	const affordable = $derived(
		stateBet.betAmount > 0 &&
			stateBet.balanceAmount >= stateBet.betAmount * (mode?.costMultiplier ?? 0),
	);

	const back = () => (stateModal.modal = { name: 'buyBonus' });
	const confirm = () => {
		// mirrors the shared dialog's rules: only a buy/activate selection may
		// take over the active mode
		if (!mode || (mode.type !== 'buy' && mode.type !== 'activate')) return;
		if (!affordable) return;
		stateBet.activeBetModeKey = stateBonus.selectedBetModeKey;
		if (mode.type === 'buy') {
			context.eventEmitter.broadcast({ type: 'bet' });
		}
		if (mode.type === 'activate') {
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = null;
	};
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="overlay"
		onclick={(event) => {
			// click on the DIM (not on the card or its children) dismisses —
			// same affordance the shared Popup's click-to-close layer gave
			if (event.target === event.currentTarget) back();
		}}
		style="z-index: {zIndex.dialog + 2};" role="dialog" aria-modal="true">
		<div class="content">
			{#if useTitleArt}
				<img class="screen-title-art" src={freeSpinsTextImg} alt={mode?.text?.title} draggable="false" />
			{:else}
				<h1 class="screen-title">{mode?.text?.title}</h1>
			{/if}

			<div class="art-halo">
				<img class="art" src={mode?.assets?.dialogImage} alt="" draggable="false" />
			</div>

			<p class="pitch">{mode?.text?.dialog}</p>

			<div class="cost-row">
				<span class="cost-label">{context.i18nDerived.cost()}</span>
				<span class="cost-value">{cost}</span>
			</div>

			<div class="verdict">
				<button class="round no" aria-label="Back" onclick={back}>
					<span></span><span></span>
				</button>
				<button
					class="round yes"
					data-test="confirm-button"
					aria-label="Confirm"
					disabled={!affordable}
					onclick={confirm}
				>
					<i></i>
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		/* semi-transparent: the reels stay visible underneath, softened */
		background:
			radial-gradient(ellipse 80% 60% at 50% 34%, rgba(16, 60, 96, 0.35) 0%, rgba(4, 16, 30, 0) 62%),
			radial-gradient(ellipse 140% 110% at 50% 50%, rgba(4, 14, 26, 0.74) 0%, rgba(1, 5, 10, 0.86) 100%);
		backdrop-filter: blur(5px);
		animation: overlay-in 220ms ease-out;
	}

	/* the dialog is a CARD: translucent navy glass with a gold hairline rim */
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.6rem, 2vh, 1.1rem);
		max-height: 96dvh;
		overflow-y: auto;
		padding: clamp(1.1rem, 3vh, 1.8rem) clamp(1.4rem, 4vw, 2.4rem);
		border-radius: 22px;
		background: linear-gradient(180deg, rgba(12, 36, 58, 0.55) 0%, rgba(5, 16, 28, 0.65) 100%);
		border: 1px solid rgba(255, 215, 0, 0.4);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.09),
			inset 0 0 34px rgba(30, 90, 140, 0.25),
			0 12px 32px rgba(0, 0, 0, 0.45);
		animation: content-in 300ms cubic-bezier(0.2, 1.4, 0.4, 1);
		scrollbar-width: none;
	}

	.screen-title {
		margin: 0;
		text-align: center;
		text-wrap: balance;
		line-height: 1.15;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: clamp(1.7rem, 4.4vw, 2.8rem);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff6cf 0%, #ffd94e 38%, #e8a41f 62%, #9c6206 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 20px rgba(255, 200, 60, 0.3));
	}

	.screen-title-art {
		height: clamp(40px, 6.5vh, 70px);
		width: auto;
		filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.7));
		user-select: none;
	}

	.art-halo {
		position: relative;
		width: clamp(250px, 36vw, 380px);
		display: flex;
		justify-content: center;
	}
	.art-halo::before {
		content: '';
		position: absolute;
		inset: -12% -8%;
		background: radial-gradient(ellipse 60% 55% at 50% 52%, rgba(255, 200, 70, 0.38) 0%, transparent 70%);
		animation: halo-pulse 2.6s ease-in-out infinite;
		pointer-events: none;
	}
	.art {
		position: relative;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.65));
		user-select: none;
	}

	.pitch {
		margin: 0;
		max-width: 46ch;
		text-align: center;
		font-size: clamp(0.95rem, 1.6vw, 1.1rem);
		font-weight: 600;
		line-height: 1.45;
		color: #ffffff;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
	}

	.cost-row {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
	}
	.cost-label {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		letter-spacing: 0.2em;
		color: #ffd700;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}
	.cost-value {
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: clamp(1.5rem, 3vw, 2.1rem);
		color: #ffd700;
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 16px rgba(255, 200, 60, 0.3);
	}

	/* ---- the verdict pair ---- */
	.verdict {
		display: flex;
		gap: clamp(1.6rem, 5vw, 3rem);
		margin-top: 0.3rem;
	}
	.round {
		appearance: none;
		border: none;
		cursor: pointer;
		width: clamp(3.6rem, 8vw, 4.4rem);
		height: clamp(3.6rem, 8vw, 4.4rem);
		border-radius: 50%;
		position: relative;
		transition: transform 0.12s ease, filter 0.15s ease;
	}
	.round:hover {
		transform: translateY(-2px) scale(1.05);
		filter: brightness(1.1);
	}
	.round:active {
		transform: translateY(1px) scale(0.96);
	}
	.round:disabled {
		opacity: 0.4;
		cursor: default;
		transform: none;
		filter: grayscale(0.4);
	}
	.round.yes {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 45%),
			radial-gradient(circle at 50% 58%, #63e063 0%, #24a824 55%, #116e11 100%);
		box-shadow:
			inset 0 2px 1px rgba(255, 255, 255, 0.4),
			inset 0 -3px 6px rgba(0, 50, 0, 0.55),
			0 0 0 3px #0a4d0a,
			0 6px 16px rgba(0, 0, 0, 0.55),
			0 0 24px rgba(80, 220, 80, 0.35);
	}
	.round.no {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 45%),
			radial-gradient(circle at 50% 58%, #f07d63 0%, #c23a24 55%, #7d1c0e 100%);
		box-shadow:
			inset 0 2px 1px rgba(255, 255, 255, 0.4),
			inset 0 -3px 6px rgba(70, 10, 0, 0.55),
			0 0 0 3px #5c150a,
			0 6px 16px rgba(0, 0, 0, 0.55),
			0 0 24px rgba(230, 90, 60, 0.3);
	}
	/* drawn glyphs — crisp at any size, no font involved */
	.round.yes i {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 38%;
		height: 20%;
		border-left: 5px solid #eafff0;
		border-bottom: 5px solid #eafff0;
		border-radius: 2px;
		transform: translate(-50%, -62%) rotate(-45deg);
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
	}
	.round.no span {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 44%;
		height: 5px;
		border-radius: 3px;
		background: #ffeae4;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
	}
	.round.no span:first-child {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.round.no span:last-child {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	@keyframes overlay-in {
		from { opacity: 0; }
	}
	@keyframes content-in {
		from { opacity: 0; transform: scale(0.92); }
	}
	@keyframes halo-pulse {
		0%, 100% { opacity: 0.75; transform: scale(1); }
		50% { opacity: 1; transform: scale(1.06); }
	}
	@media (prefers-reduced-motion: reduce) {
		.art-halo::before { animation: none; }
	}
</style>
