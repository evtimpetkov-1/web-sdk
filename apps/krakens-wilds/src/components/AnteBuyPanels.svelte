<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Button, FadeContainer } from 'components-pixi';
	import { Container, Rectangle, Sprite, Text, type Sizes } from 'pixi-svelte';
	import { stateBet, stateModal, stateUrlDerived } from 'state-shared';
	import { stateBonus } from 'components-ui-html';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';
	import { panelText } from '../game/textStyles';
	import config from '../game/config';

	/**
	 * The Ante Bet + Buy Feature furniture, per orientation (2026-08-26):
	 *
	 * - landscape/desktop: ONE combined tall panel beside the frame (the
	 *   purple->teal gradient plate) — chest collage, BUY + price, divider,
	 *   BET row, tagline, toggle over the big kraken. Two invisible hit zones
	 *   split it: buy offer above the divider, ante below.
	 * - portrait: the ORIGINAL pair of plate panels side by side under the
	 *   reels (purple BUY, teal ANTE with its baked toggle channel). The
	 *   combined bar was tried here and never read well at phone size.
	 *
	 * Geometry is authored in plate art units, rendered at FINAL size via s()
	 * — never through a scaled Container. Pixi Text rasterises at fontSize x
	 * resolution, so text inside a 0.22-scaled container bakes wrong.
	 */

	const context = getContext();
	const social = $derived(stateUrlDerived.social());

	const CARD_ART_AR = 840 / 360;
	const BUY_WORD_AR = 480 / 153; // panelBuyTxt drawn ratio
	const BET_WORD_AR = 321 / 116; // panelBetTxt source ratio
	const PILL = { w: 419, h: 140 };
	const KNOB = { offX: -89, onX: 89, w: 208, h: 108 };
	const LABEL_OFF_X = 104;
	const LABEL_ON_X = -104;
	// nominal text sizes, shared by both orientations (the hidden measuring
	// copies below are pinned to these)
	const PRICE_SIZE = 110;
	const PRICE_MAX_W = 660;
	const BET_WORD_H = 96;
	const BET_ROW_GAP = 28;
	const BET_AMOUNT_MAX = 356;

	/**
	 * LANDSCAPE combined-panel layout (absolute plate coords, plate 881x1720).
	 */
	const L = {
		plateKey: 'panelCombined',
		W: 881,
		H: 1720,
		collage: { x: 0, y: -615, w: 790 }, // 339 tall, -785..-446
		word: { x: 0, y: -357, w: 480, fontSize: 127 },
		price: { x: 0, y: -185 },
		divider: { x: 0, y: -75, w: 600, h: 3 },
		bet: { left: -290, y: 28 },
		tagline: { x: 0, y: 185, maxW: 760 },
		// the kraken is the toggle's BACKDROP, the pill sat low on it
		pill: { x: 0, y: 680 },
		kraken: { x: 0, y: 505, w: 881 }, // 377 tall, 316..694
		buyZone: { x: 0, y: -467.5, w: 881, h: 785 },
		anteZone: { x: 0, y: 392.5, w: 881, h: 935 },
	};

	/**
	 * PORTRAIT two-panel layout (the pre-combined design): v2 plates, offsets
	 * measured off their art. The teal plate's toggle channel is BAKED IN, so
	 * there is no drawn pill here — the knob seats at the measured centre 182.
	 */
	const P = {
		W: 881,
		buyH: 649, // panel_buy_v3 (1448x1066)
		anteH: 641, // panel_ante_v3 (1437x1046)
		wordY: -115,
		priceY: 85,
		// -160 left ~60 units of dead air under the top rim while the rows
		// below squeezed ~29 each; raising BET and the tagline spreads it even
		betY: -185,
		// v3 teal pill measured at x 383..1084, y 716..944 of 1437x1046:
		// centre (+9, +188) in 881-wide units, half-width 215, height 140
		pillX: 9,
		knobY: 188,
		// seat = halfW 215 - even 16 padding - knob half 104 (the landscape
		// DRAWN pill is narrower and keeps the shared 89)
		knobSeat: 95,
		taglineY: -15,
		pairGap: 50,
	};

	// The stone frame is bigger than the symbol grid on every side.
	const FRAME_W = BOARD_SIZES.width * 1.137;
	const FRAME_H = BOARD_SIZES.width * 0.805;
	const FRAME_Y_OFFSET = 10;

	const bl = $derived(context.stateGameDerived.boardLayout());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layoutType === 'portrait');

	// 0.3 ran the pair into the spin-button cluster below — 0.24 clears it
	const PORTRAIT_SCALE = 0.24;
	const SIDE_SCALE = 0.22;
	// negative tucks the pair toward the frame's stone band
	const PORTRAIT_FRAME_GAP = -10;
	const EDGE = 8;
	const GAP = 14;

	const frameHalfWidth = $derived((FRAME_W / 2) * bl.scale);
	/**
	 * The landscape panel takes whatever width is left beside the frame,
	 * SHRINKING to fit — the gap to the frame is never given up.
	 */
	const sideFit = $derived.by(() => {
		const visibleHalfWidth =
			context.stateLayoutDerived.canvasSizes().width /
			context.stateLayoutDerived.mainLayout().scale /
			2;
		const room = visibleHalfWidth - frameHalfWidth - GAP - EDGE;
		return { scale: Math.max(0.1, Math.min(SIDE_SCALE, room / 881)), gap: GAP };
	});

	const scale = $derived(isPortrait ? PORTRAIT_SCALE : sideFit.scale);
	const s = (value: number) => value * scale;

	// landscape combined panel
	const panelSizes = $derived<Sizes>({ width: L.W * scale, height: L.H * scale });
	const sidePosition = $derived({
		x: bl.x - frameHalfWidth - sideFit.gap - panelSizes.width / 2,
		y: bl.y,
	});
	// portrait pair, under the frame's bottom edge
	const buySizes = $derived<Sizes>({ width: P.W * scale, height: P.buyH * scale });
	const anteSizes = $derived<Sizes>({ width: P.W * scale, height: P.anteH * scale });
	const pairPositions = $derived.by(() => {
		const frameBottom = bl.y + (FRAME_Y_OFFSET + FRAME_H / 2) * bl.scale;
		return {
			buy: {
				x: bl.x - P.pairGap / 2 - buySizes.width / 2,
				y: frameBottom + PORTRAIT_FRAME_GAP + buySizes.height / 2,
			},
			ante: {
				x: bl.x + P.pairGap / 2 + anteSizes.width / 2,
				y: frameBottom + PORTRAIT_FRAME_GAP + anteSizes.height / 2,
			},
		};
	});

	// ---- state ----
	const idle = $derived(context.stateXstateDerived.isIdle());
	const show = $derived(context.stateGame.gameType === 'basegame');
	const anteActive = $derived(stateBet.activeBetModeKey === 'ANTE');
	const buyPrice = $derived(
		numberToCurrencyString(stateBet.betAmount * config.betModes.bonus.cost),
	);
	// ALWAYS the ante cost (bet x2) — toggling must not change the figure.
	const anteBetCost = $derived(
		numberToCurrencyString(stateBet.betAmount * config.betModes.ante.cost),
	);

	const knobSeat = $derived(isPortrait ? P.knobSeat : KNOB.onX);
	const knobX = new Tween(KNOB.offX, { duration: 180, easing: cubicOut });
	$effect(() => {
		knobX.set(anteActive ? knobSeat : -knobSeat);
	});

	const toggleAnte = () => {
		context.eventEmitter.broadcast({
			type: 'soundOnce',
			name: anteActive ? 'sfx_ui_toggle_off' : 'sfx_ui_toggle_on',
			forcePlay: true,
		});
		stateBet.activeBetModeKey = anteActive ? 'BASE' : 'ANTE';
	};

	const openBuy = () => {
		// Explanatory shop first (free-spins card only), confirm second. The
		// chest button opens the same shop unfiltered. Game.svelte fires the
		// popup sound off stateModal.
		stateBonus.shopBuyOnly = true;
		stateModal.modal = { name: 'buyBonus' };
	};
	$effect(() => {
		if (stateModal.modal === null) stateBonus.shopBuyOnly = false;
	});

	/**
	 * Amount fitting, measured off HIDDEN copies at the nominal size (the
	 * visible text re-rasterises at a smaller fontSize; measuring the visible
	 * one would feed the fit back into itself). The BET word is PINNED — only
	 * the amount reacts to its own width.
	 */
	let betAmountSizes = $state<Sizes>({ width: 0, height: 0 });
	let buyPriceSizes = $state<Sizes>({ width: 0, height: 0 });
	let taglineSizes = $state<Sizes>({ width: 0, height: 0 });

	/**
	 * The tagline is ALWAYS exactly two rows. wordWrap could re-break the lines
	 * whenever the font size or a translation's length changed (at 60 it split
	 * "DOUBLE CHANCE TO" onto a third row), so wrapping is OFF: the en value
	 * carries an explicit \n, any locale without one gets a break inserted at
	 * the space nearest its midpoint, and the whole block SHRINKS to the
	 * available width instead of re-flowing.
	 */
	const TAGLINE_FONT = 70;
	const TAGLINE_LINE = 86;
	const taglineDisplay = $derived.by(() => {
		const raw = context.i18nDerived.anteTagline();
		if (raw.includes('\n') || !raw.includes(' ')) return raw;
		const mid = raw.length / 2;
		let best = -1;
		let bestDistance = Infinity;
		for (let i = 0; i < raw.length; i++) {
			if (raw[i] !== ' ') continue;
			const distance = Math.abs(i - mid);
			if (distance < bestDistance) {
				bestDistance = distance;
				best = i;
			}
		}
		return best === -1 ? raw : raw.slice(0, best) + '\n' + raw.slice(best + 1);
	});
	const amountFit = $derived(Math.min(1, s(BET_AMOUNT_MAX) / (betAmountSizes.width || 1)));
	const buyPriceFit = $derived(Math.min(1, s(PRICE_MAX_W) / (buyPriceSizes.width || 1)));

	const pStyle = (fontSize: number) => ({
		...panelText,
		fontSize,
		stroke: { color: '#000000', width: Math.max(0.75, fontSize * 0.05) },
	});
	const textResolution = $derived(
		Math.max(2, context.stateApp.pixiApplication?.renderer?.resolution ?? 2),
	);
</script>

{#snippet betRow(rowLeftX: number, rowY: number)}
	<!-- BET is pinned; only the amount adapts -->
	<Container x={rowLeftX} y={rowY}>
		{#if social}
			<Text
				anchor={{ x: 0, y: 0.5 }}
				text={context.i18nDerived.playWord().toUpperCase()}
				resolution={textResolution}
				style={pStyle(s(BET_WORD_H))}
			/>
		{:else}
			<Sprite
				key="panelBetTxt"
				anchor={{ x: 0, y: 0.5 }}
				width={s(BET_WORD_AR * BET_WORD_H)}
				height={s(BET_WORD_H)}
			/>
		{/if}
		<Text
			anchor={{ x: 0, y: 0.5 }}
			x={s(BET_WORD_AR * BET_WORD_H + BET_ROW_GAP)}
			text={anteBetCost}
			resolution={textResolution}
			style={pStyle(s(BET_WORD_H) * amountFit)}
		/>
	</Container>
{/snippet}

{#snippet taglineText(x: number, y: number, maxW: number)}
	{@const fit = Math.min(1, s(maxW) / (taglineSizes.width || 1))}
	<!-- Inter — Titan One is unreadable this small. Two rows by construction:
	     wordWrap off, the break is baked into the text, overlong locales
	     shrink instead of re-flowing. -->
	<Text
		anchor={0.5}
		{x}
		{y}
		text={taglineDisplay}
		resolution={textResolution}
		style={{
			fontFamily: 'Inter',
			fontWeight: '700',
			fill: '#FFFFFF',
			align: 'center',
			dropShadow: { color: '#000000', blur: 2, distance: 1, alpha: 0.8 },
			fontSize: s(TAGLINE_FONT) * fit,
			lineHeight: s(TAGLINE_LINE) * fit,
		}}
	/>
{/snippet}

{#snippet toggleParts(pillCX: number, pillCY: number)}
	<Sprite
		key={anteActive ? 'panelKnobOn' : 'panelKnobOff'}
		anchor={0.5}
		x={pillCX + s(knobX.current)}
		y={pillCY}
		width={s(KNOB.w)}
		height={s(KNOB.h)}
	/>
	<Text
		anchor={0.5}
		x={pillCX + s(anteActive ? LABEL_ON_X : LABEL_OFF_X)}
		y={pillCY}
		text={anteActive ? context.i18nDerived.onWord() : context.i18nDerived.offWord()}
		resolution={textResolution}
		style={pStyle(s(64))}
	/>
{/snippet}

{#snippet buyTexts(wordX: number, wordY: number, wordW: number, socialSize: number, priceX: number, priceY: number)}
	{#if social}
		<Text
			anchor={0.5}
			x={wordX}
			y={wordY}
			text={context.i18nDerived.buyWord().toUpperCase()}
			resolution={textResolution}
			style={pStyle(s(socialSize))}
		/>
	{:else}
		<Sprite
			key="panelBuyTxt"
			anchor={0.5}
			x={wordX}
			y={wordY}
			width={s(wordW)}
			height={s(wordW / BUY_WORD_AR)}
		/>
	{/if}
	<Text
		anchor={0.5}
		x={priceX}
		y={priceY}
		text={buyPrice}
		resolution={textResolution}
		style={pStyle(s(PRICE_SIZE) * buyPriceFit)}
	/>
{/snippet}

{#if show}
	<!-- hidden measuring copies, shared by both orientations -->
	<Container visible={false}>
		<Text
			text={buyPrice}
			style={pStyle(s(PRICE_SIZE))}
			onresize={(textSizes) => (buyPriceSizes = textSizes)}
		/>
		<Text
			text={anteBetCost}
			style={pStyle(s(BET_WORD_H))}
			onresize={(textSizes) => (betAmountSizes = textSizes)}
		/>
		<Text
			text={taglineDisplay}
			style={{
				fontFamily: 'Inter',
				fontWeight: '700',
				fontSize: s(TAGLINE_FONT),
				lineHeight: s(TAGLINE_LINE),
				align: 'center',
			}}
			onresize={(textSizes) => (taglineSizes = textSizes)}
		/>
	</Container>

	{#if isPortrait}
		<!-- ============ PORTRAIT: the original pair of plate panels ============ -->
		<FadeContainer show={true} {...pairPositions.buy}>
			<Button sizes={buySizes} anchor={0.5} disabled={!idle} onpress={openBuy}>
				{#snippet children({ center, hovered, pressed })}
					<Container {...center} scale={pressed ? 0.97 : 1} alpha={idle ? 1 : 0.6}>
						<Sprite
							key="panelBuyV2"
							anchor={0.5}
							width={s(P.W)}
							height={s(P.buyH)}
							tint={hovered ? 0xffffff : 0xf2f2f2}
						/>
						{@render buyTexts(0, s(P.wordY), 480, 127, 0, s(P.priceY))}
					</Container>
				{/snippet}
			</Button>
		</FadeContainer>

		<FadeContainer show={true} {...pairPositions.ante}>
			<Button sizes={anteSizes} anchor={0.5} disabled={!idle} onpress={toggleAnte}>
				{#snippet children({ center, hovered })}
					<Container {...center} alpha={idle ? 1 : 0.6}>
						<Sprite
							key="panelAnteV2"
							anchor={0.5}
							width={s(P.W)}
							height={s(P.anteH)}
							tint={hovered ? 0xffffff : 0xf2f2f2}
						/>
						{@render betRow(s(-290), s(P.betY))}
						{@render taglineText(0, s(P.taglineY), 700)}
						{@render toggleParts(s(P.pillX), s(P.knobY))}
					</Container>
				{/snippet}
			</Button>
		</FadeContainer>
	{:else}
		<!-- ============ LANDSCAPE: the combined tall panel ============ -->
		<FadeContainer show={true} {...sidePosition}>
			<!-- plate + cosmetics, drawn once; hit zones sit on top -->
			<Container alpha={idle ? 1 : 0.6}>
				<Sprite key={L.plateKey} anchor={0.5} width={s(L.W)} height={s(L.H)} />
				<Sprite
					key="buyCardArt"
					anchor={0.5}
					x={s(L.collage.x)}
					y={s(L.collage.y)}
					width={s(L.collage.w)}
					height={s(L.collage.w / CARD_ART_AR)}
				/>
				<Sprite
					key="anteCardArt"
					anchor={0.5}
					x={s(L.kraken.x)}
					y={s(L.kraken.y)}
					width={s(L.kraken.w)}
					height={s(L.kraken.w / CARD_ART_AR)}
				/>
				<!-- gold rule between the offers. zIndex, not mount order: keeps
				     these above the art even if the art ever re-mounts. -->
				<Rectangle
					zIndex={5}
					anchor={0.5}
					x={s(L.divider.x)}
					y={s(L.divider.y)}
					width={Math.max(1, s(L.divider.w))}
					height={Math.max(1, s(L.divider.h))}
					backgroundColor={0xc8a24a}
					backgroundAlpha={0.35}
				/>
				<!-- drawn channel for the toggle (the tall plate has none baked) -->
				<Rectangle
					zIndex={5}
					anchor={0.5}
					x={s(L.pill.x)}
					y={s(L.pill.y)}
					width={s(PILL.w)}
					height={s(PILL.h)}
					borderRadius={s(PILL.h / 2)}
					backgroundColor={0x0a2233}
					backgroundAlpha={0.9}
					borderColor={0xc8a24a}
					borderWidth={Math.max(1, s(4))}
					borderAlpha={0.5}
				/>
			</Container>

			<!-- BUY zone -->
			<Button
				sizes={{ width: L.buyZone.w * scale, height: L.buyZone.h * scale }}
				anchor={0.5}
				x={L.buyZone.x * scale}
				y={L.buyZone.y * scale}
				disabled={!idle}
				onpress={openBuy}
			>
				{#snippet children({ center, pressed })}
					<!-- Button hit-tests its children's bounds; this invisible rect
					     makes the whole zone (collage included) clickable -->
					<Rectangle
						width={L.buyZone.w * scale}
						height={L.buyZone.h * scale}
						backgroundAlpha={0}
					/>
					<Container {...center} scale={pressed ? 0.97 : 1} alpha={idle ? 1 : 0.6}>
						{@render buyTexts(
							s(L.word.x - L.buyZone.x),
							s(L.word.y - L.buyZone.y),
							L.word.w,
							L.word.fontSize,
							s(L.price.x - L.buyZone.x),
							s(L.price.y - L.buyZone.y),
						)}
					</Container>
				{/snippet}
			</Button>

			<!-- ANTE zone -->
			<Button
				sizes={{ width: L.anteZone.w * scale, height: L.anteZone.h * scale }}
				anchor={0.5}
				x={L.anteZone.x * scale}
				y={L.anteZone.y * scale}
				disabled={!idle}
				onpress={toggleAnte}
			>
				{#snippet children({ center })}
					<!-- same full-zone hit rect as the buy zone (kraken included) -->
					<Rectangle
						width={L.anteZone.w * scale}
						height={L.anteZone.h * scale}
						backgroundAlpha={0}
					/>
					<Container {...center} alpha={idle ? 1 : 0.6}>
						{@render betRow(s(L.bet.left - L.anteZone.x), s(L.bet.y - L.anteZone.y))}
						{@render taglineText(
							s(L.tagline.x - L.anteZone.x),
							s(L.tagline.y - L.anteZone.y),
							L.tagline.maxW,
						)}
						{@render toggleParts(s(L.pill.x - L.anteZone.x), s(L.pill.y - L.anteZone.y))}
					</Container>
				{/snippet}
			</Button>
		</FadeContainer>
	{/if}
{/if}
