<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived } from 'state-shared';

	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const { stateXstateDerived, eventEmitter } = context;
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const disabled = $derived(!stateXstateDerived.isIdle());
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');
	const hasBonusAssets = $derived('bonusActive' in context.stateApp.loadedAssets);

	const openModal = () => (stateModal.modal = { name: 'buyBonus' });
	const disableActiveBetMode = () => (stateBet.activeBetModeKey = 'BASE');
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (active) {
			disableActiveBetMode();
		} else {
			openModal();
		}
	};
</script>

{#if hasBonusAssets}
	<Button {...props} {sizes} {disabled} {onpress}>
		{#snippet children({ center, hovered, pressed })}
			{#if disabled}
				<Sprite
					{...center}
					key="bonusInactive"
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
				/>
			{:else if hovered || pressed}
				<Sprite
					{...center}
					key="bonusHover"
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
				/>
			{:else}
				<Sprite
					{...center}
					key="bonusActive"
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
				/>
			{/if}
		{/snippet}
	</Button>
{/if}
