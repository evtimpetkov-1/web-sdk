<script lang="ts" module>
	import { Sprite, type SpriteProps } from 'pixi-svelte';

	export type Props = SpriteProps;
</script>

<script lang="ts">
	const props: Props = $props();
</script>

<Sprite {...props} key="tickerBg" />
