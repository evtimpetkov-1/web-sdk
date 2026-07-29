<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { Container, Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived, stateUi } from 'state-shared';

	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };

	// Spin icon: rotate + shrink arrows, then scale up stop button
	const rotationTween = new Tween(0, { easing: cubicInOut, duration: 250 });
	const arrowScale = new Tween(1, { easing: cubicInOut, duration: 250 });
	let showStop = $state(false);

	$effect(() => {
		if (!stateUi.reelsSpinning) {
			showStop = false;
			rotationTween.set(0, { duration: 0 });
			arrowScale.set(1, { duration: 0 });
		}
	});

</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button
			{...props}
			{sizes}
			onpress={() => {
				if (key === 'spin_default') {
					rotationTween.set(Math.PI);
					arrowScale.set(0).then(() => {
						showStop = true;
					});
				}
				onpress();
			}}
			{disabled}
		>
			{#snippet children({ center, hovered, pressed })}
				{@const isDisabled = disabled || ['spin_disabled', 'stop_disabled'].includes(key)}
				{@const alpha = isDisabled ? 0.4 : hovered || pressed ? 1 : 0.9}
				<Container {...center}>
					{#if showStop}
						<Sprite
							key="stop.png"
							label="spinButton"
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
							{alpha}
						/>
					{:else}
						<Sprite
							key="button.png"
							label="spinButton"
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
							{alpha}
						/>
						<Sprite
							key="spin_icon.png"
							width={sizes.width * arrowScale.current}
							height={sizes.height * arrowScale.current}
							anchor={0.5}
							{alpha}
							rotation={rotationTween.current}
						/>
					{/if}
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
