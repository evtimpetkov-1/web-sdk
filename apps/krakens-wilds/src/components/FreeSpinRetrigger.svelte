<script lang="ts" module>
	export type EmitterEventFreeSpinRetrigger =
		| { type: 'freeSpinRetriggerShow'; extraSpins: number; positions: { reel: number; row: number }[] };
</script>

<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, REEL_PADDING } from '../game/constants';

	const context = getContext();

	type RetriggerLabel = {
		id: number;
		reel: number;
		row: number;
		y: Tween<number>;
		alpha: Tween<number>;
		scale: Tween<number>;
	};

	let labels = $state<RetriggerLabel[]>([]);
	let idCounter = 0;
	let extraSpins = $state(0);

	context.eventEmitter.subscribeOnMount({
		freeSpinRetriggerShow: async (emitterEvent) => {
			extraSpins = emitterEvent.extraSpins;

			// Create a floating "+N" label for each bonus position
			const newLabels: RetriggerLabel[] = emitterEvent.positions.map((pos) => ({
				id: idCounter++,
				reel: pos.reel,
				row: pos.row,
				y: new Tween(0, { easing: cubicOut, duration: 800 }),
				alpha: new Tween(1, { duration: 600 }),
				scale: new Tween(0, { easing: cubicOut, duration: 300 }),
			}));

			labels = newLabels;

			// Pop in
			for (const label of newLabels) {
				label.scale.set(1);
			}

			await waitForTimeout(400);

			// Float up + fade out
			for (const label of newLabels) {
				label.y.set(-SYMBOL_SIZE * 0.6);
				label.alpha.set(0);
			}

			await waitForTimeout(900);
			labels = [];
		},
	});
</script>

{#each labels as label (label.id)}
	{@const x = SYMBOL_SIZE * (label.reel + REEL_PADDING)}
	{@const baseY = (label.row - 0.5) * SYMBOL_SIZE}
	<Container
		x={x}
		y={baseY + label.y.current}
		zIndex={10}
	>
		<ResponsiveBitmapText
			anchor={0.5}
			maxWidth={SYMBOL_SIZE}
			text={`+${extraSpins}`}
			style={{
				fontFamily: 'cinzel-bold-gold',
				fontSize: 48,
				align: 'center',
				letterSpacing: 0,
			}}
			alpha={label.alpha.current}
			scaleX={label.scale.current}
			scaleY={label.scale.current}
		/>
	</Container>
{/each}
