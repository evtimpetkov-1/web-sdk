<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let visible = $state(true);

	onMount(() => {
		const timer = setTimeout(() => {
			visible = false;
		}, 2500);
		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div class="loader-wrap" transition:fade={{ duration: 400 }}>
		<div class="loader-content">
			<img
				class="logo-text"
				src={new URL('../../static/assets/sprites/logo_text.png', import.meta.url).href}
				alt="Kraken's Wilds"
			/>
			<div class="spinner">
				<div class="dot"></div>
				<div class="dot"></div>
				<div class="dot"></div>
			</div>
		</div>
	</div>
{/if}

<style>
	.loader-wrap {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 999;
		background-color: #030a12;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.loader-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	.logo-text {
		width: min(400px, 60vw);
		height: auto;
		animation: pulse 2s ease-in-out infinite;
	}

	.spinner {
		display: flex;
		gap: 8px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #00e5ff;
		animation: bounce 1.2s ease-in-out infinite;
	}

	.dot:nth-child(2) {
		animation-delay: 0.15s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.3s;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.7;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.03);
		}
	}

	@keyframes bounce {
		0%,
		80%,
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
</style>
