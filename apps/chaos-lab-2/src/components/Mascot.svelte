<script lang="ts" module>
	export type EmitterEventMascot = { type: 'mascotWin' };
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { MASCOT_CLIP } from '../game/constants';
	import StackedAlphaVideo from './StackedAlphaVideo.svelte';

	// The mascot is Chaos Lab's Chemist (Evtim, 2026-11-26: "move the mascot from
	// chaos lab 1 here"; MASCOT_KIND in constants.ts). His clips as Chaos Lab plays
	// them: hybrid stacked mp4s, 1664x1104 = raw frame (all baked effects) |
	// character matte, 30 fps; the shader keys out the black background live,
	// keeping the effects. 01 = idle loop, 02 = win reaction (one-shot, fired by
	// `mascotWin`, cutting in at once: his laugh starts with it).
	// The encode is decoder-friendly for Android (2026-09-03): 16-aligned size, Main
	// profile, no B-frames, a keyframe every second.
	// The woman's version of this file (her three stacked-alpha clips, a random win,
	// a placement rect) is art-review/alt/mascot_woman_2026-11-26/Mascot.svelte.
	const SRCS = [
		new URL('../../assets/mascot/hybrid_01.mp4', import.meta.url).href,
		new URL('../../assets/mascot/hybrid_02.mp4', import.meta.url).href,
	];
	const WIN_CLIP = 1;
	const ASPECT = MASCOT_CLIP.width / MASCOT_CLIP.height;

	const context = getContext();

	let video: StackedAlphaVideo | undefined = $state();
	// the still (the idle's first frame, the same framing) shows until the first
	// video frame is on screen, and stays if the video never plays
	let videoShown = $state(false);

	// a win (bookEventHandlerMap: once per spin, the first cascade win reaching the
	// total bet, and at the end of Cash Respins as the coins are collected) plays
	// his reaction; one already on is not restarted
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
		const width = targetHeight * ASPECT;
		if (context.stateGameDerived.sideLayout()) {
			// desktop / phone landscape (2026-11-20, the board grows there): his flask at
			// the frame's right edge, inside the canvas (or the bar's button column), his
			// boots at the bottom pipe's level
			const stage = context.stateGameDerived.wideStage();
			return {
				targetHeight,
				// the idle's reach either side of the clip's centre (MASCOT_CLIP left / right)
				x: Math.min(stage.frameRight + width * MASCOT_CLIP.left, stage.mascotRight - width * MASCOT_CLIP.right),
				y: stage.pipeBottom + 9,
			};
		}
		// tablet (and the themed UI's desktop / landscape): right side of the reels, the
		// flask just clear of the frame's right pipe and boots just below its bottom
		// pipe (Evtim 2026-09-02);
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
	<!-- he stands ON the floor: a contact shadow under his boots (row 1067 of the
	     1104-row frame). Not in portrait, where the board hides his legs -->
	{#if !portrait}
		<Sprite
			key="cl2Shadow"
			anchor={0.5}
			x={layout.x + layout.targetHeight * ASPECT * MASCOT_CLIP.shadow.x}
			y={layout.y - layout.targetHeight * ((MASCOT_CLIP.height - 1067) / MASCOT_CLIP.height) + layout.targetHeight * 0.004}
			width={layout.targetHeight * ASPECT * MASCOT_CLIP.shadow.width}
			height={layout.targetHeight * 0.075}
			alpha={0.62}
		/>
	{/if}
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
		mode="hybrid"
		cutIn
		halfWidth={MASCOT_CLIP.width}
		halfHeight={MASCOT_CLIP.height}
		x={layout.x}
		y={layout.y}
		targetHeight={layout.targetHeight}
	/>
</MainContainer>
