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
	// Portrait: centered above the frame, over the kraken.
	const FRAME_HALF_W = 372; // boardLayout.width * 1.137 / 2
	const logoWidth = $derived(isPortrait ? 360 : 280);
	const logoX = $derived(bl.x + (isPortrait ? 0 : -FRAME_HALF_W - 130));
	const logoY = $derived(bl.y + (isPortrait ? -470 : -220));
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
