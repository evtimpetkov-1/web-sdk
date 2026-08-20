<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';

	/**
	 * Subtle camera push-in while a reel anticipation runs: the whole stage
	 * zooms toward the canvas centre, pulling focus onto the reels, and eases
	 * back out the moment the anticipation ends — including a stop-button skip,
	 * since that clears every reel's `anticipating` flag and this keys off the
	 * same flags as the anticipation columns and the kraken's tense pose.
	 *
	 * Renders nothing; it drives the pixi stage transform directly. When the
	 * zoom is exactly 1 the stage transform is restored to pristine identity so
	 * nothing else ever composes against a leftover pivot.
	 */
	const context = getContext();

	const ZOOM = 1.035;
	const zoom = new Tween(1, { easing: cubicOut });

	const anticipating = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	$effect(() => {
		// slow creep in (the anticipation holds for seconds), quick release
		zoom.set(anticipating ? ZOOM : 1, { duration: anticipating ? 900 : 250 });
	});

	$effect(() => {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const scale = zoom.current;
		if (scale === 1) {
			app.stage.pivot.set(0, 0);
			app.stage.position.set(0, 0);
			app.stage.scale.set(1);
		} else {
			app.stage.pivot.set(width / 2, height / 2);
			app.stage.position.set(width / 2, height / 2);
			app.stage.scale.set(scale);
		}
	});
</script>
