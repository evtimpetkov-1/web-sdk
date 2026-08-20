<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateMetaDerived } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import BonusCards from './BonusCards.svelte';
	import BetMenuAmountToggle from './BetMenuAmountToggle.svelte';
	import ScrollHint from './ScrollHint.svelte';

	const activateList = $derived(
		stateMetaDerived.betModeMetaList().filter((item) => item.type === 'activate'),
	);

	const buyList = $derived(
		stateMetaDerived.betModeMetaList().filter((item) => item.type === 'buy'),
	);

	let scrollEl = $state<Element | null>(null);
</script>

<!--
	Same structure as ModalBuyBonusConfirm, for the same reason: a chromed panel
	whose content stays at FULL SIZE and scrolls when the window is small. The
	old per-layout wrappers transform-scaled the whole card cluster to fit, so
	on very small popouts (Stake's Popout S) the dialog text shrank into an
	unreadable thumbnail. The X anchors to the panel corner (closeAnchor).
-->
{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} closeAnchor="content" onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="500px">
			<BaseScrollable type="column" onelement={(element) => (scrollEl = element)}>
				{#if activateList.length > 0}
					<div class="cards">
						<BonusCards list={activateList} />
					</div>
				{/if}
				{#if buyList.length > 0}
					<div class="cards">
						<BonusCards list={buyList} />
					</div>
				{/if}
				<BetMenuAmountToggle />
			</BaseScrollable>
			<!-- zero-height anchor: the scroll hint overlays the list's bottom edge -->
			<div class="hint-area">
				<ScrollHint scrollElement={scrollEl} />
			</div>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.cards {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}

	.hint-area {
		position: relative;
		width: 100%;
		height: 0;
	}
</style>
