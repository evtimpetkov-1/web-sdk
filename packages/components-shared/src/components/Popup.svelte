<script lang="ts">
	import { blur } from 'svelte/transition';
	import { onMount, type Snippet } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';

	import OnHotkey from './OnHotkey.svelte';

	type Props = {
		children: Snippet;
		zIndex: number;
		persistent?: boolean;
		onclose: () => void;
	};

	const props: Props = $props();

	const zIndexInternal = {
		topLayer: 2,
		clickToCloseLayer: 2,
		closeButton: 101,
		contentLayer: 100,
	};

	const closeModal = () => (props.persistent ? undefined : props.onclose());

	let disabled = $state(true);

	onMount(async () => {
		await waitForTimeout(300);

		disabled = false;
	});
</script>

<div>
	{@render props.children()}
</div>

<OnHotkey hotkey="Escape" onpress={closeModal} />

<div class="pop-up-wrap" class:disabled style={`z-index: ${props.zIndex};`}>
	<div class="blur-layer"></div>
	<div
		class="top-layer"
		style="--zIndex: {zIndexInternal.topLayer}"
		in:blur={{ duration: 300, opacity: 0 }}
	>
		<div
			tabindex={0}
			class="click-to-close-layer"
			onclick={closeModal}
			onkeypress={closeModal}
			role="button"
			style="--zIndex: {zIndexInternal.clickToCloseLayer}"
		></div>

		{#if !props.persistent}
			<div class="close-button-wrap" style="--zIndex: {zIndexInternal.closeButton}">
				<button class="close-button" data-test="close-button" onclick={closeModal}>×</button>
			</div>
		{/if}
		{@render props.children()}
	</div>
</div>

<style lang="scss">
	.pop-up-wrap {
		font-family: 'Inter', sans-serif;
		touch-action: manipulation;
		color: white;
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		right: 0;

		display: flex !important;
		justify-content: center;
		align-items: center;

		&.disabled {
			pointer-events: none;
		}
	}

	.blur-layer {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		right: 0;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(30px);
		-webkit-backdrop-filter: blur(30px);
	}

	.top-layer {
		width: 100%;
		height: 100%;
		z-index: var(--zIndex);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.click-to-close-layer {
		z-index: var(--zIndex);

		position: absolute;
		width: 100%;
		height: 100%;
	}

	.close-button-wrap {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: var(--zIndex);
	}

	.close-button {
		cursor: pointer;
		color: var(--modal-text, white);
		font-size: 1.8rem;
		font-weight: 400;
		background: var(--modal-btn-bg, rgba(255, 255, 255, 0.1));
		border: 1px solid var(--modal-border, rgba(255, 255, 255, 0.15));
		border-radius: 50%;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		transition: background 0.15s ease;

		&:hover {
			background: var(--modal-btn-bg-hover, rgba(255, 255, 255, 0.2));
		}
	}
</style>
