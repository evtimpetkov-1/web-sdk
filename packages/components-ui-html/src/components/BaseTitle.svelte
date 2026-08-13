<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();
</script>

<div class="ui-modal-title-wrap">
	{@render props.children()}
</div>

<style lang="scss">
	.ui-modal-title-wrap {
		text-align: center;
		font-family: var(--modal-title-font);
		font-size: var(--modal-title-size);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--modal-text);
	}

	.ui-modal-title-wrap::after {
		content: '';
		display: block;
		height: 2px;
		margin: 0.5rem auto 0;
		width: min(220px, 60%);
		background: var(--modal-divider);
		border-radius: 2px;
		opacity: 0.8;
	}
</style>
