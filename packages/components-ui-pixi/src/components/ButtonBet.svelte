<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { Container, Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateUi, stateModal } from 'state-shared';

	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	// The Space hotkey must go DEAD while any modal is up. It used to stay armed,
	// so Space with e.g. the buy-bonus CONFIRM open started a plain spin in the
	// still-active mode UNDER the dialog — the machine left idle, the confirm's
	// own bet broadcast was then dropped, and the purchase silently never
	// happened (with the leftover BONUS mode reading as "ante turned itself off").
	// An unaffordable bet does NOT disable the press: ButtonBetProvider answers it
	// with the insufficient-funds popup; the look stays dimmed (spin_disabled).
	const disabled = $derived(stateModal.modal !== null);
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };

	// Spin icon: rotate + shrink arrows, then scale up stop button
	const rotationTween = new Tween(0, { easing: cubicInOut, duration: 250 });
	const arrowScale = new Tween(1, { easing: cubicInOut, duration: 250 });
	let showStop = $state(false);
	// the press's arrows -> STOP morph; a reset cancels one still in flight
	let morph = 0;

	const resetIcon = () => {
		morph++;
		showStop = false;
		rotationTween.set(0, { duration: 0 });
		arrowScale.set(1, { duration: 0 });
	};

	// the spin is over
	$effect(() => {
		if (!stateUi.reelsSpinning) resetIcon();
	});
	// A press that opened a popup started no spin: the buy-confirm card of an
	// armed buy mode (Chaos Lab 2 keeps a bought mode armed and Spin re-opens its
	// confirm), insufficient funds. Nothing then toggles reelsSpinning, so STOP
	// stuck for good — and a bought round with no base reveal (Cash Respins)
	// never toggles it either (Evtim, 2026-11-03). A popup opened during a real
	// spin (the menu) leaves its STOP alone.
	$effect(() => {
		if (stateModal.modal && !stateUi.reelsSpinning) resetIcon();
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
					const pressMorph = ++morph;
					rotationTween.set(Math.PI);
					arrowScale.set(0).then(() => {
						// not if the spin already ended (turbo) or the press opened a popup
						if (pressMorph === morph) showStop = true;
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
