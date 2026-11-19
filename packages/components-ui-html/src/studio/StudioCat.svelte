<script lang="ts">
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
	 * The box is the old still picture's (cat.ts): the head plus 14 % of its width
	 * each side for the whiskers, from the crown's top to the head's bottom, so it
	 * drops in where that picture was. It fills its parent's width.
	 */
	const { atlas, pieces, src, headClip, ears, whiskers } = STUDIO_LOGO;
	type Piece = (typeof pieces)[number];
	type Frame = { x: number; y: number; w: number; h: number };

	const percent = (value: number) => `${value * 100}%`;
	// one piece of the packed image, as a background
	const sprite = (piece: Piece) =>
		[
			`--sx: ${percent(atlas.width / piece.aw)}`,
			`--sy: ${percent(atlas.height / piece.ah)}`,
			`--px: ${percent(atlas.width === piece.aw ? 0 : piece.ax / (atlas.width - piece.aw))}`,
			`--py: ${percent(atlas.height === piece.ah ? 0 : piece.ay / (atlas.height - piece.ah))}`,
		].join('; ');
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
</script>

<span class="studio-cat" style={`aspect-ratio: ${BOX.w} / ${BOX.h}; --atlas: url("${src}");`} aria-hidden="true">
	<span class="head" style={`${boxIn(head, BOX)}; ${sprite(head)};`}>
		<span class="tilt">
			<i class="skin" style={`clip-path: ${headClip};`}></i>
			<i class="skin ear ear_l" style={`clip-path: ${ears.l.clip}; transform-origin: ${ears.l.origin};`}></i>
			<i class="skin ear ear_r" style={`clip-path: ${ears.r.clip}; transform-origin: ${ears.r.origin};`}></i>
			{#each hairs as hair (hair.name)}
				<i
					class={`hair ${hair.name}`}
					style={`${boxIn(hair, head)}; ${sprite(hair)}; transform-origin: ${whiskers[hair.name as keyof typeof whiskers].origin};`}
				></i>
			{/each}
			{#each lids as lid (lid.name)}
				<i class={`lid ${lid.name}`} style={`${boxIn(lid, head)}; ${sprite(lid)};`}></i>
			{/each}
			<span class="crown" style={`${boxIn(crown, head)}; ${sprite(crown)};`}>
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
