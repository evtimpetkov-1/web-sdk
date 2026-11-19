<script lang="ts">
	import type { Snippet } from 'svelte';

	import StudioIntro from '../studio/StudioIntro.svelte';

	import './global.scss';

	type Props = {
		children: Snippet;
		/**
		 * The studio ident (ROYAL CAT GAMING assembles itself, about three seconds)
		 * over the game's own loader from the first frame. Every game's layout mounts
		 * GlobalStyle, so every game has it with nothing to add; `false` leaves it out.
		 * `?studio=false` in the URL skips it for one load.
		 */
		studioIntro?: boolean;
	};

	const props: Props = $props();
</script>

{@render props.children()}

{#if props.studioIntro !== false}
	<StudioIntro />
{/if}
