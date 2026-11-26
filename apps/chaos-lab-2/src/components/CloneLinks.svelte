<script lang="ts" module>
	import type { Position } from '../game/types';

	// zap's reveal: arcs between the cloners while they charge, for `ms`
	export type EmitterEventCloneLinks = { type: 'clonesLink'; cells: Position[]; ms: number };
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { stateBetDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { CLONE_STYLE, SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';

	/**
	 * What travels from the cloner to the cells it clones onto (CLONE_STYLE zap / flip /
	 * scan; the thrown tiles are FlyingClones, the slime ghosts MovingClones). Light only,
	 * drawn along the line between two cells, above the reel board:
	 * - zap: a lightning bolt, there at once, flickering between four shapes; the cell is
	 *   struck 40 ms in. For the reveal (`clonesLink`) bolts wire the first cloner to the
	 *   others, stronger and steadier up to the strike.
	 * - flip: a comet with a long tail; the cell turns over as it arrives.
	 * - scan: a beam that reaches the cell fast and holds on it while the line prints.
	 * Answers `clonesFly` like the other two (declared in MovingClones).
	 */
	const STYLE = CLONE_STYLE === 'flip' || CLONE_STYLE === 'scan' ? CLONE_STYLE : 'zap';
	const SPEC = {
		zap: { life: 210, arrive: 40, stagger: 70 },
		flip: { life: 250, arrive: 250, stagger: 60 },
		scan: { life: 560, arrive: 90, stagger: 60 },
	}[STYLE];
	const BOLTS = ['cl2LinkBolt0', 'cl2LinkBolt1', 'cl2LinkBolt2', 'cl2LinkBolt3'];

	const context = getContext();
	type Link = {
		id: number;
		kind: 'zap' | 'flip' | 'scan' | 'wire';
		x: number;
		y: number;
		length: number;
		rotation: number;
		ms: number;
		progress: Tween<number>;
	};
	let links = $state<Link[]>([]);
	let nextId = 0;

	// book rows index the padded reel; the board's y is in visible rows
	const cell = (position: Position) => ({ x: getSymbolX(position.reel), y: getSymbolY(position.row - 1) });
	const run = async (kind: Link['kind'], from: Position, to: Position, ms: number) => {
		const a = cell(from);
		const b = cell(to);
		const link: Link = {
			id: nextId++,
			kind,
			x: a.x,
			y: a.y,
			length: Math.hypot(b.x - a.x, b.y - a.y),
			rotation: Math.atan2(b.y - a.y, b.x - a.x),
			ms,
			progress: new Tween(0),
		};
		links = [...links, link];
		await link.progress.set(1, { duration: ms, easing: (t) => t });
		links = links.filter(({ id }) => id !== link.id);
	};
	// a cheap, repeatable "random" per link and step
	const noise = (id: number, step: number) => {
		const v = Math.sin(id * 127.1 + step * 311.7) * 43758.5453;
		return v - Math.floor(v);
	};

	context.eventEmitter.subscribeOnMount({
		clonesFly: async ({ from, to, onArrive }) => {
			const timeScale = stateBetDerived.timeScale();
			await Promise.all(
				to.map(async (target, index) => {
					await waitForTimeout((index * SPEC.stagger) / timeScale);
					run(STYLE, from, target, SPEC.life / timeScale);
					await waitForTimeout(SPEC.arrive / timeScale);
					onArrive?.(target);
				}),
			);
		},
		clonesLink: ({ cells, ms }) => {
			cells.slice(1).forEach((target) => run('wire', cells[0], target, ms));
		},
	});
</script>

<BoardContainer>
	{#each links as link (link.id)}
		{@const p = link.progress.current}
		{#if link.kind === 'zap' || link.kind === 'wire'}
			<!-- a new shape every 50 ms; a wire drops out now and then while the charge is young -->
			{@const step = Math.floor((p * link.ms) / 50)}
			{@const on = link.kind === 'zap' || noise(link.id, step) < 0.35 + 0.65 * p}
			<Sprite
				key={BOLTS[Math.floor(noise(link.id, step + 9) * 4) % 4]}
				anchor={{ x: 0, y: 0.5 }}
				x={link.x}
				y={link.y}
				rotation={link.rotation}
				width={link.length}
				height={SYMBOL_SIZE * (link.kind === 'zap' ? 0.62 : 0.3 + 0.3 * p) * (noise(link.id, step + 3) < 0.5 ? 1 : -1)}
				alpha={!on ? 0 : link.kind === 'zap' ? Math.min(1, (1 - p) * 3.2) : 0.3 + 0.7 * p * p}
				blendMode="add"
			/>
		{:else if link.kind === 'flip'}
			<!-- the head is at 0.9 of the picture: it leads, the tail follows -->
			{@const travel = p * p * (3 - 2 * p)}
			<Sprite
				key="cl2LinkComet"
				anchor={{ x: 0.9, y: 0.5 }}
				x={link.x + Math.cos(link.rotation) * link.length * travel}
				y={link.y + Math.sin(link.rotation) * link.length * travel}
				rotation={link.rotation}
				width={Math.min(link.length, SYMBOL_SIZE * 2.4) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, p * 1.15)))}
				height={SYMBOL_SIZE * 0.42}
				alpha={Math.min(1, p * 8)}
				blendMode="add"
			/>
		{:else}
			<!-- reaches the cell in the first sixth, holds with a shimmer, lets go -->
			{@const reach = Math.min(1, p * 6)}
			<Sprite
				key="cl2LinkBeam"
				anchor={{ x: 0, y: 0.5 }}
				x={link.x}
				y={link.y}
				rotation={link.rotation}
				width={link.length * reach}
				height={SYMBOL_SIZE * (0.2 + 0.06 * noise(link.id, Math.floor(p * 28)))}
				alpha={Math.min(1, (1 - p) * 5) * (0.75 + 0.25 * noise(link.id, Math.floor(p * 28) + 5))}
				blendMode="add"
			/>
		{/if}
	{/each}
</BoardContainer>
