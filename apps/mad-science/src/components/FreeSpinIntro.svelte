<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number };
</script>

<script lang="ts">
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { BitmapText, Container, SpineProvider, SpineSlot, SpineTrack, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';

	/**
	 * Free-spins intro (Evtim's mockup, 2026-09-08): the surgical lamp drops in
	 * and switches on over the riveted plate — CONGRATULATIONS! / YOU WON /
	 * "<n> FREE SPINS". One rig (spines/msFsPopup, art-review/madscience/fsintro/
	 * build_fsintro.py): intro_in -> intro_idle (loop) -> press -> intro_out ->
	 * resolves the book event. The count line is mounted by the app in the
	 * rig's slot_line so any spin count lays out: digits in the fsintro-digits
	 * face beside the FREE SPINS word art.
	 */
	type Phase = 'in' | 'idle' | 'out';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	/** the rig is 1600 world px wide; fit the canvas width, capped so the lamp and plate stay on screen in landscape */
	const width = $derived(Math.min(canvas.width, canvas.height * 1.55));

	// count line, in rig px: fsintro-digits cell = glyph height, advance 0.75 of the size
	const DIGIT_SIZE = 118;
	const DIGIT_ADVANCE = 0.75;
	const FS_HEIGHT = 107;
	const FS_WIDTH = (FS_HEIGHT * 1623) / 297;
	const GAP = 26;

	let show = $state(false);
	let phase = $state<Phase>('in');
	let total = $state(0);
	let oncomplete = $state(() => {});

	const textWidth = $derived(String(total).length * DIGIT_SIZE * DIGIT_ADVANCE);
	const lineWidth = $derived(textWidth + GAP + FS_WIDTH);
	const animationName = $derived(`intro_${phase}`);

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
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
		if (phase !== 'out') phase = 'out';
	};
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.7} />

	<SpineProvider key="msFsPopup" x={canvas.width / 2} y={canvas.height / 2} {width}>
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
					style={{ fontFamily: 'fsintro-digits', fontSize: DIGIT_SIZE }}
				/>
				<Sprite
					key="fsIntroFreeSpinsTxt"
					anchor={0.5}
					x={textWidth + GAP + FS_WIDTH / 2}
					width={FS_WIDTH}
					height={FS_HEIGHT}
				/>
			</Container>
		</SpineSlot>
	</SpineProvider>

	<PressToContinue {onpress} />
</FadeContainer>
