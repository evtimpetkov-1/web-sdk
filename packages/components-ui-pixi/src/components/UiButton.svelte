<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import type { ButtonIcon } from '../types';
	import type { Snippet } from 'svelte';

	type Props = Omit<ButtonProps, 'children'> & {
		icon: ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
	};

	const ICON_SPRITE_MAP: Record<string, string> = {
		menu: 'menu.png',
		autoSpin: 'auto.png',
		turbo: 'turbo.png',
		payTable: 'paytable.png',
		info: 'info.png',
		settings: 'settings.png',
		soundOn: 'sound_on.png',
		soundOff: 'sound_off.png',
		menuExit: 'close.png',
	};

	const { icon, active, children: childrenFromParent, ...buttonProps }: Props = $props();

	const spriteKey = $derived(ICON_SPRITE_MAP[icon]);
</script>

<Button {...buttonProps}>
	{#snippet children({ center, hovered, pressed })}
		{@const alpha = buttonProps.disabled
			? 0.35
			: active !== undefined && !active
				? 0.5
				: hovered || pressed
					? 1
					: 0.85}
		<Sprite
			{...center}
			key={spriteKey}
			anchor={0.5}
			width={buttonProps.sizes.width}
			height={buttonProps.sizes.height}
			{alpha}
		/>

		{@render childrenFromParent?.()}
	{/snippet}
</Button>
