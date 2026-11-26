<script lang="ts">
	import { onMount, tick } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';
	import { stateBet, stateModal, stateUrlDerived } from 'state-shared';

	import {
		ModalError,
		ModalAutoSpinMessage,
		ModalInsufficientFunds,
		GenericUI,
		GenericShop,
		GenericInfo,
	} from 'components-ui-html';

	import { getContext } from '../game/context';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import SceneShake from './SceneShake.svelte';
	import Board from './Board.svelte';
	import WinCounter from './WinCounter.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinTotalWin from './FreeSpinTotalWin.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';
	import ReplayHud from './ReplayHud.svelte';
	import ReplayOverlay from './ReplayOverlay.svelte';
	import { applyBetModeMeta } from '../game/betModeMeta';
	import { ANTE_OPTIONS, BUY_OPTIONS } from '../game/buyOptions';
	import { getResumedFreeSpinsEntry } from '../game/utils';
	import type { Bet } from '../game/typesBookEvent';

	const context = getContext();

	// Popup open / close: the info page and the bonus shop run on stateModal.
	let lastModal: string | undefined;
	$effect(() => {
		const name = stateModal.modal?.name;
		if (name && name !== lastModal) {
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_ui_popup_open' });
		} else if (!name && lastModal && lastModal !== 'buyBonusConfirm') {
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_ui_popup_close' });
		}
		lastModal = name;
	});

	onMount(() => {
		context.stateLayout.showLoadingScreen = true;
		applyBetModeMeta();
		// Pixi Text rasterises with whatever font is resolved at first draw: warm
		// the self-hosted faces while the loading screen is up (fonts.css)
		for (const face of ['32px "Alfa Slab One"', '32px "Black Ops One"', '700 32px Inter', '400 32px Inter']) {
			document.fonts?.load(face).catch(() => undefined);
		}
	});

	/**
	 * The press on the intro. It is the user gesture browsers want before audio
	 * (https://developer.chrome.com/blog/autoplay), so <Sound /> mounts right here.
	 * The intro fades out behind a plain black veil, the game mounts behind it, the
	 * veil lifts. (The curtains of the base <-> free spins switch are still Blast
	 * Drop's timber ones, so the intro does not use them.)
	 * A round reloaded inside its free spins opens on the free-spins scene: gameType
	 * is switched while the veil is shut, so the base game never shows. The resume
	 * snapshot (createBonusSnapshot) restores the rest.
	 */
	let soundReady = $state(false);
	const startGame = async () => {
		soundReady = true;
		await tick();
		await context.eventEmitter.broadcastAsync({ type: 'transitionShowVeil' });
		if (getResumedFreeSpinsEntry(stateBet.betToResume as Bet | null)) {
			context.stateGame.gameType = 'freegame';
		}
		context.stateLayout.showLoadingScreen = false;
		await tick();
		await context.eventEmitter.broadcastAsync({ type: 'transitionOpen' });
	};
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />

	<!-- sound waits for the loading screen's press (startGame); a story that
	     skips the loading screen has no press, so it mounts with the game -->
	{#if soundReady || !context.stateLayout.showLoadingScreen}
		<Sound />
	{/if}

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onstart={startGame} />
	{:else}
		<ResumeBet />

		<!-- the board shakes with its big moments: its layers move as one, the
		     background, bar and popups stay still (SceneShake) -->
		<SceneShake>
			<MainContainer>
				<!-- the frame, the reels, the loot bags, the acting symbols -->
				<Board />
			</MainContainer>

			<MainContainer>
				<!-- the counters on the frame's bottom steel: over the symbol layers.
				     Board-local units, so inside a MainContainer -->
				<WinCounter />
				<FreeSpinCounter />
				<FreeSpinTotalWin />
			</MainContainer>
		</SceneShake>

		{#if stateUrlDerived.replay()}
			<!-- replay keeps only the readouts the approval docs ask to stay
			     visible (win, bet cost, currency): no controls (Kraken's pattern) -->
			<ReplayHud />
		{/if}
		<Win />
		<FreeSpinIntro />
		<FreeSpinOutro />
	{/if}

	<!-- the curtains: over everything (zIndex); the intro's exit and every
	     base <-> free spins switch run through them -->
	<Transition />
</App>

<!--
	The shared popups that the generic UI does not replace, composed here rather than
	via <Modals> so the SDK's own BUY popups, bet menu and placeholder paytable / rules
	are never mounted. <Modals>' global font-size rules are carried below.
-->
<ModalError />
<ModalAutoSpinMessage />
<ModalInsufficientFunds />
<!--
	The generic UI (components-ui-html src/generic), the studio's one UI for every game:
	the HTML bar over the canvas while the game is on screen (replay keeps its own
	readouts), the bonus shop (no offers yet: the bar hides its bonus button while the
	game has only the base mode), and ONE info page with the paytable above the rules.
-->
{#if !context.stateLayout.showLoadingScreen && !stateUrlDerived.replay()}
	<GenericUI />
{/if}
<GenericShop
	switches={ANTE_OPTIONS}
	buys={BUY_OPTIONS}
	onconfirm={() => context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_buy_confirm' })}
/>
<GenericInfo name="3 Pots Heist">
	{#snippet paytable()}
		<PayTable />
	{/snippet}
	{#snippet rules()}
		<GameRules />
	{/snippet}
</GenericInfo>
<!--
	Replay mode's round card: the Start Replay panel before playback and the
	Replay Again panel after it. HTML, so it lives out here with the modals
	(ported from Kraken's Wilds, where it passed review).
-->
<ReplayOverlay />

<style lang="scss">
	:global(html) {
		font-size: 16px;
		/* iOS Safari enlarges long text blocks in landscape (text autosizing):
		   the rules' paragraphs rendered at ~18px against 11px headings */
		-webkit-text-size-adjust: 100%;
		text-size-adjust: 100%;
		@media screen and (max-width: 500px) {
			font-size: 110%;
		}
		@media screen and (orientation: landscape) and (max-height: 450px) {
			font-size: 75%;
		}
		/* Stake's Popout S (400x225): the shared popups (auto spins, bet menu)
		   only fit without scrolling a step smaller still (same rule as <Modals>) */
		@media screen and (max-height: 300px) {
			font-size: 62.5%;
		}
	}
</style>
