<script lang="ts">
	import { STUDIO_CAT_LEVELS } from './cat';
	import { STUDIO_LOGO } from './logo';

	/**
	 * The studio's cat on his own (head, whiskers, crown), ALIVE: for small places
	 * such as the generic UI's bonus button (Evtim, 2026-11-18: "can you animate the
	 * cat in the buy bonus, it would be better to play some animation from time to
	 * time").
	 *
	 * He is built from the studio ident's own pieces (logo.ts: the head drawn three
	 * times through clip-paths so the ears turn about their roots, the whisker
	 * layers, the two eyelids, the crown), so there is no new art and no second
	 * picture to load. Every animation runs on ONE clock (CYCLE), most of which is
	 * rest:
	 *    8 %  a blink
	 *   30 %  the right ear twitches twice
	 *   46 %  a glint on the crown
	 *   52 %  a blink
	 *   62 %  the left ear twitches
	 *   72 %  he tilts his head and winks
	 *   90 %  a small nod
	 * Transform and opacity only. Under prefers-reduced-motion he holds still.
	 *
	 * The box is the old still picture's: the head plus 14 % of its width each side
	 * for the whiskers, from the crown's top to the head's bottom. It fills its
	 * parent's width.
	 *
	 * SHARPNESS (2026-11-20, Evtim: "the buy button is looking a bit pixalated
	 * especially the wiskers ... I need this fixed on platform level"): the intro's
	 * atlas has the head at 514 px and the whiskers at twice that, and a bonus button
	 * draws the head at ~100-200 device px. On a layer with a running animation the
	 * browser shrinks with plain bilinear sampling, so a 3-10x shrink broke the thin
	 * whiskers into steps. cat.ts holds the pieces shrunk properly at a few sizes; he
	 * draws the smallest that is at least his size on screen (measured, x device pixel
	 * ratio), the intro's atlas above the last, so the browser never shrinks much.
	 */
	const { pieces, headClip, ears, whiskers } = STUDIO_LOGO;
	type Piece = (typeof pieces)[number];
	type Frame = { x: number; y: number; w: number; h: number };
	type Packed = readonly [number, number, number, number];
	type Level = { head: number; atlas: { width: number; height: number }; src: string; pieces: Record<string, Packed> };

	const LEVELS: Level[] = [
		...STUDIO_CAT_LEVELS,
		{
			head: pieces.find((piece) => piece.name === 'head')!.aw,
			atlas: STUDIO_LOGO.atlas,
			src: STUDIO_LOGO.src,
			pieces: Object.fromEntries(pieces.map((piece) => [piece.name, [piece.ax, piece.ay, piece.aw, piece.ah] as const])),
		},
	];

	const percent = (value: number) => `${value * 100}%`;
	// one piece of the packed image, as a background
	const sprite = (piece: Piece, level: Level) => {
		const { atlas } = level;
		const [ax, ay, aw, ah] = level.pieces[piece.name];
		return [
			`--sx: ${percent(atlas.width / aw)}`,
			`--sy: ${percent(atlas.height / ah)}`,
			`--px: ${percent(atlas.width === aw ? 0 : ax / (atlas.width - aw))}`,
			`--py: ${percent(atlas.height === ah ? 0 : ay / (atlas.height - ah))}`,
		].join('; ');
	};
	// a piece's box inside another box
	const boxIn = (piece: Piece, frame: Frame) =>
		[
			`left: ${percent((piece.x - frame.x) / frame.w)}`,
			`top: ${percent((piece.y - frame.y) / frame.h)}`,
			`width: ${percent(piece.w / frame.w)}`,
			`height: ${percent(piece.h / frame.h)}`,
		].join('; ');
	const find = (name: string) => pieces.find((piece) => piece.name === name)!;
	const head = find('head');
	const crown = find('crown');
	const lids = pieces.filter((piece) => piece.name.startsWith('lid_'));
	const hairs = pieces.filter((piece) => piece.name.startsWith('whisk_') || piece.name.startsWith('brow_'));

	const side = Math.floor(head.w * 0.14);
	const BOX: Frame = {
		x: head.x - side,
		y: crown.y,
		w: head.w + side * 2,
		h: head.y + head.h - crown.y,
	};

	// the level: the smallest whose head is at least ~his head on screen in device
	// pixels. Up to a 15 % upscale is allowed (not seen), so a 2560 px retina desktop
	// (~275 px of head) keeps the 257 px level instead of a ~2x shrink of the intro's
	// atlas. The middle one until he is measured.
	let root: HTMLSpanElement | undefined = $state();
	let levelIndex = $state(1);
	const level = $derived(LEVELS[levelIndex]);
	$effect(() => {
		if (!root) return;
		const el = root;
		const pick = () => {
			const need = (el.clientWidth * head.w * window.devicePixelRatio) / BOX.w;
			const index = LEVELS.findIndex((candidate) => candidate.head * 1.15 >= need);
			levelIndex = index === -1 ? LEVELS.length - 1 : index;
		};
		pick();
		const observer = new ResizeObserver(pick);
		observer.observe(el);
		// a zoom or a move to another screen changes the pixel ratio, not his box
		let dpr: MediaQueryList | undefined;
		const watchDpr = () => {
			dpr?.removeEventListener('change', onDpr);
			dpr = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
			dpr.addEventListener('change', onDpr);
		};
		const onDpr = () => {
			pick();
			watchDpr();
		};
		watchDpr();
		return () => {
			observer.disconnect();
			dpr?.removeEventListener('change', onDpr);
		};
	});
</script>

<span
	class="studio-cat"
	bind:this={root}
	style={`aspect-ratio: ${BOX.w} / ${BOX.h}; --atlas: url("${level.src}");`}
	aria-hidden="true"
>
	<span class="head" style={`${boxIn(head, BOX)}; ${sprite(head, level)};`}>
		<span class="tilt">
			<i class="skin" style={`clip-path: ${headClip};`}></i>
			<i class="skin ear ear_l" style={`clip-path: ${ears.l.clip}; transform-origin: ${ears.l.origin};`}></i>
			<i class="skin ear ear_r" style={`clip-path: ${ears.r.clip}; transform-origin: ${ears.r.origin};`}></i>
			{#each hairs as hair (hair.name)}
				<i
					class={`hair ${hair.name}`}
					style={`${boxIn(hair, head)}; ${sprite(hair, level)}; transform-origin: ${whiskers[hair.name as keyof typeof whiskers].origin};`}
				></i>
			{/each}
			{#each lids as lid (lid.name)}
				<i class={`lid ${lid.name}`} style={`${boxIn(lid, head)}; ${sprite(lid, level)};`}></i>
			{/each}
			<span class="crown" style={`${boxIn(crown, head)}; ${sprite(crown, level)};`}>
				<i class="skin"></i>
				<i class="glint"></i>
			</span>
		</span>
	</span>
</span>

<style lang="scss">
	.studio-cat {
		--cycle: 9s;
		position: relative;
		display: block;
		width: 100%;
	}

	.head,
	.tilt,
	.crown {
		position: absolute;
	}
	.tilt {
		inset: 0;
		transform-origin: 50% 100%;
		animation: sc-tilt var(--cycle) ease-in-out infinite;
	}

	/* a piece of the packed image filling its box (the sprite is set on the box) */
	.skin,
	.hair,
	.lid {
		position: absolute;
		background: var(--atlas) var(--px) var(--py) / var(--sx) var(--sy) no-repeat;
	}
	.skin {
		inset: 0;
	}

	.ear_l {
		animation: sc-ear-l var(--cycle) ease-out infinite;
	}
	.ear_r {
		animation: sc-ear-r var(--cycle) ease-out infinite;
	}
	/* the whisker layers ride the head and do not turn by themselves here. Since
	   2026-11-19 they are clean layers (one per whisker) and twitch in StudioIntro;
	   the button's cat could take the same twitch if Evtim asks for it */

	.lid {
		opacity: 0;
		animation: sc-blink var(--cycle) linear infinite;
	}
	/* the left eye also winks */
	.lid_l {
		animation-name: sc-blink-wink;
	}

	.glint {
		position: absolute;
		left: 34%;
		top: -14%;
		width: 30%;
		aspect-ratio: 1;
		background: #ffffff;
		clip-path: polygon(50% 0, 59% 41%, 100% 50%, 59% 59%, 50% 100%, 41% 59%, 0 50%, 41% 41%);
		transform: scale(0);
		animation: sc-glint var(--cycle) ease-in-out infinite;
	}

	@keyframes sc-blink {
		0%,
		7.9%,
		9.7%,
		51.9%,
		53.5%,
		100% {
			opacity: 0;
		}
		8%,
		9.6%,
		52%,
		53.4% {
			opacity: 1;
		}
	}
	@keyframes sc-blink-wink {
		0%,
		7.9%,
		9.7%,
		51.9%,
		53.5%,
		72.9%,
		76.6%,
		100% {
			opacity: 0;
		}
		8%,
		9.6%,
		52%,
		53.4%,
		73%,
		76.5% {
			opacity: 1;
		}
	}

	/* the head: a tilt for the wink, a small nod near the end */
	@keyframes sc-tilt {
		0%,
		70.5%,
		79%,
		89.5%,
		95%,
		100% {
			transform: none;
		}
		/* he stands on a line (the bonus tile's bottom edge, which also cuts him off
		   there): a turn lifts one corner of his bust off it, so every turn also
		   sinks him by what that corner rises */
		72.5%,
		76.5% {
			transform: translateY(4.2%) rotate(5.5deg);
		}
		91% {
			transform: translateY(2%) rotate(-2.5deg);
		}
		93% {
			transform: translateY(1.2%) rotate(1.5deg);
		}
	}

	/* outwards and back past the middle: the left ear turns anti-clockwise, the right clockwise */
	@keyframes sc-ear-r {
		0%,
		29.5%,
		32%,
		34.6%,
		100% {
			transform: none;
		}
		30.4% {
			transform: rotate(12deg);
		}
		31.3% {
			transform: rotate(-3deg);
		}
		33% {
			transform: rotate(11deg);
		}
		33.9% {
			transform: rotate(-3deg);
		}
	}
	@keyframes sc-ear-l {
		0%,
		61.5%,
		64.2%,
		100% {
			transform: none;
		}
		62.4% {
			transform: rotate(-12deg);
		}
		63.4% {
			transform: rotate(3deg);
		}
	}

	@keyframes sc-glint {
		0%,
		44%,
		50%,
		100% {
			transform: scale(0) rotate(0deg);
		}
		47% {
			transform: scale(1) rotate(45deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tilt,
		.ear,
		.lid,
		.glint {
			animation: none;
		}
	}
</style>
