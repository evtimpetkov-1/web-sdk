<script lang="ts">
	import { fade } from 'svelte/transition';

	/**
	 * "More below" cue for a scrolling column — the bet menu's signed-off design
	 * (components-ui-html ScrollHint, which is package-internal and Kraken-tinted)
	 * in Mad Science colours: a scrim the last rows sink into, plus three static
	 * chevrons with a light wave flowing down through them, never bouncing.
	 *
	 * Sits at the bottom of its positioned parent with zero layout shift; shown
	 * only while `scrollElement` really overflows below (scroll + ResizeObserver).
	 */
	type Props = {
		scrollElement: Element | null;
	};

	const props: Props = $props();

	let canScrollDown = $state(false);
	const update = () => {
		const el = props.scrollElement;
		canScrollDown = !!el && el.scrollHeight - el.scrollTop - el.clientHeight > 8;
	};
	$effect(() => {
		const el = props.scrollElement;
		if (!el) {
			canScrollDown = false;
			return;
		}
		update();
		el.addEventListener('scroll', update, { passive: true });
		const resizeObserver = new ResizeObserver(update);
		resizeObserver.observe(el);
		return () => {
			el.removeEventListener('scroll', update);
			resizeObserver.disconnect();
		};
	});
</script>

{#if canScrollDown}
	<div class="scroll-scrim" transition:fade={{ duration: 180 }} aria-hidden="true"></div>
	<div class="scroll-hint" transition:fade={{ duration: 180 }} aria-hidden="true">
		<svg class="c0" viewBox="0 0 36 14"><path d="M4 3l14 8 14-8" /></svg>
		<svg class="c1" viewBox="0 0 36 14"><path d="M4 3l14 8 14-8" /></svg>
		<svg class="c2" viewBox="0 0 36 14"><path d="M4 3l14 8 14-8" /></svg>
	</div>
{/if}

<style lang="scss">
	.scroll-scrim {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: calc(84px + env(safe-area-inset-bottom));
		background: linear-gradient(to bottom, rgba(2, 4, 2, 0) 0%, rgba(2, 4, 2, 0.92) 78%, rgba(2, 4, 2, 0.92) 100%);
		pointer-events: none;
		z-index: 1;
	}

	.scroll-hint {
		position: absolute;
		bottom: calc(12px + env(safe-area-inset-bottom));
		left: 50%;
		margin-left: -19px;
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: none;
		z-index: 2;

		svg {
			display: block;
			width: 38px;
			height: 15px;
			margin-top: -3px;
			fill: none;
			stroke: #abea10;
			stroke-width: 3.2;
			stroke-linecap: round;
			stroke-linejoin: round;
			filter: drop-shadow(0 0 5px rgba(171, 234, 16, 0.4));
			opacity: 0.2;
			animation: scroll-hint-wave 1.6s ease-in-out infinite;

			&.c1 {
				animation-delay: 0.18s;
			}
			&.c2 {
				animation-delay: 0.36s;
			}
		}
	}

	@keyframes scroll-hint-wave {
		0% {
			opacity: 0.2;
		}
		22% {
			opacity: 1;
		}
		55%,
		100% {
			opacity: 0.2;
		}
	}
</style>
