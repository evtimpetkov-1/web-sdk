<script lang="ts">
	import { stateBet } from 'state-shared';
	import { numberToWinCurrencyString } from 'utils-shared/amount';

	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder } from '../i18n/format';
	import config from '../game/config';
	import { fitColumns } from './fitColumns';

	/**
	 * The paytable, the first half of the generic UI's info page (GenericInfo). The
	 * pictures are the game's own symbols (static/assets/heist/paytable, cut by
	 * art-review/3-pots-heist/app/build_app_assets.py).
	 * The pays read off config.symbols, which holds PLACEHOLDER figures until the math
	 * exists (config.ts): never retype a payout in this file. The special symbols'
	 * lines are plain English, untranslated: they are rewritten from the math's spec.
	 */

	// URL-relative literals like assets.ts (a template literal makes Vite glob
	// for them and every image 404s)
	const IMG = {
		H1: new URL('../../assets/heist/paytable/H1.webp', import.meta.url).href,
		H2: new URL('../../assets/heist/paytable/H2.webp', import.meta.url).href,
		H3: new URL('../../assets/heist/paytable/H3.webp', import.meta.url).href,
		H4: new URL('../../assets/heist/paytable/H4.webp', import.meta.url).href,
		H5: new URL('../../assets/heist/paytable/H5.webp', import.meta.url).href,
		L1: new URL('../../assets/heist/paytable/L1.webp', import.meta.url).href,
		L2: new URL('../../assets/heist/paytable/L2.webp', import.meta.url).href,
		L3: new URL('../../assets/heist/paytable/L3.webp', import.meta.url).href,
		L4: new URL('../../assets/heist/paytable/L4.webp', import.meta.url).href,
		L5: new URL('../../assets/heist/paytable/L5.webp', import.meta.url).href,
		W: new URL('../../assets/heist/paytable/W.webp', import.meta.url).href,
		C: new URL('../../assets/heist/paytable/C.webp', import.meta.url).href,
		CL: new URL('../../assets/heist/paytable/CL.webp', import.meta.url).href,
		P1: new URL('../../assets/heist/paytable/P1.webp', import.meta.url).href,
		P2: new URL('../../assets/heist/paytable/P2.webp', import.meta.url).href,
		P3: new URL('../../assets/heist/paytable/P3.webp', import.meta.url).href,
	};

	const PAYING = ['H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'L5'] as const;
	const NAMES: Record<(typeof PAYING)[number], string> = {
		H1: 'H1', H2: 'H2', H3: 'H3', H4: 'H4', H5: 'H5', L1: 'A', L2: 'K', L3: 'Q', L4: 'J', L5: '10',
	}; // prettier-ignore

	// 6 / 5 / 4 / 3 of a kind, most first
	const tiersOf = (symbol: (typeof PAYING)[number]) =>
		config.symbols[symbol].paytable
			.flatMap((entry) => Object.entries(entry))
			.map(([count, value]) => ({ label: count, value }))
			.sort((a, b) => Number(b.label) - Number(a.label));

	const symbols = PAYING.map((code) => ({ img: IMG[code], name: NAMES[code], tiers: tiersOf(code) }));

	const specials = [
		{ img: IMG.W, name: 'Wild', text: 'Substitutes for every paying symbol.' },
		{ img: IMG.C, name: 'Coin', text: 'Carries a value, shown on the coin.' },
		{ img: IMG.CL, name: 'Collect', text: 'Awards the sum of the values of all Coins in view.' },
		{ img: IMG.P1, name: 'Cash', text: 'Fills the cash bag. The bag can open Free Spins with two more rows.' },
		{ img: IMG.P2, name: 'Gems', text: 'Fills the gem bag. The bag can open Free Spins with a roaming Collect Wild.' },
		{ img: IMG.P3, name: 'Gold', text: 'Fills the gold bag. The bag can open Free Spins with a multiplier that grows with every collect.' },
	];

	const INTRO =
		'Values are shown for the current bet. A symbol pays for 3 to 6 of a kind on adjacent reels, starting from the leftmost reel. Draft figures: the pays follow the game\'s math.';

	// pays are bet multiples, shown in currency at the current bet
	const formatWin = (multiplier: number) =>
		drawnOrder(numberToWinCurrencyString(multiplier * stateBet.betAmount));
	// every value on show: a new bet re-fits the symbol grid's columns
	const shownValues = $derived(
		symbols.map((symbol) => symbol.tiers.map((tier) => formatWin(tier.value)).join()).join(),
	);
</script>

<div class="panel embedded">
	<p class="intro">{INTRO}</p>

	<section class="payouts">
		<h2>{i18nDerived.ptSymbolPayouts()}</h2>
		<div class="symbols" use:fitColumns={shownValues}>
			{#each symbols as symbol}
				<div class="symbol">
					<img src={symbol.img} alt={symbol.name} />
					<div class="pays">
						{#each symbol.tiers as tier}
							<span class="count">{tier.label}</span>
							<span class="value">{formatWin(tier.value)}</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2>{i18nDerived.ptSpecialSymbols()}</h2>
		<div class="specials">
			{#each specials as special}
				<div class="special">
					<img src={special.img} alt={special.name} />
					<div>
						<span class="name">{special.name}</span>
						<p>{special.text}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<style lang="scss">
	/* same panel as GameRules (the shared modal theme's charcoal glass) */
	.panel {
		/* above the Popup's click-to-close layer (z 2), under its X (z 101) */
		position: relative;
		z-index: 100;
		box-sizing: border-box;
		width: min(680px, 92vw);
		/* dvh = the visible height (iOS vh includes the area behind the browser bars) */
		max-height: 86vh;
		max-height: 86dvh;
		overflow-y: auto;
		padding: 1.6rem 1.4rem 1rem;
		background: var(--modal-panel-bg);
		border: var(--modal-panel-border);
		border-radius: var(--modal-panel-radius);
		box-shadow: var(--modal-panel-shadow);
		color: var(--modal-text);
		font-family: 'Inter', sans-serif;
		scrollbar-width: thin;
		scrollbar-color: rgba(242, 181, 58, 0.35) transparent;
	}

	.title,
	h2 {
		margin: 0 0 0.6rem;
		text-align: center;
		font-family: var(--ms-display-font, 'Alfa Slab One', 'Inter', sans-serif);
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--modal-accent);
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 14px rgba(242, 181, 58, 0.3);
	}

	.title {
		font-size: 2rem;
	}

	h2 {
		font-size: 1.4rem;
	}

	.intro {
		margin: 0 0 1.4rem;
		text-align: center;
		font-size: 0.9rem;
		color: rgba(242, 246, 234, 0.7);
	}

	section {
		margin-bottom: 1.6rem;
	}

	/* special symbols: one row each, art beside the text */
	.specials {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.special {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.6rem 0.8rem;
		border-radius: 12px;
		background: var(--modal-bg);
		border: 1px solid var(--modal-border);

		img {
			flex: none;
			width: 84px;
			height: 84px;
			object-fit: contain;
		}

		.name {
			font-weight: 700;
			color: var(--modal-accent);
		}

		p {
			margin: 0.2rem 0 0;
			font-size: 0.9rem;
			line-height: 1.45;
			white-space: pre-line;
			color: rgba(242, 246, 234, 0.82);
		}
	}

	/* paying symbols: 3 x 3, or fewer columns where the values do not fit a card
	   (a long currency at a high bet); fitColumns sets --cols / data-cols */
	.symbols {
		--cols-max: 3;
		display: grid;
		grid-template-columns: repeat(var(--cols, var(--cols-max)), minmax(0, 1fr));
		gap: 0.6rem;
	}

	/* two columns: the ninth card sits centred under the others */
	.symbols[data-cols='2'] .symbol:last-child:nth-child(odd) {
		grid-column: 1 / -1;
		justify-self: center;
		width: calc(50% - 0.3rem);
		box-sizing: border-box;
	}

	/* one column: the art beside its pays */
	.symbols[data-cols='1'] .symbol {
		flex-direction: row;
		justify-content: center;
		gap: 1rem;
	}

	.symbol {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 0.7rem 0.4rem;
		border-radius: 12px;
		background: var(--modal-bg);
		border: 1px solid var(--modal-border);

		img {
			width: 96px;
			height: 96px;
			object-fit: contain;
		}
	}

	.pays {
		display: grid;
		grid-template-columns: auto auto;
		gap: 0.15rem 0.6rem;
		align-items: baseline;
		font-variant-numeric: tabular-nums;
	}

	.count {
		text-align: right;
		white-space: nowrap;
		font-size: 0.8rem;
		color: rgba(242, 246, 234, 0.55);
	}

	.value {
		white-space: nowrap;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--modal-accent);
	}

	.version {
		text-align: center;
		font-size: 0.7rem;
		color: rgba(242, 246, 234, 0.35);
	}

	@media screen and (max-width: 500px) {
		.panel {
			width: 94vw;
			padding: 1.4rem 0.7rem 0.8rem;
		}

		.title {
			font-size: 1.5rem;
		}

		h2 {
			font-size: 1.15rem;
		}

		.special {
			gap: 0.7rem;
			padding: 0.5rem 0.6rem;

			img {
				width: 64px;
				height: 64px;
			}

			p {
				font-size: 0.8rem;
			}
		}

		.symbol {
			padding: 0.5rem 0.2rem;

			img {
				width: 64px;
				height: 64px;
			}
		}

		.pays {
			gap: 0.1rem 0.35rem;
		}

		.count {
			font-size: 0.7rem;
		}

		.value {
			font-size: 0.75rem;
		}
	}

	/* landscape phones: five across, smaller art */
	@media screen and (max-height: 500px) {
		.panel {
			/* the whole visible height minus the popup's 1rem padding */
			max-height: calc(100vh - 2rem);
			max-height: calc(100dvh - 2rem);
			padding-top: 1rem;
		}

		.symbols {
			--cols-max: 5;
		}

		.symbol img {
			width: 60px;
			height: 60px;
		}

		.special img {
			width: 60px;
			height: 60px;
		}
	}

	/* inside the generic info page: content only, in the page's plain voice */
	.panel.embedded {
		/* the payouts first, the special symbols under them (order, below) */
		display: flex;
		flex-direction: column;
		z-index: auto;
		width: 100%;
		max-height: none;
		overflow: visible;
		padding: 0;
		background: none;
		border: 0;
		border-radius: 0;
		box-shadow: none;

		:global(h1),
		:global(h2),
		:global(h3) {
			font-family: inherit;
			font-weight: 800;
			letter-spacing: 0.06em;
			text-shadow: none;
		}
		:global(h1) {
			font-size: 1.3rem;
		}
		:global(h2) {
			font-size: 1.05rem;
		}
		.title {
			order: -3;
		}
		.intro {
			order: -2;
		}
		.payouts {
			order: -1;
		}
	}
</style>
