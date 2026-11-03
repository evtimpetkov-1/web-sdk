<script lang="ts" module>
	import type { Position } from '../game/types';
	import type { BookEventOfType, CashCellValue } from '../game/typesBookEvent';

	export type EmitterEventCashRespins =
		| { type: 'cashBoardStart'; frames: (Position & { multiplier: number })[] }
		/** one respin: every empty cell spins; `land` = what stops in them (none: all blank) */
		| { type: 'cashBoardSpin'; land?: BookEventOfType<'cashRespinLand'> }
		| { type: 'cashBoardFrames'; multipliers: BookEventOfType<'cashMultiplierFrames'>['multipliers'] }
		| { type: 'cashBoardMultiply'; coins: CashCellValue[] }
		| { type: 'cashBoardCloner'; cloner: CashCellValue; coins: CashCellValue[] }
		| {
				type: 'cashBoardBomb';
				bomb: CashCellValue;
				boosted: BookEventOfType<'cashBombActivate'>['boosted'];
		  }
		/** the end: every coin is counted, one by one; `oncollect` gets its value (x bet) */
		| { type: 'cashBoardCollect'; oncollect: (value: number, index: number) => void }
		| { type: 'cashBoardClear' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicIn, cubicOut, quadInOut } from 'svelte/easing';
	import { BitmapText, Container, Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import CashFace, { CASH_CELL, cashLabel, multTextStyle } from './CashFace.svelte';
	import CashCellSpin, { type CashSpinItem } from './CashCellSpin.svelte';
	import { BOARD_DIMENSIONS, REEL_LAND_RATES, ladderRate } from '../game/constants';
	import { getCellKey, getSymbolX, getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';
	import {
		FRAME_DIM,
		cashCellAt,
		cashGrid,
		emptyCashGrid,
		type CashCell,
		type CashFlight,
		type CashFx,
	} from '../game/stateCashRespins.svelte';
	import type { SoundEffectName } from '../game/sound';

	/**
	 * Chaos Lab 2's Cash Respins grid (2026-11-03), drawn where the reels are and
	 * under the pipe frame: Evtim's grid_v2 cell on every position, the multiplier
	 * frames, the coins / cloners / bombs, and each empty cell's own spin. What
	 * spills out of a cell (the bomb's blast, the cloner's cast, values thrown
	 * between cells) is drawn over the frame by CashRespinFx, off the same
	 * shared grid (stateCashRespins). The book decides everything
	 * (bookEventHandlerMap drives this through the cashBoard* events); this only
	 * presents it.
	 *
	 * Multipliers (Evtim): land as bare purple text, no plate; from the next spin
	 * on they wait, dimmed, for a coin to land on them. A coin landing on a frame
	 * gets the frame's value thrown into it and counts up to its total.
	 */
	const context = getContext();

	// the spin: every empty cell for SPIN_MS, later columns (and rows a little) longer,
	// one strip item per ITEM_MS at full speed, a small overshoot, then the settle
	const SPIN_MS = 700;
	const COLUMN_MS = 110;
	const ROW_MS = 25;
	const ITEM_MS = 60;
	const OVERSHOOT = 0.14;
	const SETTLE_MS = 160;
	const FILLERS: { item: CashSpinItem; weight: number }[] = [
		{ item: { kind: 'blank', value: 0 }, weight: 5 },
		{ item: { kind: 'coin', value: 1 }, weight: 1.2 },
		{ item: { kind: 'coin', value: 2 }, weight: 1 },
		{ item: { kind: 'coin', value: 5 }, weight: 0.8 },
		{ item: { kind: 'coin', value: 10 }, weight: 0.5 },
		{ item: { kind: 'mult', value: 2 }, weight: 0.6 },
		{ item: { kind: 'mult', value: 5 }, weight: 0.4 },
		{ item: { kind: 'bomb', value: 0 }, weight: 0.3 },
		{ item: { kind: 'cloner', value: 0 }, weight: 0.3 },
	];
	const FILLER_WEIGHT = _.sumBy(FILLERS, 'weight');
	const LAND_SFX: Partial<Record<CashSpinItem['kind'], SoundEffectName>> = {
		mult: 'sfx_ms_mult_land',
		bomb: 'sfx_ms_bomb_land',
		cloner: 'sfx_ms_cloner_land',
	};

	const ms = (base: number) => base / stateBetDerived.timeScale();
	const cellX = (position: Position) => getSymbolX(position.reel);
	// book rows index the padded reel; the board's y is in visible rows
	const cellY = (position: Position) => getSymbolY(position.row - 1);
	const sound = (name: SoundEffectName, rate?: number) =>
		context.eventEmitter.broadcast({ type: 'soundOnce', name, forcePlay: true, rate });

	let nextFlight = 0;

	const filler = (): CashSpinItem => {
		let roll = Math.random() * FILLER_WEIGHT;
		for (const { item, weight } of FILLERS) {
			roll -= weight;
			if (roll <= 0) return item;
		}
		return FILLERS[0].item;
	};

	const punch = async (cell: CashCell, peak = 1.15) => {
		await cell.pop.set(peak, { duration: ms(90), easing: cubicOut });
		await cell.pop.set(1, { duration: ms(240), easing: backOut });
	};

	/** a coin's value counts up to `total` with a punch */
	const countTo = async (cell: CashCell, total: number) => {
		void punch(cell, 1.18);
		await cell.value.set(total, { duration: ms(420), easing: cubicOut });
	};

	/** the frame under a coin rises through it and is thrown into its value */
	const applyFrame = async (cell: CashCell, total: number) => {
		if (cell.frame <= 0) return;
		const fx: CashFx = { text: cashLabel(cell.frame), alpha: new Tween(0), scale: new Tween(1.6) };
		cell.fx = fx;
		await fx.alpha.set(1, { duration: ms(140) });
		await Promise.all([
			fx.scale.set(0.35, { duration: ms(320), easing: cubicIn }),
			fx.alpha.set(0, { duration: ms(320), easing: cubicIn }),
		]);
		cell.fx = null;
		sound('sfx_ms_mult_apply');
		await countTo(cell, total);
	};

	const placeCoin = (cell: CashCell, value: number) => {
		cell.kind = 'coin';
		cell.value.set(value, { duration: 0 });
	};

	/** plays the cell's rig once (CashRespinFx: bomb `explode`, cloner `cast`) */
	const playRig = (cell: CashCell, rig: 'explode' | 'cast') =>
		waitForResolve((resolve) => {
			cell.onrig = () => {
				cell.rig = null;
				resolve();
			};
			cell.rig = rig;
		});

	const spinCell = async (cell: CashCell, target: CashSpinItem) => {
		const duration = ms(SPIN_MS + cell.reel * COLUMN_MS + (cell.row - 1) * ROW_MS);
		const count = Math.max(6, Math.round(duration / ms(ITEM_MS)));
		const items: CashSpinItem[] = [{ kind: 'blank', value: 0 }];
		for (let i = 1; i < count; i++) items.push(filler());
		items.push(target);
		const p = new Tween(0);
		cell.spin = { items, p };
		await p.set(count + OVERSHOOT, { duration, easing: cubicOut });
		await p.set(count, { duration: ms(SETTLE_MS), easing: backOut });
		cell.spin = null;
		if (target.kind === 'blank') return;
		if (target.kind === 'coin') placeCoin(cell, target.value);
		else if (target.kind === 'mult') cell.landed = target.value;
		else cell.kind = target.kind;
		const landSfx = LAND_SFX[target.kind];
		if (landSfx) sound(landSfx);
		void punch(cell);
	};

	const flyValue = async (from: Position, to: Position, text: string) => {
		const flight: CashFlight = {
			id: nextFlight++,
			text,
			x: new Tween(cellX(from)),
			y: new Tween(cellY(from)),
			alpha: new Tween(1),
		};
		cashGrid.flights = [...cashGrid.flights, flight];
		const duration = ms(360);
		await Promise.all([
			flight.x.set(cellX(to), { duration, easing: quadInOut }),
			flight.y.set(cellY(to), { duration, easing: quadInOut }),
		]);
		await flight.alpha.set(0, { duration: ms(100) });
		cashGrid.flights = cashGrid.flights.filter((f) => f.id !== flight.id);
	};

	context.eventEmitter.subscribeOnMount({
		cashBoardStart: ({ frames }) => {
			cashGrid.cells = emptyCashGrid();
			cashGrid.flights = [];
			for (const frame of frames) {
				const cell = cashCellAt(frame);
				cell.frame = frame.multiplier;
				cell.frameAlpha.set(FRAME_DIM, { duration: 0 });
			}
			cashGrid.show = true;
		},
		cashBoardClear: () => {
			cashGrid.show = false;
			cashGrid.cells = emptyCashGrid();
			cashGrid.flights = [];
		},
		cashBoardSpin: async ({ land }) => {
			// last respin's multipliers now wait for a coin (Evtim: "on the next spin it looses opacity")
			for (const cell of cashGrid.cells) {
				if (cell.frame > 0 && cell.frameAlpha.target > FRAME_DIM) {
					cell.frameAlpha.set(FRAME_DIM, { duration: ms(300) });
				}
			}
			const targets = new Map<string, CashSpinItem>();
			land?.coins.forEach((coin) => targets.set(getCellKey(coin), { kind: 'coin', value: coin.value }));
			land?.multipliers.forEach((mult) =>
				targets.set(getCellKey(mult), { kind: 'mult', value: mult.multiplier }),
			);
			land?.cloners.forEach((cloner) => targets.set(getCellKey(cloner), { kind: 'cloner', value: 0 }));
			land?.bombs.forEach((bomb) => targets.set(getCellKey(bomb), { kind: 'bomb', value: 0 }));
			const empty = cashGrid.cells.filter((cell) => !cell.kind);
			await Promise.all(
				_.range(BOARD_DIMENSIONS.x).map(async (reel) => {
					const column = empty.filter((cell) => cell.reel === reel);
					if (!column.length) return;
					await Promise.all(
						column.map((cell) =>
							spinCell(cell, targets.get(getCellKey(cell)) ?? { kind: 'blank', value: 0 }),
						),
					);
					// the column's stop, like a base reel's
					sound('sfx_ms_reel_land', ladderRate(REEL_LAND_RATES, reel));
				}),
			);
		},
		cashBoardFrames: async ({ multipliers }) => {
			sound('sfx_ms_mult_up');
			await Promise.all(
				multipliers.map(async (mult) => {
					const cell = cashCellAt(mult);
					cell.landed = 0;
					cell.frame = mult.frame;
					cell.frameAlpha.set(1, { duration: 0 });
					await cell.framePop.set(1.3, { duration: ms(120), easing: cubicOut });
					await cell.framePop.set(1, { duration: ms(260), easing: backOut });
				}),
			);
		},
		cashBoardMultiply: async ({ coins }) => {
			await Promise.all(
				coins.map(async (coin) => {
					const cell = cashCellAt(coin);
					cell.frame = coin.frame;
					await applyFrame(cell, coin.total);
				}),
			);
		},
		cashBoardCloner: async ({ cloner, coins }) => {
			const cell = cashCellAt(cloner);
			sound('sfx_ms_cloner_cast');
			await playRig(cell, 'cast');
			placeCoin(cell, cloner.value);
			void punch(cell, 1.2);
			cell.frame = cloner.frame;
			await applyFrame(cell, cloner.total);
			const arrivals: Promise<void>[] = [];
			await context.eventEmitter.broadcastAsync({
				type: 'clonesFly',
				from: cloner,
				to: coins,
				onArrive: (to) => {
					const coin = coins.find((c) => c.reel === to.reel && c.row === to.row);
					if (!coin) return;
					const target = cashCellAt(coin);
					sound('sfx_ms_clone_splat');
					placeCoin(target, coin.value);
					target.frame = coin.frame;
					arrivals.push(punch(target, 1.2).then(() => applyFrame(target, coin.total)));
				},
			});
			await Promise.all(arrivals);
		},
		cashBoardBomb: async ({ bomb, boosted }) => {
			const cell = cashCellAt(bomb);
			sound('sfx_ms_bomb_arm');
			// the rig's blast (it sounds its own bang on its `detonate` event, Symbol)
			// ends on an empty cell: the bomb's coin takes its place
			await playRig(cell, 'explode');
			placeCoin(cell, bomb.value);
			void punch(cell, 1.25);
			cell.frame = bomb.frame;
			await applyFrame(cell, bomb.total);
			// its value runs into every coin around it (the gold value itself: cl2-coin
			// has only x and 0-9, no "+")
			await Promise.all(
				boosted.map(async (target) => {
					await flyValue(bomb, target, cashLabel(target.add));
					sound('sfx_ms_mult_apply');
					await countTo(cashCellAt(target), target.total);
				}),
			);
		},
		cashBoardCollect: async ({ oncollect }) => {
			const coins = cashGrid.cells.filter((cell) => cell.kind === 'coin');
			for (const [index, cell] of coins.entries()) {
				oncollect(cell.value.target, index);
				void punch(cell, 1.22);
				await waitForTimeout(ms(index < 3 ? 280 : 150));
			}
			await waitForTimeout(ms(350));
		},
	});
</script>

<!--
	Drawn LAYER by layer across the grid, not cell by cell: a cell's stack drawn
	whole let every later cell's tile cover what spilled out of it — the bomb's
	blast lost its right side, coins their punch (Evtim, 2026-11-03). So: all
	tiles, all frames, all spins, then all occupants (a punching / counting cell
	sorts above its neighbours). The rigs and the thrown values are CashRespinFx,
	over the pipe frame. Every layer and every cell slot is a persistent
	Container: pixi-svelte appends a (re)mounted child at the END of its parent,
	so a bare {#if} would jump over its siblings the moment it remounts.
-->
<Container visible={cashGrid.show}>
	<BoardContainer>
		<Container>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				<Sprite
					key="cl2RespinCell"
					anchor={0.5}
					x={cellX(cell)}
					y={cellY(cell)}
					width={CASH_CELL.width}
					height={CASH_CELL.height}
				/>
			{/each}
		</Container>
		<!-- the frames, waiting under empty cells (a coin covers its frame) -->
		<Container>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				<Container x={cellX(cell)} y={cellY(cell)}>
					{#if cell.frame > 0 && !cell.kind && !cell.landed && !cell.rig}
						<Container alpha={cell.frameAlpha.current} scale={cell.framePop.current}>
							<BitmapText anchor={0.5} text={cashLabel(cell.frame)} style={multTextStyle(cell.frame)} />
						</Container>
					{/if}
				</Container>
			{/each}
		</Container>
		<!-- each spinning strip is clipped to its own cell (CashCellSpin) -->
		<Container>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				<Container x={cellX(cell)} y={cellY(cell)}>
					{#if cell.spin}
						<CashCellSpin items={cell.spin.items} p={cell.spin.p.current} />
					{/if}
				</Container>
			{/each}
		</Container>
		<Container sortableChildren>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				<Container
					x={cellX(cell)}
					y={cellY(cell)}
					scale={cell.pop.current}
					zIndex={cell.pop.current > 1.001 ? 1 : 0}
				>
					{#if cell.rig}
						<!-- the rig plays over the frame (CashRespinFx) -->
					{:else if cell.kind === 'coin'}
						<CashFace kind="coin" value={cell.value.current} />
					{:else if cell.kind}
						<CashFace kind={cell.kind} />
					{:else if cell.landed}
						<CashFace kind="mult" value={cell.landed} />
					{/if}
				</Container>
			{/each}
		</Container>
	</BoardContainer>
</Container>
