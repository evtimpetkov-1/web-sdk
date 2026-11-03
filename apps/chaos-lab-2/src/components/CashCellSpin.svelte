<script lang="ts" module>
	import type { CashFaceKind } from './CashFace.svelte';

	export type CashSpinItem = { kind: CashFaceKind; value: number };
</script>

<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';

	import CashFace, { CASH_CELL } from './CashFace.svelte';
	import { SYMBOL_SIZE } from '../game/constants';

	/**
	 * One empty Cash Respins cell spinning on its own (Evtim, 2026-11-03: per-cell
	 * spin). A strip of faces scrolls down through the cell's window: item i sits
	 * at (p - i) cells, so item 0 (the cell as it was) starts centred and the last
	 * item (the landed face, or blank) is centred when p reaches it. Only the
	 * items inside the window are mounted. Clipped to the cell by its own mask.
	 */
	type Props = {
		items: CashSpinItem[];
		/** strip position, in items */
		p: number;
	};

	const props: Props = $props();

	const visible = $derived.by(() => {
		const first = Math.max(0, Math.floor(props.p) - 1);
		const last = Math.min(props.items.length - 1, Math.ceil(props.p) + 1);
		const out: { i: number; item: CashSpinItem }[] = [];
		for (let i = first; i <= last; i++) out.push({ i, item: props.items[i] });
		return out;
	});
</script>

<Container>
	<Rectangle
		isMask
		x={-CASH_CELL.width / 2}
		y={-CASH_CELL.height / 2}
		width={CASH_CELL.width}
		height={CASH_CELL.height}
	/>
	{#each visible as { i, item } (i)}
		<Container y={(props.p - i) * SYMBOL_SIZE}>
			<CashFace kind={item.kind} value={item.value} />
		</Container>
	{/each}
</Container>
