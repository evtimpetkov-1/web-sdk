<script lang="ts">
	import { MainContainer } from 'components-layout';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const bl = $derived(context.stateGameDerived.boardLayout());
	const layout = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layout === 'portrait');

	// logo_text.webp is 800x282
	const LOGO_RATIO = 800 / 282;

	// Desktop/landscape: left of the frame (above the FS counters column).
	// Portrait/tablet: centered above the frame, over the kraken.
	//
	// Tablet cannot use the side placement: its main box is only 1000 wide and the
	// frame takes 670 of it, leaving 165 a side for a 280-wide logo — the old
	// shared non-portrait branch put the left edge at -142, off-screen. It also
	// cannot reuse portrait's -470, because portrait's box is 1422 tall against
	// tablet's 1000, so that lands the logo past the top edge.
	const isStacked = $derived(isPortrait || layout === 'tablet');
	const FRAME_HALF_W = 372; // boardLayout.width * 1.137 / 2
	// Offsets can push the logo past the top of the main box (y < 0) — nothing
	// masks MainContainer, so it stays visible as long as it is inside the canvas,
	// and tablet ratios leave canvas above the box. Tune these by eye per layout.
	const logoWidth = $derived(isPortrait ? 360 : layout === 'tablet' ? 280 : 280);
	// Desktop/landscape: centred over the combined side PANEL's column (the old
	// -166 tracked the FS counters' axis, which left the logo hanging out over
	// the ruins once the panel became the column's anchor) and raised so its
	// bottom clears the panel's top by a real gap instead of ~15 units.
	const logoX = $derived(bl.x + (isStacked ? 0 : -FRAME_HALF_W - 125));
	// portrait -510 -> -493: the board rose 17 units (boardLayout yOffset -95
	// -> -112) and the logo is board-anchored — this keeps it where it was on
	// screen while the reels close part of the gap beneath it
	const logoY = $derived(bl.y + (isPortrait ? -493 : layout === 'tablet' ? -475 : -280));
</script>

<MainContainer label="GameLogoContainer">
	<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
		<Sprite
			key="gameLogo"
			anchor={0.5}
			x={logoX}
			y={logoY}
			width={logoWidth}
			height={logoWidth / LOGO_RATIO}
		/>
	</Container>
</MainContainer>
