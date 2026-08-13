<script lang="ts">
	type Props = {
		width: string;
		height: string;
		background?: string;
		border?: string;
	};

	const {
		width,
		height,
		background = 'var(--modal-btn-bg)',
		border = '1px solid var(--modal-border)',
	}: Props = $props();
</script>

<div
	class="rectangle"
	style="
	--width-value: {width};
	--height-value: {height};
	--background-value: {background};
	--border-value: {border};
"
></div>

<style lang="scss">
	.rectangle {
		width: var(--width-value);
		height: var(--height-value);
		background: var(--background-value);
		border: var(--border-value);
		border-radius: var(--modal-btn-radius, 10px);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.25);
		transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}
</style>
