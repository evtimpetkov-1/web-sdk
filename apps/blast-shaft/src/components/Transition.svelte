<script lang="ts" module>
	export type EmitterEventTransition =
		/** curtains close and part again in one go */
		| { type: 'transition' }
		/** curtains close and STAY closed — swap the scene behind them, then open */
		| { type: 'transitionClose' }
		/** `celebrate`: free spins are behind them. Light builds in the seam, then they are thrown open in a burst of light, dust and gold */
		| { type: 'transitionOpen'; celebrate?: boolean }
		/** the curtains fade in already shut, no slide and no sound (the intro's exit) */
		| { type: 'transitionShowClosed' }
		/** the intro's exit without the curtains: the black shade alone fades in; transitionOpen fades it out */
		| { type: 'transitionShowVeil' };

	/**
	 * Above everything on the stage. pixi-svelte appends a (re)mounted child at
	 * the end of its parent, so draw order by mount order put the game — mounted
	 * after the loading screen — over the opening curtains. The intro
	 * (LoadingScreen) sits one above and fades out over the curtains fading in.
	 */
	export const CURTAIN_Z = 1000;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { Container, Rectangle, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import CurtainFx from './CurtainFx.svelte';

	/**
	 * The hospital curtain (Evtim's curtains_v2.png): its two halves, each with
	 * a stretch of rod and rings, tiled across the screen at the art's own
	 * proportions, so it covers landscape and portrait alike (a row of panels
	 * per side on wide screens, one per side on a phone). Every other panel is
	 * the opposite half mirrored, which breaks up the repeat. Base <-> free
	 * spins switches happen while it is shut, and the game itself opens behind it.
	 *
	 * Motion: `close` draws each side out of a bunch gathered off its edge and
	 * every panel swings from the rod as it lands (the msFsCurtain rig's timing
	 * and swing); `open` gathers them back off-screen. A black shade behind
	 * covers whatever the panels do not.
	 *
	 * 2026-11-24 (third review, "Poor animations"; Evtim: "make the curtain animation
	 * better ... more excitement when we show the curtains - maybe some dust, after all
	 * it should be celebration we won free spins"):
	 * - closing: the two sides are hauled in harder and MEET with a thud: the whole
	 *   curtain jolts, dust is shaken off the rod and out of the seam (CurtainFx)
	 * - opening on free spins (`celebrate`): first the cloth trembles while gold light
	 *   builds in the seam and sparks slip out (CHARGE_S), then it is thrown open
	 *   faster than usual in a flash, a fan of light, blown dust, sparks and nuggets
	 * - any other opening: a little dust off the parting edges
	 * The art is drawn from files twice the size of ART (sharp on a 2x screen).
	 */
	type Phase = 'open' | 'closing' | 'closed' | 'charging' | 'opening';
	type Side = 'left' | 'right';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const ready = $derived(
		!!context.stateApp.loadedAssets?.msCurtainLeft && !!context.stateApp.loadedAssets?.msCurtainRight,
	);
	// the effects layer mounts once, when its two atlases are in (Particles keeps the
	// texture it was given at mount)
	const fxReady = $derived(
		!!context.stateApp.loadedAssets?.bsBgLife && !!context.stateApp.loadedAssets?.bsGold,
	);
	let fx = $state<ReturnType<typeof CurtainFx>>();

	// art (curtain_left/right.webp, from cut_curtain.py): px
	const ART = { height: 1370, left: 433, right: 417 };
	const OVERLAP = 6; // art px adjacent panels overlap, so no slit shows between them
	const CENTER_OVERLAP = 10; // art px the two inner panels cross at the middle

	const CLOSE_S = 0.9;
	const OPEN_S = 0.8;
	// the two sides meet this far into the close
	const MEET_S = 0.46;
	// free spins behind the curtains: light builds in the seam, then they fly open
	const CHARGE_S = 0.8;
	const BURST_OPEN_S = 0.62;
	const SHOW_CLOSED_MS = 450;

	// ---- layout: art px -> canvas px, rings at the top edge, hem past the bottom ----
	const s = $derived((canvas.height * 1.03) / ART.height);
	const top = $derived(-canvas.height * 0.01);
	const panels = $derived.by(() => {
		const list: {
			id: string;
			side: Side;
			index: number;
			key: string;
			anchorX: number;
			mirror: boolean;
			innerX: number;
			width: number;
		}[] = [];
		for (const side of ['left', 'right'] as Side[]) {
			const dir = side === 'left' ? -1 : 1;
			let inner = canvas.width / 2 - (dir * CENTER_OVERLAP * s) / 2;
			const sidePanels: typeof list = [];
			for (let index = 0; dir < 0 ? inner > 0 : inner < canvas.width; index++) {
				// own half on even panels, the opposite half mirrored on odd ones
				const half = (index % 2 === 0) === (side === 'left') ? 'left' : 'right';
				const width = ART[half] * s;
				sidePanels.push({
					id: `${side}${index}`,
					side,
					index,
					key: half === 'left' ? 'msCurtainLeft' : 'msCurtainRight',
					// the left half's inner (leading) edge is its right side, and vice versa
					anchorX: half === 'left' ? 1 : 0,
					mirror: index % 2 === 1,
					innerX: inner,
					width,
				});
				inner += dir * (width - OVERLAP * s);
			}
			// outer first, so each inner panel lies over the one outside it
			list.push(...sidePanels.reverse());
		}
		return list;
	});
	// Open = every panel of a side gathered in one bunch just off its edge (the
	// inner edge 40 px out, the panels hanging away from the screen). Closing
	// spreads the bunch: the inner panel travels furthest, neighbours always
	// overlap, so no slit ever opens between them mid-move.
	const bunchX = (side: Side) => (side === 'left' ? -40 : canvas.width + 40);

	// ---- clock: the Pixi ticker drives the moves ----
	let phase = $state<Phase>('open');
	let t = $state(0);
	type Mark = { at: number; fn: () => void };
	let running: { duration: number; resolve: () => void; marks: Mark[] } | null = null;
	/** runs the clock for `duration`; each mark fires once as the clock passes it */
	const run = (duration: number, marks: Mark[] = []) =>
		new Promise<void>((resolve) => {
			t = 0;
			running = { duration, resolve, marks: [...marks] };
		});
	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		const tick = () => {
			if (!running) return;
			t = Math.min(running.duration, t + app.ticker.deltaMS / 1000);
			running.marks = running.marks.filter((mark) => {
				if (t < mark.at) return true;
				mark.fn();
				return false;
			});
			if (phase === 'charging') fx?.setCharge(t / CHARGE_S);
			if (t >= running.duration) {
				const done = running;
				running = null;
				done.resolve();
			}
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	const ramp = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
	const easeOut = (x: number) => 1 - (1 - x) ** 3;
	const easeIn = (x: number) => x ** 3;
	/** a swing that dies away after `from`: amplitude 1 */
	const swing = (x: number, from: number) =>
		x <= from ? 0 : Math.exp(-(x - from) * 4.5) * Math.sin((x - from) * Math.PI * 2 * 2.2);

	/**
	 * Inner-edge x and rotation about the rod for one panel at the current time.
	 * Pixi rotation is clockwise, so `dir * +` swings the hem toward the centre.
	 */
	const poseOf = (side: Side, index: number, innerX: number) => {
		const dir = side === 'left' ? -1 : 1;
		const at = (u: number) => bunchX(side) + (innerX - bunchX(side)) * u;
		if (phase === 'closing') {
			const u = easeOut(ramp(t, 0, MEET_S));
			// the hem keeps travelling after the rod stops: swings past and back,
			// each panel a touch out of step with the next
			return { x: at(u), rotation: dir * 0.055 * swing(t, MEET_S + index * 0.03) };
		}
		if (phase === 'charging') {
			// something is pushing from behind: the cloth trembles harder and harder,
			// the two inner panels bulge away from the light
			const k = t / CHARGE_S;
			const shiver = Math.sin(t * 53 + index * 1.7) * (0.002 + 0.007 * k);
			const bulge = index === 0 ? dir * 0.012 * k * k : 0;
			return { x: innerX + dir * 3 * k * (index === 0 ? 1 : 0), rotation: shiver - bulge };
		}
		if (phase === 'opening' && bursting) {
			// thrown open: no easing in, the hems fly behind
			const u = 1 - easeOut(ramp(t, 0, BURST_OPEN_S * 0.92)) ** 0.8;
			return { x: at(u), rotation: dir * 0.07 * Math.sin(Math.PI * ramp(t, 0, BURST_OPEN_S)) };
		}
		if (phase === 'opening') {
			const u = 1 - easeIn(ramp(t, 0.1, 0.7));
			// the hem trails toward the centre as the rod pulls away
			return { x: at(u), rotation: dir * 0.025 * ramp(t, 0.1, 0.5) * (1 - ramp(t, 0.6, OPEN_S)) };
		}
		return { x: innerX, rotation: 0 };
	};
	let bursting = $state(false);
	const shadeAlpha = $derived(
		phase === 'closing'
			? ramp(t, 0.2, MEET_S)
			: phase === 'opening'
				? 1 - (bursting ? ramp(t, 0, 0.18) : ramp(t, 0.15, 0.45))
				: 1,
	);
	// the thud of the two sides meeting: the whole curtain drops a little and settles
	const jolt = $derived(
		phase === 'closing' && t >= MEET_S
			? canvas.height * 0.016 * Math.exp(-(t - MEET_S) * 9) * Math.cos((t - MEET_S) * 34)
			: 0,
	);

	// ---- the requests ----
	const fade = new Tween(1);
	// shut with no panels, the shade alone: open() fades it instead of drawing the curtains
	let veil = $state(false);
	const showClosed = async () => {
		fade.set(0, { duration: 0 });
		phase = 'closed';
		await fade.set(1, { duration: SHOW_CLOSED_MS });
	};
	const showVeil = async () => {
		veil = true;
		await showClosed();
	};
	const close = async () => {
		if (phase === 'closed') return;
		phase = 'closing';
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_curtain_close' });
		await run(CLOSE_S, [
			{
				at: MEET_S,
				fn: () => {
					fx?.thud();
					context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_reel_land' });
				},
			},
		]);
		phase = 'closed';
	};
	const open = async (celebrate = false) => {
		if (phase === 'open') return;
		if (veil) {
			await fade.set(0, { duration: SHOW_CLOSED_MS });
			phase = 'open';
			veil = false;
			fade.set(1, { duration: 0 });
			return;
		}
		if (celebrate) {
			// an orchestral crescendo while the light builds, a full orchestral hit as the curtain
			// is thrown open (Evtim's round-6 pick, 2026-11-26; the charge borrowed the scatter
			// anticipation's ratchet before)
			phase = 'charging';
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_curtain_build', forcePlay: true });
			await run(CHARGE_S);
			bursting = true;
			fx?.burst();
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_curtain_blast', forcePlay: true });
		} else {
			fx?.puff();
		}
		phase = 'opening';
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_curtain_open' });
		await run(bursting ? BURST_OPEN_S : OPEN_S);
		phase = 'open';
		bursting = false;
	};

	// Requests run one after another. The intro opens the curtains on the game
	// while a resumed free-spins round may already ask them to close again; run
	// together, the second would cut the first short with the panels mid-move.
	let queue = Promise.resolve();
	const enqueue = (step: () => Promise<void>) => (queue = queue.then(step));

	context.eventEmitter.subscribeOnMount({
		transition: () =>
			enqueue(async () => {
				await close();
				await open();
			}),
		transitionClose: () => enqueue(close),
		transitionOpen: (emitterEvent) => enqueue(() => open(emitterEvent.celebrate)),
		transitionShowClosed: () => enqueue(showClosed),
		transitionShowVeil: () => enqueue(showVeil),
	});
</script>

<Container zIndex={CURTAIN_Z} alpha={fade.current}>
	<!-- each layer keeps its own Container: pixi-svelte appends a (re)mounted child at
	     the end of its parent, so the panels coming back would land over the effects -->
	<Container>
		{#if ready && phase !== 'open'}
			<Rectangle
				width={canvas.width}
				height={canvas.height}
				backgroundColor={0x000000}
				alpha={shadeAlpha}
			/>
		{/if}
	</Container>
	<Container y={jolt}>
		{#if ready && phase !== 'open'}
			{#each veil ? [] : panels as panel (panel.id)}
				{@const pose = poseOf(panel.side, panel.index, panel.innerX)}
				<Container
					x={pose.x}
					y={top}
					rotation={pose.rotation}
					scale={{ x: panel.mirror ? -1 : 1, y: 1 }}
				>
					<Sprite
						key={panel.key}
						anchor={{ x: panel.anchorX, y: 0 }}
						width={panel.width}
						height={ART.height * s}
					/>
				</Container>
			{/each}
		{/if}
	</Container>
	{#if fxReady}
		<CurtainFx bind:this={fx} />
	{/if}
</Container>
