<script lang="ts" module>
	import type { BagKey } from '../game/types';

	export type EmitterEventBags =
		/** the bag takes a hit: a pot symbol has just landed in it */
		| { type: 'bagHit'; bag: BagKey }
		/** the bag fills one level (1 -> 2 ... 4 -> 5); resolves when the loot has settled */
		| { type: 'bagLevelUp'; bag: BagKey }
		/** the bag's feature is triggered: its win animation, ending on the same level */
		| { type: 'bagWin'; bag: BagKey }
		| { type: 'bagLevelSet'; bag: BagKey; level: number };
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { BAG_KEYS } from '../game/types';
	import { BAG_LAYOUT, BAG_LEVELS } from '../game/constants';

	/**
	 * The three loot bags on the frame: cash (P1), gems (P2), gold (P3). One rig each
	 * (art-review/3-pots-heist/pots), five fill levels: `idle_N` loops at level N,
	 * `hit_N` and `win_N` play at it and end on it, `up_N_M` fills it one level.
	 * The level is stateGame.bagLevels. NOTHING drives these events yet: which book
	 * event fills or opens a bag is the math's to say.
	 */
	const context = getContext();
	const ASSET: Record<BagKey, string> = { cash: 'phBagCash', gem: 'phBagGem', gold: 'phBagGold' };

	// a one-shot playing over the idle loop, per bag
	let oneShot = $state<Partial<Record<BagKey, { animationName: string; done: () => void }>>>({});
	const level = (bag: BagKey) => context.stateGame.bagLevels[bag];
	const play = (bag: BagKey, animationName: string) =>
		waitForResolve((resolve) => {
			// a new one-shot replaces the one playing: let its waiter go first
			oneShot[bag]?.done();
			oneShot[bag] = { animationName, done: resolve };
		});

	context.eventEmitter.subscribeOnMount({
		bagHit: async ({ bag }) => await play(bag, `hit_${level(bag)}`),
		bagWin: async ({ bag }) => await play(bag, `win_${level(bag)}`),
		bagLevelUp: async ({ bag }) => {
			const from = level(bag);
			if (from >= BAG_LEVELS) return await play(bag, `hit_${from}`);
			await play(bag, `up_${from}_${from + 1}`);
		},
		bagLevelSet: ({ bag, level: value }) => {
			context.stateGame.bagLevels[bag] = Math.max(1, Math.min(BAG_LEVELS, Math.round(value)));
		},
	});
</script>

{#each BAG_KEYS as bag (bag)}
	{@const layout = BAG_LAYOUT[bag]}
	{@const shot = oneShot[bag]}
	<SpineProvider key={ASSET[bag]} x={layout.x} y={layout.y} width={layout.width} height={layout.height}>
		{#if shot}
			<SpineTrack
				trackIndex={0}
				animationName={shot.animationName}
				listener={{
					complete: () => {
						// the fill ends on the next level: the idle loop takes over there
						if (shot.animationName.startsWith('up_')) context.stateGame.bagLevels[bag] += 1;
						oneShot[bag] = undefined;
						shot.done();
					},
				}}
			/>
		{:else}
			<SpineTrack trackIndex={0} loop animationName={`idle_${level(bag)}`} />
		{/if}
	</SpineProvider>
{/each}
