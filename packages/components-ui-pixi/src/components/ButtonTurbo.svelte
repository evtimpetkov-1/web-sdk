<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const active = $derived(persistentTurbo);
	let persistentTurbo = $state(stateBet.isTurbo);
	const disabled = $derived(stateBet.isSpaceHold);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		persistentTurbo = !stateBet.isTurbo;
		stateBetDerived.updateIsTurbo(persistentTurbo, { persistent: true });
	};

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});
</script>

<!-- TEST: green bolt while turbo is on (yellow art x green tint) — to revert,
     drop the iconTint prop -->
<UiButton
	{...props}
	{sizes}
	{active}
	{onpress}
	{disabled}
	icon="turbo"
	iconActive={persistentTurbo}
	iconTint={persistentTurbo ? 0x55ff55 : undefined}
/>
