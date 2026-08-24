<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: Snippet;
		description: Snippet;
		price: Snippet;
		button: Snippet;
		image?: Snippet;
	};

	const props: Props = $props();
</script>

<div class="bonus-card-wrap">
	<div class="info">
		{@render props.title()}
		<!--
			Callers pass `image` only when there is one (see BonusCards) — an image
			row that renders nothing still costs the .info gap on both sides of it.
			The `:empty` rule below is a second line of defence for callers that
			hand over a snippet which turns out to draw nothing.
		-->
		{#if props.image}
			<div class="image">{@render props.image()}</div>
		{/if}
		{@render props.description()}
		{@render props.price()}
	</div>
	{@render props.button()}
</div>

<style lang="scss">
	.bonus-card-wrap {
		padding: 0.75rem;
		flex-direction: column;
		display: flex;
		justify-content: space-between;

		border-radius: var(--modal-btn-radius, 10px);
		background: var(--modal-bg-active);
		border: 1px solid var(--modal-border);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 24px rgba(0, 0, 0, 0.35);
		text-align: left;
		min-width: 230px;
		max-width: 270px;
		gap: 0.65rem;
	}

	.image:empty {
		display: none;
	}

	.image {
		display: flex;
		justify-content: center;

		:global(img) {
			max-width: 190px;
			max-height: 160px;
			object-fit: contain;
			filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
		}
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}
</style>
