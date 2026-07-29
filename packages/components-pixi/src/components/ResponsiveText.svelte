<script lang="ts">
	import { Container, Text, type BitmapTextProps } from 'pixi-svelte';

	type Props = Omit<BitmapTextProps, 'scale' | 'onresize'> & {
		maxWidth?: number;
		maxHeight?: number;
	};

	const { maxWidth, maxHeight, ...textProps }: Props = $props();
	let baseSizes = $state({ width: 0, height: 0 });
	const responsiveScale = $derived(
		Math.min(
			maxWidth ? maxWidth / (baseSizes.width || 1) : 1,
			maxHeight ? maxHeight / (baseSizes.height || 1) : 1,
			1,
		),
	);
</script>

<Container visible={false}>
	<Text {...textProps} onresize={(sizes) => (baseSizes = sizes)} />
</Container>

<Container>
	<Text {...textProps} scale={responsiveScale} />
</Container>
