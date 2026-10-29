<script lang="ts">
	import { onMount } from 'svelte';

	import { BitmapText, Container, Rectangle, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';

	import config from '../game/config';
	import { getContext } from '../game/context';
	import { displayFont, winUpToText } from '../game/textStyles';
	import { stateReplay, setReplayStartHandler } from '../game/stateReplay.svelte';
	import { fill, formatTimes } from '../i18n/format';
	import { i18nDerived, showsBakedArt } from '../i18n/i18nDerived';
	import { CURTAIN_Z } from './Transition.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		/** the press: this screen fades out while Game.svelte brings in the closed curtains */
		onstart: () => void;
	};

	/**
	 * The intro, shown once the HTML boot loader (LoaderGame) is gone: the logo,
	 * four panels that explain the game at a glance, and the prompt — one screen
	 * on every layout (a row of four on wide screens, 2x2 on tablet and portrait).
	 * A press fades it out over the closed curtains (Game.svelte startGame), which
	 * then open on the game. Sits above the curtains' layer.
	 *
	 * Copy is short and social-safe (no pay/bet/buy); English keys, translated
	 * through the game's messagesMap.
	 *
	 * Replay mode (Kraken's pattern): only the dimmed lab and the logo; no
	 * panels, no prompt. The HTML replay card (ReplayOverlay) shows over it and
	 * its Start Replay button runs the same start as the press.
	 */
	const props: Props = $props();
	const context = getContext();
	const isReplay = stateUrlDerived.replay();

	type PanelId = 'anywhere' | 'multipliers' | 'bombs' | 'freeSpins';
	const PANELS: { id: PanelId; title: string; text: string }[] = [
		{
			id: 'anywhere',
			title: 'WIN ANYWHERE',
			text: '8 or more of a symbol anywhere win. Winners tumble away and new symbols drop in.',
		},
		{
			id: 'multipliers',
			title: 'MULTIPLIERS',
			text: 'Collected into one total that multiplies every win after it.',
		},
		{
			id: 'bombs',
			title: 'BOMBS & CLONERS',
			text: 'Bombs blast their area and leave a Wild. Cloners turn symbols into copies of one.',
		},
		{
			id: 'freeSpins',
			title: 'FREE SPINS',
			text: '4 or more Scatters award 10 to 20 Free Spins. The multiplier keeps growing.',
		},
	];

	let started = $state(false);
	// Pixi Text rasterises with whatever face is resolved at its first draw, so the
	// copy waits for the self-hosted fonts as well as the assets
	let fontsReady = $state(false);
	onMount(() => {
		Promise.all(
			['32px Creepster', '32px "Black Ops One"', '400 32px Inter', '700 32px Inter'].map((face) =>
				document.fonts?.load(face).catch(() => undefined),
			),
		).then(() => (fontsReady = true));
	});
	const show = $derived(context.stateApp.loaded && fontsReady && !started);

	// the press in normal play, the card's Start Replay button in replay
	const start = () => {
		if (started) return;
		started = true;
		props.onstart();
	};

	$effect(() => {
		if (!isReplay) return;
		setReplayStartHandler(start);
		return () => setReplayStartHandler(null);
	});

	// gates the replay card: only once there is something to show and nothing
	// has started yet
	$effect(() => {
		stateReplay.introReady = isReplay && show;
	});

	// ---- layout, per layout type, in main-layout units ----
	// Phones (portrait, landscape) draw a main-layout unit at ~0.43-0.49 px, so
	// their copy is sized up to stay ~12-13 px on screen; desktop is ~1:1.
	// Bands are fractions of the main height: logo centre + height, the panel
	// block between top and bottom, the WIN UP TO banner (winH tall) centred
	// between the block and the prompt (PressToContinue).
	const LAYOUTS = {
		desktop: { cols: 4, maxW: 300, title: 36, text: 19, logoY: 0.14, logoH: 0.22, top: 0.28, bottom: 0.76, winH: 0.1 },
		landscape: { cols: 4, maxW: 350, title: 44, text: 27, logoY: 0.11, logoH: 0.18, top: 0.225, bottom: 0.755, winH: 0.12 },
		tablet: { cols: 2, maxW: 380, title: 38, text: 21, logoY: 0.1, logoH: 0.14, top: 0.19, bottom: 0.81, winH: 0.08 },
		portrait: { cols: 2, maxW: 370, title: 44, text: 27, logoY: 0.085, logoH: 0.12, top: 0.165, bottom: 0.825, winH: 0.08 },
	};
	const main = $derived(context.stateLayoutDerived.mainLayout());
	const spec = $derived(LAYOUTS[context.stateLayoutDerived.layoutType()] ?? LAYOUTS.desktop);
	const LOGO_RATIO = 1465 / 1074; // logo.webp
	// tablet and portrait show the one-row logo (logo_one_row.webp), like the game
	// (GameLogo): 60% of the width, never taller than the layout's logo band
	const LOGO_ROW_RATIO = 2172 / 724;
	const LOGO_ROW_WIDTH = 0.6;
	const oneRowLogo = $derived(['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()));
	const GAP = 22;
	// "WIN UP TO 22 924 X" (win_up_to.webp): the Overcharged Free Spins top win.
	// Languages without the art (showsBakedArt) draw it as text in the same box,
	// the figure the top max win of all modes in config.
	const WIN_RATIO = 2101 / 374;
	const bakedArt = showsBakedArt();
	const topMaxWin = Math.max(...Object.values(config.betModes).map((mode) => mode.max_win));
	// main units the prompt's line takes above the bottom (PressToContinue: 46-unit
	// text, 28 margin). Its container is bottom-aligned, so on a canvas taller than
	// the main layout the prompt sits lower by the letterbox, and the banner follows.
	const PROMPT_BAND = 82;

	const layout = $derived.by(() => {
		const { width: W, height: H, scale } = main;
		const cols = spec.cols;
		const rows = PANELS.length / cols;
		const top = H * spec.top;
		const bottom = H * spec.bottom;
		const panelW = Math.min((W * 0.92 - GAP * (cols - 1)) / cols, spec.maxW);
		const panelH = Math.min((bottom - top - GAP * (rows - 1)) / rows, panelW * 1.35);
		const blockW = cols * panelW + (cols - 1) * GAP;
		const blockH = rows * panelH + (rows - 1) * GAP;
		const x0 = (W - blockW) / 2;
		const y0 = top + (bottom - top - blockH) / 2;
		const logoH = H * spec.logoH;
		const rowW = Math.min(W * LOGO_ROW_WIDTH, logoH * LOGO_ROW_RATIO);
		const letterbox = (context.stateLayoutDerived.canvasSizes().height - H * scale) / 2 / scale;
		const promptTop = H - PROMPT_BAND + Math.max(0, letterbox);
		const winH = Math.min(H * spec.winH, (W * 0.9) / WIN_RATIO);
		return {
			logo: {
				x: W / 2,
				y: H * spec.logoY,
				width: oneRowLogo ? rowW : logoH * LOGO_RATIO,
				height: oneRowLogo ? rowW / LOGO_ROW_RATIO : logoH,
			},
			win: { x: W / 2, y: (y0 + blockH + promptTop) / 2, width: winH * WIN_RATIO, height: winH },
			panelW,
			panelH,
			panels: PANELS.map((panel, i) => ({
				...panel,
				x: x0 + (i % cols) * (panelW + GAP) + panelW / 2,
				y: y0 + Math.floor(i / cols) * (panelH + GAP),
			})),
		};
	});

	// panel inner geometry, from the panel box: art band, title, up to 4 lines
	const artY = $derived(layout.panelH * 0.27);
	const artH = $derived(Math.min(layout.panelH * 0.34, layout.panelW * 0.5));
	const titleY = $derived(layout.panelH * 0.53);
	const titleSize = $derived(spec.title);

	/**
	 * The copy's size: the layout's, or smaller where a translation's wrapped
	 * lines would run past the panel's bottom (translations run up to ~40%
	 * longer than the English the panels were sized for; English keeps its
	 * size on every layout). One size for all four panels, found by wrapping
	 * the way Pixi does: at spaces, and per character where a word is wider
	 * than the line (breakWords: a CJK sentence has no spaces at all).
	 */
	const LINE_HEIGHT = 1.32;
	const measure = document.createElement('canvas').getContext('2d');
	const wrappedLines = (text: string, width: number) => {
		if (!measure) return 1;
		const space = measure.measureText(' ').width;
		let lines = 1;
		let line = 0;
		for (const word of text.split(' ')) {
			const wordWidth = measure.measureText(word).width;
			if (wordWidth > width) {
				if (line > 0) lines++;
				line = 0;
				for (const char of word) {
					const charWidth = measure.measureText(char).width;
					if (line + charWidth > width) {
						lines++;
						line = 0;
					}
					line += charWidth;
				}
			} else if (line > 0 && line + wordWidth > width) {
				lines++;
				line = wordWidth;
			} else {
				line += wordWidth;
			}
			line += space;
		}
		return lines;
	};
	const textSize = $derived.by(() => {
		if (!fontsReady || !measure) return spec.text;
		const width = layout.panelW * 0.86;
		const room = layout.panelH - titleY - titleSize * 1.35 - 4;
		const texts = PANELS.map((panel) => stateI18nDerived.translate(panel.text));
		for (let size = spec.text; size > spec.text * 0.7; size -= 0.5) {
			measure.font = `400 ${size}px Inter, sans-serif`;
			if (texts.every((text) => wrappedLines(text, width) * size * LINE_HEIGHT <= room)) {
				return size;
			}
		}
		return spec.text * 0.7;
	});

	const titleStyle = $derived({
		fontFamily: displayFont(),
		fontSize: titleSize,
		fill: '#abea10',
		letterSpacing: 1,
		align: 'center' as const,
		stroke: { color: '#000000', width: 3 },
	});
	const textStyle = $derived({
		fontFamily: ['Inter', 'sans-serif'],
		fontSize: textSize,
		fill: '#e8eedf',
		align: 'center' as const,
		lineHeight: textSize * LINE_HEIGHT,
		wordWrap: true,
		wordWrapWidth: layout.panelW * 0.86,
		breakWords: true,
	});

	// symbol art keeps each PNG's own aspect (symbols.json frame sizes)
	const SYM = { w: 297, h: 321 };
	const BONUS = { w: 427, h: 423 };
	const symW = (h: number) => (h * SYM.w) / SYM.h;
</script>

<Container zIndex={CURTAIN_Z + 1}>
	<FadeContainer {show}>
		<!-- the lab stays faintly visible behind the copy -->
		<CanvasSizeRectangle backgroundColor={0x050805} backgroundAlpha={0.72} />

		<MainContainer>
			<Sprite key={oneRowLogo ? 'msLogoRow' : 'msLogo'} anchor={0.5} {...layout.logo} />

			{#each isReplay ? [] : layout.panels as panel (panel.id)}
				<Container x={panel.x} y={panel.y}>
					<Rectangle
						anchor={{ x: 0.5, y: 0 }}
						width={layout.panelW}
						height={layout.panelH}
						borderRadius={16}
						backgroundColor={0x0c120c}
						backgroundAlpha={0.86}
						borderColor={0xabea10}
						borderWidth={2}
						borderAlpha={0.4}
					/>

					<Container y={artY}>
						{#if panel.id === 'anywhere'}
							<!-- three highs fanned, the middle one in front -->
							<Sprite key="h2.png" anchor={0.5} x={-symW(artH) * 0.62} y={artH * 0.06} rotation={-0.14} width={symW(artH * 0.86)} height={artH * 0.86} />
							<Sprite key="h3.png" anchor={0.5} x={symW(artH) * 0.62} y={artH * 0.06} rotation={0.14} width={symW(artH * 0.86)} height={artH * 0.86} />
							<Sprite key="h1.png" anchor={0.5} width={symW(artH)} height={artH} />
						{:else if panel.id === 'multipliers'}
							<Sprite key="mult_symbol_plate.png" anchor={0.5} width={symW(artH)} height={artH} />
							<BitmapText
								anchor={0.5}
								text="x10"
								style={{ fontFamily: 'tickup-multipliers', fontSize: artH * 0.5, fill: 0xffffff }}
							/>
						{:else if panel.id === 'bombs'}
							<Sprite key="bomb.png" anchor={0.5} x={-symW(artH) * 0.56} rotation={-0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
							<Sprite key="cloner.png" anchor={0.5} x={symW(artH) * 0.56} rotation={0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
						{:else}
							<Sprite key="bonus.png" anchor={0.5} width={(artH * 1.08 * BONUS.w) / BONUS.h} height={artH * 1.08} />
						{/if}
					</Container>

					<ResponsiveText
						anchor={{ x: 0.5, y: 0 }}
						y={titleY}
						maxWidth={layout.panelW * 0.9}
						text={stateI18nDerived.translate(panel.title)}
						style={titleStyle}
					/>
					<Text
						anchor={{ x: 0.5, y: 0 }}
						y={titleY + titleSize * 1.35}
						text={stateI18nDerived.translate(panel.text)}
						style={textStyle}
					/>
				</Container>
			{/each}

			{#if !isReplay && bakedArt}
				<Sprite key="msWinUpTo" anchor={0.5} {...layout.win} />
			{:else if !isReplay}
				<ResponsiveText
					anchor={0.5}
					x={layout.win.x}
					y={layout.win.y}
					maxWidth={layout.win.width}
					text={fill(i18nDerived.winUpTo(), formatTimes(topMaxWin))}
					style={winUpToText(layout.win.height * 0.75)}
				/>
			{/if}
		</MainContainer>

		{#if !isReplay}
			<PressToContinue onpress={start} />
		{/if}
	</FadeContainer>
</Container>
