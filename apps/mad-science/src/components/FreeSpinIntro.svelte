<script lang="ts" module>
	import type { LoadedSpine } from 'pixi-svelte';

	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };

	// msFsPopup content in rig px (1600x1000 box, centre y 500): the plate's width
	// and middle row, the top of the lamp's hoses (it hangs above the box), the
	// top of the lamp fixture itself, and the plate's bottom
	const POPUP_PLATE_WIDTH = 937;
	const POPUP_PLATE_Y = 560;
	const POPUP_TOP = -300;
	const POPUP_FIXTURE_TOP = -220;
	const POPUP_BOTTOM = 833;
	const POPUP_PORTRAIT_FILL = 0.94; // plate width, of the canvas width
	const POPUP_PORTRAIT_MAX_HEIGHT = 0.82; // lamp + plate, of the canvas height
	// the plate's middle, of the canvas height (a quarter of the free height above
	// the lamp still sat too low, Evtim 2026-10-26)
	const POPUP_PORTRAIT_PLATE_AT = 0.48;

	/**
	 * The intro/outro popup's box (SpineProvider width + centre), shared with
	 * FreeSpinOutro. Wide canvases fit the 1600 box to the canvas width, capped
	 * so the lamp and plate stay on screen in landscape. A portrait canvas only
	 * showed the plate at ~59% of its width (Evtim, 2026-10-26): the plate now
	 * spans POPUP_PORTRAIT_FILL of it and sits mid-screen; the lamp hangs from
	 * the top edge (its hoses run off it), but the fixture never leaves the screen.
	 */
	export const popupBox = (canvas: { width: number; height: number }) => {
		const x = canvas.width / 2;
		if (canvas.height <= canvas.width) {
			return { x, y: canvas.height / 2, width: Math.min(canvas.width, canvas.height * 1.55) };
		}
		const width = Math.min(
			(canvas.width * POPUP_PORTRAIT_FILL * 1600) / POPUP_PLATE_WIDTH,
			(canvas.height * POPUP_PORTRAIT_MAX_HEIGHT * 1600) / (POPUP_BOTTOM - POPUP_TOP),
		);
		// rig px -> canvas px; the box centre is rig y 500
		const k = width / 1600;
		const y = Math.max(
			canvas.height * POPUP_PORTRAIT_PLATE_AT - (POPUP_PLATE_Y - 500) * k,
			(500 - POPUP_FIXTURE_TOP) * k,
		);
		return { x, y, width };
	};

	/**
	 * Languages without the popup's title art (showsBakedArt) draw its words as
	 * text in the title slots, so the baked lettering goes, with its glow and
	 * light sweep (both cut to the English words). Fading them by attachment
	 * colour keeps the rig's slot alpha keys, which the text follows. The rig's
	 * data is shared by every instance and the language never changes in a
	 * session, so this runs once per data object.
	 */
	const TITLE_ART_SLOTS = [
		'congrats',
		'congrats_glow',
		'congrats_sweep',
		'youwon',
		'totalwin',
		'totalwin_glow',
		'totalwin_sweep',
	];
	export const hidePopupTitleArt = (data: LoadedSpine | undefined) => {
		if (!data) return;
		const slots = TITLE_ART_SLOTS.map((name) => data.findSlot(name)?.index);
		for (const skin of data.skins) {
			for (const { slotIndex, attachment } of skin.getAttachments()) {
				const color = (attachment as { color?: { a: number } }).color;
				if (color && slots.includes(slotIndex)) color.a = 0;
			}
		}
	};

	// the text in the title slots, in rig px. The rows sit 88 px apart
	// (congrats / youwon bones), so the two cap heights stay under that.
	export const POPUP_TITLE_MAX_WIDTH = 860;
	export const CONGRATS_SIZE = 128;
	export const YOU_WON_SIZE = 84;
	export const TOTAL_WIN_SIZE = 150;
</script>

<script lang="ts">
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import {
		BitmapText,
		Container,
		SpineProvider,
		SpineSlot,
		SpineTrack,
		Sprite,
		Text,
	} from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { ART_STONE, ART_YELLOW, BLACK_OPS_CAP_OFFSET, artTitleText } from '../game/textStyles';
	import { i18nDerived, showsBakedArt } from '../i18n/i18nDerived';
	import PressToContinue from './PressToContinue.svelte';

	/**
	 * Free-spins intro (Evtim's mockup, 2026-09-08): the surgical lamp drops in
	 * and switches on over the riveted plate — CONGRATULATIONS! / YOU WON /
	 * "<n> FREE SPINS". One rig (spines/msFsPopup, art-review/madscience/fsintro/
	 * build_fsintro.py): intro_in -> intro_idle (loop) -> press -> intro_out ->
	 * resolves the book event. The count line is mounted by the app in the
	 * rig's slot_line so any spin count lays out: digits in the fsintro-digits
	 * face beside the FREE SPINS word art. Languages other than English draw
	 * the titles and that word as text (showsBakedArt, hidePopupTitleArt).
	 */
	type Phase = 'in' | 'idle' | 'out';

	const context = getContext();
	const box = $derived(popupBox(context.stateLayoutDerived.canvasSizes()));
	const bakedArt = showsBakedArt();

	// count line, in rig px: fsintro-digits cell = glyph height, advance 0.75 of the size
	const DIGIT_SIZE = 118;
	const DIGIT_ADVANCE = 0.75;
	const FS_HEIGHT = 107;
	const FS_WIDTH = (FS_HEIGHT * 1623) / 297;
	const GAP = 26;
	// the translated FREE SPINS word (no art): its size, and the widest the line may run
	const WORD_SIZE = 118;
	const LINE_MAX_WIDTH = 860;

	let show = $state(false);
	let phase = $state<Phase>('in');
	let total = $state(0);
	let oncomplete = $state(() => {});
	// the translated word's width at WORD_SIZE, measured off an unscaled copy
	let wordNaturalWidth = $state(0);

	const textWidth = $derived(String(total).length * DIGIT_SIZE * DIGIT_ADVANCE);
	const wordStyle = artTitleText(WORD_SIZE, ART_YELLOW, '#3b1704');
	const wordScale = $derived(
		Math.min(1, (LINE_MAX_WIDTH - textWidth - GAP) / (wordNaturalWidth || 1)),
	);
	const wordWidth = $derived(bakedArt ? FS_WIDTH : wordNaturalWidth * wordScale);
	const lineWidth = $derived(textWidth + GAP + wordWidth);
	const animationName = $derived(`intro_${phase}`);

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			if (!bakedArt) hidePopupTitleArt(context.stateApp.loadedAssets?.msFsPopup as LoadedSpine);
			phase = 'in';
			show = true;
		},
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			total = emitterEvent.totalFreeSpins;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});

	// a press during the entrance skips straight to the exit
	const onpress = () => {
		if (phase === 'out') return;
		phase = 'out';
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_popup_out' });
	};
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.7} />

	<SpineProvider key="msFsPopup" x={box.x} y={box.y} width={box.width}>
		<SpineTrack
			trackIndex={0}
			{animationName}
			loop={phase === 'idle'}
			listener={{
				complete: () => {
					if (phase === 'in') phase = 'idle';
					else if (phase === 'out') oncomplete();
				},
			}}
		/>
		<SpineSlot slotName="slot_line">
			<Container x={-lineWidth / 2}>
				<BitmapText
					x={textWidth / 2}
					anchor={0.5}
					text={String(total)}
					style={{ fontFamily: 'fsintro-digits', fontSize: DIGIT_SIZE, fill: 0xffffff }}
				/>
				{#if bakedArt}
					<Sprite
						key="fsIntroFreeSpinsTxt"
						anchor={0.5}
						x={textWidth + GAP + FS_WIDTH / 2}
						width={FS_WIDTH}
						height={FS_HEIGHT}
					/>
				{:else}
					<Container visible={false}>
						<Text
							text={i18nDerived.freeSpins()}
							style={wordStyle}
							onresize={(sizes) => (wordNaturalWidth = sizes.width)}
						/>
					</Container>
					<Text
						anchor={0.5}
						x={textWidth + GAP + wordWidth / 2}
						y={-WORD_SIZE * BLACK_OPS_CAP_OFFSET * wordScale}
						scale={wordScale}
						text={i18nDerived.freeSpins()}
						style={wordStyle}
					/>
				{/if}
			</Container>
		</SpineSlot>
		{#if !bakedArt}
			<SpineSlot slotName="congrats">
				<ResponsiveText
					anchor={0.5}
					y={-CONGRATS_SIZE * BLACK_OPS_CAP_OFFSET}
					maxWidth={POPUP_TITLE_MAX_WIDTH}
					text={i18nDerived.congratulations()}
					style={artTitleText(CONGRATS_SIZE, ART_STONE, '#5a130d')}
				/>
			</SpineSlot>
			<SpineSlot slotName="youwon">
				<ResponsiveText
					anchor={0.5}
					y={-YOU_WON_SIZE * BLACK_OPS_CAP_OFFSET}
					maxWidth={POPUP_TITLE_MAX_WIDTH}
					text={i18nDerived.youWon()}
					style={artTitleText(YOU_WON_SIZE, ART_STONE, '#16110d')}
				/>
			</SpineSlot>
		{/if}
	</SpineProvider>

	<PressToContinue {onpress} />
</FadeContainer>
