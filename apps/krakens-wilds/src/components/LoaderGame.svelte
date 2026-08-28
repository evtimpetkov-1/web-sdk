<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	import { stateApp } from '../game/stateApp';

	/**
	 * The game's boot screen — the first thing drawn, before Pixi exists.
	 *
	 * Plain HTML/CSS on purpose: it has to paint while the Pixi app and every
	 * game asset are still loading, so it may only use images it pulls itself.
	 * Those three (background, logo, and nothing else) are the whole budget.
	 *
	 * It tracks the REAL load. `stateApp.loadingProgress` is stepped by
	 * AssetsLoader as each asset resolves and `stateApp.loaded` flips when the
	 * last one lands; the screen holds until then and hands straight over to the
	 * Pixi loading screen's feature cards. It used to run a hardcoded 2500ms
	 * timer instead, which meant the bar was theatre and the handover happened
	 * at a moment unrelated to whether the game was ready.
	 *
	 * `stateApp` is imported directly rather than through the game context: this
	 * component is mounted by +layout.svelte as a sibling of <Game>, so the Pixi
	 * context does not reach it — but the state module is a singleton, so reading
	 * it here and inside the app is the same object.
	 */
	const bgDesktop = new URL('../../assets/sprites/base_game_bg_desktop.jpg', import.meta.url).href;
	const bgPortrait = new URL('../../assets/sprites/base_game_bg_portrait.jpg', import.meta.url)
		.href;
	const logoImg = new URL('../../assets/sprites/logo_kraken.webp', import.meta.url).href;

	let visible = $state(true);

	/**
	 * Held just short of full until `loaded` actually flips, so the bar reaching
	 * the end always means finished — `loadingProgress` can read 100 while the
	 * last assets are still being processed into textures.
	 *
	 * No max-tracking needed: AssetsLoader only ever increments its counter and
	 * `loaded` only goes false -> true, so this is already monotonic.
	 */
	const HOLD_SHORT_OF = 96;
	const progress = $derived(
		stateApp.loaded ? 100 : Math.min(stateApp.loadingProgress, HOLD_SHORT_OF),
	);

	// Out as soon as the game is ready. The short delay lets the bar be SEEN
	// completing rather than vanishing the instant it fills.
	$effect(() => {
		if (!stateApp.loaded) return;
		const timer = setTimeout(() => (visible = false), 260);
		return () => clearTimeout(timer);
	});

	/**
	 * Failsafe. `stateApp.loaded` is set even when individual assets fail (the
	 * loader catches per-asset), so this should never fire — but a loader that
	 * can hang forever is worse than one that gives up, and everything behind it
	 * is already mounted and running.
	 */
	onMount(() => {
		const timer = setTimeout(() => (visible = false), 30000);
		return () => clearTimeout(timer);
	});

	// Bubbles: fixed, hand-picked so they never clump, and cheap — six elements
	// on one transform/opacity keyframe each, which stays on the compositor.
	const BUBBLES = [
		{ left: 8, size: 10, delay: 0, duration: 7.5 },
		{ left: 22, size: 6, delay: 2.4, duration: 9 },
		{ left: 39, size: 14, delay: 1.1, duration: 6.5 },
		{ left: 63, size: 8, delay: 3.6, duration: 8.5 },
		{ left: 79, size: 12, delay: 0.7, duration: 7 },
		{ left: 92, size: 7, delay: 4.3, duration: 9.5 },
	];
</script>

{#if visible}
	<div
		class="loader-wrap"
		style="--bg-desktop: url({bgDesktop}); --bg-portrait: url({bgPortrait});"
		transition:fade={{ duration: 400 }}
	>
		<div class="vignette"></div>

		{#each BUBBLES as bubble, i (i)}
			<span
				class="bubble"
				style="left: {bubble.left}%; width: {bubble.size}px; height: {bubble.size}px;
				       animation-delay: -{bubble.delay}s; animation-duration: {bubble.duration}s;"
			></span>
		{/each}

		<div class="loader-content">
			<img class="logo" src={logoImg} alt="Kraken's Wilds" />

			<div
				class="bar"
				class:waiting={progress === 0}
				role="progressbar"
				aria-label="Loading"
				aria-valuenow={Math.round(progress)}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div class="bar-fill" style="width: {progress}%;">
					<span class="bar-shine"></span>
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
		/* the sea itself — the same art the game opens on, so the boot screen
		   reads as the game rather than a splash in front of it */
		background-color: #030a12;
		background-image: var(--bg-desktop);
		background-size: cover;
		background-position: center;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* portrait phones get the tall crop, same as the in-game background */
	@media (orientation: portrait) {
		.loader-wrap {
			background-image: var(--bg-portrait);
		}
	}

	/* Darkens the photograph so the gold logo and the bar carry the screen.
	   Heavier at the edges than the centre, which also hides the seam where a
	   very wide viewport runs past the artwork. */
	.vignette {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at center, rgba(3, 10, 18, 0.35) 0%, rgba(3, 10, 18, 0.86) 100%),
			linear-gradient(rgba(3, 10, 18, 0.25), rgba(3, 10, 18, 0.55));
	}

	.bubble {
		position: absolute;
		bottom: -40px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 32% 28%,
			rgba(255, 255, 255, 0.5),
			rgba(120, 220, 255, 0.16) 60%,
			rgba(120, 220, 255, 0.05) 100%
		);
		border: 1px solid rgba(180, 240, 255, 0.22);
		animation-name: rise;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		pointer-events: none;
	}

	.loader-content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(20px, 4vh, 40px);
		padding: 0 24px;
		width: min(560px, 82vw);
	}

	/* Portrait: the wide lockup at 82vw floated small over a full-width bar and
	   read as squashed. Bigger logo, and the bar narrower than the logo so the
	   proportions read like a composition rather than two stretched strips. */
	@media (orientation: portrait) {
		.loader-content {
			width: min(560px, 92vw);
			gap: clamp(26px, 5vh, 52px);
		}
		.bar {
			width: 78%;
		}
	}

	/* The full lockup — kraken and stone plaque, not the text-only variant the
	   boot screen used to show. Breathes rather than pulses: the old 3% scale
	   throb on a 1000px logo read as a wobble. */
	.logo {
		width: 100%;
		height: auto;
		/* belt-and-braces: no inherited rule may ever stretch the lockup */
		aspect-ratio: 1536 / 1024;
		object-fit: contain;
		filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.65));
		animation: breathe 4.5s ease-in-out infinite;
	}

	/* Stone channel with a gold fill, to match the game's frame and headings. */
	.bar {
		position: relative;
		width: 100%;
		height: 14px;
		border-radius: 7px;
		background: rgba(2, 12, 20, 0.72);
		border: 1px solid rgba(200, 162, 74, 0.45);
		box-shadow:
			inset 0 2px 5px rgba(0, 0, 0, 0.75),
			0 0 14px rgba(0, 0, 0, 0.45);
		overflow: hidden;
	}

	.bar-fill {
		position: relative;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(180deg, #ffe08a 0%, #e0a93c 45%, #b8801f 100%);
		box-shadow: 0 0 12px rgba(255, 200, 90, 0.55);
		/* smooths the step each asset makes as it lands */
		transition: width 320ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	/*
	 * Before the first asset lands there is nothing to fill — assets only start
	 * loading once <Authenticate> and <LoadI18n> resolve, so on a slow connection
	 * the bar can honestly sit at 0 for a second or two. The shine below rides on
	 * the FILLED part, which is zero-width there, so the channel gets its own
	 * travelling glow for that stretch. It hands over to the real fill the moment
	 * progress moves off zero.
	 */
	.bar.waiting::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent 15%,
			rgba(255, 210, 120, 0.4) 50%,
			transparent 85%
		);
		transform: translateX(-100%);
		animation: sweep 1.9s ease-in-out infinite;
	}

	/* A highlight travelling along the filled part — says "still working" during
	   the pauses between large assets, without animating the width itself. */
	.bar-shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent 20%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 80%
		);
		transform: translateX(-100%);
		animation: sweep 1.6s ease-in-out infinite;
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
			opacity: 0.75;
		}
		85% {
			opacity: 0.55;
		}
		100% {
			transform: translateY(-108vh) translateX(18px);
			opacity: 0;
		}
	}

	/* Respect the OS setting: the screen still works, it just stops moving. */
	@media (prefers-reduced-motion: reduce) {
		.logo,
		.bubble,
		.bar-shine,
		.bar.waiting::after {
			animation: none;
		}
		.bubble {
			opacity: 0;
		}
	}
</style>
