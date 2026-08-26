<script lang="ts" module>
	/** Fired once the spin's winnings are fully counted — see setWin. */
	export type EmitterEventSpinMultiplier = { type: 'spinMultiplierStrike' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut, cubicIn } from 'svelte/easing';
	import { Container } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { ResponsiveBitmapText } from 'components-pixi';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { playEarthquake } from '../game/earthquake';
	import { BOARD_SIZES } from '../game/constants';
	import WildLandDust from './WildLandDust.svelte';

	/**
	 * The kraken's per-spin win multiplier (free spins).
	 *
	 * It is thrown onto the screen out of the kraken's own purple smoke the moment
	 * the attack awards it, waits there through the rest of the spin — symbols
	 * landing, reels stopping, winnings counting — and only then dives into the
	 * win box, where the amount already counted is multiplied up.
	 *
	 * Striking LAST is the whole point: a coin spin adds the coin total after the
	 * payline wins, so anything earlier would multiply half a win. setWin drives
	 * the order and holds the big-win presentation back until after the strike, so
	 * a small win that becomes a big one gets its spectacle on the real figure.
	 */

	const context = getContext();
	// the stone frame is wider than the grid — placements key off ITS edge
	const FRAME_W = BOARD_SIZES.width * 1.137;

	const bl = $derived(context.stateGameDerived.boardLayout());
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const multiplier = $derived(context.stateGame.spinMultiplier);

	const scale = $derived(isPortrait ? 1 : 0.85);
	const BADGE_HALF = 95; // keeps the badge off the canvas edge on narrow layouts

	/**
	 * Where the kraken parks it while the spin plays out: beside its head, above
	 * the frame, on every layout.
	 *
	 * The +250 clears the kraken itself, whose resting half-width tops out around
	 * 200 box units (widest in portrait). Portrait sits a little higher because
	 * its box is the tallest and the kraken rides largest there.
	 */
	const home = $derived.by(() => {
		// the frame's own top edge, converted from board space into box space
		const frameHalfHeight = ((BOARD_SIZES.width * 0.805) / 2) * bl.scale;
		return {
			x: Math.min(bl.x + 250, layout.width - BADGE_HALF - 10),
			y: Math.max(70, bl.y - frameHalfHeight - (isPortrait ? 90 : 50)),
		};
	});

	/** ...and where it dives: the win box, centred on the board (see Win.svelte). */
	const target = $derived({ x: bl.x, y: bl.y - 40 });

	type Phase = 'hidden' | 'spawn' | 'idle' | 'strike';
	let phase = $state<Phase>('hidden');
	let dust = $state(false);
	/**
	 * The impact cloud at the win box, on its own clock.
	 *
	 * Two flags, and both are needed:
	 * - `burstEmit` is the short window in which smoke is actually thrown.
	 * - `burstShow` keeps the emitter MOUNTED afterwards so the last puffs live out
	 *   their 0.9s rather than being destroyed mid-flight (see WildLandDust).
	 *
	 * They are deliberately NOT tied to `phase`. The BADGE's subtree unmounts at
	 * `phase = 'hidden'` and mounts again on the next award, so a cloud gated on
	 * anything latched there (a "has struck" counter) is re-mounted — and plays
	 * again — the instant the next badge appears, with nothing having hit the box.
	 */
	let burstEmit = $state(false);
	let burstShow = $state(false);
	// how long smoke is thrown, and how long the emitter lingers to drain
	const BURST_EMIT_MS = 160;
	const BURST_DRAIN_MS = 900; // WildLandDust lifetime.max
	/**
	 * How long the strike blocks the presentation after the visible impact —
	 * this is the delay between the badge hitting the box and the winbox
	 * starting to count the multiplied figure (setWin's next winUpdate waits on
	 * spinMultiplierStrike). It used to be 620ms, which read as the box sitting
	 * on its hands after being hit; the cloud never needed the wait (it drains
	 * on its own clocks) and the badge is already invisible by impact
	 * (strikeFade), so 200ms is purely the beat between punch and reaction.
	 */
	const STRIKE_SETTLE_MS = 200;
	/**
	 * The dive, and the cue that has to finish on it.
	 *
	 * sfx_kw_mult_fly is a 1080ms descent that BUILDS for its whole length and cuts
	 * off dead on impact, so its peak has to land exactly when the badge hits the
	 * box. Played at FLY_RATE it occupies 818ms — longer than the flight should
	 * be, which is the whole tension here.
	 *
	 * Resolved by starting the CUE early rather than by stretching the motion: the
	 * badge simply keeps idling, breathing and bobbing as it already was, while the
	 * sound builds underneath. Then it dives, fast and straight.
	 *
	 * It used to pull BACK from the box first — a wind-up. That reads as a bounce
	 * and is gone; the badge no longer moves at all until it moves at the box.
	 *
	 * FLY_RATE is pinned, not derived: the cue's pitch is what it is and retuning
	 * the flight must not change how it sounds. FLY_LEAD_MS absorbs the difference.
	 */
	const DIVE_MS = 380;
	const FLY_CUE_MS = 1080;
	const FLY_RATE = 1.32;
	/** idle hold while the cue builds — invisible, the badge is still breathing */
	const FLY_LEAD_MS = Math.max(0, Math.round(FLY_CUE_MS / FLY_RATE) - DIVE_MS);
	let pulse = $state(0);
	/**
	 * What the badge SHOWS — latched at spawn instead of read live.
	 *
	 * The book clears `spinMultiplier` back to 1 before this has finished fading
	 * (a spin that paid nothing, or the feature ending), and rendering the live
	 * value meant the badge visibly flicked to "x1" on its way out.
	 */
	let displayValue = $state(1);

	const pop = new Tween(0);
	const alpha = new Tween(1);
	const flightX = new Tween(0);
	const flightY = new Tween(0);
	// swells as it dives, so it reads as bearing down on the box rather than
	// sliding across to it, then punches once more on impact
	const flightScale = new Tween(1);

	// Bumped by every spawn and dismissal so an in-flight one can tell it has been
	// superseded — without it a fade-out finishing after the next award would hide
	// the new badge.
	let sequence = 0;

	const spawn = async (value: number) => {
		const token = ++sequence;
		displayValue = value;
		pop.set(0, { duration: 0 });
		alpha.set(1, { duration: 0 });
		// MUST be reset: the strike leaves this at its impact size, so without it
		// the next award spawned at 2.35x and filled the screen.
		flightScale.set(1, { duration: 0 });
		phase = 'spawn';
		dust = true;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_kw_mult_appear', forcePlay: true });
		await pop.set(1, { duration: 480, easing: backOut });
		if (token !== sequence) return; // superseded while popping in
		dust = false;
		phase = 'idle';
	};

	/**
	 * One cloud at the win box. Runs alongside `strike` rather than being awaited
	 * by it, so the puffs can finish after the badge and the rest of the
	 * presentation have moved on.
	 */
	let burstSequence = 0;
	const burst = async () => {
		const token = ++burstSequence;
		burstShow = true;
		burstEmit = true;
		await waitForTimeout(BURST_EMIT_MS);
		if (token !== burstSequence) return; // a newer cloud owns the flags now
		burstEmit = false;
		await waitForTimeout(BURST_DRAIN_MS);
		if (token !== burstSequence) return;
		burstShow = false;
	};

	const strike = async () => {
		// nothing was awarded this spin (or it has already struck)
		if (phase === 'hidden') return;
		// Read, don't bump: this is only here so a fresh award arriving mid-strike
		// is not hidden again by this strike's own clean-up.
		const token = sequence;

		// The cue leads the motion — see FLY_LEAD_MS above. Fired first, while the
		// badge is still idling, so its peak lands on the impact and not after it.
		context.eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_kw_mult_fly',
			forcePlay: true,
			rate: FLY_RATE,
		});
		await waitForTimeout(FLY_LEAD_MS);
		if (token !== sequence) return; // a new award arrived while the cue was building

		flightX.set(home.x, { duration: 0 });
		flightY.set(home.y, { duration: 0 });
		flightScale.set(1, { duration: 0 });
		alpha.set(1, { duration: 0 });
		phase = 'strike';

		// The dive. cubicIn only — it accelerates into the box and never overshoots
		// or pulls back. The badge dissolves ON THE WAY IN (see strikeFade) rather
		// than landing on the box and inflating there, so it is already gone by the
		// time the burst goes off.
		await Promise.all([
			flightX.set(target.x, { duration: DIVE_MS, easing: cubicIn }),
			flightY.set(target.y, { duration: DIVE_MS, easing: cubicIn }),
			flightScale.set(2.1, { duration: DIVE_MS, easing: cubicIn }),
		]);

		// the hit itself, at the box — its own container, so the cloud is not tied
		// to the badge's (now invisible) one
		void burst();
		context.eventEmitter.broadcast({ type: 'winBoxImpact' });
		// the box knock rattles the box; this rattles everything else — fired
		// with the impact, never awaited, so the 200ms settle stays 200ms
		{
			const app = context.stateApp.pixiApplication;
			if (app) void playEarthquake(app, 'short');
		}
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_kw_mult_hit', forcePlay: true });
		await waitForTimeout(STRIKE_SETTLE_MS);
		if (token !== sequence) return; // a new award arrived mid-strike
		phase = 'hidden';
	};

	/**
	 * Cleared without striking — the award went unused (a spin that paid nothing),
	 * or the feature ended. Fades rather than popping out.
	 */
	const dismiss = async () => {
		if (phase === 'hidden') return;
		const token = ++sequence;
		await alpha.set(0, { duration: 200 });
		if (token !== sequence) return; // a new award arrived mid-fade
		phase = 'hidden';
		dust = false;
	};

	// `shown` is a plain let: it tracks what has been presented WITHOUT making the
	// effect depend on it, so writing phase/tweens below cannot re-trigger it.
	let shown = 1;
	$effect(() => {
		const value = multiplier;
		if (value === shown) return;
		shown = value;
		if (value > 1) {
			void spawn(value);
		} else {
			void dismiss();
		}
	});

	/**
	 * The idle breath, running ONLY while it is actually idling.
	 *
	 * This component is mounted for the whole session, so an unconditional
	 * animation frame loop here wrote reactive state 60 times a second forever —
	 * for a badge that is on screen for a few seconds of a free-spins round, and
	 * invisible the rest of the time. `pulse` is not read by this effect, so
	 * writing it cannot re-trigger it.
	 */
	$effect(() => {
		if (phase !== 'idle') return;
		let raf: number;
		const start = performance.now();
		const tick = () => {
			pulse = Math.sin((performance.now() - start) / 480) * 0.5 + 0.5;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	context.eventEmitter.subscribeOnMount({
		spinMultiplierStrike: async () => await strike(),
	});

	// idle breathes; the dive holds a steady, slightly larger pose
	const idleScale = $derived(phase === 'idle' ? 1 + pulse * 0.08 : 1);
	const bob = $derived(phase === 'idle' ? pulse * 6 : 0);
	const position = $derived(
		phase === 'strike' ? { x: flightX.current, y: flightY.current } : home,
	);

	/**
	 * Fades the badge out over the middle of the dive, by DISTANCE covered rather
	 * than by time: the flight eases in, so most of the ground is made up in the
	 * last few frames and any time-based fade would either vanish it just after it
	 * set off or leave it landing on the box. Gone by ~80% of the way, while it is
	 * at its fastest — the smoke takes it from there.
	 */
	const strikeFade = $derived.by(() => {
		if (phase !== 'strike') return 1;
		const distance = Math.hypot(target.x - home.x, target.y - home.y) || 1;
		const travelled = Math.hypot(flightX.current - home.x, flightY.current - home.y);
		const progress = travelled / distance;
		return Math.max(0, Math.min(1, (0.8 - progress) / 0.45));
	});
</script>

<!--
	The impact cloud lives in its OWN subtree, outside the badge's `phase` gate.
	The badge is gone (phase 'hidden') well before the last puffs have faded, and
	sharing a gate would unmount the emitter mid-flight — which is what makes a
	cloud snap off instead of thinning out.

	The same purple cloud the badge is revealed out of, thrown at ~2.5x the size
	of a wild's landing puff.
-->
{#if burstShow}
	<MainContainer label="SpinMultiplierBurstContainer" zIndex={100}>
		<WildLandDust x={target.x} y={target.y} emit={burstEmit} spread={2.5} />
	</MainContainer>
{/if}

{#if phase !== 'hidden'}
	<!--
		zIndex, not mount order: pixi-svelte appends on mount, and the win box's
		contents mount LATER (at winShow) than this badge does (mid-spin, when the
		kraken awards it) — so without this the box drew over the multiplier diving
		into it. MainContainer puts this on its outer container, which is the
		root-level sibling of every other one.
	-->
	<MainContainer label="SpinMultiplierContainer" zIndex={100}>
		<Container
			x={position.x}
			y={position.y + bob}
			alpha={alpha.current * strikeFade}
			scale={scale * pop.current * idleScale * flightScale.current}
		>
			<ResponsiveBitmapText
				anchor={0.5}
				maxWidth={260}
				text={`x${displayValue}`}
				style={{
					fontFamily: 'cinzel-bold-gold',
					fontSize: 130,
					align: 'center',
					letterSpacing: 0,
				}}
			/>
			<!-- rendered last so the smoke rolls OVER the number, the way the wild's
			     landing dust does (see WildLandDust) -->
			<WildLandDust x={0} y={0} emit={dust} zIndex={10} />
		</Container>
	</MainContainer>
{/if}
