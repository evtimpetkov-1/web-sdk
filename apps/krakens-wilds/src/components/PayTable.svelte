<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived, stateBet } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { i18nDerived } from '../i18n/i18nDerived';
	import config from '../game/config';
	import { COIN_MULTIPLIERS } from '../game/constants';

	const imgW = new URL('../../assets/paytable/w.webp', import.meta.url).href;
	const imgS = new URL('../../assets/paytable/s.webp', import.meta.url).href;
	const imgH1 = new URL('../../assets/paytable/h1.webp', import.meta.url).href;
	const imgH2 = new URL('../../assets/paytable/h2.webp', import.meta.url).href;
	const imgH3 = new URL('../../assets/paytable/h3.webp', import.meta.url).href;
	const imgH4 = new URL('../../assets/paytable/h4.webp', import.meta.url).href;
	const imgL1 = new URL('../../assets/paytable/l1.webp', import.meta.url).href;
	const imgL2 = new URL('../../assets/paytable/l2.webp', import.meta.url).href;
	const imgL3 = new URL('../../assets/paytable/l3.webp', import.meta.url).href;
	const imgL4 = new URL('../../assets/paytable/l4.webp', import.meta.url).href;
	const imgC = new URL('../../assets/paytable/c.webp', import.meta.url).href;

	const social = $derived(stateUrlDerived.social());
	const title = $derived(social ? i18nDerived.symbolWins() : i18nDerived.payLinesHeader());
	// quoted off the one list of coin values, never retyped in prose
	const coinValues = COIN_MULTIPLIERS.map((m) => `${m}x`);
	const coinList = `${coinValues.slice(0, -1).join(', ')} or ${coinValues[coinValues.length - 1]}`;
	const bet = $derived(stateBet.betAmount);
	// social mode must not say "bet" — same swap the rules page does
	const betLabel = $derived(social ? i18nDerived.playWord() : i18nDerived.betWord());
	const formatWin = (multiplier: number) => numberToCurrencyString(multiplier * bet);

	/**
	 * Payouts come straight from `config.symbols`, which is the same table the math
	 * is built from. They used to be typed out again here, and the two drifted: this
	 * page was still showing the pre-v2 values (L1 5-OAK at 5x when the game pays 4x)
	 * long after the math had moved on. Never hardcode a payout in this file.
	 */
	const paysOf = (symbolName: keyof typeof config.symbols) => {
		const entries = (config.symbols[symbolName] as { paytable?: Record<string, number>[] })
			.paytable;
		return Object.fromEntries(
			(entries ?? []).flatMap((entry) => Object.entries(entry)),
		) as Record<string, number>;
	};

	const specialSymbols = $derived([
		{
			img: imgW,
			name: i18nDerived.wild(),
			pays: paysOf('W'),
			description: i18nDerived.wildDesc(),
		},
		{
			img: imgC,
			name: i18nDerived.coin(),
			description: i18nDerived
				.coinDesc()
				.replace('__0__', coinList)
				.replace('__1__', betLabel),
		},
		{
			img: imgS,
			name: i18nDerived.bonus(),
			description: i18nDerived.bonusDesc(),
		},
	]);

	const symbols = $derived([
		{ img: imgH1, name: i18nDerived.trident(), pays: paysOf('H1') },
		{ img: imgH2, name: i18nDerived.ship(), pays: paysOf('H2') },
		{ img: imgH3, name: i18nDerived.anchor(), pays: paysOf('H3') },
		{ img: imgH4, name: i18nDerived.bottle(), pays: paysOf('H4') },
		{ img: imgL1, name: 'A', pays: paysOf('L1') },
		{ img: imgL2, name: 'K', pays: paysOf('L2') },
		{ img: imgL3, name: 'Q', pays: paysOf('L3') },
		{ img: imgL4, name: 'J', pays: paysOf('L4') },
	]);

	// Same story as the payouts: the 20 lines live in config, not twice.
	const paylines = Object.values(config.paylines);

</script>

{#if stateModal.modal?.name === 'payTable'}
	<Popup zIndex={zIndex.modal + 1} onclose={() => (stateModal.modal = null)}>
		<div class="paytable">
			<h1 class="modal-title">{social ? i18nDerived.symbolWins() : i18nDerived.symbolPayouts()}</h1>

			<section class="special-symbols">
				<h2>{i18nDerived.specialSymbols()}</h2>
				<div class="special-grid">
					{#each specialSymbols as symbol}
						<div class="special-card">
							<img src={symbol.img} alt={symbol.name} class="special-img" />
							<span class="symbol-name">{symbol.name}</span>
							{#if symbol.pays}
								<div class="pays-row">
									{#each Object.entries(symbol.pays) as [count, value]}
										<span class="pay-entry">
											<span class="pay-count">{count}x</span>
											<span class="pay-value">{formatWin(value)}</span>
										</span>
									{/each}
								</div>
							{/if}
							<p class="symbol-desc">{symbol.description}</p>
						</div>
					{/each}
				</div>
			</section>

			<section class="symbol-payouts">
				<h2>{social ? i18nDerived.symbolWins() : i18nDerived.symbolPayouts()}</h2>

				<div class="symbols-grid">
					{#each symbols as symbol}
						<div class="symbol-card">
							<img src={symbol.img} alt={symbol.name} class="symbol-img" />
							<div class="pays-row">
								{#each Object.entries(symbol.pays) as [count, value]}
									<span class="pay-entry">
										<span class="pay-count">{count}x</span>
										<span class="pay-value">{formatWin(value)}</span>
									</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="paylines-section">
				<h2>{social ? i18nDerived.winLinesHeader() : i18nDerived.payLinesHeader()}</h2>
				<p>{social ? i18nDerived.winlinesDesc() : i18nDerived.paylinesDesc()}</p>
				<div class="paylines-grid">
					{#each paylines as line, i}
						<div class="payline">
							<span class="payline-num">{i + 1}</span>
							<div class="payline-visual">
								{#each line as row}
									<div class="payline-col">
										{#each [0, 1, 2] as r}
											<div class="payline-cell" class:active={r === row}></div>
										{/each}
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</section>

			<div class="version-wrap">
				v1.0.0
			</div>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.paytable {
		max-width: 700px;
		width: 90vw;
		max-height: 85vh;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 2rem 1.5rem;
		color: #e0e0e0;
		font-family: 'Inter', sans-serif;
		z-index: 100;
		box-sizing: border-box;

		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}

	.modal-title {
		text-align: center;
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 0.1em;
		margin: 0 0 1.5rem;
	}

	section {
		margin-bottom: 2rem;
	}

	h2 {
		text-align: center;
		font-family: 'Cinzel', serif;
		font-size: 1.4rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 0.08em;
		margin: 0 0 0.75rem;
		text-transform: uppercase;
	}

	/* Special symbols — Wild, Coin, Bonus */
	.special-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.special-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 0.75rem 0.5rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 8px;
		border: 1px solid rgba(255, 215, 0, 0.15);
		gap: 0.4rem;
		overflow: hidden;
		min-width: 0;
	}

	.special-img {
		width: 110px;
		height: 110px;
		object-fit: contain;
		filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.3));
	}

	/* Regular symbols — 3 per row grid */
	.symbols-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.symbol-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 0.6rem 0.3rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		gap: 0.25rem;
		overflow: hidden;
		min-width: 0;
	}

	.symbol-img {
		width: 100px;
		height: 100px;
		object-fit: contain;
		filter: drop-shadow(0 0 6px rgba(0, 150, 255, 0.3));
	}

	.pays-row {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		width: 100%;
	}

	.pay-entry {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: baseline;
		gap: 0.4rem;
	}

	.pay-count {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.8rem;
	}

	.pay-value {
		color: #ffd700;
		font-weight: 700;
		font-size: 0.85rem;
	}

	.symbol-desc {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.6);
		white-space: pre-line;
		line-height: 1.4;
	}

	/* Paylines */
	.paylines-section p {
		text-align: center;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0 0 1rem;
	}

	.paylines-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.payline {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 6px;
	}

	.payline-num {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		width: 1.2rem;
		text-align: right;
		flex-shrink: 0;
	}

	.payline-visual {
		display: flex;
		gap: 1px;
		flex: 1;
	}

	.payline-col {
		display: flex;
		flex-direction: column;
		gap: 1px;
		flex: 1;
	}

	.payline-cell {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.06);

		&.active {
			background: #ffd700;
		}
	}

	.version-wrap {
		text-align: center;
		padding-top: 1rem;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.3);
	}

	@media screen and (max-width: 500px) {
		.paytable {
			padding: 1rem 0.5rem;
			width: 95vw;
		}

		.modal-title {
			font-size: 1.4rem;
		}

		h2 {
			font-size: 1.1rem;
		}

		.special-grid {
			grid-template-columns: 1fr;
		}

		.symbols-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.symbol-img {
			width: 70px;
			height: 70px;
		}

		.special-img {
			width: 90px;
			height: 90px;
		}

		.symbol-desc {
			font-size: 0.75rem;
		}

		.pay-count {
			font-size: 0.7rem;
		}

		.pay-value {
			font-size: 0.75rem;
		}

		.paylines-grid {
			grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
		}

		section {
			margin-bottom: 1.2rem;
		}
	}

	/* Landscape mobile */
	@media screen and (max-height: 500px) {
		.paytable {
			max-height: 90vh;
			padding: 0.5rem;
		}

		.symbols-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.symbol-img {
			width: 60px;
			height: 60px;
		}

		.special-img {
			width: 70px;
			height: 70px;
		}

		.modal-title {
			font-size: 1.2rem;
			margin-bottom: 0.4rem;
		}

		h2 {
			font-size: 0.9rem;
			margin-bottom: 0.3rem;
		}

		section {
			margin-bottom: 0.75rem;
		}

		.symbol-desc {
			font-size: 0.7rem;
		}

		.pay-count {
			font-size: 0.7rem;
		}

		.pay-value {
			font-size: 0.75rem;
		}

	}
</style>
