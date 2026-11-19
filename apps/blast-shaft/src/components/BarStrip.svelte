<script lang="ts">
	// The bet bar's painted strip (review 2026-11-16: "Improve ... bet bar artwork"):
	// a soot-black timber beam under a riveted iron rail, in place of the SDK's flat
	// translucent plate (stateUiTheme.barAlpha is 0 in this game). Mounted BEFORE <UI>
	// (and inside ReplayHud), so the captions, amounts and buttons draw over it.
	// Geometry = the SDK layouts' plate (LayoutDesktop / Landscape / Portrait / Tablet),
	// but the beam runs to the screen's edges on canvases wider than the layout.
	// Portrait also gets a DECK behind its buttons (Evtim 2026-11-16: over the scaffold's
	// legs and the tunnel floor they were "kind of small and blending in", while desktop
	// has solid wood behind them): a plank wall of the strip's own timber from under the
	// reel frame's sill down to the strip. Only with `deck` (the replay HUD has no buttons).
	// Art: art-review/blast-shaft/build_ui.py.
	import { Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';

	type Props = { deck?: boolean };
	const props: Props = $props();

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const isDesktop = $derived(context.stateLayoutDerived.layoutType() === 'desktop');
	// The strip starts higher than the SDK's plate did (115 / 130 above the bottom), so
	// its iron rail clears the BALANCE / WIN / BET captions (Evtim 2026-11-16: more room
	// between the captions and the rail, on portrait and slightly on desktop)
	const barAbove = $derived(isDesktop ? 122 : 148);
	const barHeight = $derived(barAbove + (isDesktop ? 0 : 10));
	const barTop = $derived(layout.height - barAbove);
	// the canvas's width in the layout's units: wider than the layout on a wide screen
	const width = $derived(
		Math.max(layout.width + 20, context.stateLayoutDerived.canvasSizes().width / layout.scale + 4),
	);
	// two mirrored beams (16.6:1) for the wide bars, one (8.3:1) for portrait
	const key = $derived(width / barHeight > 11 ? 'bsBarWide' : 'bsBar');

	// the deck: from the frame's sill (stateGame PORTRAIT_UI_TOP 540 + its 12 gap) to the strip
	const DECK_TOP = 552;
	const showDeck = $derived(!!props.deck && context.stateLayoutDerived.layoutType() === 'portrait');

	let uiShown = $state(true);
	context.eventEmitter.subscribeOnMount({
		uiShow: () => (uiShown = true),
		uiHide: () => (uiShown = false),
	});
</script>

<MainContainer standard alignVertical="bottom">
	<FadeContainer show={uiShown} duration={220}>
		{#if showDeck}
			<Sprite
				key="bsDeck"
				x={layout.width * 0.5}
				y={layout.height - DECK_TOP}
				anchor={{ x: 0.5, y: 0 }}
				{width}
				height={DECK_TOP - barAbove + 2}
			/>
		{/if}
		<Sprite {key} x={layout.width * 0.5} y={barTop} anchor={{ x: 0.5, y: 0 }} {width} height={barHeight} />
	</FadeContainer>
</MainContainer>
