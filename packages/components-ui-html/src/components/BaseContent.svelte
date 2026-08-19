<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		maxWidth: '100%' | '500px';
		/**
		 * Skip the panel chrome (background, border, shadow, padding). For wrappers
		 * whose children are all position:absolute/fixed (the portrait and landscape
		 * buy-bonus layouts): with nothing in normal flow the panel collapses to an
		 * empty padded box and paints as a small phantom square at screen center.
		 */
		bare?: boolean;
		children: Snippet;
	};

	const props: Props = $props();
</script>

<div
	class="ui-popup-standard-content-wrap"
	class:bare={props.bare}
	style="--maxWidth: {props.maxWidth}; --zIndex: {100}"
>
	{@render props.children()}
</div>

<style lang="scss">
	.ui-popup-standard-content-wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: var(--zIndex);
		max-width: var(--maxWidth);
		max-height: 100%;
		gap: 1rem;
		color: var(--modal-text);

		background: var(--modal-panel-bg);
		border: var(--modal-panel-border);
		border-radius: var(--modal-panel-radius);
		box-shadow: var(--modal-panel-shadow);
		padding: var(--modal-panel-padding);

		&.bare {
			background: none;
			border: none;
			box-shadow: none;
			padding: 0;
		}
	}
</style>
