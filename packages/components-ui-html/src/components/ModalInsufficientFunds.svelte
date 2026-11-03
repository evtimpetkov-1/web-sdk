<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	/**
	 * A bet pressed (spin button, Space, hold-to-spin) or refused by the RGS
	 * (ERR_IPB) while its cost is over the balance. Stake asks for "Insufficient
	 * Funds" here and "Insufficient Balance" on Stake.us (review 2026-10-29).
	 * Games that compose their modals one by one instead of using <Modals> must
	 * mount this one too, or the press opens a modal nothing renders.
	 */
</script>

{#if stateModal.modal?.name === 'insufficientFunds'}
	<Popup zIndex={zIndex.modal} closeAnchor="content" onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="100%">
			<BaseTitle>
				{i18nDerived.insufficientFundsTitle()}
			</BaseTitle>
			<p class="text" data-test="insufficient-funds">{i18nDerived.insufficientFundsAction()}</p>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.text {
		margin: 0;
		max-width: 26rem;
		text-align: center;
		white-space: normal;
		color: var(--modal-text-dim);
	}
</style>
