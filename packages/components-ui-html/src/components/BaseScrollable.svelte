<script lang="ts">
	import type { Snippet } from 'svelte';

	type Element = null | HTMLDivElement;

	type Props = {
		type: 'column' | 'row';
		noScroll?: boolean;
		/** hands the scroll container to the parent (e.g. for scroll hints) */
		onelement?: (element: Element) => void;
		children: Snippet<[{ element: Element }]>;
	};

	let element = $state(null as Element);

	const props: Props = $props();

	$effect(() => {
		props.onelement?.(element);
	});
</script>

<div
	bind:this={element}
	class="content {props.type}"
	class:scrollX={!props.noScroll && props.type === 'row'}
	class:scrollY={!props.noScroll && props.type === 'column'}
>
	{@render props.children({ element })}
</div>

<style lang="scss">
	.content {
		position: relative;
		text-align: center;
		display: flex;
		gap: 1rem;

		// thin, theme-matched scrollbar — the default fat white one cut through
		// the dark panels (and collided with the panel-anchored close button)
		scrollbar-width: thin;
		scrollbar-color: rgba(240, 208, 96, 0.35) transparent;

		&::-webkit-scrollbar {
			width: 6px;
			height: 6px;
		}
		&::-webkit-scrollbar-track {
			background: transparent;
		}
		&::-webkit-scrollbar-thumb {
			background: rgba(240, 208, 96, 0.35);
			border-radius: 3px;
		}

		&.column {
			flex-direction: column;
			align-items: center;
			flex: 1;
			min-height: 0;
			overflow-y: auto;
		}

		&.row {
			flex-direction: row;
			justify-content: center;
			max-width: 100%;
		}
	}
</style>
