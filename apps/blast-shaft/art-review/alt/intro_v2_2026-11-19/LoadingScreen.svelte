<script lang="ts">
	import { onMount } from 'svelte';

	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';

	import { BitmapText, Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';

	import config from '../game/config';
	import { getContext } from '../game/context';
	import { displayFont } from '../game/textStyles';
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
	 * The intro, shown once the HTML boot loader (LoaderGame) is gone: the logo
	 * on its plank, four framed timber panels that explain the game at a glance,
	 * the WIN UP TO plank hanging from them on chains, and the prompt on its plate
	 * (Evtim's plates and lettering, 2026-11-16: iCloud MyDrive/blast shaft/intro,
	 * packed by art-review/blast-shaft/build_intro.py). One screen on every layout:
	 * 2x2 on portrait and tablet as in his preview, a row of four on wide screens
	 * with the plank under the middle pair.
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
	// art: the title's English lettering (frame, its size in the art's pixels and
	// how far its ink sits off the frame's middle)
	type Lettering = { key: string; w: number; h: number; dx: number; dy: number };
	const PANELS: { id: PanelId; title: string; art: Lettering; text: string }[] = [
		{
			id: 'anywhere',
			title: 'WIN ANYWHERE',
			art: { key: 'bs_i_t_wa.png', w: 346, h: 58, dx: 0.5, dy: 3.5 },
			text: '8 or more of a symbol anywhere win. Winners tumble away and new symbols drop in.',
		},
		{
			id: 'multipliers',
			title: 'MULTIPLIERS',
			art: { key: 'bs_i_t_m.png', w: 311, h: 54, dx: 1, dy: 0 },
			text: 'Collected into one total that multiplies every win after it.',
		},
		{
			id: 'bombs',
			title: 'BOMBS & CLONERS',
			art: { key: 'bs_i_t_bc.png', w: 353, h: 57, dx: -0.5, dy: 1 },
			text: 'Bombs blast their area and leave a Wild. Cloners turn symbols into copies of one.',
		},
		{
			id: 'freeSpins',
			title: 'FREE SPINS',
			art: { key: 'bs_i_t_fs.png', w: 280, h: 55, dx: 0.5, dy: -0.5 },
			text: '4 or more Scatters award 10 to 20 Free Spins. The multiplier keeps growing.',
		},
	];

	let started = $state(false);
	// Pixi Text rasterises with whatever face is resolved at its first draw, so the
	// copy waits for the self-hosted fonts as well as the assets
	let fontsReady = $state(false);
	onMount(() => {
		Promise.all(
			['32px "Alfa Slab One"', '32px "Black Ops One"', '400 32px Inter', '700 32px Inter'].map((face) =>
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
	// Everything is placed in the ART's pixels and scaled as one block (`k` main-layout
	// units per art pixel), so the panels, the chains and the plank stay joined.
	// bs_i_sp = one panel (425x449); bs_i_dp = two panels at the same pitch with the
	// plank hanging under them (875x687).
	const PANEL = { w: 425, h: 449 };
	const PITCH = 430; // panel to panel, as bs_i_dp draws its two
	const DOUBLE = { w: 875, h: 687, panelX: 2, plankX: 427.5, plankY: 582 };
	const BLOCKS = {
		// a row of four: panel, the double (panels 2 + 3, the plank under them), panel
		4: {
			w: PITCH * 3 + PANEL.w,
			h: DOUBLE.h,
			panels: [0, 1, 2, 3].map((i) => ({ x: PITCH * i, y: 0 })),
			singles: [0, 3],
			double: { x: PITCH - DOUBLE.panelX, y: -1 },
		},
		// two rows: two panels, then the double
		2: {
			w: PITCH + PANEL.w,
			h: PANEL.h + 3 + DOUBLE.h,
			panels: [0, 1, 2, 3].map((i) => ({ x: PITCH * (i % 2), y: i < 2 ? 0 : PANEL.h + 4 })),
			singles: [0, 1],
			double: { x: -DOUBLE.panelX, y: PANEL.h + 3 },
		},
	};
	// Bands as fractions of the main height: the logo plank (centre, height), the
	// block between top and bottom (never wider than maxW of the width), the prompt
	// plate (centre, height).
	const LAYOUTS = {
		desktop: { cols: 4, logoY: 0.105, logoH: 0.17, top: 0.212, bottom: 0.85, maxW: 0.93, pressY: 0.928, pressH: 0.1 },
		landscape: { cols: 4, logoY: 0.09, logoH: 0.145, top: 0.172, bottom: 0.862, maxW: 0.95, pressY: 0.93, pressH: 0.1 },
		tablet: { cols: 2, logoY: 0.062, logoH: 0.1, top: 0.122, bottom: 0.868, maxW: 0.92, pressY: 0.932, pressH: 0.085 },
		portrait: { cols: 2, logoY: 0.072, logoH: 0.102, top: 0.136, bottom: 0.846, maxW: 0.95, pressY: 0.902, pressH: 0.078 },
	} as const;
	const main = $derived(context.stateLayoutDerived.mainLayout());
	const spec = $derived(LAYOUTS[context.stateLayoutDerived.layoutType()] ?? LAYOUTS.desktop);
	// the plates' own sizes (art pixels) and where their dark face is
	const LOGO_PLATE = { w: 824, h: 200, faceY: -8 };
	const PRESS_PLATE = { w: 822, h: 141, faceY: -4.5 };
	const CAPTION = { w: 403, h: 75 };
	// logo_one_row.webp: 2172x724, the lettering in rows 209..514 (Blast Drop)
	const LOGO_ROW_RATIO = 2172 / 724;
	// the lettering's width on the plank, of the plank's width. The face between the
	// iron brackets is 0.78 of it: 0.8 ran over the brackets (Evtim, 2026-11-17: "I dont
	// like the text being so spilled out, reduce only the text so it fits the frame")
	const LOGO_ON_PLANK = 0.64;
	// the English lettering (showsBakedArt); the other languages draw the same
	// words as text on the same plates
	const bakedArt = showsBakedArt();
	const topMaxWin = Math.max(...Object.values(config.betModes).map((mode) => mode.max_win));
	// bs_i_t_wut.png says 22 924X: only while that is the game's top max win
	const WIN_UP_TO = { key: 'bs_i_t_wut.png', w: 769, h: 103, dx: 16.5, dy: -4.5 };
	const winArt = bakedArt && topMaxWin === 22924;
	const PRESS = { key: 'bs_i_t_patc.png', w: 802, h: 77, dx: 0.5, dy: -2, ink: 682 };

	const layout = $derived.by(() => {
		const { width: W, height: H } = main;
		const block = BLOCKS[spec.cols];
		const top = H * spec.top;
		const k = Math.min((W * spec.maxW) / block.w, (H * (spec.bottom - spec.top)) / block.h);
		const x0 = (W - block.w * k) / 2;
		const y0 = top + (H * (spec.bottom - spec.top) - block.h * k) / 2;
		const logoH = H * spec.logoH;
		const pressK = Math.min((H * spec.pressH) / PRESS_PLATE.h, (W * 0.9) / PRESS_PLATE.w);
		return {
			k,
			x0,
			y0,
			block,
			logo: { x: W / 2, y: H * spec.logoY, k: Math.min(logoH / LOGO_PLATE.h, (W * 0.86) / LOGO_PLATE.w) },
			win: { x: x0 + (block.double.x + DOUBLE.plankX) * k, y: y0 + (block.double.y + DOUBLE.plankY) * k },
			press: { x: W / 2, y: H * spec.pressY, k: pressK },
			panelW: PANEL.w * k,
			panelH: PANEL.h * k,
		};
	});

	// panel inner geometry, in the panel's own pixels (his preview): the symbols,
	// the caption plate, then up to 4 lines of copy down to the frame's bottom rail
	const ART_Y = 126;
	const ART_H = 146;
	const CAPTION_Y = 246;
	const TEXT_Y = 291;
	const TEXT_BOTTOM = 410;
	const TEXT_W = 322;

	/**
	 * The copy's size: 24 art pixels (the preview's), or smaller where a
	 * translation's wrapped lines would run past the panel's bottom rail
	 * (translations run up to ~40% longer than the English the panels were sized
	 * for; English keeps its size on every layout). One size for all four panels,
	 * found by wrapping the way Pixi does: at spaces, and per character where a
	 * word is wider than the line (breakWords: a CJK sentence has no spaces at all).
	 * Measured in art pixels, drawn at k times that (a Text is never scaled).
	 */
	const TEXT_SIZE = 24;
	const LINE_HEIGHT = 1.22;
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
		const texts = PANELS.map((panel) => stateI18nDerived.translate(panel.text));
		// Chinese, Japanese and Korean fall back to a system face whose lines sit lower
		// and fuller than Inter's: they get less of the room (measured: ja ran onto the rail)
		const dense = texts.some((text) => /[\u3000-\u9fff\uac00-\ud7af]/.test(text));
		const room = (TEXT_BOTTOM - TEXT_Y) * (dense ? 0.84 : 1);
		for (let size = TEXT_SIZE; size > TEXT_SIZE * 0.62; size -= 0.5) {
			measure.font = `400 ${size}px Inter, sans-serif`;
			if (texts.every((text) => wrappedLines(text, TEXT_W) * size * LINE_HEIGHT <= room)) {
				return size;
			}
		}
		return TEXT_SIZE * 0.62;
	});

	// the lettering's colours, for the words drawn as text
	const lettering = (fontSize: number) => ({
		fontFamily: displayFont(),
		fontSize,
		fill: '#f6b01c',
		letterSpacing: 1,
		align: 'center' as const,
		stroke: { color: '#3a1c06', width: Math.max(2, fontSize * 0.1) },
		dropShadow: { color: '#000000', alpha: 0.7, blur: 2, distance: Math.max(1, fontSize * 0.06), angle: Math.PI / 2 },
	});
	const textStyle = $derived({
		fontFamily: ['Inter', 'sans-serif'],
		fontSize: textSize * layout.k,
		fill: '#f3ead8',
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
			promptAlpha.set(bright ? 1 : 0.55);
		}, BREATH_MS);
		return () => clearInterval(id);
	});
	// the two chevrons each side of the prompt, in the lettering's gold; both point
	// right, as in his preview
	const chevrons = (graphics: { poly: Function; fill: Function; stroke: Function }) => {
		for (const x of [0, 19]) {
			graphics
				.poly([x, -15, x + 15, 0, x, 15, x - 8, 15, x + 7, 0, x - 8, -15])
				.fill({ color: 0xf6b01c })
				.stroke({ width: 2.5, color: 0x3a1c06 });
		}
	};

	// The panels' symbols are the intro atlas's own bs_i_sym_* frames: the game's symbol
	// art at twice the board's size (Evtim, 2026-11-18: the intro's symbols were "a bit
	// blurry": it drew the board's 297x321 sprites enlarged). Same proportions.
	// symbol art keeps each PNG's own aspect (symbols.json frame sizes)
	const SYM = { w: 297, h: 321 };
	const BONUS = SYM; // the Scatter is a tile symbol like the rest since 2026-11-13
	const symW = (h: number) => (h * SYM.w) / SYM.h;
</script>

<Container zIndex={CURTAIN_Z + 1}>
	<FadeContainer {show}>
		<!-- the mine stays faintly visible behind the plates -->
		<CanvasSizeRectangle backgroundColor={0x070504} backgroundAlpha={0.74} />

		<MainContainer>
			<!-- the logo on its plank -->
			<Container x={layout.logo.x} y={layout.logo.y}>
				<Sprite key="bs_i_lp.png" anchor={0.5} width={LOGO_PLATE.w * layout.logo.k} height={LOGO_PLATE.h * layout.logo.k} />
				<Sprite
					key="msLogoRow"
					anchor={0.5}
					y={LOGO_PLATE.faceY * layout.logo.k}
					width={LOGO_PLATE.w * LOGO_ON_PLANK * layout.logo.k}
					height={(LOGO_PLATE.w * LOGO_ON_PLANK * layout.logo.k) / LOGO_ROW_RATIO}
				/>
			</Container>

			{#if !isReplay}
				{@const k = layout.k}
				<Container x={layout.x0} y={layout.y0}>
					<!-- The plates in a container of their own, under the contents: a layout
					     change (resize, rotation) mounts a single plate anew, and pixi-svelte
					     appends a new child at the END of its parent, so in the shared
					     container it landed over its card's contents and the card read empty -->
					<Container>
					{#each layout.block.singles as i (i)}
						<Sprite
							key="bs_i_sp.png"
							x={layout.block.panels[i].x * k}
							y={layout.block.panels[i].y * k}
							width={PANEL.w * k}
							height={PANEL.h * k}
						/>
					{/each}
					<Sprite
						key="bs_i_dp.png"
						x={layout.block.double.x * k}
						y={layout.block.double.y * k}
						width={DOUBLE.w * k}
						height={DOUBLE.h * k}
					/>
					</Container>

					{#each PANELS as panel, i (panel.id)}
						{@const artH = ART_H * k}
						<Container x={(layout.block.panels[i].x + PANEL.w / 2) * k} y={layout.block.panels[i].y * k}>
							<Container y={ART_Y * k}>
								{#if panel.id === 'anywhere'}
									<!-- three highs side by side, barely overlapping, the middle one in front -->
									<Sprite key="bs_i_sym_h2.png" anchor={0.5} x={-symW(artH) * 0.82} y={artH * 0.03} rotation={-0.05} width={symW(artH * 0.9)} height={artH * 0.9} />
									<Sprite key="bs_i_sym_h3.png" anchor={0.5} x={symW(artH) * 0.82} y={artH * 0.03} rotation={0.05} width={symW(artH * 0.9)} height={artH * 0.9} />
									<Sprite key="bs_i_sym_h1.png" anchor={0.5} width={symW(artH)} height={artH} />
								{:else if panel.id === 'multipliers'}
									<Sprite key="bs_i_sym_mult.png" anchor={0.5} width={symW(artH)} height={artH} />
									<BitmapText
										anchor={0.5}
										text="x10"
										style={{ fontFamily: 'tickup-multipliers', fontSize: artH * 0.5, fill: 0xffffff }}
									/>
								{:else if panel.id === 'bombs'}
									<Sprite key="bs_i_sym_bomb.png" anchor={0.5} x={-symW(artH) * 0.56} rotation={-0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
									<Sprite key="bs_i_sym_cloner.png" anchor={0.5} x={symW(artH) * 0.56} rotation={0.08} width={symW(artH * 0.94)} height={artH * 0.94} />
								{:else}
									<Sprite key="bs_i_sym_bonus.png" anchor={0.5} width={(artH * BONUS.w) / BONUS.h} height={artH} />
								{/if}
							</Container>

							<!-- the title on its caption plate -->
							<Container y={CAPTION_Y * k}>
								<Sprite key="bs_i_cp.png" anchor={0.5} width={CAPTION.w * k} height={CAPTION.h * k} />
								{#if bakedArt}
									<Sprite
										key={panel.art.key}
										anchor={0.5}
										x={panel.art.dx * k}
										y={panel.art.dy * k}
										width={panel.art.w * k}
										height={panel.art.h * k}
									/>
								{:else}
									<ResponsiveText
										anchor={0.5}
										maxWidth={CAPTION.w * 0.8 * k}
										text={stateI18nDerived.translate(panel.title)}
										style={lettering(40 * k)}
									/>
								{/if}
							</Container>
							<Text
								anchor={{ x: 0.5, y: 0 }}
								y={TEXT_Y * k}
								text={stateI18nDerived.translate(panel.text)}
								style={textStyle}
							/>
						</Container>
					{/each}
				</Container>

				<!-- WIN UP TO on the hanging plank -->
				{#if winArt}
					<Sprite
						key={WIN_UP_TO.key}
						anchor={0.5}
						x={layout.win.x + WIN_UP_TO.dx * k}
						y={layout.win.y + WIN_UP_TO.dy * k}
						width={WIN_UP_TO.w * k}
						height={WIN_UP_TO.h * k}
					/>
				{:else}
					<ResponsiveText
						anchor={0.5}
						x={layout.win.x}
						y={layout.win.y}
						maxWidth={690 * k}
						text={fill(i18nDerived.winUpTo(), formatTimes(topMaxWin))}
						style={lettering(74 * k)}
					/>
				{/if}

				<!-- the prompt on its plate -->
				{@const pk = layout.press.k}
				<Container x={layout.press.x} y={layout.press.y}>
					<Sprite key="bs_i_cap.png" anchor={0.5} width={PRESS_PLATE.w * pk} height={PRESS_PLATE.h * pk} />
					<Container y={PRESS_PLATE.faceY * pk} alpha={promptAlpha.current}>
						{#if bakedArt}
							<Sprite
								key={PRESS.key}
								anchor={0.5}
								x={PRESS.dx * pk * 0.86}
								y={PRESS.dy * pk * 0.86}
								width={PRESS.w * pk * 0.86}
								height={PRESS.h * pk * 0.86}
							/>
						{:else}
							<ResponsiveText
								anchor={0.5}
								maxWidth={PRESS.ink * 0.86 * pk}
								text={i18nDerived.pressToContinue()}
								style={lettering(40 * pk)}
							/>
						{/if}
						<Graphics x={-352 * pk} scale={pk} draw={chevrons} />
						<Graphics x={333 * pk} scale={pk} draw={chevrons} />
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
