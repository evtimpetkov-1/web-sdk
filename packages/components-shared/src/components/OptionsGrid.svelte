<script lang="ts" generics="TValue extends string | number">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import Button from './Button.svelte';

	type Props = {
		value: TValue;
		options: Readonly<TValue[]>;
		miniSize?: boolean;
		/**
		 * Opt-in for long option lists (the bet menu): landscape/desktop spreads
		 * to 6 columns and widens, so ~44 options become ~8 rows that mostly fit
		 * on screen instead of a skinny 15-row scroll strip. Portrait unchanged.
		 */
		wide?: boolean;
		onchange: (value: TValue) => void;
		option: Snippet<[{ option: TValue; index: number }]>;
	};

	const props: Props = $props();

	/**
	 * On open, bring the currently selected option into view: with long lists
	 * on scrolling layouts (the bet menu on phones) a high selection can sit
	 * below the fold, and the player would not see where they are. Grid
	 * children are the option buttons in `options` order. Instant, not smooth —
	 * the menu should OPEN pre-scrolled, not animate on its own.
	 */
	let gridElement = $state<HTMLDivElement | null>(null);
	onMount(() => {
		const index = props.options.indexOf(props.value);
		if (index < 0) return;
		const selected = gridElement?.children[index] as HTMLElement | undefined;
		selected?.scrollIntoView({ block: 'center', behavior: 'instant' });
	});
</script>

<div class="wrap" class:wide={props.wide}>
	<div class="content-wrap">
		<div class="grid" class:miniSize={props.miniSize} class:wide={props.wide} bind:this={gridElement}>
			{#each props.options as option, index (option)}
				<Button
					onclick={() => {
						props.onchange(option);
					}}
				>
					{@render props.option({ option, index })}
				</Button>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.wrap {
		min-width: 20rem;
	}

	// Minimum width in portrait is 320px
	@media (orientation: portrait) {
		@media (min-width: 320px) and (max-width: 370px) {
			.wrap {
				min-width: 17rem;
			}
		}
	}

	// Minimum height in portrait is 255px
	@media (orientation: landscape) {
		@media (min-height: 255px) and (max-height: 480px) {
			.wrap {
				min-width: 23rem;
			}
		}
	}

	.content-wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.grid {
		display: grid;
		gap: 0.75rem;
		place-content: center;
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-height: 480px) {
		.grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	// wide mode: landscape screens with room spread the list across 6 columns
	// (buttons keep their portrait size — the wrap grows to hold them)
	@media (orientation: landscape) and (min-width: 700px) {
		.wrap.wide {
			min-width: min(44rem, 86vw);
		}
		.grid.wide {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	.miniSize {
		@media (max-width: 500px) {
			grid-template-columns: repeat(auto-fit, minmax(20px, 1fr));
		}
		@media (max-height: 500px) {
			grid-template-columns: repeat(auto-fit, minmax(20px, 1fr));
		}
	}
</style>
