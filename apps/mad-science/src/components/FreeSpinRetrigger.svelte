<script lang="ts" module>
	export type EmitterEventFreeSpinRetrigger = {
		type: 'freeSpinRetriggerShow';
		/** spins added (5 by the rules) */
		added: number;
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut, cubicInOut } from 'svelte/easing';

	import { BitmapText, Container, Rectangle, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { ResponsiveText } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GooBurst from './GooBurst.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { freeSpinCounterLayout } from './FreeSpinCounter.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { ART_YELLOW, BLACK_OPS_CAP_OFFSET, artTitleText } from '../game/textStyles';
	import { i18nDerived, showsBakedArt } from '../i18n/i18nDerived';

	const context = getContext();
	const bakedArt = showsBakedArt();

	/**
	 * Free spins retrigger (Evtim, 2026-10-26: a quick stamp that plays itself
	 * out). Over the dimmed reel window a "+5" in the intro's orange digits
	 * (fsintro-digits, plus the generated '+' fsRetriggerPlus) stamps in on a goo
	 * splat, the intro's FREE SPINS plate pops in under it, both hold, then the
	 * +5 flies onto the FREE SPINS counter on the top pipe. The handler bumps
	 * the counter once this resolves. No press needed; a tap or Space cuts the
	 * hold short. Durations at 1x; turbo divides them by the bet's timeScale.
	 * Board-local units (BoardContainer), like the counter it flies to.
	 */
	// fsintro-digits: cell = glyph height, advance 0.75 of the size (as FreeSpinIntro)
	const DIGIT_SIZE = SYMBOL_SIZE * 1.5;
	const DIGIT_ADVANCE = 0.75;
	// plus.png is 195x200 against the digits' ~306 px: drawn at the same texel scale
	const PLUS_HEIGHT = DIGIT_SIZE * (200 / 306);
	const PLUS_WIDTH = PLUS_HEIGHT * (195 / 200);
	const PLUS_GAP = DIGIT_SIZE * 0.03;
	// free_spins.png is 1623x297
	const LABEL_HEIGHT = SYMBOL_SIZE * 0.7;
	const LABEL_WIDTH = LABEL_HEIGHT * (1623 / 297);
	// the translated word where the language has no art (showsBakedArt)
	const LABEL_TEXT_SIZE = LABEL_HEIGHT * 1.05;
	// the number row sits above the board's middle, the plate below it
	const NUMBER_DY = -SYMBOL_SIZE * 0.45;
	const LABEL_DY = SYMBOL_SIZE * 0.85;
	const GOO_SCALE = 2.6;
	const DIM_ALPHA = 0.55;
	const STAMP_FROM = 1.9;
	const STAMP_MS = 320;
	const HOLD_MS = 1300;
	const FLY_MS = 520;

	const board = $derived(context.stateGameDerived.boardLayout());
	const centre = $derived({ x: board.width / 2, y: board.height / 2 + NUMBER_DY });
	const counter = $derived(
		freeSpinCounterLayout(
			context.stateGameDerived.multiplierPlateLayout(),
			context.stateLayoutDerived.layoutType() === 'portrait'
				? context.stateGameDerived.portraitCounterLayout()
				: undefined,
		).value,
	);

	let active = $state(false);
	let splat = $state(false);
	let added = $state(0);
	const textWidth = $derived(String(added).length * DIGIT_SIZE * DIGIT_ADVANCE);
	const rowWidth = $derived(PLUS_WIDTH + PLUS_GAP + textWidth);

	const dim = new Tween(0);
	const numberPos = new Tween({ x: 0, y: 0 });
	const numberScale = new Tween(1);
	const numberAlpha = new Tween(0);
	const labelScale = new Tween(1);
	const labelAlpha = new Tween(0);

	// a press during the stamp or the hold skips the rest of the hold
	let skipped = false;
	let skipHold = () => {};
	const hold = (ms: number) =>
		skipped
			? Promise.resolve()
			: Promise.race([waitForTimeout(ms), new Promise<void>((resolve) => (skipHold = resolve))]);

	const play = async (count: number) => {
		const ms = (value: number) => value / stateBetDerived.timeScale();
		added = count;
		skipped = false;
		numberPos.set(centre, { duration: 0 });
		numberScale.set(STAMP_FROM, { duration: 0 });
		numberAlpha.set(0, { duration: 0 });
		labelScale.set(0.6, { duration: 0 });
		labelAlpha.set(0, { duration: 0 });
		active = true;
		splat = true;
		// the stamp: the retrigger's own cue; the flight: the multiplier's fly
		// (the same gesture onto a counter); the handler ticks the counter on arrival
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_fs_retrigger' });

		dim.set(DIM_ALPHA, { duration: ms(200) });
		numberAlpha.set(1, { duration: ms(140) });
		await numberScale.set(1, { duration: ms(STAMP_MS), easing: backOut });
		labelAlpha.set(1, { duration: ms(160) });
		labelScale.set(1, { duration: ms(300), easing: backOut });
		await hold(ms(HOLD_MS));

		// onto the counter, shrinking to its text size, fading as it lands
		labelAlpha.set(0, { duration: ms(200) });
		dim.set(0, { duration: ms(FLY_MS) });
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_mult_fly' });
		await Promise.all([
			numberPos.set({ x: counter.x, y: counter.y }, { duration: ms(FLY_MS), easing: cubicInOut }),
			numberScale.set(counter.size / DIGIT_SIZE, { duration: ms(FLY_MS), easing: cubicInOut }),
			numberAlpha.set(0, { delay: ms(FLY_MS * 0.7), duration: ms(FLY_MS * 0.3) }),
		]);
		active = false;
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinRetriggerShow: (emitterEvent) => play(emitterEvent.added),
	});
</script>

<!-- the wrapper never unmounts, so the layer keeps its draw-order slot (pixi-svelte appends remounted children) -->
<Container>
	{#if active}
		<MainContainer>
			<BoardContainer>
				<Rectangle
					width={board.width}
					height={board.height}
					backgroundColor={0x000000}
					alpha={dim.current}
				/>
				{#if splat}
					<Container x={centre.x} y={centre.y} scale={GOO_SCALE}>
						<GooBurst oncomplete={() => (splat = false)} />
					</Container>
				{/if}
				<Container
					x={board.width / 2}
					y={board.height / 2 + LABEL_DY}
					scale={labelScale.current}
					alpha={labelAlpha.current}
				>
					{#if bakedArt}
						<Sprite key="fsIntroFreeSpinsTxt" anchor={0.5} width={LABEL_WIDTH} height={LABEL_HEIGHT} />
					{:else}
						<ResponsiveText
							anchor={0.5}
							y={-LABEL_TEXT_SIZE * BLACK_OPS_CAP_OFFSET}
							maxWidth={board.width * 0.92}
							text={i18nDerived.freeSpins()}
							style={artTitleText(LABEL_TEXT_SIZE, ART_YELLOW, '#3b1704')}
						/>
					{/if}
				</Container>
				<Container
					x={numberPos.current.x}
					y={numberPos.current.y}
					scale={numberScale.current}
					alpha={numberAlpha.current}
				>
					<Sprite
						key="fsRetriggerPlus"
						anchor={0.5}
						x={-rowWidth / 2 + PLUS_WIDTH / 2}
						width={PLUS_WIDTH}
						height={PLUS_HEIGHT}
					/>
					<BitmapText
						anchor={0.5}
						x={rowWidth / 2 - textWidth / 2}
						text={String(added)}
						style={{ fontFamily: 'fsintro-digits', fontSize: DIGIT_SIZE, fill: 0xffffff }}
					/>
				</Container>
			</BoardContainer>
		</MainContainer>
		<PressToContinue
			showText={false}
			onpress={() => {
				skipped = true;
				skipHold();
			}}
		/>
	{/if}
</Container>
