<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived, stateBet } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	const social = $derived(stateUrlDerived.social());
	const title = $derived(social ? 'WIN TABLE' : 'PAYTABLE');
	const bet = $derived(stateBet.betAmount);
	const formatWin = (multiplier: number) => numberToCurrencyString(multiplier * bet);

	const specialSymbols = [
		{
			img: '/assets/symbols/w.png',
			name: 'Wild',
			pays: { 5: 50, 4: 10, 3: 4 },
			description: 'Substitutes for all symbols except Bonus. During Free Spins, 1 to 10 Random Wilds are placed on the reels each spin.',
		},
		{
			img: '/assets/symbols/s.png',
			name: 'Bonus',
			description: '3 Bonus = 6 Free Spins\n4 Bonus = 12 Free Spins\n5 Bonus = 18 Free Spins',
		},
	];

	const symbols = [
		{ img: '/assets/symbols/h1.png', name: 'Shark', pays: { 5: 50, 4: 10, 3: 4 } },
		{ img: '/assets/symbols/h2.png', name: 'Sea Turtle', pays: { 5: 25, 4: 5, 3: 2.5 } },
		{ img: '/assets/symbols/h3.png', name: 'Pearl', pays: { 5: 12.5, 4: 3, 3: 2 } },
		{ img: '/assets/symbols/h4.png', name: 'Nautilus', pays: { 5: 7.5, 4: 2.5, 3: 1 } },
		{ img: '/assets/symbols/l1.png', name: 'A', pays: { 5: 5, 4: 2, 3: 0.6 } },
		{ img: '/assets/symbols/l2.png', name: 'K', pays: { 5: 5, 4: 2, 3: 0.6 } },
		{ img: '/assets/symbols/l3.png', name: 'Q', pays: { 5: 4, 4: 1, 3: 0.3 } },
		{ img: '/assets/symbols/l4.png', name: 'J', pays: { 5: 4, 4: 1, 3: 0.3 } },
	];

	const paylines = [
		[1, 1, 1, 1, 1],
		[0, 0, 0, 0, 0],
		[2, 2, 2, 2, 2],
		[0, 1, 2, 1, 0],
		[2, 1, 0, 1, 2],
		[1, 0, 0, 0, 1],
		[1, 2, 2, 2, 1],
		[0, 0, 1, 2, 2],
		[2, 2, 1, 0, 0],
		[1, 2, 1, 0, 1],
		[1, 0, 1, 2, 1],
		[0, 1, 1, 1, 0],
		[2, 1, 1, 1, 2],
		[0, 1, 0, 1, 0],
		[2, 1, 2, 1, 2],
		[1, 1, 0, 1, 1],
		[1, 1, 2, 1, 1],
		[0, 0, 2, 0, 0],
		[2, 2, 0, 2, 2],
		[0, 2, 2, 2, 0],
	];

</script>

{#if stateModal.modal?.name === 'payTable'}
	<Popup zIndex={zIndex.modal + 1} onclose={() => (stateModal.modal = null)}>
		<div class="paytable">
			<h1 class="modal-title">{title}</h1>

			<section class="special-symbols">
				<h2>Special Symbols</h2>
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
				<h2>Symbol {social ? 'Wins' : 'Payouts'}</h2>

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
				<h2>{social ? 'Win' : 'Pay'} Lines</h2>
				<p>20 fixed {social ? 'win' : 'pay'}lines, left to right. Only symbols on adjacent reels starting from the leftmost reel count. This does not apply to Bonus symbols.</p>
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

	/* Special symbols — 2 cards side by side */
	.special-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
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
