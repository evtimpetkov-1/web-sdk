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

	// The multiplier plate above the reels. Always on screen, and EMPTY until a
	// multiplier is collected (Evtim, 2026-10-24; the rules: "the total multiplier
	// starts empty"). Every Multiplier is worth x2 or more, so a total of 1 (or the
	// 0 a buy sends for "no starting multiplier") means nothing collected yet. In
	// the base game it empties on every spin and accumulates that spin's
	// collects; in free spins it carries over per the book's updateGlobalMult
	// events. Layout lives in stateGameDerived.multiplierPlateLayout
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
				// reset: the old value shrinks away and the plate is left empty
				await textScale.set(0, { duration: 200 });
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_mult_reset' });
				multiplier = 1;
				await textScale.set(1, { duration: 250, easing: backOut });
				return;
			}

			if (next > multiplier) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_mult_up' });
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
			<!-- fill white = untinted. A loaded bitmap font tints every glyph with the
			     style's fill; BitmapText defaults it to white only at construction, so
			     when a resize changed fontSize the reassigned style fell back to Pixi's
			     default black fill and the value turned into black silhouettes -->
			<BitmapText
				anchor={0.5}
				scale={textScale.current}
				text={multiplier > 1 ? `x${multiplier}` : ''}
				style={{ fontFamily: 'tickup-multipliers', fontSize, fill: 0xffffff }}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
