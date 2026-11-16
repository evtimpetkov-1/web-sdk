<script lang="ts" module>
	import { SYMBOL_GAP, SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';

	/** what a Cash Respins cell can show (the strip of a spinning cell too) */
	export type CashFaceKind = 'blank' | 'coin' | 'mult' | 'bomb' | 'cloner';

	export const CASH_CELL = { width: SYMBOL_WIDTH - SYMBOL_GAP, height: SYMBOL_SIZE - SYMBOL_GAP };

	// coin v2 (433x478, gold and purple) fitted to the cell like every plate symbol
	const PLATE_ART = { width: 433, height: 478 };
	const plateK = Math.min(CASH_CELL.width / PLATE_ART.width, CASH_CELL.height / PLATE_ART.height);
	export const COIN_PLATE = { width: PLATE_ART.width * plateK, height: PLATE_ART.height * plateK };
	// the value sits on the coin's disc, a touch below the plate's centre (art px 245 of 478)
	export const COIN_TEXT_Y = 6 * plateK;

	// Labels: a coin is worth "1x" the bet (Evtim, 2026-11-03: "1x, not x1"); a
	// multiplier multiplies, "x2". The two also read apart at a glance.
	export const coinLabel = (value: number) => `${Math.round(value)}x`;
	export const multLabel = (value: number) => `x${Math.round(value)}`;
	// text size by the label's length ("5x" / "25x" / "250x" / "1500x"), in board
	// units: the coin's value fits inside its disc (~70% of the plate's width)
	const COIN_SIZES: Record<number, number> = { 2: 0.36, 3: 0.28, 4: 0.21 };
	const MULT_SIZES: Record<number, number> = { 2: 0.55, 3: 0.46 };
	// bitmap faces keep fill 0xffffff, or a restyle tints them black
	export const coinTextStyle = (value: number, purple = false) => ({
		fontFamily: purple ? 'cl2-coin-purple' : 'cl2-coin',
		fontSize: SYMBOL_SIZE * (COIN_SIZES[coinLabel(value).length] ?? 0.17),
		align: 'center' as const,
		fill: 0xffffff,
	});
	export const multTextStyle = (value: number) => ({
		fontFamily: 'cl2-multiplier',
		fontSize: SYMBOL_SIZE * (MULT_SIZES[multLabel(value).length] ?? 0.38),
		align: 'center' as const,
		fill: 0xffffff,
	});
</script>

<script lang="ts">
	import { BitmapText, Container, Sprite } from 'pixi-svelte';

	import SymbolSprite from './SymbolSprite.svelte';
	import { getSymbolInfo } from '../game/utils';

	/**
	 * One Cash Respins face at its cell's centre: a coin (Evtim's gold coin with
	 * its x-value in cl2-coin, turning purple once a multiplier frame applied:
	 * Evtim, 2026-11-04), a multiplier (the bare purple cl2-multiplier value, no
	 * plate: Evtim, 2026-11-03), or Chaos Lab's bomb / cloner plates.
	 */
	type Props = {
		kind: CashFaceKind;
		/** x bet (coin) or the multiplier */
		value?: number;
		/** a coin: 0 = gold, 1 = purple (multiplied); the purple fades in over the gold */
		purple?: number;
	};

	const props: Props = $props();

	const BOMB = getSymbolInfo({ rawSymbol: { name: 'B' }, state: 'static' });
	const CLONER = getSymbolInfo({ rawSymbol: { name: 'C' }, state: 'static' });
</script>

<Container>
	{#if props.kind === 'coin'}
		{@const purple = props.purple ?? 0}
		{@const label = coinLabel(props.value ?? 0)}
		<Container visible={purple < 1}>
			<Sprite key="cl2CoinGold" anchor={0.5} width={COIN_PLATE.width} height={COIN_PLATE.height} />
			<BitmapText anchor={0.5} y={COIN_TEXT_Y} text={label} style={coinTextStyle(props.value ?? 0)} />
		</Container>
		<Container visible={purple > 0} alpha={purple}>
			<Sprite key="cl2CoinPurple" anchor={0.5} width={COIN_PLATE.width} height={COIN_PLATE.height} />
			<BitmapText anchor={0.5} y={COIN_TEXT_Y} text={label} style={coinTextStyle(props.value ?? 0, true)} />
		</Container>
	{:else if props.kind === 'mult'}
		<BitmapText anchor={0.5} text={multLabel(props.value ?? 0)} style={multTextStyle(props.value ?? 0)} />
	{:else if props.kind === 'bomb'}
		<SymbolSprite symbolInfo={BOMB} />
	{:else if props.kind === 'cloner'}
		<SymbolSprite symbolInfo={CLONER} />
	{/if}
</Container>
