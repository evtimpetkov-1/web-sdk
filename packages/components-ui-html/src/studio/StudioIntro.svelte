<script lang="ts">
	import { onMount } from 'svelte';

	import { STUDIO_LOGO } from './logo';

	/**
	 * The studio ident: ROYAL CAT GAMING assembles itself on black, the cat alive
	 * the whole time, then fades to whatever is under it (the game's own loader).
	 * The same in every game.
	 *
	 *   0.08 s  the head hops up from below, ears flopping and whiskers trailing
	 *           after it
	 *   0.52 s  the crown drops onto it: the head takes the knock, he blinks, the
	 *           ears splay, the whiskers flare, sparks fly off the crown
	 *   0.90 s  R O Y A L  C A T slam in, one letter after another
	 *   1.00 s  from here on he never holds still: the head sways, the whiskers
	 *           drift, an ear or a whisker fan twitches now and then, the crown glints
	 *   1.38 s  the GAMING banner unrolls from its middle
	 *   1.80 s  the letters hop in a wave
	 *   2.25 s  he tilts his head and winks, the whiskers on that side lifting
	 *   3.05 s  everything fades out (0.38 s)
	 *
	 * It costs the player no time: the game loads underneath while it plays. It is
	 * all CSS animation of transform and opacity, so it keeps running smoothly while
	 * the main thread is busy starting the game, and the picture is one small image
	 * that arrives inside the code (logo.ts), so there is nothing to wait for.
	 * Under prefers-reduced-motion the logo simply appears, holds and fades.
	 * `?studio=false` in the URL skips it (development, automated checks).
	 *
	 * No new art for the motion: the ears are the head drawn again through two cuts
	 * (clip-paths) and turned about their roots; the eyelids are two small patches; the
	 * mouth does not move (tried and dropped, Evtim 2026-11-18: "its not looking good
	 * ... remove it"); every whisker and eyebrow whisker is a layer of its own that
	 * turns about its root (see the .hair rules).
	 * Pieces, cuts and boxes are generated: art-review/studio/royal-cat-gaming
	 * (build_logo_parts.py, build_studio_intro.py).
	 */
	type Props = {
		/** called when the ident has gone */
		ondone?: () => void;
	};
	const props: Props = $props();

	const { width: W, height: H, atlas, pieces, src, background, headClip, ears, whiskers } = STUDIO_LOGO;
	type Piece = (typeof pieces)[number];
	const LETTER_STEP = 55;
	const TOTAL_MS = 3450;
	const TOTAL_STILL_MS = 2000;

	const skip =
		typeof window !== 'undefined' &&
		new URLSearchParams(window.location.search).get('studio') === 'false';
	const still =
		typeof window !== 'undefined' &&
		!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	let shown = $state(!skip);

	const percent = (value: number) => `${value * 100}%`;
	// one piece of the packed image, as a background
	const sprite = (piece: Piece) =>
		[
			// aw / ah: its size in the packed image (the whiskers are packed at twice their box)
			`--sx: ${percent(atlas.width / piece.aw)}`,
			`--sy: ${percent(atlas.height / piece.ah)}`,
			`--px: ${percent(atlas.width === piece.aw ? 0 : piece.ax / (atlas.width - piece.aw))}`,
			`--py: ${percent(atlas.height === piece.ah ? 0 : piece.ay / (atlas.height - piece.ah))}`,
		].join('; ');
	// a piece's box inside another box (the logo, or the head for what rides on it)
	const boxIn = (piece: Piece, frame: { x: number; y: number; w: number; h: number }) =>
		[
			`left: ${percent((piece.x - frame.x) / frame.w)}`,
			`top: ${percent((piece.y - frame.y) / frame.h)}`,
			`width: ${percent(piece.w / frame.w)}`,
			`height: ${percent(piece.h / frame.h)}`,
		].join('; ');
	const LOGO = { x: 0, y: 0, w: W, h: H };
	const find = (name: string) => pieces.find((piece) => piece.name === name)!;
	const head = find('head');
	const crown = find('crown');
	const banner = find('banner');
	const lids = pieces.filter((piece) => piece.name.startsWith('lid_'));
	const hairs = pieces.filter((piece) => piece.name.startsWith('whisk_') || piece.name.startsWith('brow_'));
	// how each whisker moves: --up turns its tip upwards (the left ones point left, the
	// right ones right, so the same turn is mirrored), --i its place in its fan from the
	// top, for the ripple that runs down a fan
	const hairKind = (hair: Piece) => {
		const [kind, side] = hair.name.split('_');
		return { kind, side: side.startsWith('l') ? 'left' : 'right', up: side.startsWith('l') ? 1 : -1, i: Number(side.slice(1)) - 1 };
	};
	const letters = pieces.filter((piece) => piece.name.startsWith('l_'));
	// sparks off the crown as it lands: the angles they fly at (0 = straight up)
	const SPARKS = [-78, -46, -16, 14, 44, 76];

	onMount(() => {
		if (skip) {
			props.ondone?.();
			return;
		}
		const timer = setTimeout(
			() => {
				shown = false;
				props.ondone?.();
			},
			still ? TOTAL_STILL_MS : TOTAL_MS,
		);
		return () => clearTimeout(timer);
	});
</script>

{#if shown}
	<div class="studio-intro" class:still style={`--bg: ${background}; --atlas: url("${src}");`} aria-hidden="true">
		<div class="logo" style={`--ratio: ${W / H}; aspect-ratio: ${W} / ${H};`}>
			<!-- the cat: head, ears, eyelids and the crown he wears move as one -->
			<div class="piece head" style={`${boxIn(head, LOGO)}; ${sprite(head)};`}>
				<div class="sway">
					<div class="tilt">
						<div class="knock">
							<i class="skin" style={`clip-path: ${headClip};`}></i>
							<i class="skin ear ear_l" style={`clip-path: ${ears.l.clip}; transform-origin: ${ears.l.origin};`}></i>
							<i class="skin ear ear_r" style={`clip-path: ${ears.r.clip}; transform-origin: ${ears.r.origin};`}></i>
							{#each hairs as hair (hair.name)}
								{@const h = hairKind(hair)}
								<!-- outer: a slow drift; inner: the twitches -->
								<i
									class={`hair ${h.kind} ${h.side}`}
									style={`${boxIn(hair, head)}; ${sprite(hair)}; --up: ${h.up}; --i: ${h.i}; --origin: ${whiskers[hair.name as keyof typeof whiskers].origin};`}
								><i class="strand"></i></i>
							{/each}
							{#each lids as lid (lid.name)}
								<i class={`lid ${lid.name}`} style={`${boxIn(lid, head)}; ${sprite(lid)};`}></i>
							{/each}
						</div>
						<div class="crown" style={`${boxIn(crown, head)}; ${sprite(crown)};`}>
							<i class="skin"></i>
							{#each SPARKS as angle (angle)}
								<i class="spark" style={`--a: ${angle}deg;`}></i>
							{/each}
							<i class="glint g1"></i>
							<i class="glint g2"></i>
						</div>
					</div>
				</div>
			</div>

			{#each letters as letter, i (letter.name)}
				<div
					class="piece letter"
					style={`${boxIn(letter, LOGO)}; ${sprite(letter)}; --i: ${i}; --step: ${LETTER_STEP}ms;`}
				>
					<div class="hop"><i class="skin"></i></div>
				</div>
			{/each}

			<div class="piece banner" style={`${boxIn(banner, LOGO)}; ${sprite(banner)};`}>
				<div class="flutter"><i class="skin"></i></div>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.studio-intro {
		position: fixed;
		inset: 0;
		z-index: 2000;
		display: grid;
		place-items: center;
		background: var(--bg);
		/* nothing under it takes a press yet, and a late script must not leave an
		   invisible sheet over the game */
		pointer-events: none;
		animation: rc-out 380ms 3050ms ease-in both;

		&.still {
			animation: rc-out 380ms 1600ms ease-in both;
		}
	}

	.logo {
		position: relative;
		/* as large as fits: 74% of the width, 60% of the height */
		width: min(74vw, 60vh * var(--ratio), 620px);
	}

	.piece {
		position: absolute;
		will-change: transform, opacity;
	}

	.sway,
	.tilt,
	.knock,
	.hop,
	.flutter {
		position: absolute;
		inset: 0;
	}

	/* a piece of the packed image filling its box (the sprite is set on the box) */
	.skin {
		position: absolute;
		inset: 0;
		background: var(--atlas) var(--px) var(--py) / var(--sx) var(--sy) no-repeat;
	}

	/* ================================================================ the cat */
	/* up from below with a hop */
	.head {
		transform-origin: 50% 100%;
		animation: rc-head 640ms 80ms cubic-bezier(0.25, 0.8, 0.3, 1) both;
	}

	/* never still once he is up: a slow sway about the neck */
	.sway {
		transform-origin: 50% 100%;
		animation: rc-sway 1700ms 1000ms ease-in-out infinite;
	}

	/* the wink's tilt of the head */
	.tilt {
		transform-origin: 50% 100%;
		animation: rc-tilt 560ms 2230ms ease-in-out;
	}

	/* the crown's knock: squashed for a moment */
	.knock {
		transform-origin: 50% 100%;
		animation: rc-knock 320ms 790ms ease-out;
	}

	/* the ears lag behind the hop, splay at the knock, twitch on their own */
	.ear_l {
		animation:
			rc-ear-l 520ms 260ms ease-out,
			rc-ear-l 420ms 790ms ease-out,
			rc-ear-l-twitch 240ms 2080ms ease-out,
			rc-ear-l-twitch 240ms 2330ms ease-out;
	}
	.ear_r {
		animation:
			rc-ear-r 520ms 290ms ease-out,
			rc-ear-r 420ms 790ms ease-out,
			rc-ear-r-twitch 240ms 1560ms ease-out,
			rc-ear-r-twitch 200ms 2820ms ease-out;
	}

	/* The whiskers (Evtim, 2026-11-19: "animate the wiskers too"). Each muzzle whisker
	   and each eyebrow whisker is its own clean layer over a head rebuilt beneath it
	   (art-review/studio/royal-cat-gaming/lift_whiskers.py), so it can turn about its
	   root with nothing left behind. (The first lift, 2026-11-18, left slivers that
	   showed as soon as a whisker moved, so they had been held still.)
	   Angles are for the tip: rotate(var(--up) * a) lifts a muzzle whisker's tip by a;
	   on the eyebrow whiskers, which point up and out, the same turn draws the tip in
	   over the head and a negative one lets it droop outwards.
	   The outer element drifts slowly the whole time; the inner one (.strand) takes the
	   twitches, one after another (no fill mode, so none holds over the next), each
	   running down the fan from the top whisker (--i). */
	.hair,
	.strand {
		position: absolute;
		transform-origin: var(--origin);
	}
	.hair {
		animation: rc-whisker-drift 2300ms 1000ms ease-in-out infinite;
	}
	.strand {
		inset: 0;
		background: var(--atlas) var(--px) var(--py) / var(--sx) var(--sy) no-repeat;
		--ripple: calc(var(--i) * 28ms);
	}
	.whisk.right {
		animation-duration: 2050ms;
	}
	.brow {
		animation-name: rc-brow-drift;
	}

	/* muzzle whiskers: they trail the hop, flare when the crown lands, twitch (one
	   side, then the other) and lift on the wink side as he winks */
	.whisk.left .strand {
		animation:
			rc-whisker-trail 540ms calc(180ms + var(--ripple)) ease-out,
			rc-whisker-flare 440ms calc(790ms + var(--ripple)) ease-out,
			rc-whisker-twitch 320ms calc(1420ms + var(--ripple)) ease-out,
			rc-whisker-wink 600ms calc(2260ms + var(--ripple)) ease-in-out,
			rc-whisker-twitch 300ms calc(2900ms + var(--ripple)) ease-out;
	}
	.whisk.right .strand {
		animation:
			rc-whisker-trail 540ms calc(180ms + var(--ripple)) ease-out,
			rc-whisker-flare 440ms calc(790ms + var(--ripple)) ease-out,
			rc-whisker-twitch 320ms calc(1900ms + var(--ripple)) ease-out,
			rc-whisker-twitch 300ms calc(2420ms + var(--ripple)) ease-out;
	}

	/* eyebrow whiskers: they trail the hop, spring up when the crown knocks, droop as
	   the eye under them shuts (the blink; on the left also the wink) */
	.brow .strand {
		animation:
			rc-brow-trail 540ms calc(180ms + var(--ripple)) ease-out,
			rc-brow-spring 420ms calc(790ms + var(--ripple)) ease-out,
			rc-brow-droop 220ms calc(1620ms + var(--ripple)) ease-in-out,
			rc-brow-spring 420ms calc(2650ms + var(--ripple)) ease-out;
	}
	.brow.left .strand {
		animation:
			rc-brow-trail 540ms calc(180ms + var(--ripple)) ease-out,
			rc-brow-spring 420ms calc(790ms + var(--ripple)) ease-out,
			rc-brow-droop 220ms calc(1620ms + var(--ripple)) ease-in-out,
			rc-brow-wink 420ms calc(2300ms + var(--ripple)) ease-in-out,
			rc-brow-spring 420ms calc(2760ms + var(--ripple)) ease-out;
	}

	/* the eyelids: shut for a moment at the knock, a plain blink later, then one wink.
	   No fill mode, so outside those moments they are simply not there */
	.lid {
		position: absolute;
		background: var(--atlas) var(--px) var(--py) / var(--sx) var(--sy) no-repeat;
		opacity: 0;
		animation:
			rc-blink 190ms 800ms linear,
			rc-blink 150ms 1640ms linear;
	}
	.lid_l {
		animation:
			rc-blink 190ms 800ms linear,
			rc-blink 150ms 1640ms linear,
			rc-blink 320ms 2330ms linear;
	}

	/* ================================================================ the crown */
	/* it falls, lands a little too hard, settles; it rides the head from then on */
	.crown {
		position: absolute;
		transform-origin: 50% 100%;
		animation: rc-crown 520ms 520ms both;
	}

	/* sparks thrown off as it lands */
	.spark {
		position: absolute;
		left: 46%;
		top: 62%;
		width: 12%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: #ffd24a;
		opacity: 0;
		animation: rc-spark 480ms 790ms cubic-bezier(0.1, 0.7, 0.3, 1);
	}

	/* a glint on a point of the crown, now and then */
	.glint {
		position: absolute;
		width: 26%;
		aspect-ratio: 1;
		background: #ffffff;
		clip-path: polygon(50% 0, 59% 41%, 100% 50%, 59% 59%, 50% 100%, 41% 59%, 0 50%, 41% 41%);
		transform: scale(0);
	}
	.g1 {
		left: 34%;
		top: -12%;
		animation:
			rc-glint 520ms 1150ms ease-in-out,
			rc-glint 520ms 2600ms ease-in-out;
	}
	.g2 {
		left: 74%;
		top: 8%;
		animation: rc-glint 520ms 1900ms ease-in-out;
	}

	/* ================================================================ the name */
	/* the letters slam in one after another, later hop in a wave */
	.letter {
		transform-origin: 50% 70%;
		animation: rc-letter 300ms calc(900ms + var(--i) * var(--step)) cubic-bezier(0.2, 0.8, 0.3, 1) both;

		.hop {
			transform-origin: 50% 100%;
			animation: rc-hop 340ms calc(1800ms + var(--i) * 60ms) ease-out;
		}
	}

	/* the banner unrolls from its middle, then flutters once */
	.banner {
		animation: rc-banner 380ms 1380ms cubic-bezier(0.2, 0.8, 0.3, 1) both;

		.flutter {
			animation: rc-flutter 520ms 2000ms ease-in-out;
		}
	}

	/* (a light running over the letters was here and was removed: Evtim, 2026-11-18,
	   "I also want this glance going through the text removed") */

	/* ================================================================ keyframes */
	@keyframes rc-head {
		0% {
			opacity: 0;
			transform: translateY(60%) scale(0.6) rotate(-10deg);
		}
		20% {
			opacity: 1;
		}
		55% {
			opacity: 1;
			transform: translateY(-7%) scale(1.07) rotate(3deg);
		}
		78% {
			transform: translateY(1.5%) scale(0.985) rotate(-1deg);
		}
		100% {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes rc-sway {
		0%,
		100% {
			transform: none;
		}
		25% {
			transform: rotate(1.8deg) translateY(-0.6%);
		}
		75% {
			transform: rotate(-1.8deg) translateY(0.4%);
		}
	}

	@keyframes rc-tilt {
		0%,
		100% {
			transform: none;
		}
		40%,
		65% {
			transform: rotate(7deg) translateX(1.5%);
		}
	}

	@keyframes rc-knock {
		0% {
			transform: none;
		}
		28% {
			transform: scale(1.045, 0.93);
		}
		62% {
			transform: scale(0.985, 1.025);
		}
		100% {
			transform: none;
		}
	}

	/* outwards and back past the middle: the left ear turns anti-clockwise, the right clockwise */
	@keyframes rc-ear-l {
		0%,
		100% {
			transform: none;
		}
		30% {
			transform: rotate(-12deg);
		}
		65% {
			transform: rotate(5deg);
		}
	}
	@keyframes rc-ear-r {
		0%,
		100% {
			transform: none;
		}
		30% {
			transform: rotate(12deg);
		}
		65% {
			transform: rotate(-5deg);
		}
	}
	@keyframes rc-ear-l-twitch {
		0%,
		100% {
			transform: none;
		}
		40% {
			transform: rotate(-11deg);
		}
		70% {
			transform: rotate(3deg);
		}
	}
	@keyframes rc-ear-r-twitch {
		0%,
		100% {
			transform: none;
		}
		40% {
			transform: rotate(11deg);
		}
		70% {
			transform: rotate(-3deg);
		}
	}

	/* whiskers: positive = the tip up (muzzle) / in over the head (eyebrows) */
	@keyframes rc-whisker-drift {
		0%,
		100% {
			transform: none;
		}
		50% {
			transform: rotate(calc(var(--up) * 1.6deg));
		}
	}
	@keyframes rc-whisker-trail {
		0%,
		100% {
			transform: none;
		}
		35% {
			transform: rotate(calc(var(--up) * -6deg));
		}
		70% {
			transform: rotate(calc(var(--up) * 3deg));
		}
	}
	@keyframes rc-whisker-flare {
		0%,
		100% {
			transform: none;
		}
		25% {
			transform: rotate(calc(var(--up) * 5deg));
		}
		60% {
			transform: rotate(calc(var(--up) * -2deg));
		}
	}
	@keyframes rc-whisker-twitch {
		0%,
		100% {
			transform: none;
		}
		30% {
			transform: rotate(calc(var(--up) * 4deg));
		}
		62% {
			transform: rotate(calc(var(--up) * -1.2deg));
		}
	}
	@keyframes rc-whisker-wink {
		0%,
		100% {
			transform: none;
		}
		35%,
		70% {
			transform: rotate(calc(var(--up) * 6deg));
		}
	}
	@keyframes rc-brow-drift {
		0%,
		100% {
			transform: none;
		}
		50% {
			transform: rotate(calc(var(--up) * -1.2deg));
		}
	}
	@keyframes rc-brow-trail {
		0%,
		100% {
			transform: none;
		}
		35% {
			transform: rotate(calc(var(--up) * -4deg));
		}
		70% {
			transform: rotate(calc(var(--up) * 2deg));
		}
	}
	@keyframes rc-brow-spring {
		0%,
		100% {
			transform: none;
		}
		25% {
			transform: rotate(calc(var(--up) * 5deg));
		}
		60% {
			transform: rotate(calc(var(--up) * -2deg));
		}
	}
	@keyframes rc-brow-droop {
		0%,
		100% {
			transform: none;
		}
		45%,
		60% {
			transform: rotate(calc(var(--up) * -5deg));
		}
	}
	@keyframes rc-brow-wink {
		0%,
		100% {
			transform: none;
		}
		30%,
		70% {
			transform: rotate(calc(var(--up) * -7deg));
		}
	}

	@keyframes rc-blink {
		0%,
		100% {
			opacity: 0;
		}
		12%,
		88% {
			opacity: 1;
		}
	}

	@keyframes rc-crown {
		0% {
			opacity: 0;
			transform: translateY(-330%) rotate(-30deg);
			animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.5);
		}
		12% {
			opacity: 1;
		}
		52% {
			transform: translateY(10%) rotate(5deg);
			animation-timing-function: ease-out;
		}
		74% {
			transform: translateY(-16%) rotate(-4deg);
			animation-timing-function: ease-in;
		}
		100% {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes rc-spark {
		0% {
			opacity: 1;
			transform: rotate(var(--a)) translateY(0) scale(1);
		}
		100% {
			opacity: 0;
			transform: rotate(var(--a)) translateY(-700%) scale(0.3);
		}
	}

	@keyframes rc-glint {
		0%,
		100% {
			transform: scale(0) rotate(0deg);
		}
		50% {
			transform: scale(1) rotate(45deg);
		}
	}

	@keyframes rc-letter {
		0% {
			opacity: 0;
			transform: scale(2.2) translateY(-14%);
		}
		60% {
			opacity: 1;
			transform: scale(0.9);
		}
		100% {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes rc-hop {
		0%,
		100% {
			transform: none;
		}
		40% {
			transform: translateY(-17%) scale(1.04, 1.06);
		}
		75% {
			transform: translateY(2%) scale(1.03, 0.96);
		}
	}

	@keyframes rc-banner {
		0% {
			opacity: 0;
			transform: scaleX(0);
		}
		70% {
			opacity: 1;
			transform: scaleX(1.07);
		}
		100% {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes rc-flutter {
		0%,
		100% {
			transform: none;
		}
		30% {
			transform: rotate(-2.2deg) scale(1.03);
		}
		65% {
			transform: rotate(1.4deg);
		}
	}

	@keyframes rc-out {
		to {
			opacity: 0;
			visibility: hidden;
		}
	}

	/* reduced motion: the finished logo, no movement */
	.still {
		.piece,
		.piece * {
			animation: none;
		}
		.lid,
		.spark,
		.glint {
			display: none;
		}
	}
</style>
