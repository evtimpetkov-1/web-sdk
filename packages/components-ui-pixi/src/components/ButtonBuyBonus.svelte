<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal } from 'state-shared';
	import { getContextLayout } from 'utils-layout';

	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const { stateXstateDerived, eventEmitter } = context;
	const { stateLayoutDerived } = getContextLayout();
	// deliberately larger than the standard UI_BASE_SIZE buttons — the buy
	// entry point earns more presence than the utility buttons around it.
	// Desktop's UI is already generous, so it keeps the standard size.
	const buyBonusScale = $derived(stateLayoutDerived.layoutType() === 'desktop' ? 1.0 : 1.2);
	const sizes = $derived({
		width: UI_BASE_SIZE * buyBonusScale,
		height: UI_BASE_SIZE * buyBonusScale,
	});
	const disabled = $derived(!stateXstateDerived.isIdle());
	const hasBonusAssets = $derived('bonusActive' in context.stateApp.loadedAssets);

	// Always opens the shop. This button used to DISABLE an active
	// activate-mode instead of opening — with an on-screen ante toggle that
	// read as the chest silently switching ante off; the shop's own card is
	// where an activate mode is managed from here.
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'buyBonus' };
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
