<script lang="ts">
	import { i18nDerived } from '../i18n/i18nDerived';
	import { fill } from '../i18n/format';
	import { GAME_VERSION } from '../game/constants';

	/**
	 * The game rules, the second half of the generic UI's info page (GenericInfo; the
	 * paytable comes first). A PLACEHOLDER until the math exists (2026-11-24): the
	 * overview is Evtim's brief in plain English, untranslated, with no figures. The
	 * general rules, the UI guide and the disclaimer are the texts Chaos Lab and Blast
	 * Drop were approved with, in all 17 languages.
	 *
	 * When the rules are written: RTP and max win per mode are the ONLY math figures a
	 * player-facing text may show: no probabilities, percentages, frequencies or odds
	 * tables (Evtim, 2026-10-24); every obtainable value of a feature is listed, never
	 * how likely it is; figures come from config, never typed into a translation.
	 */
	const bet = $derived(i18nDerived.betWord());

	// English only, not in the catalogs: this text is rewritten from the math's spec
	const OVERVIEW = [
		'3 Pots Heist is a 6-reel, 4-row slot that pays for ways: matching symbols on adjacent reels, starting from the leftmost reel.',
		'Coins carry a value. A Collect symbol awards the sum of the values of all Coins in view.',
		'The cash, gem and gold symbols fill their loot bags above the reels. A bag can open Free Spins with its own feature: two more rows, a roaming Collect Wild, or a multiplier that grows with every collect. More than one bag can open at the same time.',
	];
</script>

<div class="panel embedded">
	<section>
		<h2>{i18nDerived.rulesOverview()}</h2>
		{#each OVERVIEW as paragraph}
			<p>{paragraph}</p>
		{/each}
		<p class="draft">Draft: the full rules, the RTP and the maximum win follow the game's math.</p>
	</section>

	<section>
		<h2>{i18nDerived.rulesGeneral()}</h2>
		<ul>
			<li>{i18nDerived.rulesGeneral1()}</li>
			<li>{i18nDerived.rulesGeneral2()}</li>
			<li>{i18nDerived.rulesGeneral3()}</li>
		</ul>
	</section>

	<section>
		<h2>{i18nDerived.rulesUiGuide()}</h2>
		<ul>
			<li>{fill(i18nDerived.uiSpin(), bet)}</li>
			<li>{i18nDerived.uiStop()}</li>
			<li>{i18nDerived.uiAutoplay()}</li>
			<li>{i18nDerived.uiTurbo()}</li>
			<li>{fill(i18nDerived.uiPlusMinus(), bet)}</li>
			<li>{i18nDerived.uiMenu()}</li>
			<!-- the generic UI has one info page (this one) and no settings popup -->
			<li>{i18nDerived.uiGameRules()}</li>
			<li>{i18nDerived.uiSound()}</li>
		</ul>
	</section>

	<section class="disclaimer">
		<h2>{i18nDerived.rulesDisclaimer()}</h2>
		<p>{i18nDerived.rulesDisclaimerText()}</p>
		<!-- "Engine", not "Stake Engine": Stake review 2026-10-29 (their docs
		     template still says Stake Engine) -->
		<p class="copyright">TM and &copy; 2026 Engine.</p>
	</section>

	<div class="version">v{GAME_VERSION}</div>
</div>

<style lang="scss">
	/* the shared modal theme (static/css/modal-theme.css): charcoal glass,
	   acid green accent, Alfa Slab One headings */
	.panel {
		/* above the Popup's click-to-close layer (z 2), under its X (z 101) */
		position: relative;
		z-index: 100;
		box-sizing: border-box;
		width: min(640px, 92vw);
		/* dvh = the visible height (iOS vh includes the area behind the browser bars) */
		max-height: 86vh;
		max-height: 86dvh;
		overflow-y: auto;
		padding: 2rem 1.6rem 1rem;
		background: var(--modal-panel-bg);
		border: var(--modal-panel-border);
		border-radius: var(--modal-panel-radius);
		box-shadow: var(--modal-panel-shadow);
		color: var(--modal-text);
		font-family: 'Inter', sans-serif;
		scrollbar-width: thin;
		scrollbar-color: rgba(242, 181, 58, 0.35) transparent;
	}

	.logo {
		display: block;
		width: min(220px, 55%);
		height: auto;
		margin: 0 auto 1.4rem;
	}

	section {
		margin-bottom: 1.5rem;
	}

	h2 {
		margin: 0 0 0.5rem;
		text-align: center;
		font-family: var(--ms-display-font, 'Alfa Slab One', 'Inter', sans-serif);
		font-size: 1.4rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--modal-accent);
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 14px rgba(242, 181, 58, 0.3);
	}

	h3 {
		margin: 1rem 0 0.3rem;
		text-align: center;
		font-size: 1rem;
		font-weight: 700;
		color: var(--modal-accent);
	}

	p,
	li {
		font-size: 0.95rem;
		line-height: 1.55;
		color: rgba(242, 246, 234, 0.82);
	}

	p {
		margin: 0 0 0.5rem;
	}

	ul,
	ol {
		margin: 0 0 0.5rem;
		padding: 0;
	}

	ul {
		list-style: none;

		li {
			position: relative;
			padding-left: 1.2rem;

			&::before {
				content: '•';
				position: absolute;
				left: 0.2rem;
				color: var(--modal-accent);
			}
		}
	}

	ol {
		padding-left: 1.6rem;

		li::marker {
			color: var(--modal-accent);
			font-weight: 700;
		}
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		padding: 0.4rem 0.5rem;
		border-bottom: 1px solid var(--modal-border);
		text-align: right;
		color: rgba(242, 246, 234, 0.88);
	}

	thead th {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--modal-accent);
	}

	/* figures stay on one line. Headers and mode names wrap, and hyphenate (the
	   html lang is the player's language) or break mid-word as a last resort:
	   Finnish, Russian and Indonesian ran the table wider than a phone panel */
	td {
		white-space: nowrap;
	}

	th {
		hyphens: auto;
		overflow-wrap: anywhere;
	}

	th:first-child,
	td:first-child {
		text-align: left;
	}

	tbody th {
		font-weight: 700;
	}

	.modes {
		margin-top: 0.75rem;
	}

	.disclaimer {
		padding-top: 1rem;
		border-top: 1px solid var(--modal-border);

		p {
			font-size: 0.85rem;
			line-height: 1.5;
			color: rgba(242, 246, 234, 0.55);
		}
	}

	.copyright {
		text-align: center;
	}

	.version {
		text-align: center;
		font-size: 0.7rem;
		color: rgba(242, 246, 234, 0.35);
	}

	@media screen and (max-width: 500px) {
		.panel {
			width: 94vw;
			padding: 1.6rem 1rem 0.8rem;
		}

		h2 {
			font-size: 1.2rem;
		}

		p,
		li {
			font-size: 0.85rem;
		}

		table {
			font-size: 0.75rem;
		}

		th,
		td {
			padding: 0.35rem 0.3rem;
		}
	}

	/* landscape phones: use the height */
	@media screen and (max-height: 500px) {
		.panel {
			/* the whole visible height minus the popup's 1rem padding */
			max-height: calc(100vh - 2rem);
			max-height: calc(100dvh - 2rem);
			padding-top: 1.2rem;
		}

		/* a third of the visible height at 160px; the rules matter more here */
		.logo {
			width: min(120px, 30%);
			margin-bottom: 0.6rem;
		}
	}

	/* inside the generic info page: content only, in the page's plain voice */
	.panel.embedded {
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
	}

	.draft {
		font-style: italic;
		opacity: 0.7;
	}
</style>
