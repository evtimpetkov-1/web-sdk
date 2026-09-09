<script lang="ts" module>
	export type EmitterEventMascot = { type: 'mascotWin' };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import StackedAlphaVideo from './StackedAlphaVideo.svelte';

	// hybrid stacked mp4s: 1664x1104 = raw frame (all baked effects) | character
	// matte. The shader keys out the black background live, keeping the effects.
	// 01 = idle loop, 02 = win reaction (one-shot, fired by `mascotWin`).
	// Encode is decoder-friendly for Android (2026-09-03): 16-aligned size, Main
	// profile, no B-frames, keyframe every second — the MediaTek hardware decoder
	// underflowed on the 1668x1112 High/B-frame stream (old/ keeps it).
	const SRCS = [
		new URL('../../assets/mascot/hybrid_01.mp4', import.meta.url).href,
		new URL('../../assets/mascot/hybrid_02.mp4', import.meta.url).href,
	];
	const WIN_CLIP = 1;
	const HALF_W = 832;
	const HALF_H = 1104;

	const context = getContext();

	let video: StackedAlphaVideo | undefined = $state();

	context.eventEmitter.subscribeOnMount({
		mascotWin: () => video?.playOnce(WIN_CLIP),
	});

	const board = $derived(context.stateGameDerived.boardLayout());
	const main = $derived(context.stateLayoutDerived.mainLayout());
	// 'tablet' (near-square window) and 'portrait' are stacked layouts with little
	// side room — keep the mascot mounted on every layout, just smaller and
	// clamped to the canvas edge.
	const stacked = $derived(
		['tablet', 'portrait'].includes(context.stateLayoutDerived.layoutType()),
	);
	const targetHeight = $derived(board.height * (stacked ? 0.95 : 1.3));
	const width = $derived(targetHeight * (HALF_W / HALF_H));
	// right side of the reels, flask just clear of the frame's right pipe and boots
	// just below its bottom pipe (Evtim, 2026-09-02); clamped to the main-layout
	// right edge
	const position = $derived({
		x: Math.min(
			board.x + board.width * 0.5 + width * 0.38,
			main.width - width * 0.08,
		),
		y: board.y + board.height * 0.5 + targetHeight * 0.08,
	});
</script>

<MainContainer>
	<StackedAlphaVideo
		bind:this={video}
		srcs={SRCS}
		mode="hybrid"
		halfWidth={HALF_W}
		halfHeight={HALF_H}
		x={position.x}
		y={position.y}
		{targetHeight}
	/>
</MainContainer>
