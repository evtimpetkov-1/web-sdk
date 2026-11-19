<script lang="ts">
	// The bet bar's strip in the game's ink hand (Evtim 2026-11-16: "change the UI bar
	// to be on theme with this game"): a dark walnut beam under a tan nailed rail, in
	// place of the SDK's flat translucent plate (stateUiTheme.barAlpha is 0 in this
	// game). Mounted BEFORE <UI> (and inside ReplayHud), so the captions, amounts and
	// buttons draw over it. Geometry = the SDK layouts' plate (LayoutDesktop /
	// Landscape / Portrait / Tablet), but the beam runs to the screen's edges on
	// canvases wider than the layout. Blast Shaft's pattern.
	// Portrait also gets a DECK behind its buttons (Evtim 2026-11-16: "some background
	// behind the UI same as the blast game ... so the UI is more visible"): a wall of
	// the strip's own planks from under the reel frame's base down to the strip, when
	// constants PORTRAIT_DECK is 'planks' (the see-through 'shade' is PortraitShade).
	// Only with `deck` (the replay HUD has no buttons).
	// Art: art-review/dynamite-gulch/rework/build_ink_ui.py.
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { PORTRAIT_DECK } from '../game/constants';
	import { getContext } from '../game/context';

	// always: the replay HUD's readouts stay up through the popups, and so does their strip
	type Props = { always?: boolean; deck?: boolean };
	const { always = false, deck = false }: Props = $props();

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const isDesktop = $derived(context.stateLayoutDerived.layoutType() === 'desktop');
	// The strip starts higher than the SDK's plate did (115 / 130 above the bottom), so
	// its tan rail clears the BALANCE / WIN / BET captions (Evtim 2026-11-16: "we need
	// some space on top of headers below the wooden horizontal line")
	const barAbove = $derived(isDesktop ? 126 : 150);
	const barHeight = $derived(barAbove + (isDesktop ? 0 : 10));
	const barTop = $derived(layout.height - barAbove);
	// the canvas's width in the layout's units: wider than the layout on a wide screen
	const width = $derived(
		Math.max(layout.width + 20, context.stateLayoutDerived.canvasSizes().width / layout.scale + 4),
	);
	// two mirrored beams (16.6:1) for the wide bars, one (8.3:1) for portrait
	const key = $derived(width / barHeight > 11 ? 'dgBarWide' : 'dgBar');

	// the deck: from the frame's base (stateGame PORTRAIT_UI_TOP 540 + its 12 gap) to the strip
	const DECK_TOP = 552;
	// (the see-through 'shade' alternative is PortraitShade, mounted under Boardwalk)
	const showDeck = $derived(
		deck && PORTRAIT_DECK === 'planks' && context.stateLayoutDerived.layoutType() === 'portrait',
	);

	let uiShown = $state(true);
	context.eventEmitter.subscribeOnMount({
		uiShow: () => (uiShown = true),
		uiHide: () => (uiShown = false),
	});
</script>

<MainContainer standard alignVertical="bottom">
	<FadeContainer show={always || uiShown} duration={220}>
		<!-- a persistent slot: a deck remounted by a layout change would otherwise be
		     appended after the strip and draw over it -->
		<Container>
			{#if showDeck}
				<Sprite
					key="dgDeck"
					x={layout.width * 0.5}
					y={layout.height - DECK_TOP}
					anchor={{ x: 0.5, y: 0 }}
					{width}
					height={DECK_TOP - barAbove + 2}
				/>
			{/if}
		</Container>
		<Sprite {key} x={layout.width * 0.5} y={barTop} anchor={{ x: 0.5, y: 0 }} {width} height={barHeight} />
	</FadeContainer>
</MainContainer>
