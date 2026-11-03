<script lang="ts" module>
	export type EmitterEventMascot = { type: 'mascotWin' };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { MASCOT_CLIP } from '../game/constants';
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
	const HALF_W = MASCOT_CLIP.width;
	const HALF_H = MASCOT_CLIP.height;

	const context = getContext();

	let video: StackedAlphaVideo | undefined = $state();

	context.eventEmitter.subscribeOnMount({
		mascotWin: () => video?.playOnce(WIN_CLIP),
	});

	const board = $derived(context.stateGameDerived.boardLayout());
	const main = $derived(context.stateLayoutDerived.mainLayout());
	// portrait: behind the board, above its top pipe (stateGame portraitMascot)
	const portrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	// 'tablet' (near-square window) is a stacked layout with little side room —
	// the mascot stays beside the reels there, just smaller and clamped to the
	// canvas edge.
	const stacked = $derived(context.stateLayoutDerived.layoutType() === 'tablet');
	const layout = $derived.by(() => {
		if (portrait) return context.stateGameDerived.portraitMascot();
		const targetHeight = board.height * (stacked ? 0.95 : 1.3);
		const width = targetHeight * (HALF_W / HALF_H);
		// right side of the reels, flask just clear of the frame's right pipe and boots
		// just below its bottom pipe (Evtim, 2026-09-02); clamped to the main-layout
		// right edge
		return {
			targetHeight,
			x: Math.min(board.x + board.width * 0.5 + width * 0.38, main.width - width * 0.08),
			y: board.y + board.height * 0.5 + targetHeight * 0.08,
		};
	});
</script>

<!-- portrait: behind the board — zIndex -1 sorts this root-level container above
     the backgrounds (-2) and under every zIndex-0 layer (board, frame, UI); the
     mascot stays mounted, so a rotation never restarts the video decoder -->
<MainContainer zIndex={portrait ? -1 : 0}>
	<StackedAlphaVideo
		bind:this={video}
		srcs={SRCS}
		mode="hybrid"
		halfWidth={HALF_W}
		halfHeight={HALF_H}
		x={layout.x}
		y={layout.y}
		targetHeight={layout.targetHeight}
	/>
</MainContainer>
