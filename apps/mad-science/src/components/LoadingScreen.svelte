<script lang="ts">
	import { onMount } from 'svelte';

	import { BitmapText, Container, Rectangle, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { stateI18nDerived, stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { stateReplay, setReplayStartHandler } from '../game/stateReplay.svelte';
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
			['32px Creepster', '400 32px Inter', '700 32px Inter'].map((face) =>
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
	// block between top and bottom, the prompt below (PressToContinue).
	const LAYOUTS = {
		desktop: { cols: 4, maxW: 300, title: 36, text: 19, logoY: 0.15, logoH: 0.23, top: 0.31, bottom: 0.865 },
		landscape: { cols: 4, maxW: 350, title: 44, text: 27, logoY: 0.12, logoH: 0.2, top: 0.25, bottom: 0.88 },
		tablet: { cols: 2, maxW: 380, title: 38, text: 21, logoY: 0.11, logoH: 0.15, top: 0.21, bottom: 0.885 },
		portrait: { cols: 2, maxW: 370, title: 44, text: 27, logoY: 0.09, logoH: 0.13, top: 0.18, bottom: 0.9 },
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

	const layout = $derived.by(() => {
		const { width: W, height: H } = main;
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
		return {
			logo: {
				x: W / 2,
				y: H * spec.logoY,
				width: oneRowLogo ? rowW : logoH * LOGO_RATIO,
				height: oneRowLogo ? rowW / LOGO_ROW_RATIO : logoH,
			},
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
	const textSize = $derived(spec.text);

	const titleStyle = $derived({
		fontFamily: ['Creepster', 'Inter', 'sans-serif'],
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
		lineHeight: textSize * 1.32,
		wordWrap: true,
		wordWrapWidth: layout.panelW * 0.86,
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
		</MainContainer>

		{#if !isReplay}
			<PressToContinue onpress={start} />
		{/if}
	</FadeContainer>
</Container>
