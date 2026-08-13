<script lang="ts">
	import { Sprite, type SpriteProps } from 'pixi-svelte';

	import { getSymbolInfo } from '../game/utils';
	import { onMount } from 'svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	onMount(() => {
		props.oncomplete?.();
	});

	$effect(() => {
		props.symbolInfo;
		props.oncomplete?.();
	});
</script>

<Sprite
	x={props.x}
	y={(props.y ?? 0) +
		('yOffset' in props.symbolInfo ? props.symbolInfo.yOffset * props.symbolInfo.scale : 0)}
	anchor={0.5}
	key={props.symbolInfo.assetKey}
	scale={props.symbolInfo.scale}
/>
