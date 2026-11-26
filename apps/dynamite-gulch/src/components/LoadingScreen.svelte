<script lang="ts">
	import { onMount } from 'svelte';

	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';

	import { BitmapText, Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { stateUrlDerived } from 'state-shared';

	import config from '../game/config';
	import { artOverflow, artOverflowX } from '../game/constants';
	import { getContext } from '../game/context';
	import { displayFont } from '../game/textStyles';
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
	 * The intro, shown once the HTML boot loader (LoaderGame) is gone: the logo,
	 * four parchment panels that explain the game at a glance (pictures, a title
	 * on its ribbon, the copy), WIN UP TO on the curved plank and the prompt on its
	 * yellow plate, over the game's own street (Evtim's plates and preview,
	 * 2026-11-16: iCloud MyDrive/dynamite gulch/intro, packed by art-review/
	 * dynamite-gulch/rework/build_ink_intro.py; Blast Shaft's pattern). One screen
	 * on every layout: 2x2 on portrait and tablet as in his preview, a row of four
	 * on wide screens.
	 * A press fades it out over the closed curtains (Game.svelte startGame), which
	 * then open on the game. Sits above the curtains' layer.
	 *
	 * Copy is short and social-safe (no pay/bet/buy); English keys, translated
	 * through the game's messagesMap.
	 *
	 * Replay mode (Kraken's pattern): only the dimmed street and the logo; no
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
			['32px Rye', '32px "Black Ops One"', '400 32px Inter', '700 32px Inter'].map((face) =>
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

	// ---- layout ----
	// The panels are placed in the ART's pixels and scaled as one block (`k`
	// main-layout units per art pixel); the logo, the plank and the prompt each fit
	// their own band. Frames are the pieces cropped to their ink (intro.json).
	const PLATE = { w: 450, h: 579 };
	const PITCH = { x: 470, y: 597 }; // plate to plate: a 20 / 18 px gap
	const CAPTION = { w: 419, h: 128, faceY: -10 }; // the ribbon's band sits above its tails
	const PLANK = { w: 921, h: 262, faceY: -15 };
	const PROMPT = { w: 910, h: 172 };
	// win_up_to.png: 1400x255, drawn 770 art pixels wide on the plank
	const WIN = { w: 770, h: (770 * 255) / 1400 };
	const BLOCKS = {
		4: { w: PITCH.x * 3 + PLATE.w, h: PLATE.h, at: (i: number) => ({ x: PITCH.x * i, y: 0 }) },
		2: { w: PITCH.x + PLATE.w, h: PITCH.y + PLATE.h, at: (i: number) => ({ x: PITCH.x * (i % 2), y: PITCH.y * Math.floor(i / 2) }) },
	};
	// Bands as fractions of the main height: the logo (centre, height), the panel
	// block between top and bottom (never wider than maxW of the width), the plank
	// and the prompt (centre, height). Main layouts: desktop / landscape 1920x1080,
	// tablet 1920x1920, portrait 1080x1920.
	const LAYOUTS = {
		desktop: { cols: 4, logoY: 0.092, logoH: 0.2, top: 0.19, bottom: 0.67, maxW: 0.93, plankY: 0.768, plankH: 0.165, pressY: 0.918, pressH: 0.095 },
		landscape: { cols: 4, logoY: 0.085, logoH: 0.185, top: 0.172, bottom: 0.682, maxW: 0.95, plankY: 0.774, plankH: 0.16, pressY: 0.92, pressH: 0.1 },
		tablet: { cols: 2, logoY: 0.07, logoH: 0.15, top: 0.142, bottom: 0.712, maxW: 0.92, plankY: 0.788, plankH: 0.125, pressY: 0.905, pressH: 0.075 },
		portrait: { cols: 2, logoY: 0.082, logoH: 0.15, top: 0.158, bottom: 0.716, maxW: 0.9, plankY: 0.796, plankH: 0.115, pressY: 0.9, pressH: 0.07 },
	} as const;
	const main = $derived(context.stateLayoutDerived.mainLayout());
	const spec = $derived(LAYOUTS[context.stateLayoutDerived.layoutType()] ?? LAYOUTS.desktop);
	// logo_one_row.webp: 2209x701 with the hat above the lettering; every layout
	// shows it, as his preview does (logoH is the whole canvas, hat included)
	const LOGO_ROW_RATIO = 2209 / 701;
	// "WIN UP TO 31 445 X": the Motherlode Respins top win, his arched lettering.
	// English and social only (showsBakedArt), and only while that is the game's
	// top max win: otherwise the words are text on the same plank
	const bakedArt = showsBakedArt();
	const topMaxWin = Math.max(...Object.values(config.betModes).map((mode) => mode.max_win));
	const winArt = bakedArt && topMaxWin === 31445;

	// the street behind the plates, blurred and shaded a bit so the plates stand off
	// it (Evtim 2026-11-16): the game's own backgrounds blurred by the builder
	// (build_ink_intro.py backdrops(): no filter here), cover-fitted like
	// Background.svelte does (the portrait cut on upright canvases)
	const SHADE = 0.34;
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const backdrop = $derived.by(() => {
		const key = canvas.height > canvas.width ? 'dgIntroBgPortrait' : 'dgIntroBg';
		const texture = context.stateApp.loadedAssets?.[key] as { width?: number; height?: number } | undefined;
		const width = texture?.width || 3;
		const height = texture?.height || 2;
		const scale = Math.max(canvas.width / width, canvas.height / height);
		return { key, x: canvas.width / 2, y: canvas.height / 2, width: width * scale, height: height * scale };
	});

	const layout = $derived.by(() => {
		const { width: W, height: H } = main;
		const block = BLOCKS[spec.cols];
		const room = H * (spec.bottom - spec.top);
		const k = Math.min((W * spec.maxW) / block.w, room / block.h);
		const logoW = Math.min(W * 0.88, H * spec.logoH * LOGO_ROW_RATIO);
		return {
			k,
			block,
			x0: (W - block.w * k) / 2,
			y0: H * spec.top + (room - block.h * k) / 2,
			logo: { x: W / 2, y: H * spec.logoY, width: logoW, height: logoW / LOGO_ROW_RATIO },
			plank: { x: W / 2, y: H * spec.plankY, k: Math.min((H * spec.plankH) / PLANK.h, (W * 0.9) / PLANK.w) },
			press: { x: W / 2, y: H * spec.pressY, k: Math.min((H * spec.pressH) / PROMPT.h, (W * 0.88) / PROMPT.w) },
		};
	});

	// panel inner geometry, in the plate's own pixels (his preview): the pictures,
	// the title ribbon over their feet, then up to 4 lines of copy
	const ART_Y = 148;
	const ART_H = 192;
	const CAPTION_Y = 306;
	const TEXT_Y = 384;
	const TEXT_BOTTOM = 540;
	const TEXT_W = 372;

	/**
	 * The copy's size: 30 art pixels (the preview's), or smaller where a
	 * translation's wrapped lines would run past the plate's bottom (translations
	 * run up to ~40% longer than the English the panels were sized for; English
	 * keeps its size on every layout). One size for all four panels, found by
	 * wrapping the way Pixi does: at spaces, and per character where a word is
	 * wider than the line (breakWords: a CJK sentence has no spaces at all).
	 * Measured in art pixels, drawn at k times that (a Text is never scaled).
	 */
	const TEXT_SIZE = 30;
	const LINE_HEIGHT = 1.2;
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
		if (!fontsReady || !measure) return TEXT_SIZE;
		const texts = PANELS.map((panel) => translateGame(panel.text));
		// Chinese, Japanese and Korean fall back to a system face whose lines sit lower
		// and fuller than Inter's: they get less of the room (Blast Shaft: ja ran over)
		const dense = texts.some((text) => /[　-鿿가-힯]/.test(text));
		const room = (TEXT_BOTTOM - TEXT_Y) * (dense ? 0.84 : 1);
		for (let size = TEXT_SIZE; size > TEXT_SIZE * 0.62; size -= 0.5) {
			measure.font = `700 ${size}px Inter, sans-serif`;
			if (texts.every((text) => wrappedLines(text, TEXT_W) * size * LINE_HEIGHT <= room)) {
				return size;
			}
		}
		return TEXT_SIZE * 0.62;
	});

	// ink on parchment and on the yellow plate: the titles and the prompt
	const INK = '#3a1d0a';
	const inked = (fontSize: number) => ({
		fontFamily: displayFont(),
		fontSize,
		fill: INK,
		letterSpacing: 1,
		align: 'center' as const,
	});
	// the plank's words where his lettering does not apply: its gold, an ink line
	const golden = (fontSize: number) => ({
		fontFamily: displayFont(),
		fontSize,
		fill: '#fdb913',
		letterSpacing: 1,
		align: 'center' as const,
		stroke: { color: '#1c0d05', width: Math.max(3, fontSize * 0.14), join: 'round' as const },
	});
	const textStyle = $derived({
		fontFamily: ['Inter', 'sans-serif'],
		fontWeight: '700' as const,
		fontSize: textSize * layout.k,
		fill: '#4a2a12',
		align: 'center' as const,
		lineHeight: textSize * layout.k * LINE_HEIGHT,
		wordWrap: true,
		wordWrapWidth: TEXT_W * layout.k,
		breakWords: true,
	});

	// the prompt breathes on its plate (a fade, never a bounce), as PressToContinue's does
	const BREATH_MS = 900;
	const promptAlpha = new Tween(1, { duration: BREATH_MS, easing: sineInOut });
	onMount(() => {
		let bright = true;
		const id = setInterval(() => {
			bright = !bright;
			promptAlpha.set(bright ? 1 : 0.5);
		}, BREATH_MS);
		return () => clearInterval(id);
	});
	// the two chevrons each side of the prompt, in its ink, pointing in at the words
	// as in his preview (drawn pointing right; the right-hand pair is mirrored)
	const chevrons = (graphics: { poly: Function; fill: Function }) => {
		for (const x of [0, 26]) {
			graphics.poly([x - 12, -24, x + 12, 0, x - 12, 24, x - 24, 24, x, 0, x - 24, -24]).fill({ color: 0x3a1d0a });
		}
	};

	// symbol art keeps each PNG's own aspect (symbols.json frame sizes)
	const SYM = { w: 297, h: 321 };
	const symW = (h: number) => (h * SYM.w) / SYM.h;
	// WIN ANYWHERE's three highs: the side ones' centres (in symbol widths from the middle),
	// their size and the middle one's (of the art band's height), the side ones' lean
	const FAN = { spread: 0.7, side: 0.84, middle: 0.92, tilt: 0.09 };
</script>

<Container zIndex={CURTAIN_Z + 1}>
	<FadeContainer {show}>
		<!-- the street, blurred, under a shade (replay: shaded further, the HTML card
		     sits over it) -->
		<Sprite key={backdrop.key} anchor={0.5} x={backdrop.x} y={backdrop.y} width={backdrop.width} height={backdrop.height} />
		<CanvasSizeRectangle backgroundColor={0x1a0d05} backgroundAlpha={isReplay ? 0.62 : SHADE} />

		<MainContainer>
			<Sprite key="msLogoRow" anchor={0.5} {...layout.logo} />

			{#if !isReplay}
				{@const k = layout.k}
				<Container x={layout.x0} y={layout.y0}>
					{#each PANELS as panel, i (panel.id)}
						{@const at = layout.block.at(i)}
						{@const artH = ART_H * k}
						<Container x={(at.x + PLATE.w / 2) * k} y={at.y * k}>
							<Sprite key="plate.png" anchor={{ x: 0.5, y: 0 }} width={PLATE.w * k} height={PLATE.h * k} />

							<Container y={ART_Y * k}>
								{#if panel.id === 'anywhere'}
									<!-- three highs, the middle one in front; the side ones stand out from behind it
									     far enough to show their faces (Evtim, 2026-11-16: "spread the left and
									     right just a bit ... the middle h1 is covering most of them") -->
									<Sprite key="h2.png" anchor={0.5} x={-symW(artH) * FAN.spread} y={artH * 0.05} rotation={-FAN.tilt} width={symW(artH * FAN.side)} height={artH * FAN.side * artOverflow('h2')} />
									<Sprite key="h3.png" anchor={0.5} x={symW(artH) * FAN.spread} y={artH * 0.05} rotation={FAN.tilt} width={symW(artH * FAN.side)} height={artH * FAN.side * artOverflow('h3')} />
									<Sprite key="h1.png" anchor={0.5} width={symW(artH * FAN.middle) * artOverflowX('h1')} height={artH * FAN.middle * artOverflow('h1')} />
								{:else if panel.id === 'multipliers'}
									<Sprite key="mult_symbol_plate.png" anchor={0.5} width={symW(artH * 1.08)} height={artH * 1.08} />
									<BitmapText
										anchor={0.5}
										text="x10"
										style={{ fontFamily: 'tickup-multipliers', fontSize: artH * 0.56, fill: 0xffffff }}
									/>
								{:else if panel.id === 'bombs'}
									<Sprite key="bomb.png" anchor={0.5} x={-symW(artH) * 0.54} rotation={-0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
									<Sprite key="cloner.png" anchor={0.5} x={symW(artH) * 0.54} rotation={0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
								{:else}
									<!-- the trigger and what it brings: a Scatter beside a Coin -->
									<Sprite key="bonus.png" anchor={0.5} x={-symW(artH) * 0.5} rotation={-0.08} width={symW(artH * 0.94) * artOverflowX('bonus')} height={artH * 0.94 * artOverflow('bonus')} />
									<!-- the gold coin (433x478), its value on the disc as CashFace draws it -->
									<Container x={symW(artH) * 0.54} rotation={0.08}>
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

							<!-- the title on its ribbon -->
							<Container y={CAPTION_Y * k}>
								<Sprite key="caption.png" anchor={0.5} width={CAPTION.w * k} height={CAPTION.h * k} />
								<ResponsiveText
									anchor={0.5}
									y={CAPTION.faceY * k}
									maxWidth={CAPTION.w * 0.78 * k}
									text={translateGame(panel.title)}
									style={inked(40 * k)}
								/>
							</Container>
							<Text anchor={{ x: 0.5, y: 0 }} y={TEXT_Y * k} text={translateGame(panel.text)} style={textStyle} />
						</Container>
					{/each}
				</Container>

				<!-- WIN UP TO on the curved plank -->
				{@const wk = layout.plank.k}
				<Container x={layout.plank.x} y={layout.plank.y}>
					<Sprite key="plank.png" anchor={0.5} width={PLANK.w * wk} height={PLANK.h * wk} />
					{#if winArt}
						<Sprite key="win_up_to.png" anchor={0.5} y={PLANK.faceY * wk} width={WIN.w * wk} height={WIN.h * wk} />
					{:else}
						<ResponsiveText
							anchor={0.5}
							y={PLANK.faceY * wk}
							maxWidth={760 * wk}
							text={fill(i18nDerived.winUpTo(), formatTimes(topMaxWin))}
							style={golden(86 * wk)}
						/>
					{/if}
				</Container>

				<!-- the prompt on its plate -->
				{@const pk = layout.press.k}
				<Container x={layout.press.x} y={layout.press.y}>
					<Sprite key="prompt.png" anchor={0.5} width={PROMPT.w * pk} height={PROMPT.h * pk} />
					<Container alpha={promptAlpha.current}>
						<ResponsiveText
							anchor={0.5}
							maxWidth={710 * pk}
							text={i18nDerived.pressToContinue()}
							style={{ ...inked(56 * pk), letterSpacing: 0 }}
						/>
						<Graphics x={-404 * pk} scale={pk * 0.8} draw={chevrons} />
						<Graphics x={404 * pk} scale={{ x: -pk * 0.8, y: pk * 0.8 }} draw={chevrons} />
					</Container>
				</Container>
			{/if}
		</MainContainer>

		{#if !isReplay}
			<!-- the tap / Space handling only: the prompt is the plate above -->
			<PressToContinue onpress={start} showText={false} />
		{/if}
	</FadeContainer>
</Container>
