<script lang="ts" module>
	/** One card of the shop: a bet mode the game offers besides the main game. */
	export type GenericOffer = {
		/** the bet mode's key in stateMeta.betModeMeta (the RGS mode, uppercase) */
		key: string;
		title: () => string;
		/** one or two lines under the title */
		description?: () => string;
		/** x base bet */
		costMultiplier: number;
		/** the card's picture: the only game art in the shop */
		image: string;
		/** 1-5; shown as a meter when the math states one */
		volatility?: number;
	};
</script>

<script lang="ts">
	import { stateBet, stateBetDerived, stateConfig, stateMeta, stateModal, stateUi, INFINITY_MARK } from 'state-shared';
	import { OnHotkey } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { getContextXstate } from 'utils-xstate';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { onMount } from 'svelte';

	import GenericIcon from './GenericIcon.svelte';
	import { stateGenericBuy } from './stateGenericBuy.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventGenericUi } from './GenericUI.svelte';

	/**
	 * The generic bonus shop (stateModal 'buyBonus') and its confirmation
	 * ('buyBonusConfirm'): plain white cards, the same in every game. A game hands
	 * over its offers and nothing else.
	 * - `switches`: 'activate' modes (an ante). The card's button switches the mode
	 *   on or off; there is one active mode, so switching one on switches the other
	 *   off. No confirmation (Stake asks for one above 2x only).
	 * - `buys`: 'buy' modes. The card's button opens the confirmation, and CONFIRM
	 *   places the bet in that mode. The mode stays selected when its round is over
	 *   (stateGenericBuy.armedKey): the bar shows its cost on Spin, and a press on
	 *   Spin opens the confirmation again. The bar's bonus button leaves it, back to
	 *   the mode that was on before (the switch that was on, or the main game).
	 * A jurisdiction that forbids feature buying (stateConfig) gets the switches only.
	 */
	type Props = {
		switches?: GenericOffer[];
		buys?: GenericOffer[];
		/** called as a purchase is confirmed (a game's own sound) */
		onconfirm?: () => void;
	};
	const props: Props = $props();
	const switches = $derived(props.switches ?? []);
	const buyEnabled = $derived(!stateConfig.jurisdiction?.disabledBuyFeature);
	const buys = $derived(buyEnabled ? (props.buys ?? []) : []);

	const { eventEmitter } = getContextEventEmitter<EmitterEventGenericUi>();
	const { stateXstateDerived } = getContextXstate();

	const open = $derived(
		stateModal.modal?.name === 'buyBonus' || stateModal.modal?.name === 'buyBonusConfirm',
	);
	const confirming = $derived(stateModal.modal?.name === 'buyBonusConfirm');
	const activeKey = $derived(stateBet.activeBetModeKey.toUpperCase());

	let selectedKey = $state('');
	const selected = $derived(buys.find((offer) => offer.key === selectedKey));

	/**
	 * Ghost-click guard: the press that opened a card may still deliver its click
	 * to what appears under the finger. Nothing acts until that press has settled;
	 * on CONFIRM it would otherwise be a one-tap purchase.
	 */
	let armed = $state(false);
	$effect(() => {
		// re-armed for the shop and again for the confirmation
		void confirming;
		if (!open) {
			armed = false;
			return;
		}
		armed = false;
		const timer = setTimeout(() => (armed = true), 250);
		return () => clearTimeout(timer);
	});

	const press = () => eventEmitter.broadcast({ type: 'soundPressGeneral' });
	const price = (offer: GenericOffer) => numberToCurrencyString(stateBet.betAmount * offer.costMultiplier);
	const affordable = (offer: GenericOffer) =>
		stateBet.betAmount > 0 && stateBet.balanceAmount >= stateBet.betAmount * offer.costMultiplier;

	const close = () => {
		if (!armed) return;
		// a confirmation Spin opened closes to the game, one from the shop to the shop
		stateModal.modal = confirming && !stateGenericBuy.confirmFromSpin ? { name: 'buyBonus' } : null;
		stateGenericBuy.confirmFromSpin = false;
	};

	const toggle = (offer: GenericOffer) => {
		if (!armed || confirming) return;
		const on = activeKey === offer.key;
		if (!on && !affordable(offer)) return;
		stateBet.activeBetModeKey = on ? 'BASE' : offer.key;
		if (!on) {
			// autoplay's loss / win limits are locked under such a mode: cleared
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}
		press();
	};

	const choose = (offer: GenericOffer) => {
		if (!armed || confirming || !affordable(offer)) return;
		selectedKey = offer.key;
		stateGenericBuy.confirmFromSpin = false;
		press();
		stateModal.modal = { name: 'buyBonusConfirm' };
	};

	const confirm = () => {
		const betMode = selected ? stateMeta.betModeMeta[selected.key] : undefined;
		if (!armed || !selected || !affordable(selected) || betMode?.type !== 'buy') return;
		const current = stateBetDerived.activeBetMode();
		// buying again from an armed buy keeps what was noted at the first purchase
		if (current?.type !== 'buy') {
			stateGenericBuy.modeAfterBuy = current?.type === 'activate' ? current.mode : 'BASE';
		}
		stateGenericBuy.armedKey = '';
		stateGenericBuy.confirmFromSpin = false;
		props.onconfirm?.();
		stateBet.activeBetModeKey = betMode.mode;
		eventEmitter.broadcast({ type: 'bet' });
		stateModal.modal = null;
	};

	// The bought mode stays selected when its round ends: armed. Spin then asks to
	// confirm it again (the hook below), the bar's bonus button leaves it.
	let wasIdle = true;
	$effect(() => {
		const idle = stateXstateDerived.isIdle();
		if (idle && !wasIdle && stateBetDerived.activeBetMode()?.type === 'buy') {
			stateGenericBuy.armedKey = stateBet.activeBetModeKey;
		}
		wasIdle = idle;
	});
	// any other way out of the bought mode (a switch in the shop, autoplay starting)
	// ends the armed state with it
	$effect(() => {
		if (stateGenericBuy.armedKey && stateBet.activeBetModeKey !== stateGenericBuy.armedKey) {
			stateGenericBuy.armedKey = '';
			stateGenericBuy.modeAfterBuy = 'BASE';
		}
	});
	onMount(() => {
		// the spin button asks here before a bet in a 'buy' mode (betPress, and
		// components-ui-pixi's ButtonBetProvider): true = handled, no bet
		stateBet.onBuyModeBet = () => {
			const key = stateGenericBuy.armedKey;
			if (!key || stateBet.activeBetModeKey !== key) return false;
			const offer = buys.find((buy) => buy.key === key.toUpperCase());
			if (!offer) return false;
			selectedKey = offer.key;
			stateGenericBuy.confirmFromSpin = true;
			stateModal.modal = { name: 'buyBonusConfirm' };
			return true;
		};
		return () => (stateBet.onBuyModeBet = null);
	});

	// the bet, changed here too: every price follows it
	const levels = $derived([...stateConfig.betAmountOptions].sort((a, b) => a - b));
	const levelIndex = $derived(Math.max(0, levels.findLastIndex((level) => level <= stateBet.betAmount)));
	const stepBet = (direction: -1 | 1) => {
		const next = levels[levelIndex + direction];
		if (!armed || confirming || next === undefined) return;
		stateBetDerived.setBetAmount(next);
		press();
	};
</script>

{#if open}
	<OnHotkey hotkey="Escape" onpress={close} />
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="shop"
		class:solo={confirming && stateGenericBuy.confirmFromSpin}
		role="dialog"
		aria-modal="true"
		data-dismiss
		style={`z-index: ${zIndex.modal + 2};`}
		onclick={(event) => {
			if ((event.target as HTMLElement).dataset?.dismiss !== undefined && !confirming) close();
		}}
	>
		<header data-dismiss>
			<h1>{i18nDerived.buyBonus()}</h1>
			<button class="x" aria-label="Close" data-test="close-button" onclick={close}>
				<GenericIcon name="close" size="1.1rem" />
			</button>
		</header>

		<div class="scroll" data-dismiss>
			<div class="cards" class:behind={confirming} data-dismiss>
				{#each [...switches.map((offer) => ({ offer, kind: 'switch' as const })), ...buys.map((offer) => ({ offer, kind: 'buy' as const }))] as { offer, kind } (offer.key)}
					{@const on = activeKey === offer.key}
					<article class="card" class:on>
						<div class="art"><img src={offer.image} alt="" draggable="false" /></div>
						<div class="body">
							{#if offer.volatility}
								<div class="meter" aria-label={`${offer.volatility} / 5`}>
									{#each [1, 2, 3, 4, 5] as mark}
										<i class:lit={mark <= offer.volatility}></i>
									{/each}
								</div>
							{/if}
							<h2>{offer.title()}</h2>
							{#if offer.description}
								<p>{offer.description()}</p>
							{/if}
							<div class="price amount">{price(offer)}</div>
							{#if kind === 'switch'}
								<button class="cta" class:off={!on} class:active={on} disabled={!on && !affordable(offer)} onclick={() => toggle(offer)}>
									{#if on}<GenericIcon name="check" size="1em" />{/if}
									{on ? i18nDerived.disable() : i18nDerived.activate()}
								</button>
							{:else}
								<button class="cta" disabled={!affordable(offer)} onclick={() => choose(offer)}>
									{i18nDerived.buy()}
								</button>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</div>

		<footer class:behind={confirming}>
			<div class="pair">
				<span class="label">{i18nDerived.balance()}</span>
				<span class="amount">{numberToCurrencyString(stateBet.balanceAmount)}</span>
			</div>
			<div class="stepper">
				<button disabled={levelIndex === 0} onclick={() => stepBet(-1)} aria-label="-">
					<GenericIcon name="minus" size="1.15em" />
				</button>
				<div class="pair">
					<span class="label">{i18nDerived.bet()}</span>
					<span class="amount">{numberToCurrencyString(stateBet.betAmount)}</span>
				</div>
				<button disabled={levelIndex >= levels.length - 1} onclick={() => stepBet(1)} aria-label="+">
					<GenericIcon name="plus" size="1.15em" />
				</button>
			</div>
		</footer>

		{#if confirming && selected}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class="veil"
				onclick={(event) => {
					if (event.target === event.currentTarget) close();
				}}
			>
				<div class="card confirm">
					<div class="art"><img src={selected.image} alt="" draggable="false" /></div>
					<div class="body">
						<h2>{selected.title()}</h2>
						{#if selected.description}
							<p>{selected.description()}</p>
						{/if}
						<div class="cost-label">{i18nDerived.cost()}</div>
						<div class="price amount">{price(selected)}</div>
						<div class="actions">
							<button class="cta off" aria-label="Back" onclick={close}>
								<GenericIcon name="close" size="0.9em" />
							</button>
							<button class="cta" data-test="confirm-button" disabled={!affordable(selected)} onclick={confirm}>
								{i18nDerived.confirm()}
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	.shop {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		background: rgba(8, 9, 12, 0.86);
		color: var(--gui-fg, #fff);
		font-family: var(--gui-font, 'Inter', system-ui, sans-serif);
		animation: shop-in 180ms ease-out;
		touch-action: none;
		overscroll-behavior: none;
		user-select: none;
		-webkit-user-select: none;
	}

	@keyframes shop-in {
		from {
			opacity: 0;
		}
	}

	button {
		appearance: none;
		border: 0;
		margin: 0;
		font: inherit;
		color: inherit;
		background: none;
		cursor: pointer;
		touch-action: manipulation;

		&:disabled {
			cursor: not-allowed;
		}
	}

	.amount {
		direction: ltr;
		unicode-bidi: bidi-override;
		font-variant-numeric: tabular-nums;
	}

	header {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(0.9rem, 2.2vh, 1.6rem) 3.6rem 0.5rem;

		h1 {
			margin: 0;
			/* grows with a wide screen (Evtim, 2026-11-18: "in desktop the header ... is
			   a bit small, in portrait it is fine as is"); 2vw of a phone is under the floor */
			font-size: clamp(1.05rem, min(2.1vw, 3.8vh), 2rem);
			font-weight: 800;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}
	}

	.x {
		position: absolute;
		right: 0.8rem;
		top: 50%;
		transform: translateY(-40%);
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.1);

		&:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.scroll {
		flex: 1;
		min-height: 0;
		display: flex;
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: contain;
		touch-action: pan-y;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
		padding: 0.5rem 0.8rem 0.8rem;
	}

	.cards {
		/* centred while it fits, top-aligned and scrolling when it does not */
		margin: auto;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		/* a card's width follows the screen (its width, and its height so five in a
		   row still fit a wide, short window); everything in a card is sized from it,
		   and never smaller than the phone sizes */
		--card: clamp(9.4rem, min(18vw, 42vh), 20rem);
		gap: calc(var(--card) * 0.055);
		max-width: calc(var(--card) * 5.4);
		transition: opacity 160ms ease;
	}

	.behind {
		opacity: 0.25;
		pointer-events: none;
	}

	/* the confirmation alone (Spin opened it over an armed buy): no shop behind it */
	.solo {
		header,
		.scroll,
		footer {
			visibility: hidden;
		}
	}

	.card {
		display: flex;
		flex-direction: column;
		width: var(--card);
		/* 1em = 1rem on a 13.5rem card */
		font-size: calc(var(--card) / 13.5);
		border-radius: 0.6rem;
		background: #ffffff;
		color: #14161b;
		overflow: hidden;
		box-shadow: 0 0.4rem 1.2rem rgba(0, 0, 0, 0.45);

		&.on {
			box-shadow:
				0 0 0 0.18rem var(--gui-accent, #ffc83d),
				0 0.4rem 1.2rem rgba(0, 0, 0, 0.45);
		}
	}

	/* The picture is shown WHOLE. It used to be drawn at the card's full width in
	   a much flatter box (a percentage height against an auto-sized grid row counts
	   as auto), which cut a third of every picture off, top and bottom (Evtim,
	   2026-11-18: "the images are cut, most of them are not visible"). The games'
	   pictures are close to square, so the box is too; whatever its shape, the
	   picture is fitted inside it. */
	.art {
		position: relative;
		aspect-ratio: 8 / 7;
		background: #1a1c22;
		overflow: hidden;

		img {
			position: absolute;
			inset: 5%;
			width: 90%;
			height: 90%;
			object-fit: contain;
			pointer-events: none;
		}
	}

	.body {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: max(0.3rem, 0.35em);
		padding: max(0.6rem, 0.7em) max(0.6rem, 0.7em) max(0.65rem, 0.75em);
		text-align: center;

		h2 {
			margin: 0;
			font-size: max(0.86rem, 0.9em);
			font-weight: 800;
			letter-spacing: 0.03em;
			line-height: 1.15;
			text-transform: uppercase;
			overflow-wrap: anywhere;
		}

		p {
			margin: 0;
			font-size: max(0.72rem, 0.8em);
			line-height: 1.35;
			color: #4a4f59;
		}
	}

	.meter {
		display: flex;
		gap: 0.2rem;

		i {
			width: 0.9rem;
			height: 0.28rem;
			border-radius: 99px;
			background: #d6d9df;

			&.lit {
				background: #14161b;
			}
		}
	}

	.price {
		margin-top: auto;
		padding-top: 0.2rem;
		font-size: max(1.15rem, 1.3em);
		font-weight: 800;
	}

	.cta {
		align-self: stretch;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35em;
		padding: max(0.6rem, 0.7em) 0.5rem;
		border-radius: 0.4rem;
		background: var(--gui-accent, #ffc83d);
		color: var(--gui-on-accent, #16130a);
		font-size: max(0.82rem, 0.9em);
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		transition:
			filter 120ms ease,
			background-color 120ms ease;

		&:hover:not(:disabled) {
			filter: brightness(1.07);
		}
		&:disabled {
			opacity: 0.35;
		}
		/* a switch that is off, and the confirmation's way back: the quiet button */
		&.off {
			background: #14161b;
			color: #ffffff;
		}
		&.active {
			background: #14161b;
			color: var(--gui-accent, #ffc83d);
		}
	}

	footer {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		/* grows with the screen like the cards, never under the phone sizes */
		font-size: clamp(1rem, min(1.5vw, 3vh), 1.5rem);
		gap: 2em;
		padding: 0.7em 1rem calc(0.75em + env(safe-area-inset-bottom, 0px));
		background: rgba(12, 13, 16, 0.92);
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		transition: opacity 160ms ease;
	}

	.pair {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 5.5em;
		font-size: 1.15em;
		font-weight: 800;
		line-height: 1.2;

		.label {
			font-size: 0.6em;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--gui-dim, rgba(255, 255, 255, 0.62));
		}
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 0.7em;
		padding: 0.3em;
		border-radius: 0.7em;
		background: rgba(255, 255, 255, 0.08);

		/* the bet changes every price above: the two buttons are the loudest
		   things on the page after the cards */
		button {
			display: grid;
			place-items: center;
			width: 2.9em;
			height: 2.9em;
			border-radius: 0.5em;
			background: var(--gui-accent, #ffc83d);
			color: var(--gui-on-accent, #16130a);
			transition:
				filter 120ms ease,
				transform 120ms ease;

			&:hover:not(:disabled) {
				filter: brightness(1.1);
			}
			&:active:not(:disabled) {
				transform: scale(0.93);
			}
			&:disabled {
				background: rgba(255, 255, 255, 0.14);
				color: rgba(255, 255, 255, 0.4);
			}
		}
	}

	.veil {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0.8rem;
		background: rgba(8, 9, 12, 0.55);
		animation: shop-in 160ms ease-out;
	}

	.card.confirm {
		width: min(19rem, 100%);
		max-height: 100%;
		overflow-y: auto;

		.body {
			gap: 0.4rem;
			padding: 0.8rem 0.8rem 0.85rem;
		}
		h2 {
			font-size: 1rem;
		}
		p {
			font-size: 0.8rem;
		}
		.price {
			margin-top: 0;
			padding-top: 0;
			font-size: 1.5rem;
		}
	}

	.cost-label {
		margin-top: 0.3rem;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #5b606b;
	}

	.actions {
		align-self: stretch;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.45rem;
		margin-top: 0.3rem;

		.off {
			padding-inline: 0.9rem;
		}
	}

	/* A phone held upright: the bet and its steps on top, the balance under them,
	   both centred, with room at the sides. In one row the balance stood against the
	   left edge and the + against the right (Evtim, 2026-11-18: "in portrait we need
	   some side space around balance and bet, maybe it would be best to put bet on
	   top of balance"). */
	@media (max-width: 600px) and (orientation: portrait) {
		footer {
			flex-direction: column-reverse;
			gap: 0.4em;
			padding-inline: 1.6rem;
		}
		.stepper {
			gap: 1.6em;
		}
		footer > .pair {
			flex-direction: row;
			align-items: baseline;
			gap: 0.6em;
			min-width: 0;

			.label {
				font-size: 0.7em;
			}
		}
	}

	/* short screens (phone landscape, Stake's popouts): a flatter picture */
	@media (max-height: 480px) {
		.art {
			aspect-ratio: 16 / 9;
		}
		header {
			padding-top: 0.5rem;
			padding-bottom: 0.3rem;
		}
		.card.confirm .art {
			aspect-ratio: 16 / 7;
		}
	}
</style>
