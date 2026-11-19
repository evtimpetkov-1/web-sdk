<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateModal } from 'state-shared';
	import { numberToWinCurrencyString } from 'utils-shared/amount';

	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder, fill, formatNumber, formatOrList, formatTimes } from '../i18n/format';
	import config from '../game/config';
	import { GAME_VERSION } from '../game/constants';
	import {
		CASH_BOMB_VALUES,
		CASH_CLONER_COINS,
		CASH_COIN_VALUES,
		CASH_FRAME_MAX,
		CASH_MULTIPLIER_VALUES,
		CASH_OVERCHARGED_BOMB_MAX,
		CASH_START_FRAMES,
		MULTIPLIER_VALUES,
	} from '../game/rulesData';
	import { fitColumns } from './fitColumns';

	/**
	 * Paytable, drawn in place of the SDK's ModalPayTable. Images are the game's
	 * own symbols, cut from the shipped sheet by
	 * art-review/madscience/paytable/cut_paytable.py.
	 * Layout (2026-11-17, the reviewers: "The Game Info could be more polished. Too
	 * much unused space."): it was one 680 px column on any screen, 1,900 px of
	 * scrolling with half a desktop empty beside it. Now the panel takes the width
	 * it is given, the payouts come first (four high symbols large, five low ones in
	 * a row), and on a wide screen the two feature groups stand side by side. Texts
	 * and their translations are unchanged.
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
		// Cash Respins (Chaos Lab 2): art-review/chaoslab2/respins/make_paytable_art.py
		coin: new URL('../../assets/chaoslab2/paytable/coin.webp', import.meta.url).href,
		cashMult: new URL('../../assets/chaoslab2/paytable/cash_mult.webp', import.meta.url).href,
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
		{
			img: IMG.bonus,
			name: i18nDerived.rulesScatter(),
			text: fill(
				i18nDerived.ptScatter(),
				formatNumber(CASH_START_FRAMES.five),
				formatNumber(CASH_START_FRAMES.sixOrMore),
			),
		},
		{
			img: IMG.mult,
			name: i18nDerived.rulesMultiplier(),
			text: fill(i18nDerived.ptMultiplier(), formatOrList(MULTIPLIER_VALUES.map(formatTimes))),
		},
		{ img: IMG.bomb, name: i18nDerived.rulesBomb(), text: i18nDerived.ptBomb() },
		{ img: IMG.cloner, name: i18nDerived.rulesCloner(), text: i18nDerived.ptCloner() },
	]);

	// the four high symbols get the bigger cards
	const highs = $derived(symbols.slice(0, 4));
	const lows = $derived(symbols.slice(4));

	// Cash Respins' own symbols: the values each can have, never how likely each one is
	const list = (values: number[]) => formatOrList(values.map(formatTimes));
	const cashSymbols = $derived([
		{
			img: IMG.coin,
			name: i18nDerived.ptCoinName(),
			text: fill(i18nDerived.ptCoin(), list(CASH_COIN_VALUES), i18nDerived.betWord()),
		},
		{
			img: IMG.cashMult,
			name: i18nDerived.rulesMultiplier(),
			text: fill(i18nDerived.ptCashMultiplier(), list(CASH_MULTIPLIER_VALUES), formatTimes(CASH_FRAME_MAX)),
		},
		{
			img: IMG.cloner,
			name: i18nDerived.rulesCloner(),
			text: fill(
				i18nDerived.ptCashCloner(),
				formatNumber(CASH_CLONER_COINS.min),
				formatNumber(CASH_CLONER_COINS.max),
			),
		},
		{
			img: IMG.bomb,
			name: i18nDerived.rulesBomb(),
			text: fill(i18nDerived.ptCashBomb(), list(CASH_BOMB_VALUES), formatTimes(CASH_OVERCHARGED_BOMB_MAX)),
		},
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
		<!-- dir="auto": the text's own direction (Arabic mirrors the cards) -->
		<div class="panel" dir="auto">
			<h1 class="title">{i18nDerived.ptTitle()}</h1>
			<p class="intro">{fill(i18nDerived.ptIntro(), i18nDerived.betWord())}</p>

			<section>
				<h2>{i18nDerived.ptSymbolPayouts()}</h2>
				{#each [{ kind: 'high', cards: highs }, { kind: 'low', cards: lows }] as group (group.kind)}
					<div class="symbols {group.kind}" use:fitColumns={shownValues}>
						{#each group.cards as symbol}
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
				{/each}
			</section>

			<div class="features">
				{#each [{ title: i18nDerived.ptSpecialSymbols(), cards: specials }, { title: i18nDerived.ptCashSymbols(), cards: cashSymbols }] as group (group.title)}
					<section>
						<h2>{group.title}</h2>
						<div class="specials">
							{#each group.cards as special}
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
				{/each}
			</div>

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
		/* as wide as the screen allows: a desktop no longer shows a narrow column */
		width: min(1100px, 94vw);
		/* dvh = the visible height (iOS vh includes the area behind the browser bars) */
		max-height: 88vh;
		max-height: 88dvh;
		overflow-y: auto;
		/* the scrollbar's room is always kept: a card grid that re-fits its columns
		   changes the height, and a scrollbar coming and going would change the width
		   under it (fitColumns would chase its own tail) */
		scrollbar-gutter: stable;
		padding: 1.4rem 1.6rem 1rem;
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
		margin-bottom: 0.3rem;
		font-size: 2rem;
	}

	/* a section title between two fading rules */
	h2 {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		font-size: 1.4rem;

		&::before,
		&::after {
			content: '';
			flex: 1;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(171, 234, 16, 0.55));
		}

		&::after {
			transform: scaleX(-1);
		}
	}

	.intro {
		margin: 0 0 1.1rem;
		text-align: center;
		font-size: 0.9rem;
		color: rgba(242, 246, 234, 0.7);
	}

	section {
		margin-bottom: 1.4rem;
	}

	/* paying symbols: the four high ones, then the five low ones. Cards are a wrapping
	   row, so a short last row sits centred; fitColumns lowers --cols (and sets
	   data-cols) where the values do not fit a card (a long currency at a high bet) */
	.symbols {
		--cols-max: 4;
		--gap: 0.6rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--gap);

		&.low {
			--cols-max: 5;
			margin-top: var(--gap);
		}
	}

	.symbol {
		/* (the half pixel keeps rounding from wrapping the last card of a row) */
		flex: 0 0 calc((100% - (var(--cols, var(--cols-max)) - 1) * var(--gap)) / var(--cols, var(--cols-max)) - 0.5px);
		min-width: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.7rem 0.4rem;
		border-radius: 12px;
		background: var(--modal-bg);
		border: 1px solid var(--modal-border);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);

		img {
			width: 88px;
			height: 88px;
			object-fit: contain;
			filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.55));
		}
	}

	.high .symbol {
		border-color: rgba(171, 234, 16, 0.5);
		background: linear-gradient(180deg, rgba(64, 84, 40, 0.5), rgba(40, 50, 36, 0.45));

		img {
			width: 112px;
			height: 112px;
		}
	}

	/* one column: the art beside its pays */
	.symbols[data-cols='1'] .symbol {
		flex-direction: row;
		gap: 1rem;
	}

	.pays {
		display: grid;
		grid-template-columns: auto auto;
		gap: 0.15rem 0.6rem;
		align-items: baseline;
		font-variant-numeric: tabular-nums;
	}

	.count {
		text-align: end;
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

	.high .value {
		font-size: 1rem;
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
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);

		img {
			flex: none;
			width: 84px;
			height: 84px;
			object-fit: contain;
			filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.55));
		}

		.name {
			font-family: var(--ms-display-font, 'Creepster', 'Inter', sans-serif);
			font-size: 1.15rem;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--modal-accent);
		}

		p {
			margin: 0.15rem 0 0;
			font-size: 0.9rem;
			line-height: 1.45;
			white-space: pre-line;
			color: rgba(242, 246, 234, 0.82);
		}
	}

	.version {
		text-align: center;
		font-size: 0.7rem;
		color: rgba(242, 246, 234, 0.35);
	}

	/* a desktop: the high symbols' art beside their pays */
	@media screen and (min-width: 900px) {
		.high .symbol {
			flex-direction: row;
			gap: 0.9rem;
			padding: 0.8rem 0.6rem;
		}
	}

	/* a wide screen (a desktop, a tablet, the Popout L window): the two feature groups
	   side by side, their cards stretched to fill the taller group's height */
	@media screen and (min-width: 700px) {
		.features {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 0 1.2rem;

			section {
				display: flex;
				flex-direction: column;
			}

			.specials {
				flex: 1;
			}

			.special {
				flex: 1;
			}
		}
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

		/* a phone: the high symbols two by two, the low ones three and two */
		.symbols {
			--cols-max: 2;

			&.low {
				--cols-max: 3;
			}
		}

		.special {
			gap: 0.7rem;
			padding: 0.5rem 0.6rem;

			img {
				width: 64px;
				height: 64px;
			}

			.name {
				font-size: 1rem;
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

		.high .symbol img {
			width: 84px;
			height: 84px;
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

		.high .value {
			font-size: 0.85rem;
		}
	}

	/* landscape phones: use the height, smaller art */
	@media screen and (max-height: 500px) {
		.panel {
			/* the whole visible height minus the popup's 1rem padding */
			max-height: calc(100vh - 2rem);
			max-height: calc(100dvh - 2rem);
			padding-top: 1rem;
		}

		/* wide and short: four and five across again, whatever the width says above */
		.symbols {
			--cols-max: 4;

			&.low {
				--cols-max: 5;
			}
		}

		.symbol img,
		.special img {
			width: 60px;
			height: 60px;
		}

		.high .symbol img {
			width: 72px;
			height: 72px;
		}
	}

	/* Stake's Popout S (400 x 225): the art a size down, so a row of cards fits the window */
	@media screen and (max-height: 300px) {
		.symbol img,
		.special img {
			width: 40px;
			height: 40px;
		}

		.high .symbol img {
			width: 48px;
			height: 48px;
		}

		.symbol {
			padding: 0.4rem 0.2rem;
		}
	}
</style>
