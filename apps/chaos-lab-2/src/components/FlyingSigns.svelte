<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo, getSymbolX, getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';
	import type { Position } from '../game/types';

	/**
	 * The cloner's SIGN flies (CLONE_STYLE 'frames'; Evtim, 2026-11-26: "I want the
	 * rectangles to fly and then some reveal effect is done, similiar to how it was
	 * before"). The two green rectangles lift off the cloner's own sign, at its size and
	 * in its colours, and are lobbed to each cell they clone onto: up and nearer, turning
	 * a little into the flight, a short green streak behind, down onto the cell. They
	 * arrive at LAND (1.18 of their size on a tile), where CloneFx's `frames_in` takes
	 * over and brings them down hard on the symbol.
	 * It is the flight the slime version had (MovingClones: a pale, see-through ghost at
	 * about half size), in the sign's real colours and size. Answers the same `clonesFly`
	 * event, in the board's coordinate space, above the reel board.
	 */
	const SIGN_ART = { width: 219, height: 269 }; // cloner_ghost.webp
	const PLATE_ART = { width: 297, height: 321 }; // the tile it is cut from, 38 / 25 px in
	const SIGN_OFFSET = { x: 38 + SIGN_ART.width / 2 - PLATE_ART.width / 2, y: 25 + SIGN_ART.height / 2 - PLATE_ART.height / 2 };
	const FLIGHT_MS = 400;
	const STAGGER_MS = 70;
	const LAND = 1.18; // spines/cl2Clone `frames_in` starts the sign here
	const LIFT = 0.3; // how much nearer it comes at the top of the arc
	const ARC = SYMBOL_SIZE * 0.85;
	const LEAN = 0.24; // radians at mid-flight, into the flight
	const TRAIL = [
		{ lag: 0.08, alpha: 0.4 },
		{ lag: 0.16, alpha: 0.22 },
		{ lag: 0.24, alpha: 0.1 },
	];
	// kept two frames past the landing, so the sign is never missing before the rig draws it
	const HANDOVER_MS = 40;

	const context = getContext();
	const plate = getSymbolInfo({ rawSymbol: { name: 'C' }, state: 'static' }).sizeRatios;
	const UNIT = (SYMBOL_SIZE * plate.width) / PLATE_ART.width; // board units per px of the tile's art
	const WIDTH = SIGN_ART.width * UNIT;
	const HEIGHT = SIGN_ART.height * UNIT;

	type Sign = { id: number; from: { x: number; y: number }; to: { x: number; y: number }; progress: Tween<number> };
	let signs = $state<Sign[]>([]);
	let nextId = 0;

	// the sign's place on a cell (book rows index the padded reel; the board's y is in visible rows)
	const place = (position: Position) => ({
		x: getSymbolX(position.reel) + SIGN_OFFSET.x * UNIT,
		y: getSymbolY(position.row - 1) + SIGN_OFFSET.y * UNIT,
	});
	const pose = (sign: Sign, at: number) => {
		const p = Math.min(1, Math.max(0, at));
		// across at an even pace; up fast and down faster, like something thrown
		const across = p * p * (3 - 2 * p);
		const height = Math.sin(Math.PI * Math.pow(p, 0.85));
		const direction = Math.sign(sign.to.x - sign.from.x) || 1;
		return {
			x: sign.from.x + (sign.to.x - sign.from.x) * across,
			y: sign.from.y + (sign.to.y - sign.from.y) * across - ARC * height,
			scale: 1 + (LAND - 1) * p + LIFT * height,
			rotation: direction * LEAN * Math.sin(Math.PI * p),
		};
	};

	context.eventEmitter.subscribeOnMount({
		clonesFly: async ({ from, to, onArrive }) => {
			const timeScale = stateBetDerived.timeScale();
			await Promise.all(
				to.map(async (target, index) => {
					await waitForTimeout((index * STAGGER_MS) / timeScale);
					const sign: Sign = { id: nextId++, from: place(from), to: place(target), progress: new Tween(0) };
					signs = [...signs, sign];
					await sign.progress.set(1, { duration: FLIGHT_MS / timeScale, easing: (t) => t });
					onArrive?.(target);
					setTimeout(() => (signs = signs.filter(({ id }) => id !== sign.id)), HANDOVER_MS);
				}),
			);
		},
	});
</script>

<BoardContainer>
	{#each signs as sign (sign.id)}
		{@const progress = sign.progress.current}
		{@const now = pose(sign, progress)}
		<!-- the streak behind it: gone as it lands -->
		{#each TRAIL as ghost}
			{@const behind = pose(sign, progress - ghost.lag)}
			{#if progress > ghost.lag && progress < 1}
				<Sprite
					key="msClonerGhost"
					anchor={0.5}
					x={behind.x}
					y={behind.y}
					width={WIDTH * behind.scale}
					height={HEIGHT * behind.scale}
					rotation={behind.rotation}
					alpha={ghost.alpha}
					blendMode="add"
				/>
			{/if}
		{/each}
		<Container x={now.x} y={now.y} rotation={now.rotation}>
			<Sprite key="msClonerGhost" anchor={0.5} width={WIDTH * now.scale} height={HEIGHT * now.scale} />
		</Container>
	{/each}
</BoardContainer>
