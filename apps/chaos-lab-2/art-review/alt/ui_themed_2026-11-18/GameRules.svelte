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
		CASH_BOMB_VALUES,
		CASH_CLONER_COINS,
		CASH_COIN_VALUES,
		CASH_FRAME_MAX,
		CASH_MULTIPLIER_VALUES,
		CASH_MUTANT_START_FRAMES,
		CASH_OVERCHARGED_BOMB_MAX,
		CASH_OVERCHARGED_FRAME_VALUES,
		CASH_POSITIONS,
		CASH_RESPINS,
		CASH_START_FRAMES,
		CASH_START_FRAME_VALUES,
		MULTIPLIER_VALUES,
		type RgsMode,
	} from '../game/rulesData';

	/**
	 * Game Rules, drawn in place of the SDK's ModalGameRules (whose body is the
	 * template's "ADD YOUR GAME RULES"). Text follows the Game Rules
	 * Specification; every figure comes from config.betModes or rulesData, so
	 * nothing here or in the locale files can drift from the math. RTP and max
	 * win are the only math figures shown: no probabilities, percentages,
	 * frequencies or odds tables (Evtim, 2026-10-24).
	 * Layout (2026-11-17, the reviewers: "The Game Info could be more polished. Too
	 * much unused space."): it was one 640 px column of text, 4,800 px of scrolling
	 * on a desktop with the rest of the screen empty. Now the panel takes the width
	 * it is given and every section is a card: two cards a row on a wide screen, one
	 * on a phone, each feature with its symbol beside the title, the buy modes and
	 * the switch modes with their shop art. The texts and their translations are
	 * unchanged, and so is their order.
	 */

	// the logo the game already loads (assets.ts), so no second download
	const logoImg = new URL('../../assets/chaoslab2/logo.webp', import.meta.url).href;
	// the paytable's symbol pictures and the shop's art, beside the sections about them
	// (URL-relative string literals, like assets.ts)
	const ICON = {
		h1: new URL('../../assets/madscience/paytable/h1.webp', import.meta.url).href,
		h2: new URL('../../assets/madscience/paytable/h2.webp', import.meta.url).href,
		wild: new URL('../../assets/madscience/paytable/wild.webp', import.meta.url).href,
		bonus: new URL('../../assets/madscience/paytable/bonus.webp', import.meta.url).href,
		mult: new URL('../../assets/madscience/paytable/mult.webp', import.meta.url).href,
		bomb: new URL('../../assets/madscience/paytable/bomb.webp', import.meta.url).href,
		cloner: new URL('../../assets/madscience/paytable/cloner.webp', import.meta.url).href,
		coin: new URL('../../assets/chaoslab2/paytable/coin.webp', import.meta.url).href,
		chaos: new URL('../../assets/madscience/buy/chaos.webp', import.meta.url).href,
		boost: new URL('../../assets/madscience/buy/boost.webp', import.meta.url).href,
		operation: new URL('../../assets/chaoslab2/buy/operation.webp', import.meta.url).href,
		mutant: new URL('../../assets/chaoslab2/buy/mutant.webp', import.meta.url).href,
		overcharged: new URL('../../assets/chaoslab2/buy/overcharged.webp', import.meta.url).href,
	};

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

	// Cash Respins: the values each symbol / frame can have, never how likely each one is
	const list = (values: number[]) => formatOrList(values.map(formatTimes));
	const cash = $derived({
		startFrames: list(CASH_START_FRAME_VALUES),
		coins: list(CASH_COIN_VALUES),
		multipliers: list(CASH_MULTIPLIER_VALUES),
		frameMax: formatTimes(CASH_FRAME_MAX),
		bombs: list(CASH_BOMB_VALUES),
		overchargedFrames: list(CASH_OVERCHARGED_FRAME_VALUES),
		overchargedBombMax: formatTimes(CASH_OVERCHARGED_BOMB_MAX),
	});

	const buyModes = $derived([
		{
			img: ICON.operation,
			name: i18nDerived.modeOperation(),
			text: fill(i18nDerived.rulesOperation(), cost('lucky_draw_free_spins'), bet),
		},
		{
			img: ICON.mutant,
			name: i18nDerived.modeMutant(),
			text: fill(
				i18nDerived.rulesMutant(),
				cost('lucky_draw_feature_heavy'),
				bet,
				formatNumber(CASH_MUTANT_START_FRAMES),
				cash.startFrames,
			),
		},
		{
			img: ICON.overcharged,
			name: i18nDerived.modeOvercharged(),
			text: fill(
				i18nDerived.rulesOvercharged(),
				cost('super_lucky_draw_free_spins'),
				bet,
				formatNumber(CASH_POSITIONS),
				cash.overchargedFrames,
				cash.overchargedBombMax,
			),
		},
	]);
</script>

{#snippet heading(title: string, icon?: string)}
	<div class="heading">
		{#if icon}<img src={icon} alt="" />{/if}
		<h2>{title}</h2>
	</div>
{/snippet}

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} closeAnchor="content" onclose={() => (stateModal.modal = null)}>
		<!-- dir="auto": the text's own direction (Arabic reads right to left: the cards,
		     the table and the bullets mirror, and mixed Latin words fall in the right
		     place; every other language is left to right as before) -->
		<div class="panel" dir="auto">
			<header class="about">
				<img src={logoImg} alt="Chaos Lab 2" class="logo" />
				<div>
					<h2>{i18nDerived.rulesOverview()}</h2>
					<p>{i18nDerived.rulesOverviewText()}</p>
				</div>
			</header>

			<div class="cards">
				<section class="wide">
					{@render heading(i18nDerived.rulesGameModes())}
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
					{@render heading(i18nDerived.rulesWinAnywhere(), ICON.h1)}
					<p>{i18nDerived.rulesWinAnywhereText()}</p>
				</section>

				<section>
					{@render heading(i18nDerived.rulesTumbles(), ICON.h2)}
					<p>{i18nDerived.rulesTumblesText()}</p>
				</section>

				<section>
					{@render heading(i18nDerived.rulesWild(), ICON.wild)}
					<p>{i18nDerived.rulesWildText()}</p>
				</section>

				<section>
					{@render heading(i18nDerived.rulesScatter(), ICON.bonus)}
					<p>{i18nDerived.rulesScatterText()}</p>
					<ul>
						<li>{i18nDerived.rulesScatter4()}</li>
						<li>{fill(i18nDerived.rulesScatter5(), formatNumber(CASH_START_FRAMES.five))}</li>
						<li>{fill(i18nDerived.rulesScatter6(), formatNumber(CASH_START_FRAMES.sixOrMore))}</li>
					</ul>
				</section>

				<section>
					{@render heading(i18nDerived.rulesMultiplier(), ICON.mult)}
					<p>{i18nDerived.rulesMultiplierText()}</p>
					<ul>
						<li>{fill(i18nDerived.rulesMultValues(), multiplierValues)}</li>
						<li>{i18nDerived.rulesMultLanding()}</li>
						<li>{i18nDerived.rulesMultCollection()}</li>
						<li>{i18nDerived.rulesMultTotal()}</li>
						<li>{i18nDerived.rulesMultBase()}</li>
						<li>{i18nDerived.rulesMultCash()}</li>
					</ul>
				</section>

				<section>
					{@render heading(i18nDerived.rulesBomb(), ICON.bomb)}
					<p>{i18nDerived.rulesBombText()}</p>
					<ul>
						<li>{i18nDerived.rulesBombLanding()}</li>
						<li>{i18nDerived.rulesBombWhen()}</li>
						<li>{i18nDerived.rulesBombClears()}</li>
						<li>{i18nDerived.rulesBombAfter()}</li>
					</ul>
				</section>

				<section>
					{@render heading(i18nDerived.rulesCloner(), ICON.cloner)}
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
					{@render heading(i18nDerived.rulesOrderOfPlay())}
					<p>{i18nDerived.rulesOrderText()}</p>
					<ol>
						<li>{i18nDerived.rulesOrder1()}</li>
						<li>{i18nDerived.rulesOrder2()}</li>
						<li>{i18nDerived.rulesOrder3()}</li>
						<li>{i18nDerived.rulesOrder4()}</li>
						<li>{i18nDerived.rulesOrder5()}</li>
					</ol>
				</section>

				<!-- the feature: the full width, its rules beside its order of play -->
				<section class="wide feature">
					{@render heading(i18nDerived.rulesCashRespins(), ICON.coin)}
					<div class="split">
						<div>
							<p>{fill(i18nDerived.rulesCashText(), formatNumber(CASH_RESPINS))}</p>
							<ul>
								<li>{fill(i18nDerived.rulesCashStart(), cash.startFrames)}</li>
								<li>{fill(i18nDerived.rulesCashRespinsRule(), formatNumber(CASH_RESPINS))}</li>
								<li>{fill(i18nDerived.rulesCashCoin(), cash.coins, bet)}</li>
								<li>{fill(i18nDerived.rulesCashMultiplier(), cash.multipliers, cash.frameMax)}</li>
								<li>
									{fill(
										i18nDerived.rulesCashCloner(),
										formatNumber(CASH_CLONER_COINS.min),
										formatNumber(CASH_CLONER_COINS.max),
									)}
								</li>
								<li>{fill(i18nDerived.rulesCashBomb(), cash.bombs, bet, cash.overchargedBombMax)}</li>
							</ul>
						</div>
						<div>
							<p>{i18nDerived.rulesCashOrderText()}</p>
							<ol>
								<li>{i18nDerived.rulesCashOrder1()}</li>
								<li>{i18nDerived.rulesCashOrder2()}</li>
								<li>{i18nDerived.rulesCashOrder3()}</li>
								<li>{i18nDerived.rulesCashOrder4()}</li>
							</ol>
							<p>{fill(i18nDerived.rulesCashEnd(), formatNumber(CASH_POSITIONS), bet)}</p>
						</div>
					</div>
				</section>

				<section class="wide">
					{@render heading(i18nDerived.rulesSwitchModes())}
					<p>{fill(i18nDerived.rulesSwitchModesText(), bet)}</p>
					<div class="offers two">
						<div class="offer row">
							<img src={ICON.chaos} alt="" />
							<p>{fill(i18nDerived.rulesChaos(), cost('ante_1'), bet)}</p>
						</div>
						<div class="offer row">
							<img src={ICON.boost} alt="" />
							<p>{fill(i18nDerived.rulesBoost(), cost('ante_2'), bet)}</p>
						</div>
					</div>
				</section>

				<section class="wide">
					{@render heading(i18nDerived.rulesBuyModes())}
					<p>{i18nDerived.rulesBuyModesText()}</p>
					<div class="offers three">
						{#each buyModes as buyMode}
							<div class="offer">
								<img src={buyMode.img} alt="" />
								<h3>{buyMode.name}</h3>
								<p>{buyMode.text}</p>
							</div>
						{/each}
					</div>
				</section>

				<section>
					{@render heading(i18nDerived.rulesGeneral())}
					<ul>
						<li>{i18nDerived.rulesGeneral1()}</li>
						<li>{i18nDerived.rulesGeneral2()}</li>
						<li>{i18nDerived.rulesGeneral3()}</li>
					</ul>
				</section>

				<!-- beside General and the disclaimer on a wide screen (two rows tall) -->
				<section class="tall">
					{@render heading(i18nDerived.rulesUiGuide())}
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
					{@render heading(i18nDerived.rulesDisclaimer())}
					<p>{i18nDerived.rulesDisclaimerText()}</p>
					<!-- "Engine", not "Stake Engine": Stake review 2026-10-29 (their docs
					     template still says Stake Engine) -->
					<p class="copyright">TM and &copy; 2026 Engine.</p>
				</section>
			</div>

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

	/* the logo beside what the game is */
	.about {
		display: flex;
		align-items: center;
		gap: 1.6rem;
		margin-bottom: 1.1rem;
		/* clear of the popup's X in the top right corner (physical: it does not
		   change sides in a right-to-left language) */
		padding-right: 2.4rem;

		> div {
			flex: 1;
			min-width: 0;
		}

		p {
			margin: 0;
		}
	}

	.logo {
		flex: none;
		display: block;
		width: min(210px, 34%);
		height: auto;
		filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.6));
	}

	/* every section a card; two a row where the screen is wide (below) */
	.cards {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.8rem;
	}

	section {
		min-width: 0;
		box-sizing: border-box;
		padding: 0.9rem 1rem 0.6rem;
		border-radius: 14px;
		background: var(--modal-bg);
		border: 1px solid var(--modal-border);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	/* the feature stands out */
	.feature {
		border-color: rgba(171, 234, 16, 0.55);
		background: linear-gradient(180deg, rgba(64, 84, 40, 0.5), rgba(40, 50, 36, 0.45));
	}

	/* a section's title, its symbol in front of it */
	.heading {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-bottom: 0.5rem;

		img {
			flex: none;
			width: 52px;
			height: 52px;
			object-fit: contain;
			filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.6));
		}
	}

	h2 {
		margin: 0;
		font-family: var(--ms-display-font, 'Creepster', 'Inter', sans-serif);
		font-size: 1.35rem;
		font-weight: 400;
		line-height: 1.15;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--modal-accent);
		text-shadow:
			0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 14px rgba(171, 234, 16, 0.3);
	}

	.about h2 {
		margin-bottom: 0.4rem;
		font-size: 1.6rem;
	}

	/* the buy modes' names: the section headers' display face, a size down
	   (they were bold Inter, which read as a different font: Evtim, 2026-11-06) */
	h3 {
		margin: 0.5rem 0 0.3rem;
		text-align: center;
		font-family: var(--ms-display-font, 'Creepster', 'Inter', sans-serif);
		font-size: 1.1rem;
		font-weight: 400;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--modal-accent);
		text-shadow: 0 2px 3px rgba(0, 0, 0, 0.9);
	}

	p,
	li {
		font-size: 0.92rem;
		line-height: 1.5;
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
			padding-inline-start: 1.2rem;

			&::before {
				content: '•';
				position: absolute;
				inset-inline-start: 0.2rem;
				color: var(--modal-accent);
			}
		}
	}

	ol {
		padding-inline-start: 1.6rem;

		li::marker {
			color: var(--modal-accent);
			font-weight: 700;
		}
	}

	li + li {
		margin-top: 0.15rem;
	}

	/* the switch modes (art beside the text) and the buy modes (art over the name) */
	.offers {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.6rem;
		margin-bottom: 0.4rem;
	}

	.offer {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
		padding: 0.7rem 0.8rem 0.4rem;
		border-radius: 12px;
		background: rgba(8, 12, 8, 0.45);
		border: 1px solid var(--modal-border);

		img {
			flex: none;
			width: auto;
			height: 104px;
			max-width: 100%;
			object-fit: contain;
			filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.55));
		}

		p {
			margin: 0 0 0.3rem;
		}

		&.row {
			flex-direction: row;
			gap: 0.9rem;
			padding-bottom: 0.7rem;

			img {
				height: 72px;
			}

			p {
				margin: 0;
			}
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
		text-align: end;
		color: rgba(242, 246, 234, 0.88);
	}

	tbody tr:last-child th,
	tbody tr:last-child td {
		border-bottom: 0;
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
		text-align: start;
	}

	tbody th {
		font-weight: 700;
	}

	.modes {
		margin: 0.4rem 0 0.3rem;
	}

	.disclaimer p {
		font-size: 0.85rem;
		line-height: 1.5;
		color: rgba(242, 246, 234, 0.6);
	}

	.copyright {
		text-align: center;
	}

	.version {
		margin-top: 0.8rem;
		text-align: center;
		font-size: 0.7rem;
		color: rgba(242, 246, 234, 0.35);
	}

	/* a wide screen (a desktop, a tablet, the Popout L window): two cards a row. The
	   table, the feature and the mode sections take the full width; the UI guide
	   stands beside General and the disclaimer */
	@media screen and (min-width: 700px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.wide {
			grid-column: 1 / -1;
		}

		.tall {
			grid-row: span 2;
		}

		.split {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0 1.6rem;
		}

		.offers.two {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.offers.three {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	/* between a phone and that: one card a row, the offers already side by side */
	@media screen and (min-width: 560px) and (max-width: 699.98px) {
		.offers.two {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.offers.three {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media screen and (max-width: 500px) {
		.panel {
			width: 94vw;
			padding: 1.4rem 0.7rem 0.8rem;
		}

		/* the logo over the overview */
		.about {
			flex-direction: column;
			gap: 0.7rem;
			padding-right: 0;
			text-align: center;
		}

		.logo {
			width: min(190px, 52%);
		}

		section {
			padding: 0.8rem 0.8rem 0.5rem;
		}

		.heading img {
			width: 44px;
			height: 44px;
		}

		h2 {
			font-size: 1.2rem;
		}

		.about h2 {
			font-size: 1.3rem;
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
			padding: 0.35rem 0.25rem;
		}

		/* the table runs wider than the card's text (the card's padding took the room
		   the COST header needs: it broke as "COS / T") */
		.modes {
			width: calc(100% + 1rem);
			margin-inline: -0.5rem;
		}

		.offer img {
			height: 92px;
		}

		.offer.row img {
			height: 60px;
		}
	}

	/* landscape phones: use the height */
	@media screen and (max-height: 500px) {
		.panel {
			/* the whole visible height minus the popup's 1rem padding */
			max-height: calc(100vh - 2rem);
			max-height: calc(100dvh - 2rem);
			padding-top: 1rem;
		}

		.logo {
			width: min(150px, 26%);
		}

		.offer img {
			height: 84px;
		}
	}
</style>
