<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';

	import { BitmapText, Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { stateUrlDerived } from 'state-shared';

	import config from '../game/config';
	import { getContext } from '../game/context';
	import { displayFont, winUpToText } from '../game/textStyles';
	import { stateReplay, setReplayStartHandler } from '../game/stateReplay.svelte';
	import { fill, formatTimes } from '../i18n/format';
	import { i18nDerived, showsBakedArt, translateGame } from '../i18n/i18nDerived';
	import { CURTAIN_Z } from './Transition.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		/** the press: this screen fades out while Game.svelte brings in the closed curtains */
		onstart: () => void;
	};

	/**
	 * The intro, shown once the HTML boot loader (LoaderGame) is gone: the logo
	 * on top, four panels that explain the game at a glance, the WIN UP TO art and
	 * the prompt — one screen on every layout (a row of four on wide screens, 2x2
	 * on tablet and portrait). Reworked 2026-11-16 on Evtim's art and preview
	 * (art-review/chaoslab2/intro: steel-framed panel plates, a green paint swash
	 * under each title, an arched WIN UP TO, a prompt plate); the preview's mascot
	 * is left out at his word and the logo sits centred on top.
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

	type PanelId = 'anywhere' | 'multipliers' | 'bombs' | 'cashRespins';
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
		// Chaos Lab 2's feature (2026-11-03): Cash Respins replace Free Spins
		{
			id: 'cashRespins',
			title: 'CASH RESPINS',
			text: '4 or more Scatters start Cash Respins. Coins land, and Multipliers, Cloners and Bombs grow them.',
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
	// their copy is sized up to stay readable; desktop is ~1:1.
	// Fractions of the main height unless said: the logo's centre and height, the
	// panel block's band (top..bottom), the WIN UP TO art's height (it sits centred
	// between the block and the prompt plate), the prompt plate's width (of the main
	// width) and its margin from the bottom (units).
	// plate: 'tall' = the panel art stretched between its corners (four in a row),
	// 'wide' = the art as painted (2x2).
	const LAYOUTS = {
		desktop: { cols: 4, plate: 'tall', maxW: 300, text: 21, logoY: 0.105, logoH: 0.155, top: 0.215, bottom: 0.715, winH: 0.12, promptW: 0.31, promptMargin: 26 },
		landscape: { cols: 4, plate: 'tall', maxW: 362, text: 27, logoY: 0.1, logoH: 0.135, top: 0.19, bottom: 0.72, winH: 0.115, promptW: 0.31, promptMargin: 22 },
		tablet: { cols: 2, plate: 'wide', maxW: 300, text: 21, logoY: 0.075, logoH: 0.1, top: 0.15, bottom: 0.8, winH: 0.085, promptW: 0.44, promptMargin: 20 },
		portrait: { cols: 2, plate: 'wide', maxW: 352, text: 27, logoY: 0.095, logoH: 0.115, top: 0.195, bottom: 0.765, winH: 0.105, promptW: 0.78, promptMargin: 52 },
	} as const;
	const main = $derived(context.stateLayoutDerived.mainLayout());
	const spec = $derived(LAYOUTS[context.stateLayoutDerived.layoutType()] ?? LAYOUTS.desktop);
	// the one-row logo (logo_one_row.webp) on every layout: centred on top, at most
	// 62% of the width
	const LOGO_ROW_RATIO = 2209 / 701;
	const LOGO_ROW_WIDTH = 0.62;
	const GAP = 22;
	// width / height of the pieces (art-review/chaoslab2/intro/build_intro.py prints them)
	const PLATE_RATIO = { tall: 0.759, wide: 0.892 };
	const CAPTION_RATIO = 4.39;
	const PROMPT_RATIO = 5.333;
	// "WIN UP TO 31 445 X" (chaoslab2/intro/win_up_to.webp, arched): the Overcharged
	// Respins top win. Languages without the art (showsBakedArt) draw it as text
	// in the same box, the figure the top max win of all modes in config.
	const WIN_RATIO = 4.043;
	const bakedArt = showsBakedArt();
	const topMaxWin = Math.max(...Object.values(config.betModes).map((mode) => mode.max_win));

	const layout = $derived.by(() => {
		const { width: W, height: H, scale } = main;
		const cols = spec.cols;
		const rows = PANELS.length / cols;
		const top = H * spec.top;
		const bottom = H * spec.bottom;
		// the panel keeps its plate's aspect: as wide as the row allows, or as tall as the band does
		const ratio = PLATE_RATIO[spec.plate];
		const panelH = Math.min(
			Math.min((W * 0.93 - GAP * (cols - 1)) / cols, spec.maxW) / ratio,
			(bottom - top - GAP * (rows - 1)) / rows,
		);
		const panelW = panelH * ratio;
		const blockW = cols * panelW + (cols - 1) * GAP;
		const blockH = rows * panelH + (rows - 1) * GAP;
		const x0 = (W - blockW) / 2;
		const y0 = top + (bottom - top - blockH) / 2;
		const rowW = Math.min(W * LOGO_ROW_WIDTH, H * spec.logoH * LOGO_ROW_RATIO);
		// the prompt's container is bottom-aligned, so on a canvas taller than the main
		// layout the plate sits lower by the letterbox, and the WIN UP TO art follows
		const letterbox = Math.max(0, (context.stateLayoutDerived.canvasSizes().height - H * scale) / 2 / scale);
		const promptW = W * spec.promptW;
		const promptH = promptW / PROMPT_RATIO;
		const promptTop = H - spec.promptMargin - promptH + letterbox;
		const winH = Math.min(H * spec.winH, (W * 0.9) / WIN_RATIO, (promptTop - (y0 + blockH)) * 0.96);
		return {
			logo: { x: W / 2, y: H * spec.logoY, width: rowW, height: rowW / LOGO_ROW_RATIO },
			win: { x: W / 2, y: (y0 + blockH + promptTop) / 2, width: winH * WIN_RATIO, height: winH },
			// in the bottom-aligned container's own units (no letterbox)
			prompt: { x: W / 2, y: H - spec.promptMargin - promptH / 2, width: promptW, height: promptH },
			panelW,
			panelH,
			panels: PANELS.map((panel, i) => ({
				...panel,
				x: x0 + (i % cols) * (panelW + GAP) + panelW / 2,
				y: y0 + Math.floor(i / cols) * (panelH + GAP),
			})),
		};
	});

	// panel inner geometry, from the panel box: the art, the green swash with the
	// title on it (the swash is an arch: its middle sits higher than its ends, and
	// its upper edge tucks under the art), then the copy down to the frame
	const artH = $derived(Math.min(layout.panelH * 0.33, layout.panelW * 0.45));
	const artY = $derived(layout.panelH * 0.07 + artH / 2);
	const capW = $derived(layout.panelW * 0.93);
	const capH = $derived(capW / CAPTION_RATIO);
	const capTop = $derived(artY + artH / 2 - capH * 0.1);
	const titleY = $derived(capTop + capH * 0.41);
	const titleSize = $derived(capH * 0.46);
	const textY = $derived(capTop + capH * 0.95 + 4);
	const textBottom = $derived(layout.panelH * 0.915);

	/**
	 * The copy's size: the layout's, or smaller where a translation's wrapped
	 * lines would run past the panel's bottom (translations run up to ~40%
	 * longer than the English the panels were sized for; English keeps its
	 * size on every layout). One size for all four panels, found by wrapping
	 * the way Pixi does: at spaces, and per character where a word is wider
	 * than the line (breakWords: a CJK sentence has no spaces at all).
	 */
	// Scripts the display faces do not cover (Cyrillic, CJK, Arabic, Devanagari)
	// fall back whole to Inter / the system sans: bold there, or a title is too thin
	// on the green
	const fallbackScript = !stateUrlDerived.social() && ['ru', 'ja', 'zh', 'ko', 'ar', 'hi'].includes(stateUrlDerived.lang());
	const displayWeight = fallbackScript ? ('700' as const) : ('400' as const);
	// no letter spacing there either: Pixi draws spaced text glyph by glyph, which
	// breaks Arabic's joined letters and Devanagari's conjuncts
	const letterSpacing = fallbackScript ? 0 : 1;
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
		const width = layout.panelW * 0.84;
		const room = textBottom - textY;
		const texts = PANELS.map((panel) => translateGame(panel.text));
		for (let size = spec.text; size > spec.text * 0.7; size -= 0.5) {
			measure.font = `400 ${size}px Inter, sans-serif`;
			// a fallback script is set in a system face the measure only guesses at
			// (Devanagari ran a line past it): 10% in hand
			if (texts.every((text) => wrappedLines(text, width) * size * LINE_HEIGHT * (fallbackScript ? 1.1 : 1) <= room)) {
				return size;
			}
		}
		return spec.text * 0.7;
	});

	// dark on the green swash, no outline (the art's own look)
	const INK = '#0e1a06';
	const titleStyle = $derived({
		fontFamily: displayFont(),
		fontSize: titleSize,
		fontWeight: displayWeight,
		fill: INK,
		letterSpacing,
		align: 'center' as const,
	});
	const textStyle = $derived({
		fontFamily: ['Inter', 'sans-serif'],
		fontSize: textSize,
		fill: '#e8eedf',
		align: 'center' as const,
		lineHeight: textSize * LINE_HEIGHT,
		wordWrap: true,
		wordWrapWidth: layout.panelW * 0.84,
		breakWords: true,
	});

	// symbol art keeps each PNG's own aspect (symbols.json frame sizes)
	const SYM = { w: 297, h: 321 };
	const BONUS = { w: 427, h: 423 };
	const symW = (h: number) => (h * SYM.w) / SYM.h;
	// the WIN ANYWHERE panel's three symbols in a row: as tall as the row's width
	// allows inside the frame (three widths = 0.84 of the panel)
	const trioH = $derived(Math.min(artH * 0.86, (layout.panelW * 0.285 * SYM.h) / SYM.w));

	// the prompt: Evtim's plate with the line on it in the titles' face, dark on
	// the green, between two pairs of chevrons; the line and the chevrons breathe
	// (a fade, never a bounce). PressToContinue below only takes the press.
	const BREATH_MS = 900;
	const breath = new Tween(1, { duration: BREATH_MS, easing: sineInOut });
	onMount(() => {
		let bright = true;
		const id = setInterval(() => {
			bright = !bright;
			breath.set(bright ? 1 : 0.6);
		}, BREATH_MS);
		return () => clearInterval(id);
	});
	// one line at 0.4 of the plate's height, smaller if the translation is longer;
	// one that would fall under 0.27 goes on two lines instead, at the largest
	// size that wraps to two
	const promptLine = $derived(context.i18nDerived.pressToContinue());
	const promptWidth = $derived(layout.prompt.width * 0.66);
	const promptFit = $derived.by(() => {
		const h = layout.prompt.height;
		if (!fontsReady || !measure) return { size: h * 0.4, wrap: false };
		const font = (size: number) => `${displayWeight} ${size}px ${displayFont()}`;
		measure.font = font(h * 0.4);
		const width = measure.measureText(promptLine).width + promptLine.length * letterSpacing;
		const oneLine = Math.min(h * 0.4, (h * 0.4 * promptWidth) / width);
		if (oneLine >= h * 0.27) return { size: oneLine, wrap: false };
		for (let size = h * 0.26; size > h * 0.14; size -= h * 0.01) {
			measure.font = font(size);
			// 6% narrower than Pixi's own wrap width: the measure ignores the letter spacing
			if (wrappedLines(promptLine, promptWidth * 0.94) <= 2) return { size, wrap: true };
		}
		return { size: h * 0.14, wrap: true };
	});
	const promptStyle = $derived({
		fontFamily: displayFont(),
		fontSize: promptFit.size,
		fontWeight: displayWeight,
		fill: INK,
		letterSpacing,
		align: 'center' as const,
		lineHeight: promptFit.size * 1.08,
		wordWrap: promptFit.wrap,
		wordWrapWidth: promptWidth,
	});
	// two chevrons pointing along dir (1 = right), drawn round the origin, h tall
	const chevrons = (graphics: { clear: () => unknown; poly: (points: number[]) => { fill: (style: { color: number }) => unknown } }, h: number, dir: number) => {
		graphics.clear();
		const t = h * 0.3; // arm thickness along x
		const reach = h * 0.42; // how far the point leads the arms
		for (const offset of [-h * 0.34, h * 0.34]) {
			const x = offset * 1 - (reach + t) / 2;
			graphics
				.poly([x, -h / 2, x + t, -h / 2, x + t + reach, 0, x + t, h / 2, x, h / 2, x + reach, 0].map((v, i) => (i % 2 ? v : v * dir)))
				.fill({ color: 0x0e1a06 });
		}
	};
</script>

<Container zIndex={CURTAIN_Z + 1}>
	<FadeContainer {show}>
		<!-- the lab stays visible behind the plates -->
		<CanvasSizeRectangle backgroundColor={0x050805} backgroundAlpha={0.55} />

		<MainContainer>
			<Sprite key="msLogoRow" anchor={0.5} {...layout.logo} />

			{#each isReplay ? [] : layout.panels as panel (panel.id)}
				<Container x={panel.x} y={panel.y}>
					<Sprite
						key={spec.plate === 'tall' ? 'cl2IntroPanelTall' : 'cl2IntroPanel'}
						anchor={{ x: 0.5, y: 0 }}
						width={layout.panelW}
						height={layout.panelH}
					/>

					<Container y={artY}>
						{#if panel.id === 'anywhere'}
							<!-- three highs side by side, each one whole (Evtim 2026-11-16: fanned
							     behind the middle one they were "cut off"): the outer two lean
							     out a little and tuck a sliver under the middle one, which is a
							     touch bigger; the row sits on the swash -->
							<Container y={(artH - trioH * 1.08) / 2}>
								<Sprite key="h2.png" anchor={0.5} x={-symW(trioH) * 0.98} y={trioH * 0.03} rotation={-0.09} width={symW(trioH)} height={trioH} />
								<Sprite key="h3.png" anchor={0.5} x={symW(trioH) * 0.98} y={trioH * 0.03} rotation={0.09} width={symW(trioH)} height={trioH} />
								<Sprite key="h1.png" anchor={0.5} width={symW(trioH * 1.08)} height={trioH * 1.08} />
							</Container>
						{:else if panel.id === 'multipliers'}
							<Sprite key="mult_symbol_plate.png" anchor={0.5} width={symW(artH)} height={artH} />
							<BitmapText
								anchor={0.5}
								text="x10"
								style={{ fontFamily: 'tickup-multipliers', fontSize: artH * 0.36, fill: 0xffffff }}
							/>
						{:else if panel.id === 'bombs'}
							<Sprite key="bomb.png" anchor={0.5} x={-symW(artH) * 0.56} rotation={-0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
							<Sprite key="cloner.png" anchor={0.5} x={symW(artH) * 0.56} rotation={0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
						{:else}
							<!-- the trigger and what it brings: a Scatter beside a Coin -->
							<Sprite
								key="bonus.png"
								anchor={0.5}
								x={-symW(artH) * 0.52}
								rotation={-0.08}
								width={(artH * 0.98 * BONUS.w) / BONUS.h}
								height={artH * 0.98}
							/>
							<!-- the gold coin (433x478), its value on the disc as CashFace draws it -->
							<Container x={symW(artH) * 0.56} rotation={0.08}>
								<Sprite key="cl2CoinGold" anchor={0.5} width={(artH * 0.94 * 433) / 478} height={artH * 0.94} />
								<BitmapText
									anchor={0.5}
									y={(artH * 0.94 * 6) / 478}
									text="5x"
									style={{ fontFamily: 'cl2-coin', fontSize: artH * 0.34, fill: 0xffffff }}
								/>
							</Container>
						{/if}
					</Container>

					<!-- the title on its paint swash, over the art's lower edge -->
					<Sprite key="cl2IntroCaption" anchor={{ x: 0.5, y: 0 }} y={capTop} width={capW} height={capH} />
					<ResponsiveText
						anchor={0.5}
						y={titleY}
						maxWidth={capW * 0.8}
						text={translateGame(panel.title)}
						style={titleStyle}
					/>
					<Text
						anchor={{ x: 0.5, y: 0 }}
						y={textY}
						text={translateGame(panel.text)}
						style={textStyle}
					/>
				</Container>
			{/each}

			{#if !isReplay && bakedArt}
				<Sprite key="cl2WinUpTo" anchor={0.5} {...layout.win} />
			{:else if !isReplay}
				<ResponsiveText
					anchor={0.5}
					x={layout.win.x}
					y={layout.win.y}
					maxWidth={layout.win.width}
					text={fill(i18nDerived.winUpTo(), formatTimes(topMaxWin))}
					style={{ ...winUpToText(layout.win.height * 0.6), letterSpacing }}
				/>
			{/if}
		</MainContainer>

		{#if !isReplay}
			<MainContainer alignVertical="bottom">
				<Container x={layout.prompt.x} y={layout.prompt.y}>
					<Sprite key="cl2IntroPrompt" anchor={0.5} width={layout.prompt.width} height={layout.prompt.height} />
					<!-- the plate's green field is centred a touch above the art's middle
					     (its shadow hangs below) -->
					<Container y={-layout.prompt.height * 0.01} alpha={breath.current}>
						<ResponsiveText
							anchor={0.5}
							maxWidth={promptWidth}
							text={promptLine}
							style={promptStyle}
						/>
						{#each [-1, 1] as side (side)}
							<Graphics
								x={side * layout.prompt.width * 0.395}
								draw={(graphics) => chevrons(graphics, layout.prompt.height * 0.24, -side)}
							/>
						{/each}
					</Container>
				</Container>
			</MainContainer>
			<PressToContinue onpress={start} showText={false} />
		{/if}
	</FadeContainer>
</Container>
