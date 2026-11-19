<script lang="ts">
	// Portrait's see-through dark wash behind the buttons, from the reel frame's base
	// down to the bar's strip (constants PORTRAIT_DECK 'shade'; the 'planks' wall is
	// BarStrip's). Its own component because of the draw order: mounted BEFORE
	// Boardwalk, so the tumbleweed and the hen cross on top of the shading, not dimmed
	// under it (Evtim 2026-11-16), while the strip and the buttons come after them.
	import { Rectangle } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { PORTRAIT_DECK, PORTRAIT_SHADE } from '../game/constants';
	import { getContext } from '../game/context';

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayoutStandard());
	// BarStrip's numbers: the frame's base (PORTRAIT_UI_TOP 540 + its 12 gap) and the
	// strip's top, in units above the layout's bottom
	const TOP = 552;
	const STRIP_TOP = 150;
	const width = $derived(
		Math.max(layout.width + 20, context.stateLayoutDerived.canvasSizes().width / layout.scale + 4),
	);
	const shown = $derived(
		PORTRAIT_DECK === 'shade' && context.stateLayoutDerived.layoutType() === 'portrait',
	);

	let uiShown = $state(true);
	context.eventEmitter.subscribeOnMount({
		uiShow: () => (uiShown = true),
		uiHide: () => (uiShown = false),
	});
</script>

<!-- No {#if} at the root: pixi-svelte appends a remounted child at the END of its
     parent, so a shade that left with the portrait layout came back drawn over the bar
     and the buttons (Evtim 2026-11-16: turn the phone and back). The containers keep
     their slot under Boardwalk; only the wash's alpha changes. -->
<MainContainer standard alignVertical="bottom">
	<FadeContainer show={shown && uiShown} duration={220} persistent>
		<Rectangle
			x={layout.width * 0.5}
			y={layout.height - TOP}
			anchor={{ x: 0.5, y: 0 }}
			{width}
			height={TOP - STRIP_TOP + 2}
			backgroundColor={PORTRAIT_SHADE.color}
			backgroundAlpha={PORTRAIT_SHADE.alpha}
		/>
	</FadeContainer>
</MainContainer>
