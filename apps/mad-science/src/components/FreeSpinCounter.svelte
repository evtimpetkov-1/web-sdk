<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { counterText } from '../game/textStyles';

	const context = getContext();

	/**
	 * FREE SPINS counter on the frame's top pipe, left of the multiplier plate
	 * (Evtim's FS mockup, 2026-09-08): label over value, centred between the
	 * board's left edge and the plate. Board-local coordinates like the plate.
	 */
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const room = $derived(plate.x - plate.width / 2);
	const x = $derived(room / 2);
	const y = $derived(plate.y);
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 0.75 : 1);
	const LABEL_SIZE = SYMBOL_SIZE * 0.26;
	const VALUE_SIZE = SYMBOL_SIZE * 0.36;
	const GAP = SYMBOL_SIZE * 0.02;

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {x} {y} {scale}>
			<ResponsiveText
				anchor={{ x: 0.5, y: 1 }}
				y={-GAP}
				maxWidth={room * 0.95}
				text="FREE SPINS"
				style={counterText(LABEL_SIZE)}
			/>
			<ResponsiveText
				anchor={{ x: 0.5, y: 0 }}
				y={GAP}
				maxWidth={room * 0.95}
				text={`${current} / ${total}`}
				style={counterText(VALUE_SIZE)}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
