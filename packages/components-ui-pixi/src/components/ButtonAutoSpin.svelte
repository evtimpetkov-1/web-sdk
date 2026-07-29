<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateModal } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';
	import ButtonBetAutoSpinsCounter from './ButtonBetAutoSpinsCounter.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const active = $derived(stateBetDerived.hasAutoBetCounter());

	let iconRotation = $state(0);

	$effect(() => {
		if (active) {
			let frame: number;
			const animate = () => {
				iconRotation += 0.03;
				frame = requestAnimationFrame(animate);
			};
			frame = requestAnimationFrame(animate);
			return () => cancelAnimationFrame(frame);
		} else {
			iconRotation = 0;
		}
	});

	const disabled = $derived.by(() => {
		if (stateBet.isSpaceHold) return true;
		if (!context.stateXstateDerived.isIdle() && !stateBetDerived.hasAutoBetCounter()) return true;
		if (!stateBetDerived.isBetCostAvailable()) return true;
		return false;
	});

	const stopAutoSpin = () => (stateBet.autoSpinsCounter = 0);
	const openModal = () => (stateModal.modal = { name: 'autoSpin' });
	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.hasAutoBetCounter() ? stopAutoSpin() : openModal();
	};
</script>

<UiButton {...props} {sizes} {active} {onpress} {disabled} icon="autoSpin" {iconRotation}>
	<Container x={sizes.width * 0.5} y={sizes.height * 0.5}>
		{#if active}
			{@const maskSize = UI_BASE_SIZE * 0.45}
			<Rectangle
				anchor={0.5}
				width={maskSize}
				height={maskSize}
				borderRadius={maskSize}
			/>
		{/if}
		<ButtonBetAutoSpinsCounter />
	</Container>
</UiButton>
