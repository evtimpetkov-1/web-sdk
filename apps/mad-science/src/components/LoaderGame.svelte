<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	import { stateApp } from '../game/stateApp';

	/**
	 * The game's boot screen — the first thing drawn, before Pixi exists.
	 *
	 * Plain HTML/CSS on purpose (same pattern as Kraken's LoaderGame): it has to
	 * paint while the Pixi app and every game asset are still loading, so it
	 * may only use images it pulls itself: the in-game background (same URL the
	 * Pixi loader fetches, so the browser downloads it once), the logo + tube
	 * art with the tube emptied, and the acid liquid that fills it.
	 *
	 * The tube tracks the REAL load. `stateApp.loadingProgress` is stepped by
	 * AssetsLoader as each asset resolves and `stateApp.loaded` flips when the
	 * last one lands; the screen holds until then and hands over to the Pixi
	 * loading screen (logo + press to continue).
	 *
	 * `stateApp` is imported directly rather than through the game context: this
	 * component is mounted by +layout.svelte as a sibling of <Game>, so the Pixi
	 * context does not reach it — but the state module is a singleton.
	 */
	const bgImg = new URL('../../assets/madscience/bg_v1.webp', import.meta.url).href;
	const baseImg = new URL('../../assets/madscience/loader/loader_base.webp', import.meta.url).href;
	const fillImg = new URL('../../assets/madscience/loader/loader_fill.webp', import.meta.url).href;

	// liquid interior of loader_base.webp, as % of the image (from
	// tools/loader/build-madscience-loader.py)
	const TUBE = { left: 20.036, top: 78.852, width: 59.868, height: 8.183 };

	let visible = $state(true);

	// Held just short of full until `loaded` actually flips, so the tube being
	// full always means finished — `loadingProgress` can read 100 while the last
	// assets are still being processed into textures.
	const HOLD_SHORT_OF = 96;
	const progress = $derived(
		stateApp.loaded ? 100 : Math.min(stateApp.loadingProgress, HOLD_SHORT_OF),
	);

	// Out as soon as the game is ready; the short delay lets the tube be SEEN
	// filling rather than vanishing the instant it completes.
	$effect(() => {
		if (!stateApp.loaded) return;
		const timer = setTimeout(() => (visible = false), 320);
		return () => clearTimeout(timer);
	});

	// Failsafe: `loaded` is set even when individual assets fail, so this should
	// never fire — but a loader that can hang forever is worse than one that
	// gives up, and everything behind it is already mounted.
	onMount(() => {
		const timer = setTimeout(() => (visible = false), 30000);
		return () => clearTimeout(timer);
	});

	// Acid bubbles drifting up the screen: fixed, hand-picked so they never
	// clump; one transform/opacity keyframe each, which stays on the compositor.
	const BUBBLES = [
		{ left: 6, size: 10, delay: 0, duration: 8 },
		{ left: 19, size: 6, delay: 2.4, duration: 9.5 },
		{ left: 37, size: 14, delay: 1.1, duration: 7 },
		{ left: 61, size: 8, delay: 3.6, duration: 9 },
		{ left: 80, size: 12, delay: 0.7, duration: 7.5 },
		{ left: 93, size: 7, delay: 4.3, duration: 10 },
	];
</script>

{#if visible}
	<div class="loader-wrap" style="--bg: url({bgImg});" transition:fade={{ duration: 400 }}>
		<div class="vignette"></div>

		{#each BUBBLES as bubble, i (i)}
			<span
				class="bubble"
				style="left: {bubble.left}%; width: {bubble.size}px; height: {bubble.size}px;
				       animation-delay: -{bubble.delay}s; animation-duration: {bubble.duration}s;"
			></span>
		{/each}

		<div class="lockup" style="--shine-opacity: {progress === 0 ? 0 : 1};">
			<img class="base" src={baseImg} alt="Mad Science" />

			<div
				class="tube"
				class:waiting={progress === 0}
				style="left: {TUBE.left}%; top: {TUBE.top}%; width: {TUBE.width}%; height: {TUBE.height}%;"
				role="progressbar"
				aria-label="Loading"
				aria-valuenow={Math.round(progress)}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div class="fill" style="width: {progress}%;">
					<img class="liquid" src={fillImg} alt="" />
					<span class="shine"></span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.loader-wrap {
		position: absolute;
		inset: 0;
		z-index: 999;
		overflow: hidden;
		/* the lab itself — the same art the game opens on */
		background-color: #050806;
		background-image: var(--bg);
		background-size: cover;
		background-position: center;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Darkens the background so the lockup carries the screen. */
	.vignette {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at center, rgba(3, 8, 4, 0.35) 0%, rgba(3, 8, 4, 0.88) 100%),
			linear-gradient(rgba(3, 8, 4, 0.2), rgba(3, 8, 4, 0.5));
	}

	.bubble {
		position: absolute;
		bottom: -40px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 32% 28%,
			rgba(236, 255, 160, 0.7),
			rgba(150, 230, 30, 0.22) 60%,
			rgba(150, 230, 30, 0.06) 100%
		);
		border: 1px solid rgba(190, 255, 60, 0.28);
		animation-name: rise;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		pointer-events: none;
	}

	/* The art is 1672x941. Width-bound in landscape, but capped by height so
	   short viewports never crop the tube; portrait just runs wider. */
	.lockup {
		position: relative;
		width: min(640px, 84vw, 86vh * 1672 / 941);
		aspect-ratio: 1672 / 941;
		filter: drop-shadow(0 14px 30px rgba(0, 0, 0, 0.7));
		animation: breathe 4.5s ease-in-out infinite;
	}

	@media (orientation: portrait) {
		.lockup {
			width: min(640px, 94vw);
		}
	}

	.base {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* The emptied glass. Overflow hidden + the art's own rounded ends on the
	   liquid keep the fill inside the tube at any width. */
	.tube {
		position: absolute;
		overflow: hidden;
		border-radius: 999px;
	}

	.fill {
		position: relative;
		height: 100%;
		overflow: hidden;
		/* smooths the step each asset makes as it lands */
		transition: width 320ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	/* The liquid is sized to the FULL tube (its aspect ratio matches the tube
	   rect, so 100% height = tube width) and clipped by .fill, so the art never
	   stretches — it is revealed left to right, dividers and all. */
	.liquid {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: auto;
		aspect-ratio: 1001 / 77;
		display: block;
	}

	/* Travelling highlight along the filled part — "still working" during the
	   pauses between large assets, without animating the width itself. */
	.shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent 20%,
			rgba(255, 255, 255, 0.45) 50%,
			transparent 80%
		);
		transform: translateX(-100%);
		animation: sweep 1.6s ease-in-out infinite;
		opacity: var(--shine-opacity, 1);
	}

	/* Before the first asset lands there is nothing to fill (assets only start
	   once Authenticate and LoadI18n resolve), so the empty glass gets its own
	   travelling glow until progress moves off zero. */
	.tube.waiting::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent 15%,
			rgba(170, 240, 40, 0.35) 50%,
			transparent 85%
		);
		transform: translateX(-100%);
		animation: sweep 1.9s ease-in-out infinite;
	}

	@keyframes breathe {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-6px) scale(1.012);
		}
	}

	@keyframes sweep {
		0% {
			transform: translateX(-100%);
		}
		60%,
		100% {
			transform: translateX(200%);
		}
	}

	@keyframes rise {
		0% {
			transform: translateY(0) translateX(0);
			opacity: 0;
		}
		12% {
			opacity: 0.8;
		}
		85% {
			opacity: 0.55;
		}
		100% {
			transform: translateY(-108vh) translateX(18px);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.lockup,
		.bubble,
		.shine,
		.tube.waiting::after {
			animation: none;
		}
		.bubble {
			opacity: 0;
		}
	}
</style>
