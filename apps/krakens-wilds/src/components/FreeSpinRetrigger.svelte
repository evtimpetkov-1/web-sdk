<script lang="ts" module>
	export type EmitterEventFreeSpinRetrigger =
		| { type: 'freeSpinRetriggerShow'; extraSpins: number; positions: { reel: number; row: number }[] };
</script>

<script lang="ts">
	import { gsap } from 'gsap';
	import { BaseSprite, Container, Rectangle, SpineProvider, SpineTrack, Texture } from 'pixi-svelte';
	import { ResponsiveBitmapText, ResponsiveText } from 'components-pixi';
	import { stateUrlDerived } from 'state-shared';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { waitForTimeout, waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { CELL_W, CELL_H, SYMBOL_SIZE, REEL_PADDING, BOARD_SIZES } from '../game/constants';
	import { headingGold } from '../game/textStyles';

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

	let splashAnim = $state<'retrigger_in' | 'retrigger_idle' | 'retrigger_out' | null>(null);
	// "+N" pop below the RETRIGGER splash
	const plusScale = new Tween(0);
	// full-screen dim behind the splash to focus attention on it
	const shadeAlpha = new Tween(0);

	/**
	 * The FREE SPIN(S) line under the +N (2026-08-26 rework).
	 *
	 * The lettering used to live INSIDE the fsText spine as six per-letter
	 * pieces; recutting them for the new font chopped glyphs at the seams, so
	 * the letters were stripped from the skeleton altogether (it now draws only
	 * the puffs, glow and flash) and the line is drawn here as a layer of its
	 * own: the baked loading-screen art for English, translated headingGold
	 * text for every other locale — which the spine's baked-English letters
	 * could never offer.
	 *
	 * A +1 retrigger reads "+1 FREE SPINS", plural, in every language. English
	 * used to crop the art before the trailing S, but the letters' dark
	 * outlines merge into one opaque slab inside a word (the only transparent
	 * gap in the art is between the two words), so a straight cut left a hard
	 * dark stub after the N. Non-English never had a singular label either.
	 */
	const useBakedArt = (stateUrlDerived.social() || stateUrlDerived.lang() === 'en');
	/**
	 * Where the spine letters actually SAT. Their setup pose is at skeleton
	 * origin, but every retrigger_* animation holds fs_grp translated to spine
	 * y -227.83 at scale 0.9 — i.e. 227.83 su BELOW the origin (spine y is up),
	 * at 90% size. The first cut of this layer used the setup pose and the line
	 * landed on top of the +N. All in skeleton units x the provider's fit
	 * (width 680 / skeleton 1600).
	 */
	const SPINE_FIT = 680 / 1600;
	const TEXT_Y = 227.83 * SPINE_FIT; // 96.8 board units below the container origin
	const TEXT_W = 1346.6 * 0.9 * SPINE_FIT; // the letters' animated footprint, 515
	const TEXT_AR = 588 / 102; // free_spins_text_en.webp is 588x102 (v5 art)
	/**
	 * The line's entrance/exit, driven by gsap on a $state target (gsap writes
	 * through the proxy, so every frame is reactive). It POPS instead of fading:
	 * in on the same 250ms delay as the +N so the pair arrives as one unit, with
	 * a back.out overshoot and a slow breathe while the card idles; out by
	 * scaling to 0 with the SAME duration, easing and moment as the +N's
	 * plusScale — the two leave together, the same way.
	 */
	const textAnim = $state({ scale: 0 });
	const killTextAnim = () => gsap.killTweensOf(textAnim);
	const textIn = () => {
		killTextAnim();
		textAnim.scale = 0;
		gsap
			.timeline()
			.to(textAnim, { scale: 1, duration: 0.45, delay: 0.25, ease: 'back.out(1.6)' })
			.to(textAnim, { scale: 1.04, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
	};
	const textOut = () => {
		killTextAnim();
		// mirrors plusScale.set(0, { duration: 300, easing: cubicOut })
		gsap.to(textAnim, { scale: 0, duration: 0.3, ease: 'power2.out' });
	};
	// the component lives for the whole session — never leave a repeating tween
	$effect(() => () => killTextAnim());
	const fullTexture = $derived(
		context.stateApp.loadedAssets?.loadingFreeSpinsTextEn as Texture | undefined,
	);

	/**
	 * The splash is driven by the spine's `complete` callbacks, which are detached
	 * from the emitter handler. This bridges the two so `freeSpinRetriggerShow`
	 * only resolves once the card has actually left the screen — the book event
	 * queue is what waits on it, and without that the next free spin spun up
	 * behind the shade (see bookEventHandlerMap.freeSpinRetrigger).
	 */
	let splashComplete: (() => void) | null = null;
	const finishSplash = () => {
		splashComplete?.();
		splashComplete = null;
	};

	// retrigger_in 1.0s + idle hold 3.0s + retrigger_out 0.45s. Used only as a
	// failsafe: if the skeleton ever fails to fire a `complete` the round must not
	// hang on a splash that is already gone.
	const SPLASH_TOTAL_MS = 1000 + 3000 + 450;
	const SPLASH_TIMEOUT_MS = SPLASH_TOTAL_MS + 1000;

	context.eventEmitter.subscribeOnMount({
		freeSpinRetriggerShow: async (emitterEvent) => {
			extraSpins = emitterEvent.extraSpins;
			splashAnim = 'retrigger_in';
			plusScale.set(0, { duration: 0 });
			plusScale.set(1, { duration: 450, easing: cubicOut, delay: 250 });
			shadeAlpha.set(0.65, { duration: 300 });
			textIn();

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

			// The per-position labels play alongside the splash rather than after it,
			// so they are run as their own sequence and both are awaited together.
			const labelsDone = (async () => {
				await waitForTimeout(400);

				// Float up + fade out
				for (const label of newLabels) {
					label.y.set(-CELL_H * 0.6);
					label.alpha.set(0);
				}

				await waitForTimeout(900);
				labels = [];
			})();

			await Promise.all([
				labelsDone,
				Promise.race([
					waitForResolve((resolve) => (splashComplete = resolve)),
					waitForTimeout(SPLASH_TIMEOUT_MS),
				]),
			]);
			splashComplete = null;
		},
	});
</script>

{#if splashAnim}
	<!-- screen shade — oversized in board space so it covers the canvas at any layout scale -->
	<Rectangle
		anchor={0.5}
		x={BOARD_SIZES.width / 2}
		y={BOARD_SIZES.height / 2}
		width={6000}
		height={6000}
		backgroundColor={0x000000}
		alpha={shadeAlpha.current}
	/>
	<Container x={BOARD_SIZES.width / 2} y={BOARD_SIZES.height / 2 - 40} zIndex={11}>
		<SpineProvider key="fsText" width={680}>
			<SpineTrack
				trackIndex={0}
				animationName={splashAnim}
				loop={splashAnim === 'retrigger_idle'}
				listener={{
					complete: async () => {
						if (splashAnim === 'retrigger_in') {
							splashAnim = 'retrigger_idle';
							await waitForTimeout(3000);
							plusScale.set(0, { duration: 300, easing: cubicOut });
							shadeAlpha.set(0, { duration: 400 });
							textOut();
							splashAnim = 'retrigger_out';
						} else if (splashAnim === 'retrigger_out') {
							splashAnim = null;
							finishSplash();
						}
					},
				}}
			/>
		</SpineProvider>
		<!-- FREE SPINS, at the spine letters' ANIMATED position (see TEXT_Y) -->
		<Container y={TEXT_Y} scale={textAnim.scale}>
			{#if useBakedArt}
				{#if fullTexture}
					<BaseSprite texture={fullTexture} anchor={0.5} width={TEXT_W} height={TEXT_W / TEXT_AR} />
				{/if}
			{:else}
				<ResponsiveText
					anchor={0.5}
					maxWidth={TEXT_W}
					text={context.i18nDerived.freeSpins()}
					style={{ ...headingGold, fontSize: 72 }}
				/>
			{/if}
		</Container>
		<!-- big +N above the FREE SPINS line -->
		<Container y={-60} scale={plusScale.current}>
			<ResponsiveBitmapText
				anchor={0.5}
				maxWidth={360}
				text={`+${extraSpins}`}
				style={{
					fontFamily: 'cinzel-bold-gold',
					fontSize: 140,
					align: 'center',
					letterSpacing: 0,
				}}
			/>
		</Container>
	</Container>
{/if}

{#each labels as label (label.id)}
	{@const x = CELL_W * (label.reel + REEL_PADDING)}
	{@const baseY = (label.row - 0.5) * CELL_H}
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
