<script lang="ts" module>
	import type { Position } from '../game/types';

	export type EmitterEventMovingClones = {
		type: 'clonesFly';
		from: Position;
		to: Position[];
		/**
		 * fired per target the moment its ghost lands, so the caller can start that
		 * cell's splat while the rest are still in the air (the event itself resolves
		 * once every ghost has arrived)
		 */
		onArrive?: (to: Position) => void;
	};
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { quadIn, quadOut, quartInOut } from 'svelte/easing';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';
	import type { MovingClone } from '../game/stateGame.svelte';

	/**
	 * The cloner's ghosts: slime copies that leave the cloner and land on the
	 * cells it clones onto. Drawn in the board's coordinate space (BoardContainer)
	 * so cell centres come from getSymbolX / getSymbolY, above the reel board.
	 * Each ghost is one entry in stateGame.movingClones for as long as it flies.
	 */
	const GHOST_ART = { width: 219, height: 269 }; // cloner_ghost.png
	const GHOST_WIDTH = SYMBOL_SIZE * 0.55;
	const GHOST_HEIGHT = (GHOST_WIDTH * GHOST_ART.height) / GHOST_ART.width;
	const GHOST_TINT = 0xd8ffc0;
	const GHOST_ALPHA = 0.85;
	const FLIGHT_MS = 380;
	const STAGGER_MS = 60;
	// the arc: up for the first 40% of the flight, down onto the target for the rest
	const RISE_RATIO = 0.4;
	const ARC_HEIGHT = SYMBOL_SIZE * 0.8;

	const context = getContext();
	let nextId = 0;

	// book rows index the padded reel; the board's y is in visible rows
	const cellX = (position: Position) => getSymbolX(position.reel);
	const cellY = (position: Position) => getSymbolY(position.row - 1);

	const fly = async ({ from, to }: { from: Position; to: Position }) => {
		const timeScale = stateBetDerived.timeScale();
		const rise = (FLIGHT_MS * RISE_RATIO) / timeScale;
		const fall = (FLIGHT_MS * (1 - RISE_RATIO)) / timeScale;
		const ghost: MovingClone = {
			id: nextId++,
			x: new Tween(cellX(from)),
			y: new Tween(cellY(from)),
			scale: new Tween(0.6),
		};
		context.stateGame.movingClones = [...context.stateGame.movingClones, ghost];

		await Promise.all([
			ghost.x.set(cellX(to), { duration: FLIGHT_MS / timeScale, easing: quartInOut }),
			(async () => {
				await ghost.y.set(cellY(from) - ARC_HEIGHT, { duration: rise, easing: quadOut });
				await ghost.y.set(cellY(to), { duration: fall, easing: quadIn });
			})(),
			(async () => {
				await ghost.scale.set(1, { duration: rise, easing: quadOut });
				await ghost.scale.set(0.7, { duration: fall, easing: quadIn });
			})(),
		]);

		context.stateGame.movingClones = context.stateGame.movingClones.filter(
			(movingClone) => movingClone.id !== ghost.id,
		);
	};

	context.eventEmitter.subscribeOnMount({
		clonesFly: async ({ from, to, onArrive }) => {
			const timeScale = stateBetDerived.timeScale();
			await Promise.all(
				to.map(async (target, index) => {
					await waitForTimeout((index * STAGGER_MS) / timeScale);
					await fly({ from, to: target });
					onArrive?.(target);
				}),
			);
		},
	});
</script>

<!-- width/height set the sprite's scale, so the flight scale lives on a parent container -->
<BoardContainer>
	{#each context.stateGame.movingClones as ghost (ghost.id)}
		<Container x={ghost.x.current} y={ghost.y.current} scale={ghost.scale.current}>
			<Sprite
				key="msClonerGhost"
				anchor={0.5}
				width={GHOST_WIDTH}
				height={GHOST_HEIGHT}
				tint={GHOST_TINT}
				alpha={GHOST_ALPHA}
			/>
		</Container>
	{/each}
</BoardContainer>
