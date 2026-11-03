<script lang="ts">
	/**
	 * Volatility meter: five radiation trefoils (the bonus symbol's sign),
	 * `level` of them lit acid green. Drawn as a path, no font or bitmap.
	 */
	type Props = { level: number; size?: string };
	const props: Props = $props();
	const marks = [1, 2, 3, 4, 5];
	const TREFOIL = 'M27.0 10.2A46 46 0 0 1 73.0 10.2L58.5 35.3A17 17 0 0 0 41.5 35.3Z M96.0 50.0A46 46 0 0 1 73.0 89.8L58.5 64.7A17 17 0 0 0 67.0 50.0Z M27.0 89.8A46 46 0 0 1 4.0 50.0L33.0 50.0A17 17 0 0 0 41.5 64.7Z M41 50a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z';
</script>

<div class="meter" style="--mark: {props.size ?? '1.1rem'};" aria-label="Volatility {props.level} of 5">
	{#each marks as mark}
		<svg class="mark" class:lit={mark <= props.level} viewBox="0 0 100 100" aria-hidden="true">
			<circle cx="50" cy="50" r="48" />
			<path d={TREFOIL} fill-rule="evenodd" />
		</svg>
	{/each}
</div>

<style lang="scss">
	.meter {
		display: flex;
		gap: 0.28rem;
		justify-content: center;
	}
	.mark {
		width: var(--mark);
		height: var(--mark);
	}
	.mark circle {
		fill: rgba(255, 255, 255, 0.06);
		stroke: rgba(255, 255, 255, 0.22);
		stroke-width: 4;
	}
	.mark path {
		fill: rgba(255, 255, 255, 0.22);
	}
	.mark.lit circle {
		fill: rgba(171, 234, 16, 0.14);
		stroke: #abea10;
	}
	.mark.lit path {
		fill: #abea10;
	}
	.mark.lit {
		filter: drop-shadow(0 0 4px rgba(171, 234, 16, 0.55));
	}
</style>
