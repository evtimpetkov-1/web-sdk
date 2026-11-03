<script lang="ts" module>
	export type EmitterEventMascot = { type: 'mascotWin' };
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { MASCOT_CLIP } from '../game/constants';
	import StackedAlphaVideo from './StackedAlphaVideo.svelte';

	// Chaos Lab 2's mascot (2026-11-03): Wan 3.0 clips of her, every one starting
	// and ending on the hero still. Stacked alpha mp4s, 1664x1104 = premultiplied
	// colour | alpha matte, 30 fps, built by
	// art-review/chaoslab2/mascot/video/v9_ingame/stack_cl2.py on the still's
	// framing (MASCOT_CLIP), so every layout tuned for the still holds.
	// idle_1-3 rotate at random (never the same one twice running); a win plays
	// win_1 or win_2 (never the same one twice running), from the next idle end.
	const SRCS = [
		new URL('../../assets/chaoslab2/mascot/idle_1.mp4', import.meta.url).href,
		new URL('../../assets/chaoslab2/mascot/idle_2.mp4', import.meta.url).href,
		new URL('../../assets/chaoslab2/mascot/idle_3.mp4', import.meta.url).href,
		new URL('../../assets/chaoslab2/mascot/win_1.mp4', import.meta.url).href,
		new URL('../../assets/chaoslab2/mascot/win_2.mp4', import.meta.url).href,
	];
	const IDLE_COUNT = 3;
	const WINS = [3, 4];
	const ASPECT = MASCOT_CLIP.width / MASCOT_CLIP.height;

	const context = getContext();

	let video: StackedAlphaVideo | undefined = $state();
	// the still (mascot.webp, the same framing) shows until the first video
	// frame is on screen, and stays if the video never plays
	let videoShown = $state(false);

	let lastWin = -1;
	context.eventEmitter.subscribeOnMount({
		mascotWin: () => {
			const pool = WINS.filter((clip) => clip !== lastWin);
			const clip = pool[Math.floor(Math.random() * pool.length)];
			lastWin = clip;
			video?.playOnce(clip);
		},
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
		const width = targetHeight * ASPECT;
		// right side of the reels, the orb just clear of the frame's right pipe and
		// boots just below its bottom pipe (the Chemist's spot, Evtim 2026-09-02);
		// clamped to the main-layout right edge
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
	<Sprite
		key="cl2Mascot"
		visible={!videoShown}
		anchor={{ x: 0.5, y: 1 }}
		x={layout.x}
		y={layout.y}
		width={layout.targetHeight * ASPECT}
		height={layout.targetHeight}
	/>
	<StackedAlphaVideo
		bind:this={video}
		srcs={SRCS}
		idleCount={IDLE_COUNT}
		onFirstFrame={() => (videoShown = true)}
		mode="stacked"
		halfWidth={MASCOT_CLIP.width}
		halfHeight={MASCOT_CLIP.height}
		x={layout.x}
		y={layout.y}
		targetHeight={layout.targetHeight}
	/>
</MainContainer>
