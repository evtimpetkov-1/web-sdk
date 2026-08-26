<script lang="ts">
	import { Button, Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateModal, stateUi, INFINITY_MARK } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BaseIcon from './BaseIcon.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import BaseButtonWrap from './BaseButtonWrap.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import ScrollHint from './ScrollHint.svelte';
	import { stateBonus, stateBonusDerived } from '../stateBonus.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	let scrollEl = $state<Element | null>(null);

	const confirm = () => {
		// Only a buy/activate selection may take over the active mode. Applying
		// the selection unconditionally meant a stale/default selection (e.g.
		// 'BASE') silently switched an active ante off while confirming nothing.
		const selected = stateBonusDerived.selectedBetModeData();
		if (!selected || (selected.type !== 'buy' && selected.type !== 'activate')) return;

		stateBet.activeBetModeKey = stateBonus.selectedBetModeKey;

		if (selected.type === 'buy') {
			eventEmitter.broadcast({ type: 'bet' });
		}

		if (selected.type === 'activate') {
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}
	};
</script>

{#if stateModal.modal?.name === 'buyBonusConfirm'}
	<Popup
		zIndex={zIndex.dialog}
		closeAnchor="content"
		onclose={() => (stateModal.modal = { name: 'buyBonus' })}
	>
		<BaseContent maxWidth="500px">
			<!-- the art leads the dialog, card-style — title and copy sit under it.
			     Games bleed it to the panel edges via their modal theme css. -->
			{#if stateBonusDerived.selectedBetModeData().assets.dialogImage}
				<img
					class="dialog-image"
					src={stateBonusDerived.selectedBetModeData().assets.dialogImage}
					alt={stateBonusDerived.selectedBetModeData().text.title}
				/>
			{/if}
			<BaseTitle>
				{stateBonusDerived.selectedBetModeData().text.title}
			</BaseTitle>
			<BaseScrollable type="column" onelement={(element) => (scrollEl = element)}>
				{stateBonusDerived.selectedBetModeData().text.dialog}
			</BaseScrollable>
			<!-- purchase confirmation must restate the concrete price: the 80x cost
			     is otherwise only visible on the card in the previous popup -->
			<div class="cost-row">
				<span class="cost-label">{i18nDerived.cost()}</span>
				<span class="cost-value">
					{numberToCurrencyString(
						stateBet.betAmount * stateBonusDerived.selectedBetModeData().costMultiplier,
					)}
				</span>
			</div>
			<!-- relative wrapper: the scroll hint overlays the gap above CONFIRM
			     without shifting the layout when it appears/disappears -->
			<div class="confirm-area">
				<ScrollHint scrollElement={scrollEl} />
				<BaseButtonWrap type="max-width">
					<Button
						data-test="confirm-button"
						onclick={() => {
							confirm();
							eventEmitter.broadcast({ type: 'soundPressGeneral' });
							stateModal.modal = null;
						}}
					>
						<!-- same themeable call-to-action surface as the shop card's BUY -->
					<BaseIcon
						width="100%"
						height="3rem"
						background="var(--modal-btn-cta-bg, var(--modal-btn-bg))"
						border="var(--modal-btn-cta-border, 1px solid var(--modal-border))"
					/>
						<BaseButtonContent>
							<span style="font-size: 1rem;">{i18nDerived.confirm()}</span>
						</BaseButtonContent>
					</Button>
				</BaseButtonWrap>
			</div>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.confirm-area {
		position: relative;
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.cost-row {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 0.5rem;
		width: 100%;
		padding: 0.25rem 0;
	}

	.cost-label {
		font-size: 0.85rem;
		letter-spacing: 0.1em;
		color: rgba(240, 208, 96, 0.9);
	}

	.cost-value {
		font-size: 1.15rem;
		font-weight: 700;
	}

	.dialog-image {
		display: block;
		width: 100%;
		max-height: 220px;
		object-fit: cover;
		border-radius: 10px;
		margin: 0 auto;
	}
</style>
