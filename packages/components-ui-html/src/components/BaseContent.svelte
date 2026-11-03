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
		/* never taller than the screen (minus Popup's padding): the panel's own
		   scrollable body scrolls instead of the whole popup, which drew a
		   browser scrollbar on Stake's Popout S (400x225). A % height did not
		   bind: the wrapper above has no definite height. */
		max-height: calc(100vh - 2 * var(--popup-pad, 1rem));
		max-height: calc(100dvh - 2 * var(--popup-pad, 1rem));
		min-height: 0;
		box-sizing: border-box;
		gap: 1rem;
		color: var(--modal-text);

		background: var(--modal-panel-bg);
		border: var(--modal-panel-border);
		border-radius: var(--modal-panel-radius);
		box-shadow: var(--modal-panel-shadow);
		padding: var(--modal-panel-padding);

		/* Stake's Popout S (400x225): with the full gaps the auto-spin options
		   overflowed their column by a few px and drew a needless scrollbar */
		@media screen and (max-height: 300px) {
			gap: 0.6rem;
		}

		&.bare {
			background: none;
			border: none;
			box-shadow: none;
			padding: 0;
		}
	}
</style>
