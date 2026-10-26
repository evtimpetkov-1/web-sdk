<script lang="ts">
	import { stateBet, stateConfig, stateModal, stateUi, stateUrlDerived, INFINITY_MARK } from 'state-shared';
	import { OptionsToggle } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { ANTE_OPTIONS, BUY_OPTIONS, type ShopOffer } from '../game/buyOptions';
	import { stateBuy } from '../game/stateBuy.svelte';
	import BuyVolatility from './BuyVolatility.svelte';
	import ScrollHint from './ScrollHint.svelte';

	/**
	 * Feature shop: a fullscreen takeover with the two ante switches (Chaos
	 * Mode, Free Spins Boost) first, the three free spins cards under them, and
	 * a bet stepper. It stays mounted — blurred and dimmed — while BuyConfirm
	 * sits on top, so the confirmation reads as a dialog over the shop rather
	 * than a new screen. Renders above
	 * the SDK modal layer (which never mounts the shared buy popups here —
	 * Game.svelte composes the modal set without them).
	 */
	const context = getContext();

	const open = $derived(
		stateModal.modal?.name === 'buyBonus' || stateModal.modal?.name === 'buyBonusConfirm',
	);
	const confirming = $derived(stateModal.modal?.name === 'buyBonusConfirm');
	const social = $derived(stateUrlDerived.social());
	// a jurisdiction can switch feature buying off (authenticate config); the
	// antes are bet options, not buys, so they stay
	const buyEnabled = $derived(!stateConfig.jurisdiction?.disabledBuyFeature);
	// the RGS reports modes uppercase, a replay URL may not
	const activeKey = $derived(stateBet.activeBetModeKey.toUpperCase());

	/**
	 * Ghost-click guard (from Kraken's Wilds): the PIXI button opening this
	 * shop fires on pointerup, and the browser then delivers the same tap's
	 * `click` to whatever DOM sits under the finger. Handlers stay dead until
	 * the opening tap has settled.
	 */
	let armed = $state(false);
	$effect(() => {
		if (!open) {
			armed = false;
			return;
		}
		const t = setTimeout(() => (armed = true), 150);
		return () => clearTimeout(t);
	});

	const price = (option: ShopOffer) =>
		numberToCurrencyString(stateBet.betAmount * option.costMultiplier);
	const affordable = (option: ShopOffer) =>
		stateBet.betAmount > 0 && stateBet.balanceAmount >= stateBet.betAmount * option.costMultiplier;

	const columns = Math.min(3, BUY_OPTIONS.length);
	// phones scroll the column (the antes sit below the fold in landscape)
	let contentEl = $state<HTMLElement | null>(null);

	const close = () => {
		if (!armed) return;
		stateModal.modal = null;
	};
	const choose = (option: ShopOffer) => {
		if (!armed || confirming) return;
		stateBuy.selectedOptionKey = option.key;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'buyBonusConfirm' };
	};
	/**
	 * One active mode key, so the two antes switch each other off by
	 * construction; tapping the active one returns to the main game. At 2x and
	 * 1.5x neither needs a confirmation step (Stake asks for one above 2x).
	 */
	const toggleAnte = (option: ShopOffer) => {
		if (!armed || confirming) return;
		const on = activeKey === option.key;
		if (!on && !affordable(option)) return;
		stateBet.activeBetModeKey = on ? 'BASE' : option.key;
		if (!on) {
			// the autoplay loss/win limits lock under an 'activate' mode — clear
			// them, as the SDK's own confirm does
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<!-- any tap on the backdrop closes: the overlay, the scrolling column
	     (which spans the full width, so the sides of the cards land on it)
	     and the gaps of the grids all carry data-dismiss -->
	<div
		class="overlay"
		class:confirming
		data-dismiss
		onclick={(event) => {
			if ((event.target as HTMLElement).dataset?.dismiss !== undefined) close();
		}}
		style="z-index: {zIndex.modal + 2};"
		role="dialog"
		aria-modal="true"
	>
		<button class="close" aria-label="Close" onclick={close} disabled={confirming}>
			<span></span><span></span>
		</button>

		<div class="content" data-dismiss style="--cols: {columns};" bind:this={contentEl}>
			<h1 class="screen-title">
				{#if buyEnabled}
					{social ? 'FEATURE PLAY' : 'BUY FEATURE'}
				{:else}
					BOOST MODES
				{/if}
			</h1>

			<!-- the antes first, the buy cards under them (Evtim, 2026-10-24); one
			     switch each, the whole card is the hit area -->
			<div class="antes" data-dismiss>
				{#each ANTE_OPTIONS as option (option.key)}
					{@const on = activeKey === option.key}
					<button
						class="ante"
						class:on
						role="switch"
						aria-checked={on}
						disabled={!on && !affordable(option)}
						onclick={() => toggleAnte(option)}
					>
						<img class="ante-art" src={option.image} alt="" draggable="false" />
						<span class="ante-info">
							<span class="ante-title">{option.title}</span>
							<span class="ante-pitch">{option.description}</span>
						</span>
						<span class="ante-side">
							<span class="ante-cost">{price(option)}</span>
							<span class="ante-cost-label">PER SPIN</span>
							<span class="switch" aria-hidden="true"><span class="knob"></span></span>
							<span class="switch-label">{on ? 'ON' : 'OFF'}</span>
						</span>
					</button>
				{/each}
			</div>

			{#if buyEnabled}
				<div class="divider" data-dismiss></div>
				<div class="cards" data-dismiss>
					{#each BUY_OPTIONS as option (option.key)}
						<article class="card">
							<div class="art">
								<img src={option.image} alt="" draggable="false" />
							</div>
							{#if option.volatility}
								<BuyVolatility level={option.volatility} />
							{/if}
							<h2 class="title">{option.title}</h2>
							<p class="pitch">{option.description}</p>
							<div class="price">{price(option)}</div>
							<button class="cta" disabled={!affordable(option)} onclick={() => choose(option)}>
								{social ? 'PLAY' : 'BUY'}
							</button>
						</article>
					{/each}
				</div>
			{/if}

			<!-- bet stepper: every price follows the chosen bet -->
			<OptionsToggle
				value={stateBet.betAmount}
				options={stateConfig.betAmountOptions}
				onchange={(value) => {
					if (!armed || confirming) return;
					stateBet.betAmount = value;
					context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
				}}
			>
				{#snippet children({ disabledDown, disabledUp, toggleDown, toggleUp })}
					<div class="stepper">
						<button class="chip down" disabled={disabledDown} onclick={toggleDown} aria-label="Lower"></button>
						<div class="stake">
							<span class="stake-label">{social ? 'PLAY' : 'BET'}</span>
							<span class="stake-value">{numberToCurrencyString(stateBet.betAmount)}</span>
						</div>
						<button class="chip up" disabled={disabledUp} onclick={toggleUp} aria-label="Raise"></button>
					</div>
				{/snippet}
			</OptionsToggle>
		</div>

		{#if !confirming}
			<ScrollHint scrollElement={contentEl} />
		{/if}
	</div>
{/if}

<style lang="scss">
	/* Mad Science palette: charcoal glass, acid green (#abea10, from the logo)
	   as the single loud accent, a violet undertone in the glow */
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background:
			radial-gradient(ellipse 80% 60% at 50% 30%, rgba(90, 140, 20, 0.22) 0%, rgba(6, 10, 6, 0) 60%),
			radial-gradient(ellipse 140% 110% at 50% 50%, rgba(8, 12, 8, 0.78) 0%, rgba(2, 4, 2, 0.9) 100%);
		backdrop-filter: blur(5px);
		animation: fade-in 220ms ease-out;
		color: #ffffff;
	}

	.content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.7rem, 2vh, 1.2rem);
		/* border-box: the padding counts inside the max-height, so a tall
		   column scrolls instead of overflowing the (clipping) overlay */
		box-sizing: border-box;
		max-height: 100dvh;
		width: 100%;
		overflow-y: auto;
		padding: clamp(3.4rem, 8vh, 4.5rem) 1.2rem 1.4rem;
		scrollbar-width: none;
		transition: filter 220ms ease, opacity 220ms ease;
		/* the cards and the ante row share one width */
		--shop-width: min(96vw, calc(var(--cols) * 250px + (var(--cols) - 1) * 1.2rem));
	}
	/* the confirm dialog sits on top: the shop recedes but stays in view */
	.overlay.confirming .content {
		filter: blur(7px) brightness(0.55);
		opacity: 0.85;
		pointer-events: none;
	}

	.screen-title {
		margin: 0;
		font-family: 'Creepster', 'Inter', sans-serif;
		font-size: clamp(1.8rem, 3.6vw, 2.5rem);
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #abea10;
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 18px rgba(171, 234, 16, 0.35);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: clamp(0.7rem, 1.6vw, 1.2rem);
		width: var(--shop-width);
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
		padding: 0 0.8rem 0.9rem;
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(30, 36, 30, 0.82) 0%, rgba(12, 16, 12, 0.9) 100%);
		border: 1px solid rgba(171, 234, 16, 0.32);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			inset 0 0 30px rgba(90, 140, 20, 0.12),
			0 12px 30px rgba(0, 0, 0, 0.5);
		overflow: hidden;
		transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}
	.card:hover {
		transform: translateY(-3px);
		border-color: rgba(171, 234, 16, 0.7);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			0 0 22px rgba(171, 234, 16, 0.22),
			0 14px 32px rgba(0, 0, 0, 0.55);
	}

	/* the art floats on a violet/green radial (the cut-outs carry no backdrop) */
	.art {
		width: calc(100% + 1.6rem);
		margin: 0 -0.8rem 0.2rem;
		/* follows the viewport height, so the whole shop fits common desktop
		   sizes (768-1080 tall) without scrolling */
		height: clamp(7rem, 25vh, 14rem);
		display: flex;
		align-items: center;
		justify-content: center;
		background:
			radial-gradient(ellipse 60% 70% at 50% 60%, rgba(171, 234, 16, 0.22) 0%, transparent 70%),
			linear-gradient(180deg, rgba(70, 40, 110, 0.55) 0%, rgba(20, 16, 30, 0.2) 100%);
		border-bottom: 1px solid rgba(171, 234, 16, 0.18);
	}
	.art img {
		height: 88%;
		width: auto;
		max-width: 88%;
		object-fit: contain;
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.7));
		user-select: none;
	}

	.title {
		margin: 0;
		font-family: 'Creepster', 'Inter', sans-serif;
		font-size: clamp(1.2rem, 1.9vw, 1.5rem);
		font-weight: 400;
		line-height: 1.1;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-align: center;
		text-wrap: balance;
		/* two lines reserved: every free spins title wraps, so they align */
		min-height: calc(2 * 1.1em);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.pitch {
		margin: 0;
		font-size: clamp(0.72rem, 1.05vw, 0.85rem);
		line-height: 1.35;
		text-align: center;
		color: rgba(255, 255, 255, 0.78);
		/* lines reserved so the price and CTA rows line up across the grid */
		min-height: calc(3 * 1.35em);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.price {
		margin-top: auto;
		font-size: clamp(1.15rem, 2vw, 1.5rem);
		font-weight: 800;
		color: #abea10;
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 14px rgba(171, 234, 16, 0.3);
	}

	.cta {
		appearance: none;
		border: none;
		cursor: pointer;
		width: 100%;
		padding: 0.6rem 1rem 0.55rem;
		border-radius: 999px;
		font-weight: 800;
		font-size: 0.95rem;
		letter-spacing: 0.14em;
		color: #10200a;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 50%),
			linear-gradient(180deg, #c7f53a 0%, #abea10 55%, #79b506 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -3px 5px rgba(34, 53, 6, 0.45),
			0 6px 14px rgba(0, 0, 0, 0.5),
			0 0 16px rgba(171, 234, 16, 0.25);
		transition: transform 0.12s ease, filter 0.15s ease;
	}
	.cta:hover:not(:disabled) {
		transform: translateY(-1px);
		filter: brightness(1.08);
	}
	.cta:active:not(:disabled) {
		transform: translateY(1px) scale(0.98);
	}
	.cta:disabled {
		opacity: 0.4;
		cursor: default;
		filter: grayscale(0.5);
	}

	.divider {
		width: var(--shop-width);
		height: 1px;
		background: linear-gradient(90deg, transparent 0%, rgba(171, 234, 16, 0.45) 50%, transparent 100%);
	}

	/* ---- antes ---- */
	.antes {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(0.7rem, 1.6vw, 1.2rem);
		width: var(--shop-width);
	}
	.ante {
		appearance: none;
		cursor: pointer;
		display: grid;
		grid-template-columns: 4.6rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.7rem;
		min-width: 0;
		padding: 0.55rem 0.9rem 0.55rem 0.5rem;
		border-radius: 16px;
		font: inherit;
		color: inherit;
		text-align: left;
		background: linear-gradient(180deg, rgba(30, 36, 30, 0.82) 0%, rgba(12, 16, 12, 0.9) 100%);
		border: 1px solid rgba(171, 234, 16, 0.22);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			0 10px 24px rgba(0, 0, 0, 0.45);
		transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
	}
	.ante:hover:not(:disabled) {
		border-color: rgba(171, 234, 16, 0.6);
	}
	.ante.on {
		border-color: rgba(171, 234, 16, 0.95);
		background: linear-gradient(180deg, rgba(48, 66, 24, 0.9) 0%, rgba(16, 24, 10, 0.94) 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			inset 0 0 26px rgba(171, 234, 16, 0.14),
			0 0 20px rgba(171, 234, 16, 0.28),
			0 10px 24px rgba(0, 0, 0, 0.45);
	}
	.ante:disabled {
		cursor: default;
		opacity: 0.45;
		filter: grayscale(0.5);
	}
	.ante-art {
		width: 100%;
		aspect-ratio: 1;
		object-fit: contain;
		filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.7));
		user-select: none;
	}
	.ante-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}
	.ante-title {
		font-family: 'Creepster', 'Inter', sans-serif;
		font-size: clamp(1.1rem, 1.7vw, 1.35rem);
		letter-spacing: 0.06em;
		color: #ffffff;
	}
	.ante.on .ante-title {
		color: #abea10;
	}
	.ante-pitch {
		font-size: clamp(0.68rem, 0.95vw, 0.78rem);
		line-height: 1.3;
		color: rgba(255, 255, 255, 0.75);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.ante-side {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}
	.ante-cost {
		font-size: clamp(0.95rem, 1.4vw, 1.1rem);
		font-weight: 800;
		color: #abea10;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
		white-space: nowrap;
	}
	.ante-cost-label {
		font-size: 0.58rem;
		letter-spacing: 0.18em;
		color: rgba(220, 240, 190, 0.6);
		white-space: nowrap;
	}
	.switch {
		position: relative;
		margin-top: 0.3rem;
		width: 3.1rem;
		height: 1.65rem;
		border-radius: 999px;
		background: radial-gradient(circle at 50% 60%, #1e281a 0%, #0f150c 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.6),
			0 0 0 2px rgba(171, 234, 16, 0.4);
		transition: background 0.18s ease, box-shadow 0.18s ease;
	}
	.knob {
		position: absolute;
		top: 50%;
		left: 0.2rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		transform: translateY(-50%);
		background: radial-gradient(circle at 40% 35%, #8a9584 0%, #4a5446 70%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
		transition: left 0.18s cubic-bezier(0.3, 0.9, 0.4, 1.2), background 0.18s ease;
	}
	.ante.on .switch {
		background: linear-gradient(180deg, #c7f53a 0%, #abea10 55%, #79b506 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 0 0 2px rgba(223, 246, 105, 0.9),
			0 0 14px rgba(171, 234, 16, 0.45);
	}
	.ante.on .knob {
		left: calc(100% - 1.45rem);
		background: radial-gradient(circle at 40% 35%, #ffffff 0%, #d8e8c8 70%);
	}
	.switch-label {
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.2em;
		color: rgba(255, 255, 255, 0.5);
	}
	.ante.on .switch-label {
		color: #abea10;
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
		min-width: 8rem;
	}
	.stake-label {
		font-size: 0.66rem;
		letter-spacing: 0.22em;
		color: rgba(220, 240, 190, 0.7);
	}
	.stake-value {
		font-size: 1.2rem;
		font-weight: 800;
		color: #abea10;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
	}
	.chip {
		appearance: none;
		border: none;
		cursor: pointer;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		position: relative;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 45%),
			radial-gradient(circle at 50% 60%, #3a4a30 0%, #1e281a 60%, #0f150c 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.2),
			0 0 0 2px rgba(171, 234, 16, 0.5),
			0 4px 10px rgba(0, 0, 0, 0.5);
		transition: transform 0.12s ease, box-shadow 0.15s ease;
	}
	.chip::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 0.7rem;
		height: 0.7rem;
		border-right: 3px solid #abea10;
		border-bottom: 3px solid #abea10;
		border-radius: 2px;
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
			inset 0 1px 0 rgba(255, 255, 255, 0.2),
			0 0 0 2px rgba(223, 246, 105, 0.95),
			0 0 14px rgba(171, 234, 16, 0.35),
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
		z-index: 1;
		top: clamp(0.8rem, 3vh, 1.6rem);
		right: clamp(0.8rem, 3vw, 1.8rem);
		width: 2.8rem;
		height: 2.8rem;
		border-radius: 50%;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 45%),
			radial-gradient(circle at 50% 60%, #3a4a30 0%, #1e281a 60%, #0f150c 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.2),
			0 0 0 2px rgba(171, 234, 16, 0.5),
			0 4px 10px rgba(0, 0, 0, 0.5);
		transition: transform 0.12s ease, filter 0.15s ease, opacity 0.2s ease;
	}
	.close:hover:not(:disabled) {
		transform: rotate(90deg);
		filter: brightness(1.15);
	}
	.close:disabled {
		opacity: 0;
		pointer-events: none;
	}
	.close span {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 1.2rem;
		height: 3px;
		border-radius: 2px;
		background: #abea10;
	}
	.close span:first-child {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.close span:last-child {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	/* short landscape (phones): two-line pitches so the antes come into view sooner */
	@media (orientation: landscape) and (max-height: 500px) {
		.pitch {
			min-height: calc(2 * 1.35em);
			-webkit-line-clamp: 2;
		}
	}

	/* portrait: every offer becomes a row — art left, text and price right */
	@media (orientation: portrait) {
		.overlay {
			padding-top: env(safe-area-inset-top);
			padding-bottom: env(safe-area-inset-bottom);
		}
		.content {
			justify-content: flex-start;
			max-height: 100%;
			--shop-width: min(94vw, 520px);
		}
		.cards {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.6rem;
		}
		.card {
			display: grid;
			grid-template-columns: 6.4rem minmax(0, 1fr) auto;
			grid-template-areas:
				'art title title'
				'art pitch pitch'
				'art price cta';
			align-items: center;
			column-gap: 0.7rem;
			row-gap: 0.3rem;
			padding: 0.5rem 0.7rem 0.55rem 0;
		}
		.art {
			grid-area: art;
			align-self: stretch;
			width: auto;
			height: auto;
			margin: 0;
			border-bottom: none;
			border-right: 1px solid rgba(171, 234, 16, 0.18);
		}
		.art img {
			height: auto;
			max-height: 6rem;
			max-width: 90%;
		}
		.title {
			grid-area: title;
			min-height: 0;
			font-size: 1.05rem;
			text-align: left;
			justify-content: flex-start;
		}
		.pitch {
			grid-area: pitch;
			min-height: 0;
			font-size: 0.72rem;
			text-align: left;
			-webkit-line-clamp: 3;
		}
		.price {
			grid-area: price;
			margin-top: 0;
			font-size: 1.15rem;
		}
		.cta {
			grid-area: cta;
			width: auto;
			padding: 0.45rem 1.3rem 0.4rem;
		}
		.antes {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.6rem;
		}
		.ante {
			grid-template-columns: 4rem minmax(0, 1fr) auto;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
</style>
