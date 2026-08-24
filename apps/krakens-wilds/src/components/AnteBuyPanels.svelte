<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Button, FadeContainer } from 'components-pixi';
	import { Container, Sprite, Text, type Sizes } from 'pixi-svelte';
	import { stateBet, stateModal, stateUrlDerived } from 'state-shared';
	import { stateBonus } from 'components-ui-html';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';
	import { panelText } from '../game/textStyles';
	import config from '../game/config';

	/**
	 * The Ante Bet and Buy Feature panels beside the reels (spec v2.1).
	 *
	 * - BUY panel: shows the live buy price (bet x 100) and opens the buy-bonus
	 *   SHOP first (explanatory card, free-spins offer only — see
	 *   stateBonus.shopBuyOnly), whose card then leads to the confirm dialog.
	 * - ANTE panel: always displays the ante total bet (bet x2 — what a spin
	 *   costs WITH ante, regardless of the toggle state, so the figure never
	 *   jumps on toggle), the DOUBLE CHANCE tagline, and an ON/OFF toggle that
	 *   switches the active bet mode between BASE and ANTE.
	 *
	 * Placement: desktop / landscape / tablet stack them LEFT of the reels (BUY
	 * on top, ANTE below); portrait puts them side by side under the reels.
	 * Base-game furniture: hidden during free spins, inert whenever not idle.
	 *
	 * Geometry is authored in the panel ART's pixel space (881x540) but rendered
	 * at FINAL size via s() — never through a scaled Container. Pixi Text
	 * rasterises at its fontSize x renderer resolution, so text inside a
	 * 0.22-scaled container was baked ~5x too large and minified into mush;
	 * sized this way it re-bakes crisp at the actual display size (and re-bakes
	 * on layout changes, since s() is reactive).
	 */

	const context = getContext();
	const social = $derived(stateUrlDerived.social());

	// ---- panel art geometry (asset pixel space, scaled by s() at use) ----
	const PANEL_W = 881;
	const PANEL_H = 540;
	// Toggle seats measured off the DESIGN mock (buttons-prev.png, which uses
	// these exact assets 1:1): the knob's seat is inset 32px from the pill's
	// rim and rides ~10px above the rim's vertical centre. Pill rim in the box
	// art: x 193..690, y 366..504 (centre 441.5, 435 → box-centre offsets
	// +1, +165); knob canvas 208x108, fully opaque.
	const KNOB = { offX: -112, onX: 114, y: 155, w: 208, h: 108 };
	const LABEL_OFF_X = 138; // OFF sits in the free right half of the pill
	const LABEL_ON_X = -138; // ON sits in the free left half
	const BET_ROW_Y = -150; // BET $4.50 headline row
	const TAGLINE_Y = -30; // DOUBLE CHANCE TO WIN FEATURES
	const BUY_WORD_Y = -95; // BUY word on the buy panel
	const BUY_PRICE_Y = 65; // price line on the buy panel

	// The stone frame is wider than the symbol grid — panels sit against ITS
	// edge, not the grid's (BoardFrame FRAME_SCALE_BASE.width).
	const FRAME_W = BOARD_SIZES.width * 1.137;

	// ---- placement, derived from the live board layout so resizes track ----
	const bl = $derived(context.stateGameDerived.boardLayout());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layoutType === 'portrait');

	const PORTRAIT_SCALE = 0.3;
	const SIDE_SCALE = 0.22;
	const EDGE = 8; // never sit flush against the canvas edge
	const GAP = 14; // preferred breathing room between panel and frame
	// A squeezed layout rides onto the frame's outer stone band (~40 units wide
	// at tablet scale) rather than shrink further — it never reaches the reels.
	const TIGHT_GAP = -20;

	/**
	 * How much room the side stack really has, and therefore how big it may be.
	 *
	 * Measured against the VISIBLE CANVAS, not the main box: the box is centred
	 * and fitted with `min(widthScale, heightScale)`, so a height-constrained
	 * canvas leaves usable margin outside the box while a width-constrained one
	 * leaves none. Tablet is the case that bites — its box is a fixed 1000x1000
	 * and the frame eats 670 of it, leaving ~165 units beside the frame where a
	 * full-size panel needs 208, so the panels hung off the left edge. Clamping
	 * here is what keeps them on screen at every window size.
	 */
	// half the stone frame's on-screen width — the edge every placement keys off
	const frameHalfWidth = $derived((FRAME_W / 2) * bl.scale);

	const sideFit = $derived.by(() => {
		const visibleHalfWidth =
			context.stateLayoutDerived.canvasSizes().width /
			context.stateLayoutDerived.mainLayout().scale /
			2;
		const roomAt = (gap: number) => visibleHalfWidth - frameHalfWidth - gap - EDGE;
		if (roomAt(GAP) >= PANEL_W * SIDE_SCALE) return { scale: SIDE_SCALE, gap: GAP };
		return {
			scale: Math.max(0.1, Math.min(SIDE_SCALE, roomAt(TIGHT_GAP) / PANEL_W)),
			gap: TIGHT_GAP,
		};
	});

	const scale = $derived(isPortrait ? PORTRAIT_SCALE : sideFit.scale);
	const s = (value: number) => value * scale;
	const sizes = $derived<Sizes>({ width: PANEL_W * scale, height: PANEL_H * scale });
	const positions = $derived.by(() => {
		if (isPortrait) {
			// Under the reels, above the spin-button cluster. The +40 deliberately
			// rides the panels up INTO the frame's bottom stone band (~28 units of
			// overlap) — touching the frame is by design, clearing the spin/chest
			// buttons below is what matters.
			//
			// Pushed out to the frame's own left and right edges rather than sitting
			// together in the middle: it squares them with the reels above and opens
			// the centre gap for the spin cluster.
			const y = bl.y + (BOARD_SIZES.height / 2) * bl.scale + 40 + sizes.height / 2;
			return {
				buy: { x: bl.x - frameHalfWidth + sizes.width / 2, y },
				ante: { x: bl.x + frameHalfWidth - sizes.width / 2, y },
			};
		}
		// stacked left of the frame: BUY on top, ANTE below
		const x = bl.x - frameHalfWidth - sideFit.gap - sizes.width / 2;
		return {
			buy: { x, y: bl.y - sizes.height / 2 - 8 },
			ante: { x, y: bl.y + sizes.height / 2 + 8 },
		};
	});

	// ---- state ----
	const idle = $derived(context.stateXstateDerived.isIdle());
	const show = $derived(context.stateGame.gameType === 'basegame');
	const anteActive = $derived(stateBet.activeBetModeKey === 'ANTE');
	const buyPrice = $derived(
		numberToCurrencyString(stateBet.betAmount * config.betModes.bonus.cost),
	);
	// ALWAYS the ante cost (bet x2) — the panel advertises what a spin with
	// ante costs; toggling must not move or change the figure.
	const anteBetCost = $derived(
		numberToCurrencyString(stateBet.betAmount * config.betModes.ante.cost),
	);

	// the knob glides between its two seats instead of teleporting (art px)
	const knobX = new Tween(KNOB.offX, { duration: 180, easing: cubicOut });
	$effect(() => {
		knobX.set(anteActive ? KNOB.onX : KNOB.offX);
	});

	const toggleAnte = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBet.activeBetModeKey = anteActive ? 'BASE' : 'ANTE';
	};

	const openBuy = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		// Explanatory shop first (free-spins card only), confirm second. The
		// chest button opens the same shop unfiltered.
		stateBonus.shopBuyOnly = true;
		stateModal.modal = { name: 'buyBonus' };
	};
	// The buy-only filter must not leak into the chest's shop: once every modal
	// is closed (bought, confirmed or dismissed), the shop is back to normal.
	$effect(() => {
		if (stateModal.modal === null) stateBonus.shopBuyOnly = false;
	});

	// centring the BET-word + amount row needs the live text width (final px)
	let betAmountSizes = $state<Sizes>({ width: 0, height: 0 });
	const BET_WORD_H = 96; // bet_txt drawn at this art height
	const BET_WORD_W = (321 / 116) * BET_WORD_H;
	const BET_ROW_GAP = 28;
	const betRowWidth = $derived(s(BET_WORD_W + BET_ROW_GAP) + betAmountSizes.width);

	// panelText at a FINAL font size. Titan One is a heavy display face and at
	// these sizes any generous stroke clogs its counters — the outline is kept
	// whisper-thin (5%, min 0.75px) purely for contrast against the panel art.
	const pStyle = (fontSize: number) => ({
		...panelText,
		fontSize,
		stroke: { color: '#000000', width: Math.max(0.75, fontSize * 0.05) },
	});
	// Bake the text at no less than 2x its display size: at renderer resolution 1
	// (non-retina desktops) a ~20px glyph rasterised 1:1 reads coarse and the
	// stroke clogs it; a 2x bake downsampled by the GPU at an exact 2:1 reads
	// clean. Retina screens keep their native (higher) resolution.
	const textResolution = $derived(
		Math.max(2, context.stateApp.pixiApplication?.renderer?.resolution ?? 2),
	);
</script>

{#if show}
	<!-- BUY FEATURE panel -->
	<FadeContainer show={true} {...positions.buy}>
		<Button {sizes} anchor={0.5} disabled={!idle} onpress={openBuy}>
			{#snippet children({ center, hovered, pressed })}
				<Container {...center} scale={pressed ? 0.97 : 1} alpha={idle ? 1 : 0.6}>
					<Sprite
						key="panelBuy"
						anchor={0.5}
						width={s(PANEL_W)}
						height={s(PANEL_H)}
						tint={hovered ? 0xffffff : 0xf2f2f2}
					/>
					{#if social}
						<Text
							anchor={0.5}
							y={s(BUY_WORD_Y)}
							text={context.i18nDerived.buyWord().toUpperCase()}
							resolution={textResolution}
							style={pStyle(s(110))}
						/>
					{:else}
						<Sprite
							key="panelBuyTxt"
							anchor={0.5}
							y={s(BUY_WORD_Y)}
							width={s(415)}
							height={s(132)}
						/>
					{/if}
					<Text
						anchor={0.5}
						y={s(BUY_PRICE_Y)}
						text={buyPrice}
						resolution={textResolution}
						style={pStyle(s(96))}
					/>
				</Container>
			{/snippet}
		</Button>
	</FadeContainer>

	<!-- ANTE BET panel -->
	<FadeContainer show={true} {...positions.ante}>
		<Button {sizes} anchor={0.5} disabled={!idle} onpress={toggleAnte}>
			{#snippet children({ center, hovered })}
				<Container {...center} alpha={idle ? 1 : 0.6}>
					<Sprite
						key="panelAnte"
						anchor={0.5}
						width={s(PANEL_W)}
						height={s(PANEL_H)}
						tint={hovered ? 0xffffff : 0xf2f2f2}
					/>
					<!-- BET $X headline, centred as one row -->
					<Container x={-betRowWidth / 2} y={s(BET_ROW_Y)}>
						{#if social}
							<Text
								anchor={{ x: 0, y: 0.5 }}
								text={context.i18nDerived.playWord().toUpperCase()}
								resolution={textResolution}
							style={pStyle(s(96))}
							/>
						{:else}
							<Sprite
								key="panelBetTxt"
								anchor={{ x: 0, y: 0.5 }}
								width={s(BET_WORD_W)}
								height={s(BET_WORD_H)}
							/>
						{/if}
						<Text
							anchor={{ x: 0, y: 0.5 }}
							x={s(BET_WORD_W + BET_ROW_GAP)}
							text={anteBetCost}
							resolution={textResolution}
							style={pStyle(s(96))}
							onresize={(textSizes) => (betAmountSizes = textSizes)}
						/>
					</Container>
					<!--
						The tagline runs at ~11px final size — Titan One is unreadable down
						there. Inter 700 (already loaded, made for small UI text) with a
						shadow instead of a stroke keeps it legible; Titan One stays on the
						price and toggle, whose sizes can carry it.
					-->
					<Text
						anchor={0.5}
						y={s(TAGLINE_Y)}
						text={context.i18nDerived.anteTagline()}
						resolution={textResolution}
						style={{
							fontFamily: 'Inter',
							fontWeight: '700',
							fill: '#FFFFFF',
							align: 'center',
							dropShadow: { color: '#000000', blur: 2, distance: 1, alpha: 0.8 },
							fontSize: s(52),
							wordWrap: true,
							wordWrapWidth: s(660),
							lineHeight: s(64),
						}}
					/>
					<!-- toggle: knob glides across the pill, state word in the free half -->
					<Sprite
						key={anteActive ? 'panelKnobOn' : 'panelKnobOff'}
						anchor={0.5}
						x={s(knobX.current)}
						y={s(KNOB.y)}
						width={s(KNOB.w)}
						height={s(KNOB.h)}
					/>
					<Text
						anchor={0.5}
						x={s(anteActive ? LABEL_ON_X : LABEL_OFF_X)}
						y={s(KNOB.y)}
						text={anteActive ? context.i18nDerived.onWord() : context.i18nDerived.offWord()}
						resolution={textResolution}
						style={pStyle(s(64))}
					/>
				</Container>
			{/snippet}
		</Button>
	</FadeContainer>
{/if}
