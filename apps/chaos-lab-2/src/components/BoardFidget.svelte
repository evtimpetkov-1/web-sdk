<script lang="ts">
	import { untrack } from 'svelte';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { getCellKey, getSymbolInfo } from '../game/utils';
	import {
		BOARD_DIMENSIONS,
		FIDGET_EVERY_MS,
		FIDGET_SECOND_MS,
		FIDGET_AUTOPLAY_WAIT_MS,
		FIDGET_MAX,
		FIDGET_HIGH_WEIGHT,
	} from '../game/constants';

	/**
	 * The board at rest is alive: the moment it comes to rest one cell plays its
	 * symbol's `fidget` (the heart beats, the eye looks around, the fingers drum,
	 * a shiver runs up a slime letter), a second follows close behind, then one
	 * every half second or so. Logic only, draws nothing: it sets
	 * stateGame.fidget[cell] and ReelSymbol shows the rig and clears the flag when
	 * the one-shot ends. Nothing is picked while a round plays, a reel moves or
	 * Cash Respins own the screen; a reduced-motion setting turns it off.
	 */
	const context = getContext();

	const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	const between = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

	// every visible cell is static (the padded rows 1..y are the window)
	const resting = () =>
		!context.stateGame.roundActive &&
		!context.stateGame.cashRespins &&
		context.stateGame.board.every((reel) =>
			reel.reelState.symbols.every(
				(symbol, row) => row === 0 || row > BOARD_DIMENSIONS.y || symbol.symbolState === 'static',
			),
		);

	let lastName: string | undefined;

	const pick = () => {
		const { fidget, board } = context.stateGame;
		if (Object.values(fidget).filter(Boolean).length >= FIDGET_MAX) return;
		const cells: { key: string; name: string; weight: number }[] = [];
		board.forEach((reel, reelIndex) => {
			reel.reelState.symbols.forEach((symbol, row) => {
				if (row === 0 || row > BOARD_DIMENSIONS.y) return;
				const key = getCellKey({ reel: reelIndex, row });
				if (fidget[key]) return;
				if (getSymbolInfo({ rawSymbol: symbol.rawSymbol, state: 'fidget' }).type !== 'spine') return;
				const { name } = symbol.rawSymbol;
				// never the same symbol twice running while another kind is on the board
				cells.push({
					key,
					name,
					weight: (name.startsWith('L') ? 1 : FIDGET_HIGH_WEIGHT) * (name === lastName ? 0.05 : 1),
				});
			});
		});
		const total = cells.reduce((sum, cell) => sum + cell.weight, 0);
		if (!total) return;
		let roll = Math.random() * total;
		const cell = cells.find((candidate) => (roll -= candidate.weight) <= 0) ?? cells[cells.length - 1];
		lastName = cell.name;
		fidget[cell.key] = true;
	};

	// Reactive, not polled: the first fidget starts as the last symbol settles
	// (the next task). Between autoplay (or held-Space) rounds the board rests only for an
	// instant, so there it waits: a rig mounted and dropped every round is a cost.
	const isResting = $derived(resting());
	$effect(() => {
		if (!isResting || reducedMotion()) return;
		const continuous = untrack(() => stateBet.autoSpinsCounter !== 0 || stateBet.isSpaceHold);
		// picked from a timer, never inside this effect: a fidget flag set while the
		// settling symbols are still flushing runs their sprite effects on a rig state
		let timer: ReturnType<typeof setTimeout>;
		let first = true;
		const loop = () => {
			pick();
			timer = setTimeout(loop, first ? FIDGET_SECOND_MS : between(FIDGET_EVERY_MS));
			first = false;
		};
		timer = setTimeout(loop, continuous ? FIDGET_AUTOPLAY_WAIT_MS : 0);
		return () => clearTimeout(timer);
	});
</script>
