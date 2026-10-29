<script lang="ts" module>
	import { SYMBOL_SIZE } from '../game/constants';
	import type { PortraitCounterLayout } from '../game/stateGame.svelte';

	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		/** `pop`: the value punches up as it changes (a retrigger's +N landing on it) */
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number; pop?: boolean };

	const LABEL_SIZE = SYMBOL_SIZE * 0.26;
	const VALUE_SIZE = SYMBOL_SIZE * 0.36;
	const GAP = SYMBOL_SIZE * 0.02;
	// the value's container sits about mid-text, so the pop scales around its middle
	const VALUE_PIVOT = VALUE_SIZE * 0.6;

	/**
	 * FREE SPINS counter on the frame's top pipe, left of the multiplier plate
	 * (Evtim's FS mockup, 2026-09-08): label over value, centred between the
	 * board's left edge and the plate. Portrait (`line`, 2026-10-26): one line
	 * in the left half of the bottom pipe (stateGame portraitCounterLayout).
	 * Board-local coordinates like the plate. Shared with FreeSpinRetrigger,
	 * whose +N flies onto the value (portrait: the line's middle).
	 */
	export const freeSpinCounterLayout = (
		plate: { x: number; y: number; width: number },
		line?: PortraitCounterLayout,
	) => {
		if (line) {
			const value = { x: line.left, y: line.textY, size: line.size };
			return { room: line.maxWidth, x: line.left, y: line.textY, value };
		}
		const room = plate.x - plate.width / 2;
		const x = room / 2;
		return {
			room,
			x,
			y: plate.y,
			/** the value's middle and on-screen text size, board-local */
			value: { x, y: plate.y + GAP + VALUE_PIVOT, size: VALUE_SIZE },
		};
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { counterText } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();

	const line = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait'
			? context.stateGameDerived.portraitCounterLayout()
			: undefined,
	);
	const layout = $derived(
		freeSpinCounterLayout(context.stateGameDerived.multiplierPlateLayout(), line),
	);

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);
	const pop = new Tween(1);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
			if (emitterEvent.pop) {
				pop
					.set(1.4, { duration: 110, easing: cubicOut })
					.then(() => pop.set(1, { duration: 320, easing: backOut }));
			}
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		{#if line}
			<Sprite
				key="msCounterPlate"
				anchor={0.5}
				x={layout.x}
				y={line.y}
				width={line.plate.width}
				height={line.plate.height}
			/>
			<!-- the whole line pops on a retrigger -->
			<Container x={layout.x} y={layout.y} scale={pop.current}>
				<ResponsiveText
					anchor={{ x: 0.5, y: 0.5 }}
					maxWidth={layout.room}
					text={`${i18nDerived.freeSpins()} ${current} / ${total}`}
					style={counterText(line.size)}
				/>
			</Container>
		{:else}
			<Container x={layout.x} y={layout.y}>
				<ResponsiveText
					anchor={{ x: 0.5, y: 1 }}
					y={-GAP}
					maxWidth={layout.room * 0.95}
					text={i18nDerived.freeSpins()}
					style={counterText(LABEL_SIZE)}
				/>
				<Container y={GAP + VALUE_PIVOT} scale={pop.current}>
					<ResponsiveText
						anchor={{ x: 0.5, y: 0 }}
						y={-VALUE_PIVOT}
						maxWidth={layout.room * 0.95}
						text={`${current} / ${total}`}
						style={counterText(VALUE_SIZE)}
					/>
				</Container>
			</Container>
		{/if}
	</BoardContainer>
</FadeContainer>
