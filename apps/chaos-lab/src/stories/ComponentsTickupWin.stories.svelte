<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/<TickupWin>',
	});
</script>

<script lang="ts">
	import { BitmapText, Container, Rectangle } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import { SYMBOL_SIZE } from '../game/constants';
	import assets from '../game/assets';

	/**
	 * Every glyph the winbox font carries, in the strings the RGS actually
	 * produces (utils-shared/amount.ts formats 1234.5 per currency; wins add
	 * decimals at low bets). Anything the atlas lacks renders as a gap.
	 */
	const FONT = 'tickup-win';
	const CHARSET = ['0123456789', '1,234.56 + 7/8 x', 'ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', 'hkprsxz ł م ج'];
	const CURRENCIES = [
		'$1234.50', 'CA$1234.50', '¥1235', '€1234.50', '₽1234.50', 'CN¥1234.50', '₱1234.50', '₹1234.50',
		'Rp1235', '₩1235', 'R$1234.50', 'MX$1234.50', '1234.50 KR', '1234.50 zł', '1235 ₫', '₺1234.50',
		'1235 CLP', '1234.50 ARS', 'S/1234.50', '₦1234.50', '1234.50 SAR', '1234.50 ILS', '1234.50 AED',
		'NT$1234.50', 'kr1234.50', 'KD1234.50', 'JD1234.50', '₡1234.50', '1234.50 TND', 'SG$1234.50',
		'RM1234.50', '1234.50 OMR', '1234.50 QAR', 'BD1234.50', 'Rs1234.50', '1234.50 م.ج', 'NZ$1234.50',
		'Bs1234.50', 'GH₵1234.50', 'KSh1234.50', 'MAD1234.50', 'KM1234.50', 'TSh1234.50', 'USh1234.50',
		'CFA1234.50', '1234.50 GC', '1234.50 SC', '$0.002', '$12,345,678.90',
	];
	const LINE = 56;
	const COLS = 3;
	const COL_W = 470;
</script>

<Story name="charset">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Rectangle width={1600} height={1000} backgroundColor={0x1b1f1b} />
			<Container x={24} y={24}>
				{#each CHARSET as text, i}
					<BitmapText y={i * LINE} {text} style={{ fontFamily: FONT, fontSize: 44 }} />
				{/each}
				{#each CURRENCIES as text, i}
					<BitmapText
						x={(i % COLS) * COL_W}
						y={(CHARSET.length + 0.5 + Math.floor(i / COLS)) * LINE}
						{text}
						style={{ fontFamily: FONT, fontSize: 36 }}
					/>
				{/each}
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>

<!-- the two sizes Win.svelte draws: SYMBOL_SIZE on the board, 3.6x inside the big-win spine -->
<Story name="winbox sizes">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Rectangle width={1600} height={1000} backgroundColor={0x1b1f1b} />
			<Container x={800} y={140}>
				<Rectangle x={-1} y={-1} width={2} height={2} backgroundColor={0xff0000} />
				<BitmapText
					anchor={0.5}
					text="$1,234.56"
					style={{ fontFamily: FONT, fontSize: SYMBOL_SIZE, align: 'center' }}
				/>
			</Container>
			<Container x={800} y={520}>
				<Rectangle x={-1} y={-1} width={2} height={2} backgroundColor={0xff0000} />
				<BitmapText
					anchor={0.5}
					text="$1,234.56"
					style={{ fontFamily: FONT, fontSize: SYMBOL_SIZE * 3.6, align: 'center' }}
				/>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
