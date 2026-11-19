<script lang="ts" module>
	import type { Snippet } from 'svelte';

	import {
		Container,
		Rectangle,
		anchorToPivot,
		type ContainerProps,
		type Sizes,
		type PixiPoint,
	} from 'pixi-svelte';

	type ContainerPropsToOmit =
		| 'eventMode'
		| 'cursor'
		| 'pivot'
		| 'children'
		| 'onpointerover'
		| 'onpointerout'
		| 'onpointerdown'
		| 'onpointerup';

	export type Props = Omit<ContainerProps, ContainerPropsToOmit> & {
		sizes: Sizes;
		onpress: () => void;
		disabled?: boolean;
		anchor?: PixiPoint;
		children: Snippet<
			[
				{
					center: { x: number; y: number };
					hovered: boolean;
					pressed: boolean;
				},
			]
		>;
		debug?: boolean;
		/**
		 * true: a press counts inside the `sizes` box only. By default the hit area is
		 * whatever the children draw, transparent pixels included, so art drawn larger
		 * than the box (a sprite with a margin for its shadow) would take the presses
		 * meant for its neighbours.
		 */
		boxHit?: boolean;
	};
</script>

<script lang="ts">
	const { children, sizes, anchor, disabled, onpress, debug, boxHit, ...containerProps }: Props = $props();
	// in the container's own units: its pivot puts the box at 0..sizes
	const hitArea = $derived(
		boxHit
			? { contains: (x: number, y: number) => x >= 0 && x <= sizes.width && y >= 0 && y <= sizes.height }
			: undefined,
	);
	const center = $derived({
		x: sizes.width * 0.5,
		y: sizes.height * 0.5,
	});

	let hovered = $state(false);
	let pressed = $state(false);

	$effect(() => {
		if (disabled) {
			hovered = false;
			pressed = false;
		}
	});
</script>

<Container
	{...containerProps}
	eventMode="static"
	{hitArea}
	cursor={disabled ? 'not-allowed' : 'pointer'}
	pivot={anchorToPivot({ sizes, anchor })}
	onpointerover={() => {
		if (disabled) return;
		hovered = true;
	}}
	onpointerout={() => {
		if (disabled) return;
		hovered = false;
	}}
	onpointerdown={() => {
		if (disabled) return;
		pressed = true;
	}}
	onpointerup={() => {
		if (disabled) return;
		pressed = false;
		onpress();
	}}
>
	{#if debug}
		<Rectangle
			width={sizes.width}
			height={sizes.height}
			alpha={0.5}
			borderWidth={2}
			borderColor={0xffffff}
		/>
	{/if}
	{@render children({ center, hovered, pressed })}
</Container>
