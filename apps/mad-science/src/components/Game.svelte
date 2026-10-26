<script lang="ts">
	import { onMount, tick } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';
	import { stateModal, stateUrlDerived } from 'state-shared';

	import { UI, stateUiTheme } from 'components-ui-pixi';
	import {
		ModalError,
		ModalBetMenu,
		ModalAutoSpin,
		ModalAutoSpinMessage,
		ModalSettings,
	} from 'components-ui-html';

	import { getContext } from '../game/context';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import BoardBacking from './BoardBacking.svelte';
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
	import Transition from './Transition.svelte';
	import VideoMascot from './VideoMascot.svelte';
	import GameLogo from './GameLogo.svelte';
	import BuyShop from './BuyShop.svelte';
	import BuyConfirm from './BuyConfirm.svelte';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';
	import ReplayHud from './ReplayHud.svelte';
	import ReplayOverlay from './ReplayOverlay.svelte';
	import { applyBetModeMeta } from '../game/betModeMeta';

	const context = getContext();

	// Popup open / close: the shared bet menu, autoplay, settings, rules and the buy
	// shop all run on stateModal. A new card (shop -> confirm) opens again; a
	// confirmed purchase closes under its own sound (BuyConfirm), so that is silent.
	let lastModal: string | undefined;
	$effect(() => {
		const name = stateModal.modal?.name;
		if (name && name !== lastModal) {
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_ui_popup_open' });
		} else if (!name && lastModal && lastModal !== 'buyBonusConfirm') {
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_ui_popup_close' });
		}
		lastModal = name;
	});

	onMount(() => {
		context.stateLayout.showLoadingScreen = true;
		applyBetModeMeta();
		// bottom bar in the logo's voice: Creepster captions in acid green, white
		// Inter amounts, charcoal plate, green-rimmed stepper chips
		Object.assign(stateUiTheme, {
			labelFont: 'Creepster',
			labelWeight: '400',
			labelFill: 0xabea10,
			labelLetterSpacing: 1,
			barFill: 0x0c100c,
			barAlpha: 0.82,
			stepperFill: 0x1e281a,
			stepperRim: 0xabea10,
			stepperRimHover: 0xdff669,
			stepperGlyph: 0xabea10,
			stepperGlyphHover: 0xdff669,
			// turbo_on.png is already the inverted acid disc; no tint on top
			turboActiveTint: 0xffffff,
		});
		// Pixi Text rasterises with whatever font is resolved at first draw — warm
		// the self-hosted faces while the loading screen is up (fonts.css)
		for (const face of ['32px Creepster', '32px Nosifer', '32px "Black Ops One"', '700 32px Inter', '400 32px Inter']) {
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
	 */
	let soundReady = $state(false);
	const startGame = async () => {
		soundReady = true;
		await tick();
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_game_start' });
		await context.eventEmitter.broadcastAsync({ type: 'transitionShowClosed' });
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

		<MainContainer>
			<!-- zIndex -2: under the FS glow fill (-1) and the board -->
			<BoardBacking />
			<Board />
			<BoardFrame />
			<TumbleWinAmount />
			<GlobalMultiplier />
			<!-- both free-spin counters sit on the frame's top pipe either side of the
			     plate, in the same board-local units, so they belong in the plate's
			     MainContainer: outside it their board coordinates were read as raw
			     canvas pixels and drifted with every window resize -->
			<FreeSpinCounter />
			<FreeSpinTotalWin />
		</MainContainer>

		<MainContainer>
			<TumbleBoard />
			<ClusterWinAmounts />
		</MainContainer>

		<MainContainer>
			<MultiplierBoard />
			<MovingClones />
		</MainContainer>

		<VideoMascot />

		<GameLogo />

		{#if stateUrlDerived.replay()}
			<!-- replay keeps only the readouts the approval docs ask to stay
			     visible (win, bet cost, currency) — no controls (Kraken's pattern) -->
			<ReplayHud />
		{:else}
			<UI>
				<!-- the logo is the GameLogo sprite (top-left / above the plate); the
				     SDK's text slots stay empty -->
				{#snippet gameName()}{/snippet}
				{#snippet logo()}{/snippet}
			</UI>
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
	The shared modal set, composed here rather than via <Modals> so the SDK's
	two BUY popups are never mounted — the game draws its own (BuyShop /
	BuyConfirm, HTML, so they live out here with the modals). The paytable and
	rules are the game's own too (the SDK's are template placeholders), and
	they carry the version footer. <Modals>' global font-size rules are carried
	below.
-->
<ModalError />
<ModalBetMenu />
<ModalAutoSpin />
<ModalAutoSpinMessage />
<PayTable />
<GameRules />
<ModalSettings />
<BuyShop />
<BuyConfirm />
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
	}
</style>
