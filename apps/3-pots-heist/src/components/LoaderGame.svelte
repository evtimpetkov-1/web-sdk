<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { stateModal } from 'state-shared';

	import { stateApp } from '../game/stateApp';

	/**
	 * The game's boot screen: the first thing drawn, before Pixi exists.
	 *
	 * Plain HTML/CSS on purpose (same pattern as Kraken's LoaderGame): it has to
	 * paint while the Pixi app and every game asset are still loading, so it may
	 * only use what it pulls itself: the in-game background (the same URL the Pixi
	 * loader fetches, so the browser downloads it once) and a plain bar drawn in CSS.
	 * A PLACEHOLDER look (2026-11-24): the game has no logo or loader art yet.
	 *
	 * The bar tracks the REAL load. `stateApp.loadingProgress` is stepped by
	 * AssetsLoader as each asset resolves and `stateApp.loaded` flips when the
	 * last one lands; the screen holds until then and hands over to the Pixi
	 * loading screen (press to continue).
	 *
	 * `stateApp` is imported directly rather than through the game context: this
	 * component is mounted by +layout.svelte as a sibling of <Game>, so the Pixi
	 * context does not reach it, but the state module is a singleton.
	 */
	const bgImg = new URL('../../assets/heist/bg/base.webp', import.meta.url).href;

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

	// A failed authentication (bad rgs_url, expired session) never mounts the
	// game, so `loaded` never comes: get out of the way of its error at once.
	$effect(() => {
		if (stateModal.modal?.name === 'error') visible = false;
	});

	// Failsafe: `loaded` is set even when individual assets fail, so this should
	// never fire — but a loader that can hang forever is worse than one that
	// gives up, and everything behind it is already mounted.
	onMount(() => {
		const timer = setTimeout(() => (visible = false), 30000);
		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div class="loader-wrap" style="--bg: url({bgImg});" transition:fade={{ duration: 400 }}>
		<div
			class="bar"
			role="progressbar"
			aria-label="Loading"
			aria-valuenow={Math.round(progress)}
			aria-valuemin="0"
			aria-valuemax="100"
		>
			<div class="fill" style="width: {progress}%;"></div>
		</div>
	</div>
{/if}

<style lang="scss">
	.loader-wrap {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		background:
			linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)),
			var(--bg) center / cover no-repeat,
			#000;
	}

	.bar {
		width: min(60vw, 26rem);
		height: 0.5rem;
		margin-bottom: 12vh;
		border-radius: 0.25rem;
		background: rgba(255, 255, 255, 0.16);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: inherit;
		background: #f2b53a;
		/* smooths the step each asset makes as it lands */
		transition: width 320ms cubic-bezier(0.33, 1, 0.68, 1);
	}
</style>
