<script lang="ts" module>
	import { SYMBOL_GAP, SYMBOL_SIZE, SYMBOL_WIDTH } from '../game/constants';

	/** what a Cash Respins cell can show (the strip of a spinning cell too) */
	export type CashFaceKind = 'blank' | 'coin' | 'mult' | 'bomb' | 'cloner';

	export const CASH_CELL = { width: SYMBOL_WIDTH - SYMBOL_GAP, height: SYMBOL_SIZE - SYMBOL_GAP };

	// coin_plate.png (297x321) fitted to the cell like every plate symbol
	const PLATE_ART = { width: 297, height: 321 };
	const plateK = Math.min(CASH_CELL.width / PLATE_ART.width, CASH_CELL.height / PLATE_ART.height);
	export const COIN_PLATE = { width: PLATE_ART.width * plateK, height: PLATE_ART.height * plateK };

	// text size by the label's length ("x5" / "x25" / "x250"), in board units:
	// the first guesses of the CashRespinsAssets story, at the board's cell
	const COIN_SIZES: Record<number, number> = { 2: 0.46, 3: 0.4 };
	const MULT_SIZES: Record<number, number> = { 2: 0.55, 3: 0.46 };
	export const cashLabel = (value: number) => `x${Math.round(value)}`;
	// bitmap faces keep fill 0xffffff, or a restyle tints them black
	export const coinTextStyle = (value: number) => ({
		fontFamily: 'cl2-coin',
		fontSize: SYMBOL_SIZE * (COIN_SIZES[cashLabel(value).length] ?? 0.32),
		align: 'center' as const,
		fill: 0xffffff,
	});
	export const multTextStyle = (value: number) => ({
		fontFamily: 'cl2-multiplier',
		fontSize: SYMBOL_SIZE * (MULT_SIZES[cashLabel(value).length] ?? 0.38),
		align: 'center' as const,
		fill: 0xffffff,
	});
</script>

<script lang="ts">
	import { BitmapText, Container, Sprite } from 'pixi-svelte';

	import SymbolSprite from './SymbolSprite.svelte';
	import { getSymbolInfo } from '../game/utils';

	/**
	 * One Cash Respins face at its cell's centre: a coin (Evtim's gold plate with
	 * its x-value in cl2-coin), a multiplier (the bare purple cl2-multiplier value,
	 * no plate: Evtim, 2026-11-03), or Chaos Lab's bomb / cloner plates.
	 */
	type Props = {
		kind: CashFaceKind;
		/** x bet (coin) or the multiplier */
		value?: number;
	};

	const props: Props = $props();

	const BOMB = getSymbolInfo({ rawSymbol: { name: 'B' }, state: 'static' });
	const CLONER = getSymbolInfo({ rawSymbol: { name: 'C' }, state: 'static' });
</script>

<Container>
	{#if props.kind === 'coin'}
		<Sprite key="cl2CoinPlate" anchor={0.5} width={COIN_PLATE.width} height={COIN_PLATE.height} />
		<BitmapText anchor={0.5} text={cashLabel(props.value ?? 0)} style={coinTextStyle(props.value ?? 0)} />
	{:else if props.kind === 'mult'}
		<BitmapText anchor={0.5} text={cashLabel(props.value ?? 0)} style={multTextStyle(props.value ?? 0)} />
	{:else if props.kind === 'bomb'}
		<SymbolSprite symbolInfo={BOMB} />
	{:else if props.kind === 'cloner'}
		<SymbolSprite symbolInfo={CLONER} />
	{/if}
</Container>
