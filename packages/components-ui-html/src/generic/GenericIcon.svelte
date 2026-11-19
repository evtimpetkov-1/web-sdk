<script lang="ts">
	import { ICONS, type IconName } from './icons';

	/**
	 * One icon of the generic UI, drawn as a CSS mask: the icon's alpha with the
	 * text colour laid through it, so it takes any colour and follows `disabled`,
	 * hover and the accent without a second file. `size` is any CSS length (the
	 * default 1em follows the font size).
	 */
	type Props = { name: IconName; size?: string };
	const props: Props = $props();
</script>

<span
	class="gi"
	aria-hidden="true"
	style={`--gi-src: url("${ICONS[props.name]}"); --gi-size: ${props.size ?? '1em'};`}
></span>

<style>
	.gi {
		display: inline-block;
		flex: none;
		width: var(--gi-size);
		height: var(--gi-size);
		background-color: currentColor;
		-webkit-mask: var(--gi-src) center / contain no-repeat;
		mask: var(--gi-src) center / contain no-repeat;
	}
</style>
