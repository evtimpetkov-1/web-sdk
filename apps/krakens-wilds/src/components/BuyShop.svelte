<script lang="ts">
	import { stateBet, stateConfig, stateMeta, stateModal } from 'state-shared';
	import { stateBonus } from 'components-ui-html';
	import { OptionsToggle } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';

	// the loading screen's baked gold lettering; non-EN keeps the gradient text
	const freeSpinsTextImg = new URL(
		'../../assets/sprites/loading/free_spins_text_en.webp',
		import.meta.url,
	).href;
	const useTitleArt = stateUrlDerived.lang() === 'en';

	/**
	 * The feature-buy screen, built from scratch (2026-08-26) as a fullscreen
	 * slot-game takeover — soft vignette, the offers'
	 * ART as the heroes with glowing price plates and big glossy CTAs. No
	 * boxed panel, no shared modal chrome. Renders ABOVE the shared
	 * ModalBuyBonus (which still mounts underneath at zIndex.modal — this
	 * overlay is opaque enough that it is never seen; same override pattern
	 * as PayTable/GameRules).
	 *
	 * Only two bitmap assets are used, per the design brief: the chest
	 * collage and the kraken cutout (read from betModeMeta, where the shop
	 * cards already declare them). Everything else is drawn here.
	 */
	const context = getContext();

	const open = $derived(stateModal.modal?.name === 'buyBonus');
	const buyMode = $derived(stateMeta.betModeMeta.BONUS);
	const anteMode = $derived(stateMeta.betModeMeta.ANTE);
	const showAnte = $derived(!stateBonus.shopBuyOnly);
	const anteActive = $derived(stateBet.activeBetModeKey === 'ANTE');

	const buyPrice = $derived(
		numberToCurrencyString(stateBet.betAmount * (buyMode?.costMultiplier ?? 0)),
	);
	// same affordability rule the shared shop cards applied: no bet, or a
	// balance short of the mode's cost, greys the CTA out
	const canAfford = (costMultiplier: number) =>
		stateBet.betAmount > 0 && stateBet.balanceAmount >= stateBet.betAmount * costMultiplier;
	const buyAffordable = $derived(canAfford(buyMode?.costMultiplier ?? 0));
	const anteAffordable = $derived(canAfford(anteMode?.costMultiplier ?? 0));
	const antePrice = $derived(
		numberToCurrencyString(stateBet.betAmount * (anteMode?.costMultiplier ?? 0)),
	);

	const close = () => (stateModal.modal = null);
	const choose = (key: 'BONUS' | 'ANTE') => {
		// an ACTIVE ante's CTA reads OFF — it deactivates right here, no
		// confirm ceremony for switching a toggle off
		if (key === 'ANTE' && anteActive) {
			stateBet.activeBetModeKey = 'BASE';
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ui_toggle_off', forcePlay: true });
			return;
		}
		stateBonus.selectedBetModeKey = key;
		stateModal.modal = { name: 'buyBonusConfirm' };
	};

</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="overlay"
		onclick={(event) => {
			// click on the DIM (not on the card or its children) dismisses —
			// same affordance the shared Popup's click-to-close layer gave
			if (event.target === event.currentTarget) close();
		}}
		style="z-index: {zIndex.modal + 2};" role="dialog" aria-modal="true">

		<button class="close" aria-label="Close" onclick={close}><span></span><span></span></button>

		<div class="content">
			{#if useTitleArt}
				<img class="screen-title-art" src={freeSpinsTextImg} alt={buyMode?.text?.title} draggable="false" />
			{:else}
				<h1 class="screen-title">{buyMode?.text?.title}</h1>
			{/if}

			<div class="offers" class:single={!showAnte}>
				<!-- FEATURE BUY offer -->
				<div class="offer">
					<div class="art-halo">
						<img class="art" src={buyMode?.assets?.dialogImage} alt="" draggable="false" />
					</div>
					<p class="pitch">{buyMode?.text?.description}</p>
					<div class="price-plate">{buyPrice}</div>
					<button class="cta gold" disabled={!buyAffordable} onclick={() => choose('BONUS')}>
						{buyMode?.text?.button}
					</button>
				</div>

				{#if showAnte}
					<div class="offer">
						<div class="art-halo teal">
							<img class="art" src={anteMode?.assets?.dialogImage} alt="" draggable="false" />
						</div>
						<h2 class="offer-title">{anteMode?.text?.title}</h2>
						<p class="pitch">{anteMode?.text?.description}</p>
						<div class="price-plate">{antePrice}</div>
						<button
							class="cta teal"
							disabled={!anteActive && !anteAffordable}
							onclick={() => choose('ANTE')}
						>
							{anteActive
								? context.i18nDerived.offWord()
								: (anteMode?.text?.button ?? 'ACTIVATE')}
						</button>
					</div>
				{/if}
			</div>

			<!-- bet stepper: the price follows the chosen bet -->
			<OptionsToggle
				value={stateBet.betAmount}
				options={stateConfig.betAmountOptions}
				onchange={(value) => {
					stateBet.betAmount = value;
					context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
				}}
			>
				{#snippet children({ disabledDown, disabledUp, toggleDown, toggleUp })}
					<div class="stepper">
						<button class="chip down" disabled={disabledDown} onclick={toggleDown} aria-label="Lower bet"></button>
						<div class="stake">
							<span class="stake-label">{context.i18nDerived.betWord?.() ?? 'BET'}</span>
							<span class="stake-value">{numberToCurrencyString(stateBet.betAmount)}</span>
						</div>
						<button class="chip up" disabled={disabledUp} onclick={toggleUp} aria-label="Raise bet"></button>
					</div>
				{/snippet}
			</OptionsToggle>
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
		background:
			radial-gradient(ellipse 90% 70% at 50% 32%, rgba(16, 60, 96, 0.35) 0%, rgba(4, 16, 30, 0) 60%),
			radial-gradient(ellipse 140% 110% at 50% 50%, rgba(4, 14, 26, 0.72) 0%, rgba(1, 5, 10, 0.85) 100%);
		backdrop-filter: blur(5px);
		animation: overlay-in 250ms ease-out;
	}



	.content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.7rem, 2.2vh, 1.4rem);
		max-height: 100dvh;
		overflow-y: auto;
		padding: 1.2rem;
		animation: content-in 320ms cubic-bezier(0.2, 1.4, 0.4, 1);
		scrollbar-width: none;
	}

	/* the big gradient-gold display title */
	.screen-title {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: clamp(2rem, 5.2vw, 3.4rem);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff6cf 0%, #ffd94e 38%, #e8a41f 62%, #9c6206 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 22px rgba(255, 200, 60, 0.3));
	}

	.screen-title-art {
		height: clamp(46px, 7.5vh, 80px);
		width: auto;
		filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.7));
		user-select: none;
	}

	.offers {
		display: flex;
		gap: clamp(1.6rem, 5vw, 4.5rem);
		align-items: stretch;
		justify-content: center;
	}
	.offers.single {
		gap: 0;
	}

	/* each offer is a CARD: translucent navy glass with a gold hairline rim */
	.offer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.55rem;
		width: clamp(250px, 31vw, 345px);
		padding: 1rem 1.1rem 1.15rem;
		border-radius: 20px;
		background: linear-gradient(180deg, rgba(12, 36, 58, 0.55) 0%, rgba(5, 16, 28, 0.65) 100%);
		border: 1px solid rgba(255, 215, 0, 0.4);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.09),
			inset 0 0 34px rgba(30, 90, 140, 0.25),
			0 12px 32px rgba(0, 0, 0, 0.45);
	}

	/* the art is the hero — pulsing radial glow, no box */
	.art-halo {
		position: relative;
		display: flex;
		justify-content: center;
		width: 100%;
	}
	.art-halo::before {
		content: '';
		position: absolute;
		inset: -12% -8%;
		background: radial-gradient(ellipse 60% 55% at 50% 52%, rgba(255, 200, 70, 0.4) 0%, transparent 70%);
		animation: halo-pulse 2.6s ease-in-out infinite;
		pointer-events: none;
	}
	.art-halo.teal::before {
		background: radial-gradient(ellipse 60% 55% at 50% 52%, rgba(90, 230, 205, 0.38) 0%, transparent 70%);
	}
	.art {
		position: relative;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.65));
		user-select: none;
	}

	.offer-title {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: clamp(1.05rem, 2vw, 1.4rem);
		letter-spacing: 0.1em;
		color: #ffd700;
		text-shadow: 0 2px 3px rgba(0, 0, 0, 0.85);
	}

	.pitch {
		margin: 0;
		max-width: 34ch;
		text-align: center;
		font-size: clamp(1.05rem, 1.9vw, 1.35rem);
		font-weight: 600;
		line-height: 1.4;
		color: #ffffff;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
	}

	/* gold, so the price separates from the white description above it */
	.price-plate {
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: clamp(1.35rem, 2.6vw, 1.9rem);
		color: #ffd700;
		letter-spacing: 0.04em;
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 16px rgba(255, 200, 60, 0.3);
	}

	/* ---- the CTA pills: thick gloss, hard rim, engraved text ---- */
	.cta {
		appearance: none;
		border: none;
		cursor: pointer;
		width: 100%;
		max-width: 280px;
		padding: 0.78rem 1rem 0.72rem;
		border-radius: 999px;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: 1.15rem;
		letter-spacing: 0.12em;
		position: relative;
		transition: transform 0.12s ease, filter 0.15s ease;
	}
	.cta:hover {
		transform: translateY(-2px);
		filter: brightness(1.08);
	}
	.cta:active {
		transform: translateY(1px) scale(0.98);
	}
	.cta:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.cta:disabled:hover {
		transform: none;
		filter: grayscale(0.4);
	}
	/* stone plate + gold rim + gold Cinzel — the game's counter/panel voice,
	   not web-button gloss */
	.cta.gold,
	.cta.teal {
		color: #ffd700;
		text-shadow: 0 2px 3px rgba(0, 0, 0, 0.9);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 45%),
			linear-gradient(180deg, #1d4a6a 0%, #0d2c44 55%, #071c2e 100%);
		border: 2px solid rgba(255, 215, 0, 0.75);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.15),
			inset 0 -3px 6px rgba(0, 0, 0, 0.5),
			0 6px 16px rgba(0, 0, 0, 0.55),
			0 0 18px rgba(255, 200, 60, 0.18);
	}
	.cta.teal {
		color: #7dfce9;
		border-color: rgba(90, 230, 205, 0.75);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.15),
			inset 0 -3px 6px rgba(0, 0, 0, 0.5),
			0 6px 16px rgba(0, 0, 0, 0.55),
			0 0 18px rgba(60, 220, 190, 0.18);
	}

	/* ---- stepper ---- */
	.stepper {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}
	.stake {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 8.5rem;
	}
	.stake-label {
		font-size: 0.68rem;
		letter-spacing: 0.22em;
		color: rgba(200, 225, 245, 0.7);
		text-transform: uppercase;
	}
	.stake-value {
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: 1.2rem;
		color: #ffd700;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
	}
	.chip {
		appearance: none;
		border: none;
		cursor: pointer;
		width: 2.7rem;
		height: 2.7rem;
		border-radius: 50%;
		position: relative;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 45%),
			radial-gradient(circle at 50% 60%, #1d5b80 0%, #0c344e 60%, #072133 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.25),
			0 0 0 2px rgba(255, 215, 0, 0.5),
			0 4px 10px rgba(0, 0, 0, 0.5);
		transition: transform 0.12s ease, box-shadow 0.15s ease;
	}
	.chip::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 0.75rem;
		height: 0.75rem;
		border-right: 3px solid #ffd700;
		border-bottom: 3px solid #ffd700;
		border-radius: 2px;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.6));
	}
	.chip.down::after {
		transform: translate(-50%, -68%) rotate(45deg);
	}
	.chip.up::after {
		transform: translate(-50%, -32%) rotate(225deg);
	}
	.chip:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.25),
			0 0 0 2px rgba(255, 226, 130, 0.95),
			0 0 14px rgba(255, 215, 0, 0.35),
			0 4px 10px rgba(0, 0, 0, 0.5);
	}
	.chip:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* ---- close ---- */
	.close {
		appearance: none;
		border: none;
		cursor: pointer;
		position: absolute;
		top: clamp(0.8rem, 3vh, 1.6rem);
		right: clamp(0.8rem, 3vw, 1.8rem);
		width: 2.9rem;
		height: 2.9rem;
		border-radius: 50%;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 45%),
			radial-gradient(circle at 50% 60%, #1d5b80 0%, #0c344e 60%, #072133 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.25),
			0 0 0 2px rgba(255, 215, 0, 0.5),
			0 4px 10px rgba(0, 0, 0, 0.5);
		transition: transform 0.12s ease, filter 0.15s ease;
	}
	.close:hover {
		transform: rotate(90deg);
		filter: brightness(1.15);
	}
	.close span {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 1.2rem;
		height: 3px;
		border-radius: 2px;
		background: #ffd700;
	}
	.close span:first-child {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.close span:last-child {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	@media (orientation: portrait) {
		.offers {
			flex-direction: column;
			align-items: center;
			gap: 1.3rem;
		}
		.offer {
			width: min(78vw, 330px);
		}
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
