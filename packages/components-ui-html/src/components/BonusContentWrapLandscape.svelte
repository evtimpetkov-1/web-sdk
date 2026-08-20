<script lang="ts">
	import type { Snippet } from 'svelte';

	import { getContextLayout } from 'utils-layout';
	import { resizeObserver, type ContentRect } from 'utils-resize-observer';

	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';

	type Props = {
		maxListLength: number;
		betAmount: Snippet;
		bonusCardsActivate: Snippet;
		bonusCardsBuy: Snippet;
	};

	const props: Props = $props();

	const { stateLayoutDerived } = getContextLayout();

	let contentRect = $state({ width: 0, height: 0, left: 0, top: 0 } as ContentRect);

	/**
	 * The cards and the bet toggle are ONE cluster (toggle right under the
	 * cards, same as portrait) and the whole cluster is measured unscaled and
	 * shrunk together to fit the viewport. Earlier layouts positioned the two
	 * independently (toggle fixed to the screen edge, then beside the scaled
	 * cards' unscaled box) and they kept drifting apart on wide/short windows.
	 */
	const scale = $derived(
		Math.min(
			1,
			(stateLayoutDerived.canvasSizes().height * 0.92) / (contentRect?.height || 1),
			(stateLayoutDerived.canvasSizes().width * 0.9) / (contentRect?.width || 1),
		),
	);
</script>

<!-- bare: the content is out of normal flow, so a chromed panel would
     collapse to an empty square at screen center -->
<BaseContent maxWidth="100%" bare>
	<!-- outer div centers; inner div scales about its own center — the visual
	     stays perfectly centered at any scale -->
	<div class="center">
		<div
			class="cluster"
			style="transform: scale({scale});"
			use:resizeObserver={(value) => (contentRect = value)}
		>
			<BaseScrollable type="row" noScroll>
				{@render props.bonusCardsActivate()}
			</BaseScrollable>

			<BaseScrollable type="row" noScroll>
				{@render props.bonusCardsBuy()}
			</BaseScrollable>

			<div class="amount">
				{@render props.betAmount()}
			</div>
		</div>
	</div>
</BaseContent>

<style lang="scss">
	.center {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.cluster {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;

		transform-origin: center center;
	}

	.amount {
		margin-top: 0.25rem;
	}
</style>
