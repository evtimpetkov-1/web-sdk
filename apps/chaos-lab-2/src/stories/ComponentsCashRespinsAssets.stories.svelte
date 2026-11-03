<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/<CashRespinsAssets>',
	});
</script>

<script lang="ts">
	import { BitmapText, Container, Rectangle, Sprite } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import { SYMBOL_SIZE } from '../game/constants';
	import assets from '../game/assets';

	/**
	 * Chaos Lab 2's Cash Respins art before the feature exists (2026-11-03): the
	 * coin plate with values in cl2-coin, and the purple cl2-multiplier values
	 * that land on the reels without a plate. Cells are SYMBOL_SIZE, like the
	 * board; the text sizes are first guesses for the feature to tune.
	 */
	const COINS = ['x1', 'x5', 'x10', 'x25', 'x100', 'x250'];
	const MULTS = ['x2', 'x3', 'x5', 'x10', 'x25', 'x100'];
	const CELL = SYMBOL_SIZE * 1.6;
	// coin_plate.png is 297x321
	const PLATE = { width: CELL * 0.92, height: CELL * 0.92 * (321 / 297) };
</script>

<Story name="coins + multipliers">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Rectangle width={1600} height={1000} backgroundColor={0x15171a} />
			<Container x={60} y={60}>
				{#each COINS as text, i}
					<Container x={i * (CELL + 20) + CELL / 2} y={CELL / 2}>
						<Rectangle x={-CELL / 2} y={-CELL / 2} width={CELL} height={CELL} backgroundColor={0x26292e} />
						<Sprite key="cl2CoinPlate" anchor={0.5} width={PLATE.width} height={PLATE.height} />
						<BitmapText
							anchor={0.5}
							{text}
							style={{ fontFamily: 'cl2-coin', fontSize: CELL * (text.length > 3 ? 0.36 : 0.46), align: 'center' }}
						/>
					</Container>
				{/each}
				{#each MULTS as text, i}
					<Container x={i * (CELL + 20) + CELL / 2} y={CELL * 1.5 + 40}>
						<Rectangle x={-CELL / 2} y={-CELL / 2} width={CELL} height={CELL} backgroundColor={0x26292e} />
						<BitmapText
							anchor={0.5}
							{text}
							style={{ fontFamily: 'cl2-multiplier', fontSize: CELL * (text.length > 3 ? 0.42 : 0.55), align: 'center' }}
						/>
					</Container>
				{/each}
				<!-- the full charsets -->
				<BitmapText y={CELL * 2 + 90} text="x0123456789" style={{ fontFamily: 'cl2-coin', fontSize: 90 }} />
				<BitmapText y={CELL * 2 + 200} text="x0123456789" style={{ fontFamily: 'cl2-multiplier', fontSize: 90 }} />
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
