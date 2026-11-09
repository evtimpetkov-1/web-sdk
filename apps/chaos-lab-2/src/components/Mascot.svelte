<script lang="ts" module>
	export type EmitterEventMascot = { type: 'mascotWin' };
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { MASCOT_CLIP } from '../game/constants';
	import StackedAlphaVideo from './StackedAlphaVideo.svelte';

	// Chaos Lab 2's mascot (Evtim, 2026-11-04): his MiniMax H3 takes, an idle that
	// loops and two wins (the orb's bursts), all starting and ending on the hero
	// still's pose (v11; the earlier Wan clips were removed). Native resolution,
	// one crop for all: stacked alpha 2624x1856 = premultiplied colour | alpha
	// matte with the light baked in (hybrid), 24 fps; built by
	// art-review/chaoslab2/mascot/video/v11_evtim/build_clips.py. PLACEMENT (the
	// builder's RECT, fitted to mascot.webp) puts the crop on the still's framing
	// (MASCOT_CLIP), so every layout tuned for the still holds. Mipmapped like the
	// still: it draws at a third to a half of its pixel size beside the reels.
	const SRCS = [
		new URL('../../assets/chaoslab2/mascot/idle.mp4', import.meta.url).href,
		new URL('../../assets/chaoslab2/mascot/win.mp4', import.meta.url).href,
		new URL('../../assets/chaoslab2/mascot/win2.mp4', import.meta.url).href,
	];
	const WINS = [1, 2];
	const HALF = { width: 1312, height: 1856 };
	const PLACEMENT = {
		frameWidth: MASCOT_CLIP.width,
		frameHeight: MASCOT_CLIP.height,
		x: 51.74,
		y: 76,
		width: 703.69,
		height: 995.47,
	};
	const ASPECT = MASCOT_CLIP.width / MASCOT_CLIP.height;

	const context = getContext();

	let video: StackedAlphaVideo | undefined = $state();
	// the still (mascot.webp, the same framing) shows until the first video
	// frame is on screen, and stays if the video never plays
	let videoShown = $state(false);

	// a win (bookEventHandlerMap: once per spin, the first cascade win reaching the
	// total bet, and at the end of Cash Respins as the coins are collected) plays a
	// win clip at random, never the same one twice running, from the end of the
	// current idle loop
	let lastWin = -1;
	context.eventEmitter.subscribeOnMount({
		mascotWin: () => {
			const pool = WINS.filter((clip) => clip !== lastWin);
			const clip = pool[Math.floor(Math.random() * pool.length)];
			// remembered only if it plays: one is ignored while another is queued or on
			if (video?.playOnce(clip)) lastWin = clip;
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
		onFirstFrame={() => (videoShown = true)}
		mode="stacked"
		halfWidth={HALF.width}
		halfHeight={HALF.height}
		placement={PLACEMENT}
		mipmap
		x={layout.x}
		y={layout.y}
		targetHeight={layout.targetHeight}
	/>
</MainContainer>
