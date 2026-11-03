<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate, requestReplay } from 'rgs-requests';
	import { stateUrlDerived, stateBet, stateConfig, stateModal, stateUi } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

	type Props = {
		children: Snippet;
		/**
		 * Rendered INSTEAD of the game when authentication (or the replay fetch)
		 * fails: the game never mounts, so nothing can be played. Stake checks this
		 * with an invalid rgs_url ("fails authentication, displays an error,
		 * prevents gameplay"). Pass the game's <ModalError /> — the error is on
		 * stateModal. Without it a plain built-in message shows.
		 */
		failed?: Snippet;
	};

	const props: Props = $props();

	/**
	 * Local development only (`vite dev`): no rgs_url means no RGS session, so the
	 * game boots on a mock balance. Never in a build — there a missing or empty
	 * rgs_url is an invalid one and fails authentication. (Games used to decide
	 * this in their layout on `!rgsUrl()` alone, which shipped a playable game
	 * with a 10000 mock balance to anyone opening it with `rgs_url=`.)
	 */
	const DEV_BALANCE = 10000;
	const isDevWithoutRgs =
		!!import.meta.env?.DEV && !stateUrlDerived.rgsUrl() && !stateUrlDerived.replay();

	let status = $state<'pending' | 'ready' | 'failed'>('pending');

	const toAmount = (apiAmount: number) => apiAmount / API_AMOUNT_MULTIPLIER;

	const setRoundBet = (amount: number) => {
		stateBet.betAmount = amount;
		stateBet.wageredBetAmount = amount;
	};

	const authenticate = async () => {
		if (!stateUrlDerived.rgsUrl()) {
			throw { error: 'ERR_RGS_URL', message: 'The rgs_url parameter is missing.' };
		}

		const authenticateData = await requestAuthenticate({
			rgsUrl: stateUrlDerived.rgsUrl(),
			sessionID: stateUrlDerived.sessionID(),
			language: stateUrlDerived.lang(),
		});

		// error
		if (authenticateData?.error) throw authenticateData;

		// balance
		if (authenticateData?.balance) {
			// Example of authenticateData.balance
			// {
			// 		"amount": 10000000000000000,
			// 		"currency": "USD"
			// },
			stateBet.currency = authenticateData.balance.currency;
			stateBet.balanceAmount = toAmount(authenticateData.balance.amount);
		}

		// config
		if (authenticateData?.config) {
			// Example of authenticateData.config
			// {
			// 	"gameID": "37_test-lines",
			// 	"minBet": 100000,
			// 	"maxBet": 1000000000,
			// 	"stepBet": 10000,
			// 	"defaultBetLevel": 1000000,
			// 	"betLevels": [100000, 200000, ..., 1000000000],
			// 	"betModes": {},
			// 	"jurisdiction": {
			// 			"socialCasino": false,
			// 			"disabledFullscreen": false,
			// 			"disabledTurbo": false,
			// 			"disabledSuperTurbo": false,
			// 			"disabledAutoplay": false,
			// 			"disabledSlamstop": false,
			// 			"disabledSpacebar": false,
			// 			"disabledBuyFeature": false,
			// 			"displayNetPosition": false,
			// 			"displayRTP": false,
			// 			"displaySessionTimer": false,
			// 			"minimumRoundDuration": 0
			// 	}
			// }
			stateConfig.jurisdiction = authenticateData?.config?.jurisdiction;
			stateConfig.betAmountOptions = (authenticateData.config?.betLevels || []).map(toAmount);
			stateConfig.betMenuOptions = stateConfig.betAmountOptions;

			if (authenticateData.config?.defaultBetLevel) {
				stateBet.betAmount = toAmount(authenticateData.config.defaultBetLevel);
			}
		}

		// round: the active one, or the last finished one (Stake returns either)
		const round = authenticateData?.round;
		if (round) {
			// Example of authenticateData.round
			// {
			// 	"betID": 62277967,
			// 	"amount": 1000000,
			// 	"payout": 33400000,
			// 	"payoutMultiplier": 33.4,
			// 	"active": true,
			// 	"state": [...],
			// 	"mode": "BONUS",
			// 	"event": null
			// }
			// `amount` is the BASE bet (payoutMultiplier = payout / amount).

			if (round.state) {
				// @ts-ignore
				stateBet.betToResume = round;
			}

			const amount = round.amount && round.amount > 0 ? toAmount(round.amount) : 0;

			if (round.active) {
				// an unfinished round resumes at its own bet and mode
				if (amount) setRoundBet(amount);
				if (round.mode) stateBet.activeBetModeKey = round.mode;
			} else if (amount && stateConfig.betAmountOptions.includes(amount)) {
				// The last FINISHED round keeps the player's bet across a reload (a
				// losing spin is closed by the RGS at once, so a refresh mid-spin lands
				// here), but never its mode: an ante or a buy costs more and has to be
				// chosen again. A bet that is not a level of this session (another
				// currency, changed levels) stays on defaultBetLevel.
				setRoundBet(amount);
			}
		}
	};

	const handleReplay = async () => {
		/**
		 * `amount` and `currency` are OPTIONAL replay parameters. When they are
		 * absent the platform asks for a 1 USD bet — 1 SC in social mode — to be
		 * shown rather than a zeroed-out round, so the replay card still reads as
		 * a real round. https://stake-engine.com/changelog/replay-mode
		 */
		const replayBetAmount = toAmount(stateUrlDerived.amount()) || 1;
		stateBet.betAmount = replayBetAmount;
		stateBet.wageredBetAmount = replayBetAmount;
		stateBet.activeBetModeKey = stateUrlDerived.mode();

		// Set currency from URL if provided
		const currencyParam = new URLSearchParams(window.location.search).get('currency');
		if (currencyParam) {
			stateBet.currency = currencyParam;
		} else if (stateUrlDerived.social()) {
			// XSC formats as "1.00 SC" — see CurrencyMeta in utils-shared/amount
			stateBet.currency = 'XSC';
		}

		const data = await requestReplay({
			rgsUrl: stateUrlDerived.rgsUrl(),
			game: stateUrlDerived.game(),
			mode: stateUrlDerived.mode(),
			version: stateUrlDerived.version(),
			event: stateUrlDerived.event(),
		});

		// @ts-ignore the replay schema is not typed yet
		if (!data || data.error) {
			throw data?.error ? data : { error: 'No replay data', message: 'Replay returned empty response' };
		}

		// @ts-ignore
		stateBet.betToResume = {
			...data,
			event: '0',
			active: true,
			mode: stateUrlDerived.mode(),
		};
	};

	onMount(async () => {
		if (isDevWithoutRgs) {
			stateUi.config.mode = 'default';
			stateBet.balanceAmount = DEV_BALANCE;
			status = 'ready';
			return;
		}

		try {
			if (stateUrlDerived.replay()) {
				stateUi.config.mode = 'replay';
				await handleReplay();
			} else {
				stateUi.config.mode = 'default';
				await authenticate();
			}
			status = 'ready';
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
			status = 'failed';
		}
	});
</script>

{#if status === 'ready'}
	{@render props.children()}
{:else if status === 'failed'}
	{#if props.failed}
		{@render props.failed()}
	{:else}
		<div class="auth-failed" role="alert">
			<p>Unable to start the game. Please reload or try again later.</p>
		</div>
	{/if}
{/if}

<style lang="scss">
	.auth-failed {
		position: fixed;
		inset: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		box-sizing: border-box;
		background: #000000;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		text-align: center;
	}
</style>
