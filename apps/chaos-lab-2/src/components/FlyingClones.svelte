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
	 * The cloner throws COPIES OF ITS OWN TILE (FX_SET 'energy', 2026-11-26; the slime
	 * version, MovingClones, lobbed a pale ghost of the sign). Each copy lifts off the
	 * cloner, darts to its cell on a low arc leaning into the flight, with a streak of
	 * green afterimages behind it, and arrives lifted (1.12): exactly where CloneFx's
	 * `splat` takes over and slams it into the cell. So the copy that leaves the cloner
	 * is the tile the cell ends up with.
	 * Answers the same `clonesFly` event as MovingClones (declared there), in the board's
	 * coordinate space, above the reel board. One of the two is mounted (Game.svelte).
	 */
	const FLIGHT_MS = 380;
	const STAGGER_MS = 60;
	const ARRIVE_SCALE = 1.12; // CloneFx `splat` starts here
	const LIFT = 0.16; // how much nearer it comes mid-flight
	const ARC = SYMBOL_SIZE * 0.3;
	const LEAN = 0.2; // radians at mid-flight, into the flight
	// afterimages: how far behind (share of the flight) and how strong
	const TRAIL = [
		{ lag: 0.07, alpha: 0.42 },
		{ lag: 0.14, alpha: 0.28 },
		{ lag: 0.21, alpha: 0.17 },
		{ lag: 0.28, alpha: 0.08 },
	];
	const TRAIL_TINT = 0x9dff5a;
	// kept two frames past the landing, so the cell is never seen bare before the splat is drawn
	const HANDOVER_MS = 40;

	const context = getContext();
	const tile = getSymbolInfo({ rawSymbol: { name: 'C' }, state: 'static' });
	const WIDTH = SYMBOL_SIZE * tile.sizeRatios.width;
	const HEIGHT = SYMBOL_SIZE * tile.sizeRatios.height;

	type Clone = { id: number; from: { x: number; y: number }; to: { x: number; y: number }; progress: Tween<number> };
	let clones = $state<Clone[]>([]);
	let nextId = 0;

	// book rows index the padded reel; the board's y is in visible rows
	const cell = (position: Position) => ({ x: getSymbolX(position.reel), y: getSymbolY(position.row - 1) });
	// slow off the cloner (it lifts), fast through the middle, straight into the cell
	const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
	const pose = (clone: Clone, at: number) => {
		const p = Math.min(1, Math.max(0, at));
		const e = ease(p);
		const swing = Math.sin(Math.PI * e);
		const direction = Math.sign(clone.to.x - clone.from.x) || 1;
		return {
			x: clone.from.x + (clone.to.x - clone.from.x) * e,
			y: clone.from.y + (clone.to.y - clone.from.y) * e - ARC * swing,
			scale: 1 + (ARRIVE_SCALE - 1) * e + LIFT * swing,
			rotation: direction * LEAN * swing,
		};
	};

	const fly = async ({ from, to }: { from: Position; to: Position }) => {
		const clone: Clone = { id: nextId++, from: cell(from), to: cell(to), progress: new Tween(0) };
		clones = [...clones, clone];
		await clone.progress.set(1, { duration: FLIGHT_MS / stateBetDerived.timeScale(), easing: (t) => t });
		return clone;
	};

	context.eventEmitter.subscribeOnMount({
		clonesFly: async ({ from, to, onArrive }) => {
			const timeScale = stateBetDerived.timeScale();
			await Promise.all(
				to.map(async (target, index) => {
					await waitForTimeout((index * STAGGER_MS) / timeScale);
					const clone = await fly({ from, to: target });
					onArrive?.(target);
					setTimeout(() => (clones = clones.filter(({ id }) => id !== clone.id)), HANDOVER_MS);
				}),
			);
		},
	});
</script>

<BoardContainer>
	{#each clones as clone (clone.id)}
		{@const progress = clone.progress.current}
		{@const now = pose(clone, progress)}
		<!-- the streak behind it: gone as it lands -->
		{#each TRAIL as ghost}
			{@const behind = pose(clone, progress - ghost.lag)}
			{#if progress > ghost.lag && progress < 1}
				<Sprite
					key={tile.assetKey}
					anchor={0.5}
					x={behind.x}
					y={behind.y}
					width={WIDTH * behind.scale}
					height={HEIGHT * behind.scale}
					rotation={behind.rotation}
					tint={TRAIL_TINT}
					alpha={ghost.alpha}
					blendMode="add"
				/>
			{/if}
		{/each}
		<Container x={now.x} y={now.y} rotation={now.rotation}>
			<Sprite key={tile.assetKey} anchor={0.5} width={WIDTH * now.scale} height={HEIGHT * now.scale} />
		</Container>
	{/each}
</BoardContainer>
