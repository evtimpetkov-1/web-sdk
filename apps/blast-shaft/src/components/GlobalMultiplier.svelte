<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		/** `instant`: no animation or sound (behind the closed curtains) */
		| { type: 'globalMultiplierUpdate'; multiplier: number; instant?: boolean };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';

	import { BitmapText, Container, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';

	// The multiplier plate above the reels (right of them on desktop / landscape since
	// 2026-11-20). It was on screen only while it held a
	// value (Evtim, 2026-11-18: "make the multiplier plate hide and show when needed
	// similar to chaos lab 2 and dynamite games"; their logic, ported as it is.
	// Before, it was always shown, empty: that copy is in
	// art-review/alt/GlobalMultiplier_always_on_2026-11-18.svelte). It drops in as a
	// collect begins (multiplierBoardShow: the Multipliers act for a moment before
	// they fly, so it is in place when they arrive) and leaves when the value is
	// reset. In free spins the total is kept, so from the first collect (or from
	// the start, with Motherlode Free Spins' starting multiplier) it stays to the
	// end. Every Multiplier is worth x2 or more, so a total of 1 (or the
	// 0 a buy sends for "no starting multiplier") means nothing collected yet. It
	// empties on the spin press (actor.ts) and accumulates that spin's collects;
	// in free spins it carries over per the book's updateGlobalMult events, and
	// the curtains into and out of free spins clear it unseen (Evtim, 2026-10-28).
	// Layout lives in stateGameDerived.multiplierPlateLayout
	// so MultiplierBoard can fly the collected symbols onto the same spot.
	const context = getContext();
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const fontSize = $derived(plate.height * 0.62);

	// ON SCREEN ALL THE TIME again, empty until a collect (Evtim, 2026-11-20: "the
	// multiplier plate - show it all the time", once it moved beside the reels on
	// desktop / landscape). false = the show-only-with-a-value logic below.
	const ALWAYS_SHOWN = true;

	let show = $state(true);
	let multiplier = $state(1);
	const textScale = new Tween(1, { duration: 200, easing: cubicOut });
	// a collect is on its way: the plate comes in ahead of the value
	let armed = $state(false);
	const wanted = $derived(ALWAYS_SHOWN || multiplier > 1 || armed);
	// 0 = away (lifted a little, see-through), 1 = in place
	const plateIn = new Tween(ALWAYS_SHOWN ? 1 : 0, { duration: 260, easing: backOut });
	$effect(() => {
		plateIn.set(wanted ? 1 : 0, wanted ? { duration: 260, easing: backOut } : { duration: 320, easing: cubicOut });
	});

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),
		globalMultiplierHide: () => (show = false),
		multiplierBoardShow: () => (armed = true),
		globalMultiplierUpdate: async (emitterEvent) => {
			const next = emitterEvent.multiplier;

			if (emitterEvent.instant) {
				multiplier = next;
				armed = false;
				textScale.set(1, { duration: 0 });
				// behind the curtains / on a reload: in place (or gone) at once
				plateIn.set(ALWAYS_SHOWN || next > 1 ? 1 : 0, { duration: 0 });
				return;
			}

			if (next === 1 && multiplier !== 1) {
				// reset: the old value shrinks away and the plate leaves with it
				await textScale.set(0, { duration: 200 });
				multiplier = 1;
				armed = false;
				await textScale.set(1, { duration: 250, easing: backOut });
				return;
			}

			if (next > multiplier) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_mult_up' });
				multiplier = next;
				armed = false;
				await textScale.set(1.35, { duration: 120 });
				await textScale.set(1, { duration: 220, easing: backOut });
				return;
			}

			multiplier = next;
			armed = false;
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container
			x={plate.x}
			y={plate.y - (1 - plateIn.current) * plate.height * 0.3}
			alpha={Math.max(0, Math.min(1, plateIn.current))}
			visible={plateIn.current > 0.01}
		>
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
