<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/<CashRespinsAssets>',
	});
</script>

<script lang="ts">
	import { BitmapText, Container, Rectangle } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import CashFace from '../components/CashFace.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import assets from '../game/assets';

	/**
	 * Chaos Lab 2's Cash Respins faces as the board draws them (CashFace): coin v2
	 * gold (as it lands) and purple (once a multiplier frame applied, Evtim
	 * 2026-11-04), and the plateless purple multipliers. Drawn at 1.6x the board's
	 * cell; the coin's text sizes by label length are CashFace's COIN_SIZES.
	 */
	const COINS = [1, 5, 25, 100, 250, 1500];
	const MULTS = [2, 3, 5, 10, 25, 100];
	const ZOOM = 1.6;
	const CELL = SYMBOL_SIZE * ZOOM;
	const ROWS = [
		{ kind: 'coin', values: COINS, purple: 0 },
		{ kind: 'coin', values: COINS, purple: 1 },
		{ kind: 'mult', values: MULTS, purple: 0 },
	] as const;
</script>

<Story name="coins + multipliers">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Rectangle width={1600} height={1000} backgroundColor={0x15171a} />
			<Container x={60} y={60}>
				{#each ROWS as row, r}
					{#each row.values as value, i}
						<Container x={i * (CELL + 20) + CELL / 2} y={r * (CELL + 20) + CELL / 2}>
							<Rectangle x={-CELL / 2} y={-CELL / 2} width={CELL} height={CELL} backgroundColor={0x26292e} />
							<Container scale={ZOOM}>
								<CashFace kind={row.kind} {value} purple={row.purple} />
							</Container>
						</Container>
					{/each}
				{/each}
				<!-- the full charsets -->
				<Container y={3 * (CELL + 20) + 20}>
					<BitmapText text="x0123456789" style={{ fontFamily: 'cl2-coin', fontSize: 70, fill: 0xffffff }} />
					<BitmapText y={80} text="x0123456789" style={{ fontFamily: 'cl2-coin-purple', fontSize: 70, fill: 0xffffff }} />
					<BitmapText y={160} text="x0123456789" style={{ fontFamily: 'cl2-multiplier', fontSize: 70, fill: 0xffffff }} />
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
