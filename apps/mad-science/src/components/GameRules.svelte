<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import { i18nDerived } from '../i18n/i18nDerived';
	import { fill, formatNumber, formatOrList, formatPercent, formatTimes } from '../i18n/format';
	import config from '../game/config';
	import { GAME_VERSION } from '../game/constants';
	import { modeName } from '../game/modeNames';
	import {
		FREE_SPIN_COUNTS,
		MULTIPLIER_VALUES,
		OVERCHARGED_START_MULTIPLIERS,
		type RgsMode,
	} from '../game/rulesData';

	/**
	 * Game Rules, drawn in place of the SDK's ModalGameRules (whose body is the
	 * template's "ADD YOUR GAME RULES"). Text follows the Game Rules
	 * Specification; every figure comes from config.betModes or rulesData, so
	 * nothing here or in the locale files can drift from the math. RTP and max
	 * win are the only math figures shown: no probabilities, percentages,
	 * frequencies or odds tables (Evtim, 2026-10-24).
	 */

	// the logo the game already loads (assets.ts), so no second download
	const logoImg = new URL('../../assets/madscience/logo.webp', import.meta.url).href;

	const cost = (mode: RgsMode) => formatTimes(config.betModes[mode].cost);

	const bet = $derived(i18nDerived.betWord());

	const modes = $derived(
		(Object.keys(config.betModes) as RgsMode[]).map((mode) => ({
			name: modeName(mode) ?? mode,
			cost: cost(mode),
			rtp: formatPercent(config.betModes[mode].rtp, 2),
			maxWin: formatTimes(config.betModes[mode].max_win),
		})),
	);

	const multiplierValues = $derived(formatOrList(MULTIPLIER_VALUES.map(formatTimes)));

	// the values a bought round can produce, never how likely each one is
	const freeSpinCounts = $derived(formatOrList(FREE_SPIN_COUNTS.map(formatNumber)));
	const startMultipliers = $derived(formatOrList(OVERCHARGED_START_MULTIPLIERS.map(formatTimes)));

	const buyModes = $derived([
		{
			name: i18nDerived.modeOperation(),
			text: fill(i18nDerived.rulesOperation(), cost('lucky_draw_free_spins'), bet),
		},
		{
			name: i18nDerived.modeMutant(),
			text: fill(i18nDerived.rulesMutant(), cost('lucky_draw_feature_heavy'), bet),
		},
		{
			name: i18nDerived.modeOvercharged(),
			text: fill(
				i18nDerived.rulesOvercharged(),
				cost('super_lucky_draw_free_spins'),
				bet,
				startMultipliers,
			),
		},
	]);
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} closeAnchor="content" onclose={() => (stateModal.modal = null)}>
		<div class="panel">
			<img src={logoImg} alt="Mad Science" class="logo" />

			<section>
				<h2>{i18nDerived.rulesOverview()}</h2>
				<p>{i18nDerived.rulesOverviewText()}</p>
			</section>

			<section>
				<h2>{i18nDerived.rulesGameModes()}</h2>
				<p>{i18nDerived.rulesGameModesText()}</p>
				<table class="modes">
					<thead>
						<tr>
							<th scope="col">{i18nDerived.colMode()}</th>
							<th scope="col">{i18nDerived.colCost()}</th>
							<th scope="col">{i18nDerived.colRtp()}</th>
							<th scope="col">{i18nDerived.colMaxWin()}</th>
						</tr>
					</thead>
					<tbody>
						{#each modes as mode}
							<tr>
								<th scope="row">{mode.name}</th>
								<td>{mode.cost}</td>
								<td>{mode.rtp}</td>
								<td>{mode.maxWin}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>

			<section>
				<h2>{i18nDerived.rulesWinAnywhere()}</h2>
				<p>{i18nDerived.rulesWinAnywhereText()}</p>
			</section>

			<section>
				<h2>{i18nDerived.rulesTumbles()}</h2>
				<p>{i18nDerived.rulesTumblesText()}</p>
			</section>

			<section>
				<h2>{i18nDerived.rulesWild()}</h2>
				<p>{i18nDerived.rulesWildText()}</p>
			</section>

			<section>
				<h2>{i18nDerived.rulesScatter()}</h2>
				<p>{i18nDerived.rulesScatterText()}</p>
				<ul>
					<li>{i18nDerived.rulesScatter4()}</li>
					<li>{i18nDerived.rulesScatter5()}</li>
					<li>{i18nDerived.rulesScatter6()}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.rulesMultiplier()}</h2>
				<p>{i18nDerived.rulesMultiplierText()}</p>
				<ul>
					<li>{fill(i18nDerived.rulesMultValues(), multiplierValues)}</li>
					<li>{i18nDerived.rulesMultLanding()}</li>
					<li>{i18nDerived.rulesMultCollection()}</li>
					<li>{i18nDerived.rulesMultTotal()}</li>
					<li>{i18nDerived.rulesMultBase()}</li>
					<li>{i18nDerived.rulesMultFs()}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.rulesBomb()}</h2>
				<p>{i18nDerived.rulesBombText()}</p>
				<ul>
					<li>{i18nDerived.rulesBombLanding()}</li>
					<li>{i18nDerived.rulesBombWhen()}</li>
					<li>{i18nDerived.rulesBombClears()}</li>
					<li>{i18nDerived.rulesBombAfter()}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.rulesCloner()}</h2>
				<p>{i18nDerived.rulesClonerText()}</p>
				<ul>
					<li>{i18nDerived.rulesClonerWhen()}</li>
					<li>{i18nDerived.rulesClonerWhat()}</li>
					<li>{i18nDerived.rulesClonerNot()}</li>
					<li>{i18nDerived.rulesClonerAfter()}</li>
					<li>{i18nDerived.rulesClonerOne()}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.rulesOrderOfPlay()}</h2>
				<p>{i18nDerived.rulesOrderText()}</p>
				<ol>
					<li>{i18nDerived.rulesOrder1()}</li>
					<li>{i18nDerived.rulesOrder2()}</li>
					<li>{i18nDerived.rulesOrder3()}</li>
					<li>{i18nDerived.rulesOrder4()}</li>
					<li>{i18nDerived.rulesOrder5()}</li>
				</ol>
			</section>

			<section>
				<h2>{i18nDerived.rulesFreeSpins()}</h2>
				<p>{i18nDerived.rulesFreeSpinsText()}</p>
				<ul>
					<li>{i18nDerived.rulesFsPersistent()}</li>
					<li>{i18nDerived.rulesFsFeatures()}</li>
					<li>{i18nDerived.rulesFsRetrigger()}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.rulesSwitchModes()}</h2>
				<p>{fill(i18nDerived.rulesSwitchModesText(), bet)}</p>
				<ul>
					<li>{fill(i18nDerived.rulesChaos(), cost('ante_1'), bet)}</li>
					<li>{fill(i18nDerived.rulesBoost(), cost('ante_2'), bet)}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.rulesBuyModes()}</h2>
				<p>{fill(i18nDerived.rulesBuyModesText(), freeSpinCounts)}</p>
				{#each buyModes as buyMode}
					<h3>{buyMode.name}</h3>
					<p>{buyMode.text}</p>
				{/each}
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
					<li>{i18nDerived.uiFeature()}</li>
					<li>{fill(i18nDerived.uiPlusMinus(), bet)}</li>
					<li>{i18nDerived.uiMenu()}</li>
					<li>{i18nDerived.uiPaytable()}</li>
					<li>{i18nDerived.uiGameRules()}</li>
					<li>{i18nDerived.uiSound()}</li>
					<li>{i18nDerived.uiSettings()}</li>
				</ul>
			</section>

			<section class="disclaimer">
				<h2>{i18nDerived.rulesDisclaimer()}</h2>
				<p>{i18nDerived.rulesDisclaimerText()}</p>
				<p class="copyright">TM and &copy; 2026 Stake Engine.</p>
			</section>

			<div class="version">v{GAME_VERSION}</div>
		</div>
	</Popup>
{/if}

<style lang="scss">
	/* the shared modal theme (static/css/modal-theme.css): charcoal glass,
	   acid green accent, Creepster headings */
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
		scrollbar-color: rgba(171, 234, 16, 0.35) transparent;
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
		font-family: var(--ms-display-font, 'Creepster', 'Inter', sans-serif);
		font-size: 1.4rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--modal-accent);
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 14px rgba(171, 234, 16, 0.3);
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
</style>
