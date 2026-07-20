<script lang="ts">
	import { Sprite, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiSprite from './UiSprite.svelte';
	import type { ButtonIcon } from '../types';
	import type { Snippet } from 'svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from '../constants';

	type Props = Omit<ButtonProps, 'children'> & {
		icon: ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
		variant?: 'dark' | 'light';
	};

	const ICON_SPRITE_MAP: Record<string, string> = {
		menu: 'menu',
		autoSpin: 'auto',
		turbo: 'turbo',
		decrease: 'minus',
		increase: 'plus',
		payTable: 'payTable',
		info: 'info',
		settings: 'settings',
		soundOn: 'soundOn',
		soundOff: 'soundOff',
		menuExit: 'menuExit',
	};

	const {
		icon,
		active,
		variant = 'dark',
		children: childrenFromParent,
		...buttonProps
	}: Props = $props();

	const spritePrefix = $derived(ICON_SPRITE_MAP[icon]);
</script>

<Button {...buttonProps}>
	{#snippet children({ center, hovered, pressed })}
		{#if spritePrefix}
			{#if buttonProps.disabled}
				<Sprite
					{...center}
					key={`${spritePrefix}Inactive`}
					anchor={0.5}
					width={buttonProps.sizes.width}
					height={buttonProps.sizes.height}
				/>
			{:else if hovered || pressed}
				<Sprite
					{...center}
					key={`${spritePrefix}Hover`}
					anchor={0.5}
					width={buttonProps.sizes.width}
					height={buttonProps.sizes.height}
				/>
			{:else}
				<Sprite
					{...center}
					key={`${spritePrefix}Active`}
					anchor={0.5}
					width={buttonProps.sizes.width}
					height={buttonProps.sizes.height}
					alpha={active !== undefined && !active ? 0.5 : 1}
				/>
			{/if}
		{:else}
			<UiSprite
				{...center}
				anchor={0.5}
				width={buttonProps.sizes.width}
				height={buttonProps.sizes.height}
				backgroundColor={variant === 'dark' ? 0x000000 : 0xffffff}
				backgroundAlpha={variant === 'dark' ? 0.4 : 0.7}
				{...buttonProps.disabled
					? {
							backgroundColor: 0x333333,
							backgroundAlpha: 0.3,
						}
					: {}}
				{...(hovered || pressed)
					? {
							backgroundAlpha: variant === 'dark' ? 0.6 : 0.85,
						}
					: {}}
				{...active
					? {
							borderWidth: 3,
							borderColor: variant === 'dark' ? 0xffffff : 0x000000,
							borderAlpha: 0.6,
						}
					: {}}
			/>

			<Text
				{...center}
				anchor={0.5}
				text={i18nDerived[icon]()}
				style={{
					align: 'center',
					wordWrap: true,
					wordWrapWidth: 200,
					fontFamily: 'proxima-nova',
					fontWeight: '600',
					fontSize: UI_BASE_FONT_SIZE * 0.9,
					fill: variant === 'dark' ? 0xffffff : 0x000000,
				}}
			/>
		{/if}

		{@render childrenFromParent?.()}
	{/snippet}
</Button>
