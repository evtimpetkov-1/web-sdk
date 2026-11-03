<script lang="ts">
	import { onMount } from 'svelte';
	import { stateBet, stateBetDerived, stateMeta, stateModal } from 'state-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { getBuyOption } from '../game/buyOptions';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder } from '../i18n/format';
	import { stateBuy } from '../game/stateBuy.svelte';
	import BuyVolatility from './BuyVolatility.svelte';
	import { fitText } from './fitText';

	/**
	 * Purchase confirmation for a bought free spins mode: one card over the blurred shop
	 * (BuyShop stays mounted underneath) — the option's art on top, title,
	 * pitch, price, CONFIRM. The X and the dim both return to the shop. No
	 * "buy"/"bet" wording anywhere, so it passes social mode as-is.
	 */
	const context = getContext();

	const open = $derived(stateModal.modal?.name === 'buyBonusConfirm');
	const option = $derived(getBuyOption(stateBuy.selectedOptionKey));
	const cost = $derived(
		drawnOrder(numberToCurrencyString(stateBet.betAmount * (option?.costMultiplier ?? 0))),
	);
	const affordable = $derived(
		!!option &&
			stateBet.betAmount > 0 &&
			stateBet.balanceAmount >= stateBet.betAmount * option.costMultiplier,
	);

	/**
	 * Ghost-click guard, as the shop's: the spin press opens this card on
	 * pointerup and the browser then delivers that tap's `click` to whatever
	 * sits under the finger. On CONFIRM that would be a one-tap buy, so nothing
	 * here acts until the opening tap has settled.
	 */
	let settled = $state(false);
	$effect(() => {
		if (!open) {
			settled = false;
			stateBuy.confirmFromSpin = false;
			return;
		}
		const t = setTimeout(() => (settled = true), 300);
		return () => clearTimeout(t);
	});

	// opened by the spin press over an armed buy: back/X return to the game
	const back = () => {
		if (!settled) return;
		if (stateBuy.confirmFromSpin) {
			stateBuy.confirmFromSpin = false;
			stateModal.modal = null;
			return;
		}
		stateModal.modal = { name: 'buyBonus' };
	};
	const confirm = () => {
		const mode = option ? stateMeta.betModeMeta[option.key] : undefined;
		if (!settled || !affordable || mode?.type !== 'buy') return;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_buy_confirm' });
		const current = stateBetDerived.activeBetMode();
		// buying again from an armed buy keeps the ante noted at the first buy
		if (current?.type !== 'buy') {
			stateBuy.anteAfterBuy = current?.type === 'activate' ? current.mode : '';
		}
		stateBuy.armedKey = '';
		stateBuy.confirmFromSpin = false;
		stateBet.activeBetModeKey = mode.mode;
		context.eventEmitter.broadcast({ type: 'bet' });
		stateModal.modal = null;
	};

	/**
	 * Repeat buy (Evtim, 2026-10-27): the bought mode stays selected when its
	 * round ends, so the bar's BET shows its real cost and the buy slot + spin
	 * ring show it armed. A spin press (button or Space) then opens this card
	 * straight away through the shared ButtonBetProvider hook, never a silent
	 * buy: Stake wants a bought mode confirmed again after every round. The ante
	 * the player had comes back when they leave the buy (disarmBuy, the slot's X).
	 */
	let wasIdle = true;
	$effect(() => {
		const idle = context.stateXstateDerived.isIdle();
		if (idle && !wasIdle && stateBetDerived.activeBetMode()?.type === 'buy') {
			stateBuy.armedKey = stateBet.activeBetModeKey;
		}
		wasIdle = idle;
	});
	// any other way out of the buy mode (a shop ante switch, autoplay start, a
	// Space hold's base spin) ends the armed state with it
	$effect(() => {
		if (stateBuy.armedKey && stateBet.activeBetModeKey !== stateBuy.armedKey) {
			stateBuy.armedKey = '';
			stateBuy.anteAfterBuy = '';
		}
	});
	onMount(() => {
		stateBet.onBuyModeBet = () => {
			if (!stateBuy.armedKey || stateBet.activeBetModeKey !== stateBuy.armedKey) return false;
			stateBuy.selectedOptionKey = stateBuy.armedKey;
			stateBuy.confirmFromSpin = true;
			stateModal.modal = { name: 'buyBonusConfirm' };
			return true;
		};
		return () => (stateBet.onBuyModeBet = null);
	});
</script>

{#if open && option}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="overlay"
		onclick={(event) => {
			if (event.target === event.currentTarget) back();
		}}
		style="z-index: {zIndex.dialog + 2};"
		role="dialog"
		aria-modal="true"
	>
		<button class="close" aria-label="Back" onclick={back}><span></span><span></span></button>

		<div class="card">
			<div class="art">
				<img src={option.image} alt="" draggable="false" />
			</div>
			<div class="body">
				{#if option.volatility}
					<BuyVolatility level={option.volatility} size="1.4rem" />
				{/if}
				<h1 class="title">{option.title()}</h1>
				<p class="pitch">{option.description()}</p>
				<div class="cost" use:fitText={cost}>{cost}</div>
				<button class="cta" data-test="confirm-button" disabled={!affordable} onclick={confirm}>
					{i18nDerived.confirm()}
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
		/* light dim only: the blurred shop underneath is the backdrop */
		background: rgba(2, 4, 2, 0.35);
		animation: fade-in 200ms ease-out;
		color: #ffffff;
		/* as the shop: no page pan or bounce under a drag */
		touch-action: none;
		overscroll-behavior: none;
	}

	.card {
		display: flex;
		flex-direction: column;
		width: min(92vw, 430px);
		max-height: 94dvh;
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: none;
		touch-action: pan-y;
		border-radius: 20px;
		background: linear-gradient(180deg, rgba(30, 36, 30, 0.96) 0%, rgba(12, 16, 12, 0.98) 100%);
		border: 1px solid rgba(171, 234, 16, 0.45);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 0 30px rgba(171, 234, 16, 0.18),
			0 20px 50px rgba(0, 0, 0, 0.7);
		animation: card-in 260ms cubic-bezier(0.2, 0.9, 0.3, 1.1);
		scrollbar-width: none;
	}

	.art {
		aspect-ratio: 16 / 9;
		display: flex;
		align-items: center;
		justify-content: center;
		background:
			radial-gradient(ellipse 60% 70% at 50% 60%, rgba(171, 234, 16, 0.25) 0%, transparent 70%),
			linear-gradient(180deg, rgba(70, 40, 110, 0.6) 0%, rgba(20, 16, 30, 0.25) 100%);
		border-bottom: 1px solid rgba(171, 234, 16, 0.2);
	}
	.art img {
		height: 80%;
		width: auto;
		max-width: 70%;
		object-fit: contain;
		filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.7));
		user-select: none;
	}

	.body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.55rem;
		padding: 1rem 1.4rem 1.3rem;
	}
	.title {
		margin: 0;
		font-family: var(--ms-display-font, 'Creepster', 'Inter', sans-serif);
		font-size: clamp(1.7rem, 3.8vw, 2.2rem);
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-align: center;
		/* a translated title can be one long word */
		overflow-wrap: anywhere;
	}
	.pitch {
		margin: 0;
		max-width: 40ch;
		font-size: 0.95rem;
		line-height: 1.45;
		text-align: center;
		color: rgba(255, 255, 255, 0.82);
	}
	.cost {
		margin-top: 0.3rem;
		/* one line, shrunk to the card by fitText (a long currency's price) */
		max-width: 100%;
		white-space: nowrap;
		font-size: clamp(1.7rem, 4vw, 2.3rem);
		font-weight: 800;
		color: #abea10;
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 16px rgba(171, 234, 16, 0.3);
	}
	.cta {
		appearance: none;
		border: none;
		cursor: pointer;
		width: 100%;
		padding: 0.8rem 1rem 0.75rem;
		border-radius: 14px;
		font-weight: 800;
		font-size: 1.15rem;
		letter-spacing: 0.14em;
		color: #10200a;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 50%),
			linear-gradient(180deg, #c7f53a 0%, #abea10 55%, #79b506 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -3px 5px rgba(34, 53, 6, 0.45),
			0 6px 14px rgba(0, 0, 0, 0.5),
			0 0 18px rgba(171, 234, 16, 0.3);
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
	.close {
		appearance: none;
		border: none;
		cursor: pointer;
		position: absolute;
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
		background: #abea10;
	}
	.close span:first-child {
		transform: translate(-50%, -50%) rotate(45deg);
	}
	.close span:last-child {
		transform: translate(-50%, -50%) rotate(-45deg);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.97);
		}
	}
</style>
