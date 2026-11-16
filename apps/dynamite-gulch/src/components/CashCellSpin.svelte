<script lang="ts" module>
	import type { CashFaceKind } from './CashFace.svelte';

	export type CashSpinItem = { kind: CashFaceKind; value: number };

	/** the values a rolling coin / multiplier may carry: the board's fillers use only these */
	export const ROLL_COIN_VALUES = [1, 2, 5, 10];
	export const ROLL_MULT_VALUES = [2, 5];
</script>

<script lang="ts">
	import { BitmapText, Container, Sprite } from 'pixi-svelte';

	import CashFace, {
		COIN_PLATE,
		COIN_TEXT_Y,
		coinLabel,
		coinTextStyle,
		multLabel,
		multTextStyle,
	} from './CashFace.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	/**
	 * One empty Cash Respins tile spinning on its own, like a little reel (Evtim,
	 * 2026-11-06: "every tile should be independent"; its start, speed and stop
	 * are its own, CashRespinBoard). Faces scroll down through the tile at full
	 * size, one board row apart; CashRespinBoard clips them to the tile (one
	 * mask per row parity, not one per tile).
	 *
	 * Built for speed (the strips it replaced mounted a new face every ~60 ms per
	 * tile and masked each tile: iPhone 15 Pro Safari fell to ~29 fps). Nothing
	 * mounts while it spins: two persistent slots hold every face a filler can be
	 * (the coin plate and one text per ROLL_COIN_VALUES, the multipliers, bomb,
	 * cloner) and only switch which is visible. The landing face (any value) is
	 * the one full CashFace, mounted as it scrolls in.
	 *
	 * items[0] = the tile as it was (blank), items[last] = what lands; `p` runs
	 * from 0 to last (plus an overshoot): item i sits at (p - i) rows.
	 */
	type Props = {
		items: CashSpinItem[];
		/** strip position, in items */
		p: number;
	};

	const props: Props = $props();

	const BOMB = getSymbolInfo({ rawSymbol: { name: 'B' }, state: 'static' });
	const CLONER = getSymbolInfo({ rawSymbol: { name: 'C' }, state: 'static' });
	// one style object per value: a new object per face would restyle the text
	const COIN_STYLES = Object.fromEntries(ROLL_COIN_VALUES.map((v) => [v, coinTextStyle(v)]));
	const MULT_STYLES = Object.fromEntries(ROLL_MULT_VALUES.map((v) => [v, multTextStyle(v)]));

	const last = $derived(props.items.length - 1);
	const base = $derived(Math.floor(props.p));
	const frac = $derived(props.p - base);
	// the face leaving downwards (base) and the one arriving from above (base + 1);
	// the landing face is drawn by itself, below
	const slots = $derived(
		[base, base + 1].map((i) => ({
			item: i < last ? props.items[i] : null,
			y: (i === base ? frac : frac - 1) * SYMBOL_SIZE,
		})),
	);
	// the landing face, from the moment it starts scrolling in
	const landingY = $derived(props.p > last - 1 ? (props.p - last) * SYMBOL_SIZE : null);
</script>

<Container>
	{#each slots as slot, s (s)}
		{@const kind = slot.item?.kind ?? 'blank'}
		{@const value = slot.item?.value ?? 0}
		<Container y={slot.y}>
			<Sprite
				visible={kind === 'coin'}
				key="cl2CoinGold"
				anchor={0.5}
				width={COIN_PLATE.width}
				height={COIN_PLATE.height}
			/>
			{#each ROLL_COIN_VALUES as v (v)}
				<BitmapText
					visible={kind === 'coin' && value === v}
					anchor={0.5}
					y={COIN_TEXT_Y}
					text={coinLabel(v)}
					style={COIN_STYLES[v]}
				/>
			{/each}
			{#each ROLL_MULT_VALUES as v (v)}
				<BitmapText visible={kind === 'mult' && value === v} anchor={0.5} text={multLabel(v)} style={MULT_STYLES[v]} />
			{/each}
			<Sprite
				visible={kind === 'bomb'}
				key={BOMB.assetKey}
				anchor={0.5}
				width={SYMBOL_SIZE * BOMB.sizeRatios.width}
				height={SYMBOL_SIZE * BOMB.sizeRatios.height}
			/>
			<Sprite
				visible={kind === 'cloner'}
				key={CLONER.assetKey}
				anchor={0.5}
				width={SYMBOL_SIZE * CLONER.sizeRatios.width}
				height={SYMBOL_SIZE * CLONER.sizeRatios.height}
			/>
		</Container>
	{/each}
	<Container visible={landingY !== null}>
		{#if landingY !== null}
			{@const target = props.items[last]}
			<Container y={landingY}>
				{#if target.kind !== 'blank'}
					<CashFace kind={target.kind} value={target.value} />
				{/if}
			</Container>
		{/if}
	</Container>
</Container>
