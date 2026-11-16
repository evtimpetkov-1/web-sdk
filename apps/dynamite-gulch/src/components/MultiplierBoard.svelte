<script lang="ts" module>
	export type EmitterEventMultiplierBoard =
		| { type: 'multiplierBoardShow' }
		| { type: 'multiplierBoardHide' }
		| { type: 'multiplierBoardInit' }
		| { type: 'multiplierBoardReset' }
		| { type: 'multiplierBoardAnimate' }
		| { type: 'multiplierBoardMove' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { quartInOut } from 'svelte/easing';

	import { waitForResolve } from 'utils-shared/wait';

	import MultiplierBoardBase from './MultiplierBoardBase.svelte';
	import MultiplierTileBurst from './MultiplierTileBurst.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import type { RawSymbol, SymbolState } from '../game/types';
	import { getSymbolX, getSymbolY } from '../game/utils';

	const context = getContext();

	let show = $state(false);

	// The flight onto the plaque, and the moment in it the tile left in the cell
	// bursts (Evtim, 2026-11-13). quartInOut has carried the value a third of the
	// way by then, clear of its cell.
	const FLY_MS = 600;
	const TILE_BURST_AT = 0.45;
	// the bursting tiles: their own list, so a burst outlives the flight (0.55 s
	// from mid-flight) and the reset / hide that follow it
	let bursts = $state<{ id: number; x: number; y: number }[]>([]);
	let burstId = 0;

	const createMultiplierSymbol = ({
		rawSymbol,
		reelIndex,
		symbolIndex,
		reelLength,
	}: {
		rawSymbol: RawSymbol;
		reelIndex: number;
		symbolIndex: number;
		reelLength: number;
	}) => {
		if (rawSymbol.name === 'M' && symbolIndex > 0 && symbolIndex < reelLength - 1) {
			const initX = getSymbolX(reelIndex);
			const initY = getSymbolY(symbolIndex - 1);
			const symbolX = new Tween(initX);
			const symbolY = new Tween(initY);
			const symbolState = 'win' as SymbolState;
			const oncomplete = () => {};

			const multiplierSymbol = $state({
				reelIndex,
				symbolIndex,
				initX,
				initY,
				symbolX,
				symbolY,
				rawSymbol,
				symbolState,
				oncomplete,
			});

			return multiplierSymbol;
		}

		return undefined;
	};

	const initMultiplierBoard = () => {
		return context.stateGameDerived.boardRaw().map((rawSymbols, reelIndex) => {
			return rawSymbols.map((rawSymbol, symbolIndex) =>
				createMultiplierSymbol({
					rawSymbol,
					reelIndex,
					symbolIndex,
					reelLength: rawSymbols.length,
				}),
			);
		});
	};

	context.eventEmitter.subscribeOnMount({
		multiplierBoardShow: () => (show = true),
		multiplierBoardHide: () => (show = false),
		multiplierBoardInit: () => {
			context.stateGame.multiplierBoard = initMultiplierBoard();
		},
		multiplierBoardReset: () => {
			context.stateGame.multiplierBoard = [];
		},
		multiplierBoardAnimate: async () => {
			const getPromises = () =>
				_.flatten(
					context.stateGame.multiplierBoard.map((multiplierReel) => {
						return multiplierReel.filter(Boolean).map(async (multiplierSymbol) => {
							await waitForResolve((resolve) => (multiplierSymbol!.oncomplete = resolve));
						});
					}),
				);

			await Promise.all(getPromises());
		},
		multiplierBoardMove: async () => {
			// mid-flight: every collected cell's tile bursts and the cell is left empty
			// (M_GONE) for the tumble that follows, which then has nothing to burst there
			const flying = _.flatten(context.stateGame.multiplierBoard).filter(Boolean);
			setTimeout(() => {
				flying.forEach((multiplierSymbol) => {
					const { reelIndex, symbolIndex, initX, initY } = multiplierSymbol!;
					const reelSymbol = context.stateGame.board[reelIndex].reelState.symbols[symbolIndex];
					if (reelSymbol.rawSymbol.name !== 'M_TAKEN') return;
					reelSymbol.rawSymbol = { name: 'M_GONE' };
					bursts.push({ id: burstId++, x: initX, y: initY });
				});
				if (flying.length) {
					context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_dg_goo_burst' });
				}
			}, FLY_MS * TILE_BURST_AT);

			const getPromises = () =>
				_.flatten(
					context.stateGame.multiplierBoard.map((multiplierReel) => {
						return multiplierReel.filter(Boolean).map(async (multiplierSymbol) => {
							// onto the multiplier plate above the reels
							const plate = context.stateGameDerived.multiplierPlateLayout();
							const target = { x: plate.x, y: plate.y };
							const tweenOptions = { duration: FLY_MS, easing: quartInOut };
							const moveX = () => multiplierSymbol!.symbolX.set(target.x, tweenOptions);
							const moveY = () => multiplierSymbol!.symbolY.set(target.y, tweenOptions);
							await Promise.all([moveX(), moveY()]);
						});
					}),
				);

			await Promise.all(getPromises());
		},
	});
</script>

{#if show}
	<BoardContainer>
		<MultiplierBoardBase />
	</BoardContainer>
{/if}

<!-- always mounted: the bursts are not tied to `show` -->
<BoardContainer>
	{#each bursts as burst (burst.id)}
		<MultiplierTileBurst
			x={burst.x}
			y={burst.y}
			oncomplete={() => (bursts = bursts.filter((other) => other.id !== burst.id))}
		/>
	{/each}
</BoardContainer>
