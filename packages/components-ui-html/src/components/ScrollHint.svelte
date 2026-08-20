<script lang="ts">
	import { fade } from 'svelte/transition';

	/**
	 * "More content below" affordance for modal scroll areas — two cues working
	 * together (design signed off on the bet menu, 2026-08-20):
	 * - a scrim: the list's last rows sink into shadow;
	 * - three wide chevrons that DON'T move — a light wave flows down through
	 *   them (staggered opacity pulse), direction without toy-like bouncing.
	 *
	 * Render it inside a `position: relative` wrapper around the confirm/footer
	 * block; it overlays the gap above it with zero layout shift. Pass the
	 * scrollable element (BaseScrollable's `onelement`); visibility follows the
	 * element's real overflow via scroll events + a ResizeObserver.
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
		top: -68px;
		height: 68px; /* runs to y=0 — flush against the footer, so there is no
		   see-through strip between the gradient's end and the button */
		background: linear-gradient(
			to bottom,
			rgba(6, 12, 20, 0) 0%,
			rgba(6, 12, 20, 0.9) 76%,
			rgba(6, 12, 20, 0.9) 100%
		);
		pointer-events: none;
		z-index: 1;
	}

	.scroll-hint {
		position: absolute;
		top: -54px;
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
			stroke: var(--modal-accent-selected, #f0d060);
			stroke-width: 3.2;
			stroke-linecap: round;
			stroke-linejoin: round;
			filter: drop-shadow(0 0 5px rgba(240, 208, 96, 0.35));
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
