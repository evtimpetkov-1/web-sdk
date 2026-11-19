<script lang="ts">
	import { onMount } from 'svelte';

	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';

	import { BaseSprite, BitmapText, Container, PixiRectangle, Sprite, Text, Texture } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { CanvasSizeRectangle } from 'components-layout';
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
	 * The intro, shown once the HTML boot loader (LoaderGame) is gone. Set 3 (Evtim's
	 * into_2 pieces, 2026-11-19, packed by art-review/blast-shaft/build_intro_v3.py): his
	 * mine timbers fill the screen, the logo sits on their top beam, four timber panels
	 * that explain the game hang from the beam on chains (a row of four on wide screens;
	 * 2x2 on portrait and tablet, the second row hanging from the first), and WIN UP TO
	 * and the prompt are bare lettering under them, as in his two previews.
	 * Everything is placed off the background's beam, so the chains meet it at any screen
	 * shape; the background covers the screen and is never pushed so high that the beam
	 * leaves it. The set before: art-review/alt/intro_v2_2026-11-19/restore.sh.
	 * A press fades it out over the closed curtains (Game.svelte startGame), which
	 * then open on the game. Sits above the curtains' layer.
	 *
	 * Copy is short and social-safe (no pay/bet/buy); English keys, translated
	 * through the game's messagesMap.
	 *
	 * Replay mode (Kraken's pattern): only the timbers and the logo; no panels, no
	 * prompt. The HTML replay card (ReplayOverlay) shows over it and its Start Replay
	 * button runs the same start as the press.
	 */
	const props: Props = $props();
	const context = getContext();
	const isReplay = stateUrlDerived.replay();

	type PanelId = 'anywhere' | 'multipliers' | 'bombs' | 'freeSpins';
	// art: the title's English lettering (frame, its size in the panel's pixels and the
	// shift that puts its ink on the title's line)
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

	// ---- the art ----
	// his two backgrounds and the rows of their top beam (the chains hang from its underside,
	// a straight edge on both: the last lit row is 136-137 / 261-262 all along)
	const BGS = {
		wide: { key: 'bsIntroBgWide', w: 1672, h: 941, beamTop: 63, beamBottom: 137 },
		tall: { key: 'bsIntroBgTall', w: 958, h: 1642, beamTop: 158, beamBottom: 262 },
	};
	const PLATE = { w: 435, h: 480 };
	const PLATE_ASPECT = PLATE.w / PLATE.h;
	// the chain, cut to its links (68 px wide); drawn at CHAIN_SCALE of the panel's scale,
	// as in his previews
	const CHAIN_SCALE = 0.47;
	// the logo's lettering fills its 2172x724 canvas's width, 337 px tall
	const LOGO = { w: 2172, h: 724, inkAspect: 2172 / 337 };
	// the English lettering: frame and ink sizes in the old panel units (the atlas holds
	// them at 2x), and the shift from the frame's middle to the ink's
	const WIN_UP_TO = { key: 'bs_i_t_wut.png', w: 769, h: 103, inkW: 733, inkH: 87.5, dx: 16.5, dy: -1.25 };
	const PRESS = { key: 'bs_i_t_patc.png', w: 802, h: 77, inkW: 680.5, inkH: 46.5, dx: 0.25, dy: 0.75 };
	// the English lettering (showsBakedArt); the other languages draw the same words as text
	const bakedArt = showsBakedArt();
	const topMaxWin = Math.max(...Object.values(config.betModes).map((mode) => mode.max_win));
	// bs_i_t_wut.png says 22 924X: only while that is the game's top max win
	const winArt = bakedArt && topMaxWin === 22924;

	// ---- layout ----
	// Per layout, in panel heights unless named otherwise: the gap between panels (panel
	// widths), the chains' visible length under the beam and between the rows (and how far
	// they may grow when the screen has room), the logo's lettering height (beam heights),
	// WIN UP TO's gap and lettering height, the room between it and the prompt, the prompt's
	// lettering width (of the screen) and its centre (of the screen's height), the chains'
	// places across a panel.
	const SPECS = {
		desktop: { cols: 4, gapX: 0.105, maxW: 0.97, chainTop: 0.23, chainTopMax: 0.42, gapY: 0, gapYMax: 0, logoInk: 1.6, logoMaxW: 0.6, winGap: 0.055, winH: 0.2, winMaxW: 0.8, pressGap: 0.22, pressW: 0.4, pressMaxH: 0.05, pressY: 0.931, chains: [0.24, 0.76] },
		landscape: { cols: 4, gapX: 0.105, maxW: 0.97, chainTop: 0.23, chainTopMax: 0.42, gapY: 0, gapYMax: 0, logoInk: 1.6, logoMaxW: 0.6, winGap: 0.055, winH: 0.2, winMaxW: 0.8, pressGap: 0.22, pressW: 0.4, pressMaxH: 0.05, pressY: 0.931, chains: [0.24, 0.76] },
		tablet: { cols: 2, gapX: 0.13, maxW: 0.9, chainTop: 0.1, chainTopMax: 0.35, gapY: 0.09, gapYMax: 0.25, logoInk: 1.3, logoMaxW: 0.66, winGap: 0.07, winH: 0.16, winMaxW: 0.86, pressGap: 0.24, pressW: 0.6, pressMaxH: 0.035, pressY: 0.945, chains: [0.5] },
		portrait: { cols: 2, gapX: 0.13, maxW: 0.95, chainTop: 0.1, chainTopMax: 0.35, gapY: 0.09, gapYMax: 0.25, logoInk: 1.3, logoMaxW: 0.66, winGap: 0.07, winH: 0.16, winMaxW: 0.86, pressGap: 0.24, pressW: 0.7, pressMaxH: 0.03, pressY: 0.948, chains: [0.5] },
	} as const;
	// how far a chain runs on behind the panel it holds, in panel heights
	const CHAIN_TUCK = 0.1;

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const spec = $derived(SPECS[context.stateLayoutDerived.layoutType()] ?? SPECS.desktop);

	const layout = $derived.by(() => {
		const { width: W, height: H } = canvas;
		const bg = spec.cols === 2 ? BGS.tall : BGS.wide;
		// the background covers the screen, centred, but never so high that the beam
		// (and half its height above it, for the logo) leaves the top
		const s = Math.max(W / bg.w, H / bg.h);
		const beamH = (bg.beamBottom - bg.beamTop) * s;
		const oy = Math.min(0, Math.max((H - bg.h * s) / 2, beamH * 0.5 - bg.beamTop * s));
		const beamTop = oy + bg.beamTop * s;
		const beamBottom = oy + bg.beamBottom * s;

		// the prompt's lettering
		const pressW = Math.min(W * spec.pressW, H * spec.pressMaxH * (PRESS.inkW / PRESS.inkH));
		const pressH = pressW * (PRESS.inkH / PRESS.inkW);
		const pressY = H * spec.pressY;

		// the chains, the panels and WIN UP TO share what is between the beam and the prompt
		const rows = 4 / spec.cols;
		const span = pressY - pressH / 2 - beamBottom;
		const units = spec.chainTop + rows + (rows - 1) * spec.gapY + spec.winGap + spec.winH + spec.pressGap;
		const ph = Math.min(span / units, (W * spec.maxW) / ((spec.cols + (spec.cols - 1) * spec.gapX) * PLATE_ASPECT));
		const pw = ph * PLATE_ASPECT;
		// room left over (a screen narrower than the art's shape): longer chains first,
		// then the rest either side of WIN UP TO
		let rest = Math.max(0, span - units * ph);
		const take = (most: number) => {
			const used = Math.min(rest, Math.max(0, most));
			rest -= used;
			return used;
		};
		const chainTop = spec.chainTop * ph + take((spec.chainTopMax - spec.chainTop) * ph);
		const gapY = spec.gapY * ph + (rows > 1 ? take((spec.gapYMax - spec.gapY) * ph) : 0);
		const top = beamBottom + chainTop;
		const blockW = spec.cols * pw + (spec.cols - 1) * spec.gapX * pw;
		const x0 = (W - blockW) / 2;
		const panels = [0, 1, 2, 3].map((i) => ({
			x: x0 + (i % spec.cols) * pw * (1 + spec.gapX),
			y: top + Math.floor(i / spec.cols) * (ph + gapY),
		}));
		const blockBottom = top + rows * ph + (rows - 1) * gapY;
		// the logo fills the beam, but never outgrows the panels under it (his portrait
		// preview: 0.72 of their width)
		const logoW = Math.min(beamH * spec.logoInk * LOGO.inkAspect, W * spec.logoMaxW, blockW * 0.75);

		// WIN UP TO, never wider than winMaxW of the screen
		const winW = Math.min(spec.winH * ph * (WIN_UP_TO.inkW / WIN_UP_TO.inkH), W * spec.winMaxW);
		const winH = winW * (WIN_UP_TO.inkH / WIN_UP_TO.inkW);
		const winY = blockBottom + spec.winGap * ph + rest / 2 + winH / 2;

		// the chains: from the beam's underside to the first row, and (2x2) from the
		// first row to the second, running on behind the panels they hold
		const chains: { x: number; y: number; len: number }[] = [];
		for (let i = 0; i < 4; i++) {
			const p = panels[i];
			const fromBeam = i < spec.cols;
			// the chain's flat-cut top on the beam's bottom edge: it runs on up into the beam
			const y = fromBeam ? beamBottom : p.y - gapY - CHAIN_TUCK * ph;
			const len = p.y + CHAIN_TUCK * ph - y;
			for (const at of spec.chains) chains.push({ x: p.x + at * pw, y, len });
		}

		return {
			bg: { key: bg.key, x: W / 2, y: oy + (bg.h * s) / 2, w: bg.w * s, h: bg.h * s },
			logo: { x: W / 2, y: (beamTop + beamBottom) / 2, w: logoW, h: (logoW * LOGO.h) / LOGO.w },
			k: ph / PLATE.h,
			panels,
			chains,
			win: { x: W / 2, y: winY, w: winW, h: winH },
			// a translation drawn as text may run wider than the English art
			press: { x: W / 2, y: pressY, w: pressW, h: pressH, maxW: Math.min(W * 0.92, pressW * 1.4) },
			winMaxW: Math.min(W * 0.92, winW * 1.25),
		};
	});

	// The chain cut to the length each one needs (its top is the art's own flat cut, the
	// other end is cut behind a panel): a texture on the atlas frame's own pixels.
	const chainFrame = $derived(context.stateApp.loadedAssets?.['bs_i_chain.png'] as Texture | undefined);
	const chainScale = $derived(CHAIN_SCALE * layout.k);
	const chainTexture = (len: number) => {
		const frame = chainFrame!.frame;
		const h = Math.max(1, Math.min(frame.height, Math.round(len / chainScale)));
		return new Texture({ source: chainFrame!.source, frame: new PixiRectangle(frame.x, frame.y, frame.width, h) });
	};
	// one texture per distinct length (the chains of a row share theirs)
	const chainTextures = $derived.by(() => {
		if (!chainFrame) return [];
		const byLen = new Map<number, Texture>();
		return layout.chains.map((chain) => {
			const len = Math.round(chain.len);
			if (!byLen.has(len)) byLen.set(len, chainTexture(len));
			return byLen.get(len)!;
		});
	});

	// panel inner geometry, in the panel's own pixels (435x480; the hazard stripe from 408):
	// the symbols, the title, then up to 4 lines of copy down to the stripe
	const ART_Y = 122;
	const ART_H = 136;
	const TITLE_Y = 230;
	const TEXT_Y = 266;
	const TEXT_BOTTOM = 398;
	const TEXT_W = 340;

	/**
	 * The copy's size: 24 panel pixels, or smaller where a translation's wrapped lines
	 * would run onto the stripe (translations run up to ~40% longer than the English the
	 * panels were sized for; English keeps its size on every layout). One size for all
	 * four panels, found by wrapping the way Pixi does: at spaces, and per character
	 * where a word is wider than the line (breakWords: a CJK sentence has no spaces at
	 * all). Measured in panel pixels, drawn at k times that (a Text is never scaled).
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
		const dense = texts.some((text) => /[　-鿿가-힯]/.test(text));
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
	// the copy on the bare wood: a soft dark shadow keeps it off the grain
	const textStyle = $derived({
		fontFamily: ['Inter', 'sans-serif'],
		fontSize: textSize * layout.k,
		fill: '#f6eedc',
		align: 'center' as const,
		lineHeight: textSize * layout.k * LINE_HEIGHT,
		wordWrap: true,
		wordWrapWidth: TEXT_W * layout.k,
		breakWords: true,
		dropShadow: { color: '#000000', alpha: 0.85, blur: Math.max(1, 3 * layout.k), distance: Math.max(1, 1.5 * layout.k), angle: Math.PI / 2 },
	});

	// the prompt breathes (a fade, never a bounce), as PressToContinue's does
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

	// The panels' symbols are the intro atlas's own bs_i_sym_* frames: the game's symbol
	// art at twice the board's size (Evtim, 2026-11-18: the intro's symbols were "a bit
	// blurry": it drew the board's 297x321 sprites enlarged). Same proportions.
	const SYM = { w: 297, h: 321 };
	const symW = (h: number) => (h * SYM.w) / SYM.h;
</script>

<Container zIndex={CURTAIN_Z + 1}>
	<FadeContainer {show}>
		<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={1} />
		<Sprite key={layout.bg.key} anchor={0.5} x={layout.bg.x} y={layout.bg.y} width={layout.bg.w} height={layout.bg.h} />

		{#if !isReplay}
			{@const k = layout.k}
			<!-- Chains, then panels, then their contents, each in a container of its own: a
			     layout change (resize, rotation) mounts a child anew, and pixi-svelte appends
			     a new child at the END of its parent, so in a shared container a chain or a
			     plate could land over a panel's contents -->
			<Container>
				{#each layout.chains as chain, i (i)}
					{#if chainTextures[i]}
						<BaseSprite
							texture={chainTextures[i]}
							anchor={{ x: 0.5, y: 0 }}
							x={chain.x}
							y={chain.y}
							scale={chainScale}
						/>
					{/if}
				{/each}
			</Container>
			<Container>
				{#each layout.panels as panel, i (i)}
					<Sprite key="bs_i_plate.png" x={panel.x} y={panel.y} width={PLATE.w * k} height={PLATE.h * k} />
				{/each}
			</Container>

			{#each PANELS as panel, i (panel.id)}
				{@const artH = ART_H * k}
				<Container x={layout.panels[i].x + (PLATE.w / 2) * k} y={layout.panels[i].y}>
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
							<Sprite key="bs_i_sym_bonus.png" anchor={0.5} width={symW(artH)} height={artH} />
						{/if}
					</Container>

					<!-- the title, straight on the wood as in his preview -->
					<Container y={TITLE_Y * k}>
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
								maxWidth={360 * k}
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

			<!-- WIN UP TO, bare lettering under the panels -->
			{#if winArt}
				{@const sc = layout.win.w / WIN_UP_TO.inkW}
				<Sprite
					key={WIN_UP_TO.key}
					anchor={0.5}
					x={layout.win.x + WIN_UP_TO.dx * sc}
					y={layout.win.y + WIN_UP_TO.dy * sc}
					width={WIN_UP_TO.w * sc}
					height={WIN_UP_TO.h * sc}
				/>
			{:else}
				<ResponsiveText
					anchor={0.5}
					x={layout.win.x}
					y={layout.win.y}
					maxWidth={layout.winMaxW}
					text={fill(i18nDerived.winUpTo(), formatTimes(topMaxWin))}
					style={lettering(layout.win.h * 1.5)}
				/>
			{/if}

			<!-- the prompt, breathing -->
			<Container x={layout.press.x} y={layout.press.y} alpha={promptAlpha.current}>
				{#if bakedArt}
					{@const sc = layout.press.w / PRESS.inkW}
					<Sprite
						key={PRESS.key}
						anchor={0.5}
						x={PRESS.dx * sc}
						y={PRESS.dy * sc}
						width={PRESS.w * sc}
						height={PRESS.h * sc}
					/>
				{:else}
					<ResponsiveText
						anchor={0.5}
						maxWidth={layout.press.maxW}
						text={i18nDerived.pressToContinue()}
						style={lettering(layout.press.h * 1.25)}
					/>
				{/if}
			</Container>
		{/if}

		<!-- the logo on the beam -->
		<Sprite key="msLogoRow" anchor={0.5} x={layout.logo.x} y={layout.logo.y} width={layout.logo.w} height={layout.logo.h} />

		{#if !isReplay}
			<!-- the tap / Space handling only: the prompt is the lettering above -->
			<PressToContinue onpress={start} showText={false} />
		{/if}
	</FadeContainer>
</Container>
