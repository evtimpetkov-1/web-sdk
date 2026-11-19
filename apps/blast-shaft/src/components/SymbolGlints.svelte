<script lang="ts">
	// Idle life on a resting board (review 2026-11-16: "Symbols are too static").
	// Between rounds every symbol is a static sprite; this starts one pass of a
	// symbol's `glint` rig animation (light running up the gold bars, the cart
	// rocking on its wheels, the lantern's flame, the helmet lamp's beam, a glint
	// sliding across a letter) on a random resting cell every half second or so.
	// At most MAX rigs run at once, so the board stays cheap: 28 sprites + 2 rigs.
	// ReelSymbol draws the rig while stateGame.glints[cell] is set and clears it when
	// the pass ends, a spin starts or a round begins.
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { getCellKey, getSymbolInfo } from '../game/utils';
	import { BOARD_DIMENSIONS } from '../game/constants';

	const context = getContext();
	const MAX = 2;
	// a flag older than this was never cleared by its rig (the cell was hidden): drop it
	const STALE_MS = 3000;

	onMount(() => {
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		let timer: ReturnType<typeof setTimeout>;
		const tick = () => {
			timer = setTimeout(tick, 420 + Math.random() * 620);
			const { stateGame } = context;
			const now = performance.now();
			let live = 0;
			for (const key in stateGame.glints) {
				const startedAt = stateGame.glints[key];
				if (!startedAt) continue;
				if (now - startedAt > STALE_MS) stateGame.glints[key] = 0;
				else live++;
			}
			if (stateGame.roundActive || document.hidden || live >= MAX) return;
			const reel = Math.floor(Math.random() * BOARD_DIMENSIONS.x);
			// the reel's strip is padded: rows 1..y are the visible ones
			const row = 1 + Math.floor(Math.random() * BOARD_DIMENSIONS.y);
			const symbol = stateGame.board[reel]?.reelState.symbols[row];
			const key = getCellKey({ reel, row });
			if (!symbol || symbol.symbolState !== 'static' || stateGame.glints[key]) return;
			if (getSymbolInfo({ rawSymbol: symbol.rawSymbol, state: 'glint' }).type !== 'spine') return;
			stateGame.glints[key] = now;
		};
		timer = setTimeout(tick, 1500);
		return () => clearTimeout(timer);
	});
</script>
