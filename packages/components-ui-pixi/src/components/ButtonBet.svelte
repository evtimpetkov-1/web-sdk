<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered, pressed })}
				{@const isDisabled = disabled || ['spin_disabled', 'stop_disabled'].includes(key)}
				<Container {...center}>
					{#if isDisabled}
						<Sprite
							key="spinInactive"
							label="spinButton"
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
						/>
					{:else if hovered || pressed}
						<Sprite
							key="spinHover"
							label="spinButton"
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
						/>
					{:else}
						<Sprite
							key="spinActive"
							label="spinButton"
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
						/>
					{/if}
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
