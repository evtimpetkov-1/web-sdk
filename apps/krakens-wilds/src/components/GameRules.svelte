<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived } from 'state-shared';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { COIN_MULTIPLIERS } from '../game/constants';
	import config from '../game/config';
	const logoImg = new URL('../../assets/sprites/logo_text.webp', import.meta.url).href;

	const social = $derived(stateUrlDerived.social());
	const betLabel = $derived(social ? i18nDerived.playWord() : i18nDerived.betWord());
	const payoutLabel = $derived(social ? i18nDerived.winWord() : i18nDerived.payoutWord());
	const lineLabel = $derived(social ? i18nDerived.winlineWord() : i18nDerived.paylineWord());
	const linesLabel = $derived(social ? i18nDerived.winlinesWord() : i18nDerived.paylinesWord());
	const paidLabel = $derived(social ? i18nDerived.wonWord() : i18nDerived.paidWord());
	const payTableName = $derived(social ? i18nDerived.winTableLabel() : i18nDerived.payTableLabel());
	// quoted off the one list of coin values, never retyped in prose
	const coinValues = COIN_MULTIPLIERS.map((m) => `${m}x`);
	const coinRange = `${coinValues.slice(0, -1).join(', ')} or ${coinValues[coinValues.length - 1]}`;
	// same rule for the buy cost — it is read off the bet mode the RGS is charging
	const buyCost = `${config.betModes.bonus.cost}x`;
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal + 1} onclose={() => (stateModal.modal = null)}>
		<div class="game-rules">
			<img src={logoImg} alt="Kraken's Wilds" class="logo" />

			<section>
				<h2>{i18nDerived.gameOverview()}</h2>
				<p>
					{i18nDerived.overviewDesc().replace(/__0__/g, linesLabel).replace(/__1__/g, lineLabel).replace(/__2__/g, paidLabel)}
				</p>
			</section>

			<section>
				<h2>{social ? i18nDerived.playMode() : i18nDerived.betMode()}</h2>
				<ul>
					<li>{i18nDerived.betModeRtp().replace('__0__', betLabel)}</li>
					<li>{i18nDerived.betModeMultiplier().replace('__0__', payoutLabel).replace('__1__', betLabel)}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.wildSymbol()}</h2>
				<p>
					{i18nDerived.wildSymbolDesc().replace('__0__', payoutLabel)}
				</p>
			</section>

			<section>
				<h2>{i18nDerived.coinSymbol()}</h2>
				<p>
					{i18nDerived.coinSymbolDesc().replace('__0__', coinRange).replace('__1__', betLabel).replace('__2__', payoutLabel)}
				</p>
			</section>

			<section>
				<h2>{i18nDerived.specialSpinHeader()}</h2>
				<p>{i18nDerived.specialSpinDesc()}</p>
				<ul>
					<li>{i18nDerived.specialSpinWild().replace('__0__', linesLabel.charAt(0).toUpperCase() + linesLabel.slice(1)).replace('__1__', paidLabel)}</li>
					<li>{i18nDerived.specialSpinCoin().replace('__0__', linesLabel.charAt(0).toUpperCase() + linesLabel.slice(1))}</li>
				</ul>
				<p>{i18nDerived.specialSpinFs()}</p>
			</section>

			<section>
				<h2>{i18nDerived.bonusFreeSpins()}</h2>
				<ul>
					<li>{i18nDerived.fs3Bonus()}</li>
					<li>{i18nDerived.fs4Bonus()}</li>
					<li>{i18nDerived.fs5Bonus()}</li>
				</ul>
				<p>
					{i18nDerived.fsDesc()}
				</p>
			</section>

			<section>
				<h2>{i18nDerived.buyFeature()}</h2>
				<p>
					{i18nDerived.buyFeatureDesc().replace('__0__', buyCost).replace('__1__', betLabel)}
				</p>
			</section>

			<section>
				<h2>{i18nDerived.generalRules()}</h2>
				<ul>
					<li>{i18nDerived.grHighestWin().replace('__0__', lineLabel).replace('__1__', paidLabel)}</li>
					<li>{i18nDerived.grSimultaneous().replace('__0__', linesLabel)}</li>
					<li>{i18nDerived.grLineBonus().replace('__0__', lineLabel.charAt(0).toUpperCase() + lineLabel.slice(1))}</li>
					<li>{i18nDerived.grBonusAny().replace('__0__', lineLabel)}</li>
				</ul>
			</section>

			<section>
				<h2>{i18nDerived.uiGuide()}</h2>
				<ul>
					<li>{i18nDerived.uiSpin().replace('__0__', betLabel)}</li>
					<li>{i18nDerived.uiStop()}</li>
					<li>{i18nDerived.uiAutoSpin()}</li>
					<li>{i18nDerived.uiTurbo()}</li>
					<li>{i18nDerived.uiPlusMinus().replace('__0__', betLabel)}</li>
					<li>{i18nDerived.uiMenu()}</li>
					<li>{i18nDerived.uiPaytable().replace('__0__', payTableName).replace('__1__', payoutLabel).replace('__2__', linesLabel)}</li>
					<li>{i18nDerived.uiGameRules()}</li>
					<li>{i18nDerived.uiSound()}</li>
					<li>{i18nDerived.uiSettings()}</li>
				</ul>
			</section>

			<section class="disclaimer">
				<h2>{i18nDerived.disclaimer()}</h2>
				<p>
					{i18nDerived.disclaimerText()}
				</p>
				<p class="copyright">
					TM and &copy; 2026 Stake Engine.
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
