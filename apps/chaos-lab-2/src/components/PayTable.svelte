<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateModal } from 'state-shared';
	import { numberToWinCurrencyString } from 'utils-shared/amount';

	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder, fill, formatOrList, formatTimes } from '../i18n/format';
	import config from '../game/config';
	import { GAME_VERSION } from '../game/constants';
	import { MULTIPLIER_VALUES } from '../game/rulesData';
	import { fitColumns } from './fitColumns';

	/**
	 * Paytable, drawn in place of the SDK's ModalPayTable. Images are the game's
	 * own symbols, cut from the shipped sheet by
	 * art-review/madscience/paytable/cut_paytable.py.
	 */

	// URL-relative literals like assets.ts (a template literal makes Vite glob
	// for them and every image 404s)
	const IMG = {
		h1: new URL('../../assets/madscience/paytable/h1.webp', import.meta.url).href,
		h2: new URL('../../assets/madscience/paytable/h2.webp', import.meta.url).href,
		h3: new URL('../../assets/madscience/paytable/h3.webp', import.meta.url).href,
		h4: new URL('../../assets/madscience/paytable/h4.webp', import.meta.url).href,
		a: new URL('../../assets/madscience/paytable/a.webp', import.meta.url).href,
		k: new URL('../../assets/madscience/paytable/k.webp', import.meta.url).href,
		q: new URL('../../assets/madscience/paytable/q.webp', import.meta.url).href,
		j: new URL('../../assets/madscience/paytable/j.webp', import.meta.url).href,
		ten: new URL('../../assets/madscience/paytable/ten.webp', import.meta.url).href,
		wild: new URL('../../assets/madscience/paytable/wild.webp', import.meta.url).href,
		bonus: new URL('../../assets/madscience/paytable/bonus.webp', import.meta.url).href,
		mult: new URL('../../assets/madscience/paytable/mult.webp', import.meta.url).href,
		bomb: new URL('../../assets/madscience/paytable/bomb.webp', import.meta.url).href,
		cloner: new URL('../../assets/madscience/paytable/cloner.webp', import.meta.url).href,
	};

	type PayingSymbol = 'H1' | 'H2' | 'H3' | 'H4' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

	/**
	 * The pay tiers ("8–9", "10–11", "12+") read off config.symbols, the table
	 * the math pays from: runs of equal value per count are merged, and the run
	 * reaching the last count (the 30-cell board) reads "N+". Never retype a
	 * payout in this file.
	 */
	const tiersOf = (symbol: PayingSymbol) => {
		const pays = config.symbols[symbol].paytable
			.flatMap((entry) => Object.entries(entry))
			.map(([count, value]) => ({ count: Number(count), value }))
			.sort((a, b) => a.count - b.count);
		const lastCount = pays[pays.length - 1].count;
		const tiers: { from: number; to: number; value: number }[] = [];
		for (const { count, value } of pays) {
			const tier = tiers[tiers.length - 1];
			if (tier && tier.value === value) tier.to = count;
			else tiers.push({ from: count, to: count, value });
		}
		return tiers.map(({ from, to, value }) => ({
			label: to === lastCount ? `${from}+` : from === to ? `${from}` : `${from}–${to}`,
			value,
		}));
	};

	const symbols = $derived(
		[
			{ code: 'H1', img: IMG.h1, name: i18nDerived.symBrainJar() },
			{ code: 'H2', img: IMG.h2, name: i18nDerived.symHeart() },
			{ code: 'H3', img: IMG.h3, name: i18nDerived.symEyeball() },
			{ code: 'H4', img: IMG.h4, name: i18nDerived.symHand() },
			{ code: 'L1', img: IMG.a, name: 'A' },
			{ code: 'L2', img: IMG.k, name: 'K' },
			{ code: 'L3', img: IMG.q, name: 'Q' },
			{ code: 'L4', img: IMG.j, name: 'J' },
			{ code: 'L5', img: IMG.ten, name: '10' },
		].map((symbol) => ({ ...symbol, tiers: tiersOf(symbol.code as PayingSymbol) })),
	);

	const specials = $derived([
		{ img: IMG.wild, name: i18nDerived.rulesWild(), text: i18nDerived.ptWild() },
		{ img: IMG.bonus, name: i18nDerived.rulesScatter(), text: i18nDerived.ptScatter() },
		{
			img: IMG.mult,
			name: i18nDerived.rulesMultiplier(),
			text: fill(i18nDerived.ptMultiplier(), formatOrList(MULTIPLIER_VALUES.map(formatTimes))),
		},
		{ img: IMG.bomb, name: i18nDerived.rulesBomb(), text: i18nDerived.ptBomb() },
		{ img: IMG.cloner, name: i18nDerived.rulesCloner(), text: i18nDerived.ptCloner() },
	]);

	// pays are base-bet multiples, shown in currency at the current base bet
	const formatWin = (multiplier: number) =>
		drawnOrder(numberToWinCurrencyString(multiplier * stateBet.betAmount));
	// every value on show: a new bet re-fits the symbol grid's columns
	const shownValues = $derived(
		symbols.map((symbol) => symbol.tiers.map((tier) => formatWin(tier.value)).join()).join(),
	);
</script>

{#if stateModal.modal?.name === 'payTable'}
	<Popup zIndex={zIndex.modal} closeAnchor="content" onclose={() => (stateModal.modal = null)}>
		<div class="panel">
			<h1 class="title">{i18nDerived.ptTitle()}</h1>
			<p class="intro">{fill(i18nDerived.ptIntro(), i18nDerived.betWord())}</p>

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

			<section>
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

			<div class="version">v{GAME_VERSION}</div>
		</div>
	</Popup>
{/if}

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
		scrollbar-color: rgba(171, 234, 16, 0.35) transparent;
	}

	.title,
	h2 {
		margin: 0 0 0.6rem;
		text-align: center;
		font-family: var(--ms-display-font, 'Creepster', 'Inter', sans-serif);
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--modal-accent);
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 14px rgba(171, 234, 16, 0.3);
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
</style>
