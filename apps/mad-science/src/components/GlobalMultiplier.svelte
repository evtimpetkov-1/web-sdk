<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| { type: 'globalMultiplierUpdate'; multiplier: number };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';

	import { BitmapText, Container, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';

	// The multiplier plate above the reels. Always on screen: in the base game it
	// resets to x1 on every spin and accumulates the multipliers collected during
	// that spin's cascades; in free spins it carries over per the book's
	// updateGlobalMult events. Layout lives in stateGameDerived.multiplierPlateLayout
	// so MultiplierBoard can fly the collected symbols onto the same spot.
	const context = getContext();
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const fontSize = $derived(plate.height * 0.62);

	let show = $state(true);
	let multiplier = $state(1);
	const textScale = new Tween(1, { duration: 200, easing: cubicOut });

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),
		globalMultiplierHide: () => (show = false),
		globalMultiplierUpdate: async (emitterEvent) => {
			const next = emitterEvent.multiplier;

			if (next === 1 && multiplier !== 1) {
				// reset: the old value shrinks away, the fresh x1 pops back in
				await textScale.set(0, { duration: 200 });
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_reset' });
				multiplier = 1;
				await textScale.set(1, { duration: 250, easing: backOut });
				return;
			}

			if (next > multiplier) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
				multiplier = next;
				await textScale.set(1.35, { duration: 120 });
				await textScale.set(1, { duration: 220, easing: backOut });
				return;
			}

			multiplier = next;
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container x={plate.x} y={plate.y}>
			<Sprite key="msMultPlate" anchor={0.5} width={plate.width} height={plate.height} />
			<BitmapText
				anchor={0.5}
				scale={textScale.current}
				text={`x${multiplier}`}
				style={{ fontFamily: 'tickup-multipliers', fontSize }}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
