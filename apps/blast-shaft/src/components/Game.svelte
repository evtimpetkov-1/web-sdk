<script lang="ts">
	import { onMount, tick } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';
	import { stateBet, stateModal, stateUrlDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { UI, stateUiTheme } from 'components-ui-pixi';
	import {
		ModalError,
		ModalBetMenu,
		ModalAutoSpin,
		ModalAutoSpinMessage,
		ModalInsufficientFunds,
		ModalSettings,
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
	import BoardFrame from './BoardFrame.svelte';
	import SceneShake from './SceneShake.svelte';
	import SymbolGlints from './SymbolGlints.svelte';
	import Board from './Board.svelte';
	import BoardBacking from './BoardBacking.svelte';
	import AnticipationField from './AnticipationField.svelte';
	import BuySlot from './BuySlot.svelte';
	import BarStrip from './BarStrip.svelte';
	import DustFall from './DustFall.svelte';
	import GoldFx from './GoldFx.svelte';
	import Bats from './Bats.svelte';
	import ClusterWinAmounts from './ClusterWinAmounts.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import GlobalMultiplier from './GlobalMultiplier.svelte';
	import MultiplierBoard from './MultiplierBoard.svelte';
	import MovingClones from './MovingClones.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinTotalWin from './FreeSpinTotalWin.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import FreeSpinRetrigger from './FreeSpinRetrigger.svelte';
	import Transition from './Transition.svelte';
	import GameLogo from './GameLogo.svelte';
	import BuyShop from './BuyShop.svelte';
	import BuyConfirm from './BuyConfirm.svelte';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';
	import ReplayHud from './ReplayHud.svelte';
	import ReplayOverlay from './ReplayOverlay.svelte';
	import { applyBetModeMeta } from '../game/betModeMeta';
	import { ANTE_OPTIONS, BUY_OPTIONS } from '../game/buyOptions';
	import { UI_KIND } from '../game/constants';
	import { displayFont } from '../game/textStyles';
	import { getResumedFreeSpinsEntry } from '../game/utils';
	import type { Bet } from '../game/typesBookEvent';

	const context = getContext();

	// Popup open / close: the shared bet menu, autoplay, settings, rules and the buy
	// shop all run on stateModal. A new card (shop -> confirm) opens again; a
	// confirmed purchase closes under its own sound (BuyConfirm), so that is silent.
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
		// bottom bar: Alfa Slab One captions in gold and white Inter amounts over the
		// painted timber strip (BarStrip, so the SDK's own plate is switched off), the
		// -/+ and every other button from the painted iron set (build_ui.py). The
		// display face follows the language (displayFont); the HTML popups read it as
		// --ms-display-font, set by the layout (+layout.svelte)
		// (the generic UI has no theme: UI_KIND in constants.ts)
		if (UI_KIND === 'themed') Object.assign(stateUiTheme, {
			labelFont: displayFont(),
			labelWeight: '400',
			labelFill: 0xf6bf48,
			labelLetterSpacing: 1,
			barFill: 0x0c0a08,
			barAlpha: 0,
			// minus.png / plus.png instead of the code-drawn chips
			stepperSprites: true,
			// ... set lower and a little wider than the code-drawn chips sat: clear of the
			// strip's iron rail, beside the caption and the amount (Evtim 2026-11-16)
			stepperY: -10,
			stepperOffset: 116,
			// the painted autoplay button keeps its light where it is: no spinning disc
			autoSpinRotates: false,
			// turbo_on.png is already the molten disc; no tint on top
			turboActiveTint: 0xffffff,
			// portrait: bigger buttons on the plank deck (BarStrip `deck`), which runs from
			// 552 to 148 units above the bottom; BuySlot places the nugget above Bet
			portraitDeck: { spinScale: 1.85, spinY: 350, sideScale: 1, sideY: 252, outerX: 128, innerX: 298 },
		});
		// Pixi Text rasterises with whatever font is resolved at first draw — warm
		// the self-hosted faces while the loading screen is up (fonts.css)
		for (const face of ['32px "Alfa Slab One"', '32px "Black Ops One"', '700 32px Inter', '400 32px Inter']) {
			document.fonts?.load(face).catch(() => undefined);
		}
	});

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});

	/**
	 * The press on the intro. It is the user gesture browsers want before audio
	 * (https://developer.chrome.com/blog/autoplay), so <Sound /> mounts right
	 * here and the start sound and the curtains are heard (before, it mounted
	 * with the game and the start sound was dropped). The intro fades out while
	 * the curtains fade in already shut; the game mounts behind them; they part.
	 * The curtains only show one start in five (Evtim, 2026-10-26); otherwise the
	 * same swap happens behind a plain black fade.
	 * A round reloaded inside its free spins opens on the free-spins theatre: it
	 * is dressed while the transition is shut, and the lab -> theatre cross-fade
	 * (Background, 500 ms) runs out before it opens, so the base game never shows.
	 * The resume snapshot (createBonusSnapshot) restores the rest.
	 */
	const INTRO_CURTAIN_CHANCE = 0.2;
	const BACKGROUND_FADE_MS = 500;
	let soundReady = $state(false);
	const startGame = async () => {
		soundReady = true;
		await tick();
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_game_start' });
		await context.eventEmitter.broadcastAsync({
			type: Math.random() < INTRO_CURTAIN_CHANCE ? 'transitionShowClosed' : 'transitionShowVeil',
		});
		if (getResumedFreeSpinsEntry(stateBet.betToResume as Bet | null)) {
			context.stateGame.gameType = 'freegame';
			await waitForTimeout(BACKGROUND_FADE_MS);
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
		<!-- idle life on a resting board: a glint on a random symbol now and then -->
		<SymbolGlints />
		<!-- a bat across the tunnel now and then, behind the reels (root zIndex -1.4) -->
		<Bats />

		<!-- the mine shakes with its big moments: the board layers move as one, the
		     background, logo, bar and popups stay still (SceneShake) -->
		<SceneShake>
			<MainContainer>
				<!-- zIndex -2: under the FS glow fill (-1) and the board -->
				<BoardBacking />
				<!-- scatter anticipation: under every symbol layer, so only empty cells show it -->
				<AnticipationField />
				<Board />
				<BoardFrame />
				<GlobalMultiplier />
			</MainContainer>

			<MainContainer>
				<TumbleBoard />
				<ClusterWinAmounts />
			</MainContainer>

			<MainContainer>
				<MultiplierBoard />
				<MovingClones />
				<!-- the counters (FREE SPINS, TOTAL WIN, the base game's WIN): on the top
				     pipe beside the plate, or in portrait on plates hanging from the reel
				     window's bottom edge, where symbols spill (bonus disc, landings), so
				     they draw above the symbol layers. Board-local units, so inside a
				     MainContainer: outside one their board coordinates were read as raw
				     canvas pixels and drifted with every window resize -->
				<TumbleWinAmount />
				<FreeSpinCounter />
				<FreeSpinTotalWin />
				<!-- gold in motion: a collected multiplier's comet and the hit on the sign,
				     the nuggets a win throws at the WIN counter -->
				<GoldFx />
			</MainContainer>
		</SceneShake>

		<GameLogo />

		{#if stateUrlDerived.replay()}
			<!-- replay keeps only the readouts the approval docs ask to stay
			     visible (win, bet cost, currency) — no controls (Kraken's pattern) -->
			<ReplayHud />
		{:else if UI_KIND === 'themed'}
			<!-- the painted strip the bar's captions and buttons sit on (under the UI) -->
			<BarStrip deck />
			<UI>
				<!-- the logo is the GameLogo sprite (top-left / above the plate); the
				     SDK's text slots stay empty -->
				{#snippet gameName()}{/snippet}
				{#snippet logo()}{/snippet}
			</UI>
			<!-- the game's own buy button + an active ante / armed buy around the
			     spin button (halo, rim, cost chip), all over the bar (BuySlot) -->
			<BuySlot />
		{/if}
		<FreeSpinRetrigger />
		<Win />
		<FreeSpinIntro />
		<FreeSpinOutro />
		<!-- dust shaken off the roof, falling from the top of the screen in front of
		     everything: on the mine's blasts and when the free spins board drops in -->
		<DustFall />
	{/if}

	<!-- the curtains: over everything (zIndex); the intro's exit and every
	     base <-> free spins switch run through them -->
	<Transition />
</App>

<!--
	The shared modal set, composed here rather than via <Modals> so the SDK's
	two BUY popups are never mounted — the game draws its own (BuyShop /
	BuyConfirm, HTML, so they live out here with the modals). The paytable and
	rules are the game's own too (the SDK's are template placeholders), and
	they carry the version footer. <Modals>' global font-size rules are carried
	below.
-->
<ModalError />
<ModalAutoSpinMessage />
<ModalInsufficientFunds />
{#if UI_KIND === 'generic'}
	<!--
		The generic UI (components-ui-html src/generic): the HTML bar over the canvas
		while the game is on screen (replay keeps its own readouts), the white bonus
		cards, and ONE info page with the paytable above the rules. No bet menu,
		autoplay popup or settings popup: the bar does those itself.
	-->
	{#if !context.stateLayout.showLoadingScreen && !stateUrlDerived.replay()}
		<GenericUI />
	{/if}
	<GenericShop
		switches={ANTE_OPTIONS}
		buys={BUY_OPTIONS}
		onconfirm={() => context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bs_buy_confirm' })}
	/>
	<GenericInfo name="Blast Drop">
		{#snippet paytable()}
			<PayTable embedded />
		{/snippet}
		{#snippet rules()}
			<GameRules embedded />
		{/snippet}
	</GenericInfo>
{:else}
	<ModalBetMenu />
	<ModalAutoSpin />
	<PayTable />
	<GameRules />
	<ModalSettings />
	<BuyShop />
	<BuyConfirm />
{/if}
<!--
	Replay mode's round card — the Start Replay panel before playback and the
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
