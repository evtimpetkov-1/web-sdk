<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateUiTheme } from '../stateUiTheme.svelte';
	import { stateBet, stateBetDerived } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	// the player's turbo setting itself, never a private copy: the copy was taken
	// at mount and only flipped by presses, so a Space-hold release (turbo forced
	// off) or a remount during a slam-stopped spin (a temporary turbo) left the
	// button lit with turbo off (2026-10-26)
	const active = $derived(stateBet.isTurboPersistent);
	const disabled = $derived(stateBet.isSpaceHold);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		// toggle the setting, not isTurbo: that is also true during a slam-stopped spin
		stateBetDerived.updateIsTurbo(!stateBet.isTurboPersistent, { persistent: true });
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
	iconActive={active}
	iconTint={active ? stateUiTheme.turboActiveTint : undefined}
/>
