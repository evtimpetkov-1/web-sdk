<script lang="ts">
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { FRAME_ART, SYMBOL_SIZE } from '../game/constants';
	import Roamers, { type RoamScene } from './Roamers.svelte';

	/**
	 * The wanderers ON A PHONE (Evtim, 2026-11-18: "on portrait we are not seeing
	 * anything behind the reels, so the effects should be in front of the reels below
	 * it"). Upright, the reels span the screen: the street and the boardwalk of the
	 * painting are behind them. So the small tumbleweeds, the dust devils and the hen
	 * roam the ground UNDER the reels there, drawn in front like the crossing
	 * (Boardwalk): from just below the reel frame's foot, where they are small, down
	 * towards the buttons, where they are larger, in over one edge of the screen and
	 * out over the other, each on its own bent way.
	 *
	 * Main-layout units, like Boardwalk, so the band keeps its place at the frame on
	 * every phone; the bar's buttons are drawn over it. Not mounted on other layouts:
	 * there the wanderers are behind the reels, in the painting (Ambient).
	 */
	const context = getContext();

	// frame.webp: the row its bottom beam ends on (Boardwalk's FRAME_BASE)
	const FRAME_BASE = 850 / FRAME_ART.height;

	const phone = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const night = $derived(context.stateGame.gameType === 'freegame');
	const ground = $derived.by(() => {
		const main = context.stateLayoutDerived.mainLayout();
		const canvas = context.stateLayoutDerived.canvasSizes();
		const board = context.stateGameDerived.boardLayout();
		const frame = context.stateGameDerived.frameLayout();
		const cell = SYMBOL_SIZE * board.scale;
		// the screen in main units (the main layout is centred on it)
		const width = canvas.width / main.scale;
		const left = (main.width - width) / 2;
		const bottom = (main.height + canvas.height / main.scale) / 2;
		const foot = frame.y + frame.height * (FRAME_BASE - 0.5);
		// from a little under the frame to above the bar's strip; never thinner than
		// half a cell (a short phone)
		const far = foot + cell * 0.3;
		const near = Math.max(far + cell * 0.5, bottom - cell * 1.05);
		const scene: RoamScene = {
			zones: [{ y: [far, near], x: [left, left + width], open: true, weight: 1 }],
			depth: [far, near],
			weed: [cell * 0.34, cell * 0.68],
			devil: [cell * 0.6, cell * 1.2],
			hen: [cell * 0.36, cell * 0.72],
		};
		return { scene, left, right: left + width };
	});
</script>

{#if phone}
	<MainContainer>
		<Roamers scene={ground.scene} left={ground.left} right={ground.right} {night} active={true} />
	</MainContainer>
{/if}
