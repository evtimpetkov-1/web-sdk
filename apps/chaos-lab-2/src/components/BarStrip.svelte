<script lang="ts">
	// The bet bar's strip in the game's own steel (Evtim 2026-11-16: "change the UI bar
	// and icons similar to what is done for the blast game"): a dark gunmetal plate under
	// a riveted rail, in place of the SDK's flat translucent plate (stateUiTheme.barAlpha
	// is 0 in this game). Mounted BEFORE <UI> (and inside ReplayHud), so the captions,
	// amounts and buttons draw over it. Geometry = the SDK layouts' plate (LayoutDesktop /
	// Landscape / Portrait / Tablet), but the plate runs to the screen's edges on canvases
	// wider than the layout.
	// Portrait also gets a DECK behind its buttons (`part="deck"`): a wall of the strip's
	// own steel from under the reel frame's sill down to the strip, so the buttons sit on
	// solid metal like on desktop instead of on the painted floor (Blast Shaft's pattern).
	// It is a mount of its own, UNDER the board layers, so the frame's slime drips hang
	// over its rail; the strip itself stays over the board, where the SDK's plate was.
	// Art: art-review/chaoslab2/ui_bar/build_ui_bar.py.
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';

	// always: the replay HUD's readouts stay up through the popups, and so does their strip
	type Props = { part?: 'strip' | 'deck'; always?: boolean };
	const props: Props = $props();

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const isDesktop = $derived(context.stateLayoutDerived.layoutType() === 'desktop');
	// The strip starts a little higher than the SDK's plate did (115 / 130 above the
	// bottom), so its rail clears the BALANCE / WIN / BET captions
	const barAbove = $derived(isDesktop ? 122 : 148);
	const barHeight = $derived(barAbove + (isDesktop ? 0 : 10));
	const barTop = $derived(layout.height - barAbove);
	// the canvas's width in the layout's units: wider than the layout on a wide screen
	const width = $derived(
		Math.max(layout.width + 20, context.stateLayoutDerived.canvasSizes().width / layout.scale + 4),
	);
	// two mirrored plates (16.6:1) for the wide bars, one (8.3:1) for portrait
	const key = $derived(width / barHeight > 11 ? 'cl2BarWide' : 'cl2Bar');

	// the deck: from the frame's sill (stateGame PORTRAIT_UI_TOP 540 + its 12 gap) to the strip
	const DECK_TOP = 552;
	const isDeck = $derived(props.part === 'deck');
	const showDeck = $derived(isDeck && context.stateLayoutDerived.layoutType() === 'portrait');

	let uiShown = $state(true);
	context.eventEmitter.subscribeOnMount({
		uiShow: () => (uiShown = true),
		uiHide: () => (uiShown = false),
	});
</script>

<MainContainer standard alignVertical="bottom">
	<FadeContainer show={!!props.always || uiShown} duration={220}>
		{#if showDeck}
			<Sprite
				key="cl2Deck"
				x={layout.width * 0.5}
				y={layout.height - DECK_TOP}
				anchor={{ x: 0.5, y: 0 }}
				{width}
				height={DECK_TOP - barAbove + 2}
			/>
		{/if}
		{#if !isDeck}
			<Sprite {key} x={layout.width * 0.5} y={barTop} anchor={{ x: 0.5, y: 0 }} {width} height={barHeight} />
		{/if}
	</FadeContainer>
</MainContainer>
