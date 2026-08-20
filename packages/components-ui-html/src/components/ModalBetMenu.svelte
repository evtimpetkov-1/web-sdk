<script lang="ts">
	import { Button, Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import BaseIcon from './BaseIcon.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import BaseButtonWrap from './BaseButtonWrap.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import BetMenuAmountToggle from './BetMenuAmountToggle.svelte';
	import BetMenuAmountGrid from './BetMenuAmountGrid.svelte';
	import ScrollHint from './ScrollHint.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	const confirm = () => {
		stateModal.modal = null;
	};

	let scrollEl = $state<Element | null>(null);
</script>

{#if stateModal.modal?.name === 'betAmountMenu'}
	<Popup zIndex={zIndex.modal} closeAnchor="content" onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="100%">
			<BaseTitle>
				{i18nDerived.betMenu()}
			</BaseTitle>
			<BaseScrollable type="column" onelement={(element) => (scrollEl = element)}>
				<span style="color: var(--modal-text-dim); font-size: 0.9rem;">{i18nDerived.selectYourBet()}</span>
				<BetMenuAmountToggle />
				<BetMenuAmountGrid />
			</BaseScrollable>
			<!-- relative wrapper so the hint overlays the gap above CONFIRM without
			     shifting the layout when it appears/disappears -->
			<div class="confirm-area">
				<ScrollHint scrollElement={scrollEl} />
				<BaseButtonWrap type="full-width">
					<Button data-test="confirm-button" onclick={confirm}>
						<BaseIcon
							width="100%"
							height="3rem"
							background="var(--modal-btn-confirm-bg)"
							border="1px solid var(--modal-btn-confirm-border)"
						/>
						<BaseButtonContent>
							<span style="font-size: 1rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;"
								>{i18nDerived.confirm()}</span
							>
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
</style>
