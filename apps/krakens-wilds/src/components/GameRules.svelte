<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived } from 'state-shared';

	const social = $derived(stateUrlDerived.social());
	const betLabel = $derived(social ? 'play' : 'bet');
	const payoutLabel = $derived(social ? 'win' : 'payout');
	const lineLabel = $derived(social ? 'winline' : 'payline');
	const linesLabel = $derived(social ? 'winlines' : 'paylines');
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal + 1} onclose={() => (stateModal.modal = null)}>
		<div class="game-rules">
			<img src="/assets/sprites/logo.png" alt="Kraken's Wilds" class="logo" />

			<section>
				<h2>Game Overview</h2>
				<p>
					Kraken's Wilds is a 5-reel, 3-row video slot with 20 fixed {linesLabel}.
					Wins are evaluated from left to right on each {lineLabel}, starting from the leftmost reel.
					Only symbols on adjacent reels count. The highest win per {lineLabel} is {social ? 'awarded' : 'paid'}.
				</p>
			</section>

			<section>
				<h2>{social ? 'Play' : 'Bet'} Mode</h2>
				<ul>
					<li>Base game: RTP 96.50%. Maximum win: 5,000x total {betLabel}.</li>
					<li>All {payoutLabel} values are shown as multipliers of the total {betLabel} amount.</li>
				</ul>
			</section>

			<section>
				<h2>Wild Symbol</h2>
				<p>
					The Wild (Kraken) substitutes for all symbols except the Bonus symbol.
					Wild has its own {payoutLabel} values.
				</p>
			</section>

			<section>
				<h2>Bonus &amp; Free Spins</h2>
				<ul>
					<li>3 Bonus symbols anywhere on the reels award <strong>6 Free Spins</strong>.</li>
					<li>4 Bonus symbols award <strong>12 Free Spins</strong>.</li>
					<li>5 Bonus symbols award <strong>18 Free Spins</strong>.</li>
				</ul>
				<p>
					During Free Spins, 1 to 10 Random Wilds are placed on the reels at the start of each spin.
					Every Bonus symbol that lands during Free Spins awards +1 additional Free Spin.
					There is no limit on retriggers.
				</p>
			</section>

			<section>
				<h2>General Rules</h2>
				<ul>
					<li>Only the highest win per {lineLabel} is {social ? 'awarded' : 'paid'}.</li>
					<li>Simultaneous wins on different {linesLabel} are added together.</li>
					<li>{lineLabel.charAt(0).toUpperCase() + lineLabel.slice(1)} wins and Bonus wins are added together.</li>
					<li>Bonus symbols {social ? 'win' : 'pay'} in any position (not limited to {linesLabel}).</li>
				</ul>
			</section>

			<section>
				<h2>User Interface Guide</h2>
				<ul>
					<li><strong>Spin</strong> — Start a spin at the current {betLabel} amount.</li>
					<li><strong>Stop</strong> — Stop the reels early during a spin.</li>
					<li><strong>Auto Spin</strong> — Automatically spin a set number of times.</li>
					<li><strong>Turbo</strong> — Speed up reel animations.</li>
					<li><strong>+/−</strong> — Increase or decrease the {betLabel} amount.</li>
					<li><strong>Menu (☰)</strong> — Open the settings menu.</li>
					<li><strong>{social ? 'Win Table' : 'Pay Table'}</strong> — View symbol {payoutLabel} values and {linesLabel}.</li>
					<li><strong>Game Rules</strong> — View the game rules and disclaimer.</li>
					<li><strong>Sound</strong> — Toggle game sounds on or off.</li>
					<li><strong>Settings</strong> — Adjust game settings.</li>
				</ul>
			</section>

			<section class="disclaimer">
				<h2>Disclaimer</h2>
				<p>
					Malfunction voids all wins and plays. A consistent internet connection is required.
					In the event of a disconnection, reload the game to finish any uncompleted rounds.
					The expected return is calculated over many plays.
					The game display is not representative of any physical device and is for illustrative purposes only.
					Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser.
				</p>
				<p class="copyright">
					TM and &copy; 2025 Stake Engine. Developed by Royal Cat Gaming.
				</p>
			</section>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.game-rules {
		max-width: 600px;
		width: 90vw;
		max-height: 85vh;
		overflow-y: auto;
		padding: 2rem 1.5rem;
		color: #e0e0e0;
		font-family: 'Inter', sans-serif;
		z-index: 100;

		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}

	.logo {
		display: block;
		margin: 0 auto 1.5rem;
		max-width: 200px;
		height: auto;
	}

	section {
		margin-bottom: 1.5rem;
	}

	h2 {
		text-align: center;
		font-family: 'Cinzel', serif;
		font-size: 1.2rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 0.5rem;
	}

	p {
		font-size: 1rem;
		line-height: 1.6;
		margin: 0 0 0.5rem;
		color: rgba(255, 255, 255, 0.8);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
		padding-left: 1.2rem;
		position: relative;

		&::before {
			content: '•';
			position: absolute;
			left: 0;
			color: #ffd700;
		}
	}

	.disclaimer {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 1rem;

		p {
			font-size: 0.85rem;
			color: rgba(255, 255, 255, 0.5);
			line-height: 1.5;
		}
	}

	.copyright {
		text-align: center;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.3);
		margin-top: 0.75rem;
	}

	@media screen and (max-width: 500px) {
		.game-rules {
			padding: 1.5rem 1rem;
		}

		.logo {
			max-width: 150px;
		}
	}
</style>
