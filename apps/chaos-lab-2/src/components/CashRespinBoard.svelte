<script lang="ts" module>
	import type { Position } from '../game/types';
	import type { BookEventOfType, CashCellValue } from '../game/typesBookEvent';
	import type { CashCellSnapshot } from '../game/stateCashRespins.svelte';

	export type EmitterEventCashRespins =
		| { type: 'cashBoardStart'; frames: (Position & { multiplier: number })[] }
		/** after the intro: the starting frames pop in one by one, then wait (dim) */
		| { type: 'cashBoardRevealFrames' }
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
		| { type: 'cashBoardClear' }
		// a resumed round: the grid as it was, at once (no spins, no counts)
		| { type: 'cashBoardRestore'; cells: CashCellSnapshot[] };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicIn, cubicOut, quadInOut } from 'svelte/easing';
	import { BitmapText, Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import CashFace, { CASH_CELL, coinLabel, multLabel, multTextStyle } from './CashFace.svelte';
	import CashCellSpin, { type CashSpinItem } from './CashCellSpin.svelte';
	import {
		BOARD_DIMENSIONS,
		REEL_LAND_RATES,
		SYMBOL_GAP,
		SYMBOL_SIZE,
		SYMBOL_WIDTH,
		ladderRate,
	} from '../game/constants';
	import { getCellKey, getSymbolX, getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';
	import {
		FRAME_DIM,
		cashCellAt,
		cashGrid,
		emptyCashGrid,
		type CashCell,
		type CashFlight,
	} from '../game/stateCashRespins.svelte';
	import type { SoundEffectName } from '../game/sound';

	/**
	 * Chaos Lab 2's Cash Respins grid (2026-11-03), drawn where the reels are and
	 * under the pipe frame: Evtim's grid_v2 cell on every position, the multiplier
	 * frames, the coins / cloners / bombs, and each empty cell's own spin. What
	 * spills out of a cell (the bomb's blast, the cloner's cast, the bomb's value
	 * thrown onto coins) is drawn over the frame by CashRespinFx, off the same
	 * shared grid (stateCashRespins). The book decides everything
	 * (bookEventHandlerMap drives this through the cashBoard* events); this only
	 * presents it.
	 *
	 * Presentation (Evtim's calls, 2026-11-03):
	 * - Multipliers land as bare purple text, no plate; from the next spin they
	 *   wait, dimmed. One landing on a frame does not cover it: the frame slides
	 *   down, the new one sits above it, drops into it and the frame counts up
	 *   to their sum.
	 * - A coin (or bomb / cloner) on a frame shows the frame as a purple corner
	 *   badge until it applies: the badge flies into the coin, which counts up.
	 * - A bomb or cloner acting dims every cell it does not touch; the bomb's 3x3
	 *   glows under the coins it boosts.
	 * - Coins read "1x" (x bet), multipliers "x2".
	 */
	const context = getContext();

	// the spin: every empty tile rolls on its own (Evtim, 2026-11-06: "every tile
	// should be independent"): it starts within START_SPREAD_MS, rolls for
	// SPIN_MIN_MS + up to SPIN_SPREAD_MS at its own speed (one face per ~ITEM_MS),
	// overshoots a little and settles, so the tiles stop in a random order (the
	// column-by-column stop it replaced read as reels)
	const START_SPREAD_MS = 90;
	const SPIN_MIN_MS = 650;
	const SPIN_SPREAD_MS = 650;
	const ITEM_MS = 60;
	const ITEM_SPEED_SPREAD = 0.3;
	const OVERSHOOT = 0.14;
	const SETTLE_MS = 170;
	// tiles stopping close together share one tick
	const STOP_TICK_GAP_MS = 70;
	// coin / multiplier fillers must stay within CashCellSpin's ROLL_COIN_VALUES /
	// ROLL_MULT_VALUES: its slots hold one text per value
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
	// a tile at rest: its reel shows nothing
	const IDLE_ROLL: CashSpinItem[] = [{ kind: 'blank', value: 0 }];
	/** the windows of the tiles in every other row (row parity 0 / 1): one spin mask */
	const drawTileWindows = (graphics: { rect: (x: number, y: number, w: number, h: number) => unknown; fill: (c: number) => unknown }, parity: number) => {
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				if (row % 2 !== parity) continue;
				const position = { reel, row };
				graphics.rect(cellX(position) - CASH_CELL.width / 2, cellY(position) - CASH_CELL.height / 2, CASH_CELL.width, CASH_CELL.height);
			}
		}
		graphics.fill(0xffffff);
	};
	const LAND_SFX: Partial<Record<CashSpinItem['kind'], SoundEffectName>> = {
		mult: 'sfx_ms_mult_land',
		bomb: 'sfx_ms_bomb_land',
		cloner: 'sfx_ms_cloner_land',
	};
	// a multiplier on a frame: the new one this far above the centre, the frame
	// this far below, both at STACK_SCALE
	const STACK_OFFSET = SYMBOL_SIZE * 0.2;
	const STACK_SCALE = 0.68;
	// the frame under a coin / bomb / cloner: a badge in the cell's top-right corner
	const BADGE = { x: CASH_CELL.width * 0.3, y: -CASH_CELL.height * 0.31, scale: 0.42 };
	// starting frames: one pops in every REVEAL_STEP_MS, all wait dimmed after REVEAL_HOLD_MS
	const REVEAL_STEP_MS = 70;
	const REVEAL_HOLD_MS = 450;
	// focus: the black over the cells a bomb / cloner does not touch, at full dim
	const DIM_ALPHA = 0.55;
	const AREA_COLOR = 0xff5a1f;
	const AREA_ALPHA = 0.3;
	const CELL_RADIUS = SYMBOL_SIZE * 0.06;

	const ms = (base: number) => base / stateBetDerived.timeScale();
	const cellX = (position: Position) => getSymbolX(position.reel);
	// book rows index the padded reel; the board's y is in visible rows
	const cellY = (position: Position) => getSymbolY(position.row - 1);
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
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
	const punchFrame = async (cell: CashCell, peak = 1.3) => {
		await cell.framePop.set(peak, { duration: ms(120), easing: cubicOut });
		await cell.framePop.set(1, { duration: ms(260), easing: backOut });
	};

	/** a coin's value counts up to `total` with a punch */
	const countTo = async (cell: CashCell, total: number) => {
		void punch(cell, 1.18);
		await cell.value.set(total, { duration: ms(420), easing: cubicOut });
	};

	/**
	 * the frame under a coin (its corner badge) flies into it: the coin turns
	 * purple (gold until multiplied: Evtim, 2026-11-04) and counts up to `total`
	 */
	const applyFrame = async (cell: CashCell, total: number) => {
		if (cell.frame <= 0) return;
		if (!cell.badge) {
			// a coin that arrived on its frame just now (cloner): show the badge first
			cell.badgeFly.set(0, { duration: 0 });
			cell.badge = true;
			await waitForTimeout(ms(220));
		}
		await cell.badgeFly.set(1, { duration: ms(300), easing: cubicIn });
		cell.badge = false;
		cell.badgeFly.set(0, { duration: 0 });
		sound('sfx_ms_mult_apply');
		void cell.purple.set(1, { duration: ms(200), easing: cubicOut });
		await countTo(cell, total);
	};

	const placeCoin = (cell: CashCell, value: number) => {
		cell.kind = 'coin';
		cell.value.set(value, { duration: 0 });
		cell.purple.set(0, { duration: 0 });
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

	/** light these cells, dim the rest (null: all lit again) */
	const setFocus = async (keys: string[] | null) => {
		if (keys) {
			cashGrid.focus = keys;
			await cashGrid.dim.set(1, { duration: ms(220), easing: cubicOut });
		} else {
			await cashGrid.dim.set(0, { duration: ms(260), easing: cubicOut });
			cashGrid.focus = null;
		}
	};

	const spinCell = async (cell: CashCell, target: CashSpinItem) => {
		// this tile's own start, length and speed
		const delay = ms(Math.random() * START_SPREAD_MS);
		const duration = ms(SPIN_MIN_MS + Math.random() * SPIN_SPREAD_MS);
		const itemMs = ms(ITEM_MS * (1 - ITEM_SPEED_SPREAD / 2 + Math.random() * ITEM_SPEED_SPREAD));
		const count = Math.max(6, Math.round(duration / itemMs));
		const items: CashSpinItem[] = [{ kind: 'blank', value: 0 }];
		for (let i = 1; i < count; i++) items.push(filler());
		items.push(target);
		const p = new Tween(0);
		cell.spin = { items, p };
		if (delay > 0) await waitForTimeout(delay);
		await p.set(count + OVERSHOOT, { duration, easing: cubicOut });
		await p.set(count, { duration: ms(SETTLE_MS), easing: backOut });
		cell.spin = null;
		if (target.kind === 'blank') return;
		if (target.kind === 'mult') {
			cell.landed = target.value;
			cell.landedDrop.set(0, { duration: 0 });
			cell.landedAlpha.set(1, { duration: 0 });
			if (cell.frame > 0) {
				// on a frame: both stay on show, the new one above, the frame below
				cell.frameAlpha.set(1, { duration: ms(200) });
				void cell.stack.set(1, { duration: ms(240), easing: cubicOut });
			}
		} else {
			if (target.kind === 'coin') placeCoin(cell, target.value);
			else cell.kind = target.kind;
			// its frame stays readable, as a corner badge, until it applies
			if (cell.frame > 0) {
				cell.badgeFly.set(0, { duration: 0 });
				cell.badge = true;
			}
		}
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
			cashGrid.focus = null;
			cashGrid.dim.set(0, { duration: 0 });
			cashGrid.area = null;
			// hidden until the intro is out (cashBoardRevealFrames)
			for (const frame of frames) {
				const cell = cashCellAt(frame);
				cell.frame = frame.multiplier;
				cell.frameShown.set(frame.multiplier, { duration: 0 });
				cell.frameAlpha.set(0, { duration: 0 });
			}
			cashGrid.show = true;
		},
		cashBoardRevealFrames: async () => {
			const framed = cashGrid.cells.filter((cell) => cell.frame > 0);
			if (!framed.length) return;
			sound('sfx_ms_mult_up');
			for (const cell of framed) {
				cell.frameAlpha.set(1, { duration: ms(120) });
				void punchFrame(cell, 1.4);
				await waitForTimeout(ms(REVEAL_STEP_MS));
			}
			await waitForTimeout(ms(REVEAL_HOLD_MS));
			for (const cell of framed) cell.frameAlpha.set(FRAME_DIM, { duration: ms(350) });
		},
		cashBoardRestore: ({ cells }) => {
			cashGrid.cells = emptyCashGrid();
			cashGrid.flights = [];
			cashGrid.focus = null;
			cashGrid.dim.set(0, { duration: 0 });
			cashGrid.area = null;
			for (const snapshot of cells) {
				const cell = cashCellAt(snapshot);
				if (snapshot.frame > 0) {
					// framed cells wait dimmed, as after every respin (cashBoardSpin)
					cell.frame = snapshot.frame;
					cell.frameShown.set(snapshot.frame, { duration: 0 });
					cell.frameAlpha.set(FRAME_DIM, { duration: 0 });
				}
				if (snapshot.coin) {
					cell.kind = 'coin';
					cell.value.set(snapshot.coin.value, { duration: 0 });
					cell.purple.set(snapshot.coin.purple ? 1 : 0, { duration: 0 });
				}
			}
			cashGrid.show = true;
		},
		cashBoardClear: () => {
			cashGrid.show = false;
			cashGrid.cells = emptyCashGrid();
			cashGrid.flights = [];
			cashGrid.focus = null;
			cashGrid.dim.set(0, { duration: 0 });
			cashGrid.area = null;
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
			// each tile ticks as it stops, rising in pitch as the grid settles; tiles
			// stopping within STOP_TICK_GAP_MS of each other share one tick
			let stopped = 0;
			let lastTick = -Infinity;
			await Promise.all(
				empty.map(async (cell) => {
					await spinCell(cell, targets.get(getCellKey(cell)) ?? { kind: 'blank', value: 0 });
					const step = Math.floor((stopped++ * REEL_LAND_RATES.length) / empty.length);
					const now = performance.now();
					if (now - lastTick >= ms(STOP_TICK_GAP_MS)) {
						lastTick = now;
						sound('sfx_ms_reel_land', ladderRate(REEL_LAND_RATES, step));
					}
				}),
			);
		},
		cashBoardFrames: async ({ multipliers }) => {
			sound('sfx_ms_mult_up');
			await Promise.all(
				multipliers.map(async (mult) => {
					const cell = cashCellAt(mult);
					const onFrame = cell.frame > 0;
					cell.frame = mult.frame;
					cell.frameAlpha.set(1, { duration: ms(150) });
					if (onFrame) {
						// the new one drops into the frame below it, which counts up to their sum
						await Promise.all([
							cell.landedDrop.set(1, { duration: ms(240), easing: cubicIn }),
							cell.landedAlpha.set(0, { duration: ms(240), easing: cubicIn }),
						]);
						cell.landed = 0;
						void punchFrame(cell);
						await cell.frameShown.set(mult.frame, { duration: ms(360), easing: cubicOut });
						await cell.stack.set(0, { duration: ms(260), easing: backOut });
					} else {
						// a new frame: the landed text simply becomes it
						cell.frameShown.set(mult.frame, { duration: 0 });
						cell.landed = 0;
						await punchFrame(cell);
					}
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
			await setFocus([getCellKey(cloner), ...coins.map(getCellKey)]);
			sound('sfx_ms_cloner_cast');
			await playRig(cell, 'cast');
			// its coins first (each takes its own frame as it lands), then the cloner
			// itself becomes a coin and takes its frame: the other way round, a
			// multiplied cloner coin sat beside clones that were not (Evtim, 2026-11-04)
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
			placeCoin(cell, cloner.value);
			await punch(cell, 1.2);
			cell.frame = cloner.frame;
			await applyFrame(cell, cloner.total);
			await setFocus(null);
		},
		cashBoardBomb: async ({ bomb, boosted }) => {
			const cell = cashCellAt(bomb);
			// its 3x3, clipped to the grid: lit and glowing, everything else dims
			const area = {
				reel0: Math.max(0, bomb.reel - 1),
				reel1: Math.min(BOARD_DIMENSIONS.x - 1, bomb.reel + 1),
				row0: Math.max(1, bomb.row - 1),
				row1: Math.min(BOARD_DIMENSIONS.y, bomb.row + 1),
				alpha: new Tween(0),
			};
			cashGrid.area = area;
			const inArea = cashGrid.cells.filter(
				(c) => c.reel >= area.reel0 && c.reel <= area.reel1 && c.row >= area.row0 && c.row <= area.row1,
			);
			void area.alpha.set(AREA_ALPHA, { duration: ms(260), easing: cubicOut });
			await setFocus(inArea.map(getCellKey));
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
					await flyValue(bomb, target, coinLabel(target.add));
					sound('sfx_ms_mult_apply');
					await countTo(cashCellAt(target), target.total);
				}),
			);
			await Promise.all([area.alpha.set(0, { duration: ms(260) }), setFocus(null)]);
			cashGrid.area = null;
		},
		cashBoardCollect: async ({ oncollect }) => {
			const coins = cashGrid.cells.filter((cell) => cell.kind === 'coin');
			for (const [index, cell] of coins.entries()) {
				oncollect(cell.value.target, index);
				void punch(cell, 1.22);
				// the last coin into TOTAL WIN thumps the slot (SceneShake)
				if (index === coins.length - 1) {
					context.eventEmitter.broadcast({ type: 'sceneShake', preset: 'collect' });
				}
				await waitForTimeout(ms(index < 3 ? 280 : 150));
			}
			await waitForTimeout(ms(350));
		},
	});

	const areaRect = $derived.by(() => {
		const area = cashGrid.area;
		if (!area) return null;
		const reels = area.reel1 - area.reel0 + 1;
		const rows = area.row1 - area.row0 + 1;
		return {
			x: getSymbolX(area.reel0) - SYMBOL_WIDTH / 2 + SYMBOL_GAP / 2,
			y: getSymbolY(area.row0 - 1) - SYMBOL_SIZE / 2 + SYMBOL_GAP / 2,
			width: reels * SYMBOL_WIDTH - SYMBOL_GAP,
			height: rows * SYMBOL_SIZE - SYMBOL_GAP,
			alpha: area.alpha.current,
		};
	});
</script>

<!--
	Drawn LAYER by layer across the grid, not cell by cell: a cell's stack drawn
	whole let every later cell's tile cover what spilled out of it — the bomb's
	blast lost its right side, coins their punch (Evtim, 2026-11-03). So: all
	tiles, the bomb's area, all frames, all spins, all occupants (a punching /
	counting cell sorts above its neighbours), the frame badges, the focus dim.
	The rigs and the thrown values are CashRespinFx, over the pipe frame. Every
	layer and every cell slot is a persistent Container: pixi-svelte appends a
	(re)mounted child at the END of its parent, so a bare {#if} would jump over
	its siblings the moment it remounts.
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
		<!-- the acting bomb's 3x3 glows under the coins it boosts -->
		<Container>
			{#if areaRect}
				<Rectangle
					x={areaRect.x}
					y={areaRect.y}
					width={areaRect.width}
					height={areaRect.height}
					borderRadius={CELL_RADIUS}
					backgroundColor={AREA_COLOR}
					alpha={areaRect.alpha}
				/>
			{/if}
		</Container>
		<!-- frames on empty cells, and a multiplier just landed (above its frame, if it has one) -->
		<Container>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				{@const stack = cell.stack.current}
				{@const scale = lerp(1, STACK_SCALE, stack)}
				<Container x={cellX(cell)} y={cellY(cell)}>
					<Container>
						{#if cell.frame > 0 && !cell.kind && !cell.rig}
							<Container
								y={stack * STACK_OFFSET}
								scale={scale * cell.framePop.current}
								alpha={cell.frameAlpha.current}
							>
								<BitmapText
									anchor={0.5}
									text={multLabel(cell.frameShown.current)}
									style={multTextStyle(cell.frameShown.current)}
								/>
							</Container>
						{/if}
					</Container>
					<Container>
						{#if cell.landed}
							<Container
								y={lerp(-STACK_OFFSET, STACK_OFFSET, cell.landedDrop.current) * stack}
								scale={scale * cell.pop.current}
								alpha={cell.landedAlpha.current}
							>
								<BitmapText anchor={0.5} text={multLabel(cell.landed)} style={multTextStyle(cell.landed)} />
							</Container>
						{/if}
					</Container>
				</Container>
			{/each}
		</Container>
		<!-- each empty tile's own reel (CashCellSpin): mounted once for the whole
		     feature and only shown while it spins, so a spin mounts nothing (30
		     tiles mounting at once was the drop as every spin began). Clipped to
		     the tiles by TWO masks, not one per tile: a face only ever reaches the
		     row above or below its own, and that row is in the other mask -->
		{#each [0, 1] as parity (parity)}
			<Container>
				<Graphics isMask draw={(graphics) => drawTileWindows(graphics, parity)} />
				{#each cashGrid.cells as cell (getCellKey(cell))}
					{#if cell.row % 2 === parity}
						<Container x={cellX(cell)} y={cellY(cell)} visible={!!cell.spin}>
							<CashCellSpin items={cell.spin?.items ?? IDLE_ROLL} p={cell.spin?.p.current ?? 0} />
						</Container>
					{/if}
				{/each}
			</Container>
		{/each}
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
						<CashFace kind="coin" value={cell.value.current} purple={cell.purple.current} />
					{:else if cell.kind}
						<CashFace kind={cell.kind} />
					{/if}
				</Container>
			{/each}
		</Container>
		<!-- the frame under a coin / bomb / cloner: a corner badge until it applies -->
		<Container>
			{#each cashGrid.cells as cell (getCellKey(cell))}
				{@const t = cell.badgeFly.current}
				<Container x={cellX(cell)} y={cellY(cell)}>
					{#if cell.badge && cell.kind && cell.frame > 0}
						<Container
							x={lerp(BADGE.x, 0, t)}
							y={lerp(BADGE.y, 0, t)}
							scale={lerp(BADGE.scale, 0.9, t)}
							alpha={1 - Math.max(0, (t - 0.65) / 0.35)}
						>
							<BitmapText anchor={0.5} text={multLabel(cell.frame)} style={multTextStyle(cell.frame)} />
						</Container>
					{/if}
				</Container>
			{/each}
		</Container>
		<!-- a bomb / cloner acting: every cell it does not touch dims -->
		<Container>
			{#if cashGrid.focus}
				{#each cashGrid.cells as cell (getCellKey(cell))}
					{#if !cashGrid.focus.includes(getCellKey(cell))}
						<Rectangle
							anchor={0.5}
							x={cellX(cell)}
							y={cellY(cell)}
							width={CASH_CELL.width}
							height={CASH_CELL.height}
							borderRadius={CELL_RADIUS}
							backgroundColor={0x000000}
							alpha={DIM_ALPHA * cashGrid.dim.current}
						/>
					{/if}
				{/each}
			{/if}
		</Container>
	</BoardContainer>
</Container>
