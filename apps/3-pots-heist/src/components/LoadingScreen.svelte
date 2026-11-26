<script lang="ts">
	import { onMount } from 'svelte';

	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle } from 'components-layout';
	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { BACKGROUND_ART } from '../game/heistArt';
	import { stateReplay, setReplayStartHandler } from '../game/stateReplay.svelte';
	import { CURTAIN_Z } from './Transition.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		/** the press: this screen fades out while Game.svelte brings in the closed curtains */
		onstart: () => void;
	};

	/**
	 * The intro, shown once the HTML boot loader (LoaderGame) is gone. A PLACEHOLDER
	 * (2026-11-24): the game's background, dimmed, and the prompt. The game has no logo,
	 * no feature panels and no figures to quote yet; Blast Drop's intro, which this
	 * replaces, was all three.
	 * A press fades it out over the closed curtains (Game.svelte startGame), which then
	 * open on the game. Sits above the curtains' layer.
	 *
	 * Replay mode (Kraken's pattern): no prompt. The HTML replay card (ReplayOverlay)
	 * shows over it and its Start Replay button runs the same start as the press.
	 */
	const props: Props = $props();
	const context = getContext();
	const isReplay = stateUrlDerived.replay();

	let started = $state(false);
	// Pixi Text rasterises with whatever face is resolved at its first draw, so the
	// prompt waits for the self-hosted fonts as well as the assets
	let fontsReady = $state(false);
	onMount(() => {
		const faces = ['32px "Alfa Slab One"', '32px "Black Ops One"', '700 32px Inter', '400 32px Inter'];
		Promise.all(faces.map((face) => document.fonts?.load(face).catch(() => undefined))).finally(
			() => (fontsReady = true),
		);
	});
	const show = $derived(context.stateApp.loaded && fontsReady && !started);

	// the press in normal play, the card's Start Replay button in replay
	const start = () => {
		if (started) return;
		started = true;
		props.onstart();
	};

	$effect(() => {
		if (!isReplay) return;
		setReplayStartHandler(start);
		return () => setReplayStartHandler(null);
	});

	// gates the replay card: only once there is something to show and nothing
	// has started yet
	$effect(() => {
		stateReplay.introReady = isReplay && show;
	});

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const cover = $derived.by(() => {
		const scale = Math.max(canvas.width / BACKGROUND_ART.width, canvas.height / BACKGROUND_ART.height);
		return { width: BACKGROUND_ART.width * scale, height: BACKGROUND_ART.height * scale };
	});
</script>

<Container zIndex={CURTAIN_Z + 1}>
	<FadeContainer {show}>
		<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={1} />
		<Sprite key="phBg" anchor={0.5} x={canvas.width / 2} y={canvas.height / 2} {...cover} />
		<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.45} />

		{#if !isReplay}
			<PressToContinue onpress={start} />
		{/if}
	</FadeContainer>
</Container>
