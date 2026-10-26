<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	type AddingBoard = RawSymbol[][];
	type ExplodingPositions = Position[];

	export type EmitterEventTumbleBoard =
		| { type: 'tumbleBoardShow' }
		| { type: 'tumbleBoardHide' }
		| { type: 'tumbleBoardInit'; addingBoard: AddingBoard }
		| { type: 'tumbleBoardReset' }
		| { type: 'tumbleBoardExplode'; explodingPositions: ExplodingPositions }
		| { type: 'tumbleBoardRemoveExploded' }
		| { type: 'tumbleBoardSlideDown'; anticipation?: boolean };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';

	import { BoardContext } from 'components-shared';
	import { stateBetDerived } from 'state-shared';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import TumbleBoardBase from './TumbleBoardBase.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import { getCellKey, getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';
	import {
		ANTICIPATION_DROP_MS,
		ANTICIPATION_REEL_STAGGER_MS,
		TUMBLE_DROP_MS,
	} from '../game/constants';
	import type { SymbolState } from '../game/types';

	const context = getContext();

	let show = $state(false);

	// Bomb ring timing (ms at 1x, TumbleSymbol scales them): the bomb rig fires
	// `detonate` at 0.38s, the ring then reaches its neighbours at 70ms per cell of
	// distance so the corners burst after the sides.
	const BOMB_DETONATE_MS = 380;
	const BLAST_MS_PER_CELL = 70;
	const isSamePosition = (a: Position, b: Position) => a.reel === b.reel && a.row === b.row;
	const cellDistance = (a: Position, b: Position) => Math.hypot(a.reel - b.reel, a.row - b.row);
	// every state a cell leaves the board in (tumbleBoardRemoveExploded)
	const REMOVED_STATES: SymbolState[] = ['explosion', 'explode', 'blasted'];

	const createTumbleSymbol = ({ initY, rawSymbol }: { initY: number; rawSymbol: RawSymbol }) => {
		const symbolY = new Tween(initY);
		const oncomplete = () => {};

		const tumbleSymbol = $state({
			symbolY,
			rawSymbol,
			symbolState: 'static' as const,
			oncomplete,
		});

		return tumbleSymbol;
	};

	const initTumbleBoardAdding = ({ addingBoard }: { addingBoard: AddingBoard }) => {
		return context.stateGameDerived.boardRaw().map((_, reelIndex) => {
			const addingReel = addingBoard[reelIndex] ?? [];

			const tumbleReelAdding = addingReel.map((rawSymbol, symbolIndex) => {
				const initY = getSymbolY(symbolIndex - 1 - addingReel.length);
				return createTumbleSymbol({ initY, rawSymbol });
			});

			return tumbleReelAdding;
		});
	};

	const initTumbleBoardBase = () => {
		return context.stateGameDerived.boardRaw().map((rawSymbolReel) => {
			const tumbleReelBase = rawSymbolReel.map((rawSymbol, symbolIndex) => {
				const initY = getSymbolY(symbolIndex - 1);
				return createTumbleSymbol({ initY, rawSymbol });
			});

			return tumbleReelBase;
		});
	};

	context.eventEmitter.subscribeOnMount({
		tumbleBoardShow: () => (show = true),
		tumbleBoardHide: () => (show = false),
		tumbleBoardInit: ({ addingBoard }) => {
			context.stateGame.tumbleBoardAdding = initTumbleBoardAdding({ addingBoard });
			context.stateGame.tumbleBoardBase = initTumbleBoardBase();
		},
		tumbleBoardReset: () => {
			context.stateGame.tumbleBoardAdding = [];
			context.stateGame.tumbleBoardBase = [];
		},
		tumbleBoardExplode: async ({ explodingPositions }) => {
			// a pending bombExplode is drawn by this tumble: every bomb plays its explode
			// rig and leaves a Wild in its cell (the bombs are not exploding positions —
			// they stay on the board), the cleared cells take the blast instead of the
			// goo, reached by the ring of the nearest bomb
			const bomb = context.stateGame.bombPending;
			context.stateGame.bombPending = undefined;
			const getTumbleSymbol = (position: Position) =>
				context.stateGame.tumbleBoardBase[position.reel][position.row];

			// sounds once per wave, however many bombs: the ARM pulses as the rigs start
			// (the boom itself is the rig's `detonate` event, Symbol.svelte), the Wild's
			// sting as the first one takes its cell
			if (bomb?.bombs.length) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_bomb_arm' });
			}
			let wildStung = false;
			const detonations = (bomb?.bombs ?? []).map(async (position) => {
				const tumbleSymbol = getTumbleSymbol(position);
				tumbleSymbol.symbolState = 'explode';
				await waitForResolve((resolve) => (tumbleSymbol.oncomplete = resolve));
				// the rig ends empty: the Wild takes the cell before the slide
				if (bomb!.wilds.some((wild) => isSamePosition(wild, position))) {
					tumbleSymbol.rawSymbol = { name: 'W' };
					tumbleSymbol.symbolState = 'static';
					if (!wildStung) {
						wildStung = true;
						context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_wild_land' });
					}
				}
			});
			// one removal per cell, for the same reason as boardWithAnimateSymbols (the
			// math dedupes explodingSymbols today; a repeat would hang the tumble)
			const removals = _.uniqBy(explodingPositions, getCellKey).map(async (position) => {
				const tumbleSymbol = getTumbleSymbol(position);
				if (bomb?.bombs.length) {
					const distance = Math.min(...bomb.bombs.map((b) => cellDistance(position, b)));
					tumbleSymbol.blastDelay = BOMB_DETONATE_MS + BLAST_MS_PER_CELL * distance;
					tumbleSymbol.symbolState = 'blasted';
				} else {
					tumbleSymbol.symbolState = 'explosion';
				}
				await waitForResolve((resolve) => (tumbleSymbol.oncomplete = resolve));
			});

			await Promise.all([...detonations, ...removals]);
		},
		tumbleBoardRemoveExploded: () => {
			context.stateGame.tumbleBoardBase.forEach((tumbleReel, reelIndex) => {
				context.stateGame.tumbleBoardBase[reelIndex] = tumbleReel.filter(
					(tumbleSymbol) => !REMOVED_STATES.includes(tumbleSymbol.symbolState),
				);
			});
		},
		// anticipation (one Scatter short of a trigger, see the tumbleBoard handler):
		// the columns that refill drop one after another and slower; the rest of the
		// time every column drops at once
		tumbleBoardSlideDown: async ({ anticipation }) => {
			const timeScale = stateBetDerived.timeScale();
			const duration = anticipation ? ANTICIPATION_DROP_MS / timeScale : TUMBLE_DROP_MS;
			const stagger = anticipation ? ANTICIPATION_REEL_STAGGER_MS / timeScale : 0;
			// Refer to initTumbleBoardBase
			const isMoving = (tumbleSymbol: { symbolY: Tween<number> }, symbolIndex: number) =>
				getSymbolY(symbolIndex - 1) !== tumbleSymbol.symbolY.current;
			// only columns that move take a turn, so no dead time before the first drop
			let turn = 0;
			const getPromises = () =>
				_.flatten(
					context.stateGameDerived.tumbleBoardCombined().map((tumbleReel) => {
						const delay = tumbleReel.some(isMoving) ? turn++ * stagger : 0;
						return tumbleReel.map(async (tumbleSymbol, symbolIndex) => {
							const targetY = getSymbolY(symbolIndex - 1);
							if (targetY !== tumbleSymbol.symbolY.current) {
								if (delay) await waitForTimeout(delay);
								await tumbleSymbol.symbolY.set(targetY, {
									duration,
									easing: backOut,
								});

								if (symbolIndex > 0 && symbolIndex < tumbleReel.length - 1) {
									tumbleSymbol.symbolState = 'land';
									context.stateGameDerived.onSymbolLand({ rawSymbol: tumbleSymbol.rawSymbol });
									await waitForResolve((resolve) => {
										tumbleSymbol.oncomplete = () => {
											tumbleSymbol.symbolState = 'static';
											resolve();
										};
									});
								}
							}
						});
					}),
				);

			await Promise.all(getPromises());
		},
	});
</script>

{#if show}
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<TumbleBoardBase />
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<TumbleBoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
