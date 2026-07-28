<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicInOut } from 'svelte/easing';
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

	// Spin icon rotation (180° = bottom arrow swaps to top)
	const rotationTween = new Tween(0, { easing: cubicInOut, duration: 250 });

	let showStop = $state(false);

	$effect(() => {
		if (stateUi.reelsSpinning) {
			// Reels started: rotate icon, then swap to stop after a brief delay
			showStop = false;
			rotationTween.set(Math.PI).then(() => {
				if (stateUi.reelsSpinning) {
					setTimeout(() => {
						if (stateUi.reelsSpinning) showStop = true;
					}, 100);
				}
			});
		} else {
			// Reels stopped: immediately show spin button
			showStop = false;
			rotationTween.set(0, { duration: 0 });
		}
	});

	// Scale pulse on press
	const scaleTween = new Tween(1, { easing: cubicOut, duration: 150 });

	const onPressAnimation = () => {
		scaleTween.set(1.08).then(() => scaleTween.set(1));
	};
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button
			{...props}
			{sizes}
			onpress={() => {
				onpress();
				onPressAnimation();
			}}
			{disabled}
		>
			{#snippet children({ center, hovered, pressed })}
				{@const isDisabled = disabled || ['spin_disabled', 'stop_disabled'].includes(key)}
				{@const alpha = isDisabled ? 0.4 : hovered || pressed ? 1 : 0.9}
				<Container {...center} scale={scaleTween.current}>
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
							width={sizes.width}
							height={sizes.height}
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
