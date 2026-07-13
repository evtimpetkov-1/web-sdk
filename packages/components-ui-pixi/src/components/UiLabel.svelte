<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { WHITE } from 'constants-shared/colors';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
	};

	const props: Props = $props();

	const labelStyle = {
		fontFamily: 'proxima-nova',
		fontSize: UI_BASE_FONT_SIZE,
		fontWeight: '700',
		fill: 0xf0d060,
		letterSpacing: 2,
	} as const;

	const valueStyle = {
		fontFamily: 'proxima-nova',
		fontSize: UI_BASE_FONT_SIZE * 1.15,
		fontWeight: '700',
		fill: WHITE,
		letterSpacing: 1,
	} as const;
</script>

{#if props.stacked}
	{#if props.tiled}
		<UiSprite
			anchor={0.5}
			scale={0.7}
		/>
	{/if}
	<Text anchor={{ x: 0.5, y: 1 }} text={props.label} style={labelStyle} y={-10} />
	<Text anchor={{ x: 0.5, y: 0 }} text={props.value} style={valueStyle} y={-2} />
{:else}
	{#if props.tiled}
		<UiSprite
			anchor={0.5}
			scale={0.7}
		/>
	{/if}
	<Text anchor={{ x: 0, y: 0.5 }} text={props.label} style={labelStyle} />
	<Text
		anchor={{ x: 1, y: 0.5 }}
		text={props.value}
		style={valueStyle}
		x={UI_BASE_FONT_SIZE * 10}
	/>
{/if}
