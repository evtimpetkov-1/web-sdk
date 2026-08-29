<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, REM, Container } from 'pixi-svelte';
	import { UI } from 'components-ui-pixi';
	import { stateUrlDerived, stateModal } from 'state-shared';
	import {
		GameVersion,
		ModalError,
		ModalBetMenu,
		ModalAutoSpin,
		ModalAutoSpinMessage,
		ModalPayTable,
		ModalGameRules,
		ModalSettings,
	} from 'components-ui-html';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';
	import BuyShop from './BuyShop.svelte';
	import BuyConfirm from './BuyConfirm.svelte';

	import { getContext } from '../game/context';
	import { applyBetModeMeta } from '../game/betModeMeta';
	import { GAME_VERSION, zIndexes } from '../game/constants';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import Anticipations from './Anticipations.svelte';
	import AnticipationZoom from './AnticipationZoom.svelte';
	import MovingWilds from './MovingWilds.svelte';
import SpecialOverlay from './SpecialOverlay.svelte';
	import LineWinLabels from './LineWinLabels.svelte';
	import FreeSpinRetrigger from './FreeSpinRetrigger.svelte';
	import KrakenTopper from './KrakenTopper.svelte';
	import GameLogo from './GameLogo.svelte';
	import AnteBuyPanels from './AnteBuyPanels.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import Win from './Win.svelte';
	import SpinMultiplier from './SpinMultiplier.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import FsCloudTransition from './FsCloudTransition.svelte';
	import Transition from './Transition.svelte';
	import ReplayHud from './ReplayHud.svelte';
	import ReplayOverlay from './ReplayOverlay.svelte';

	const context = getContext();

	/**
	 * Modal open / close, from one place.
	 *
	 * Every panel in the game — settings, rules, paytable, the buy shop, the buy
	 * confirm — is driven by `stateModal.modal`, so watching that covers all of
	 * them at once. Wiring the sound into each button instead would mean editing
	 * the shared components-ui-html package and would still miss any modal opened
	 * by something other than a click.
	 */
	let modalOpen = false;
	$effect(() => {
		const isOpen = stateModal.modal !== null;
		if (isOpen === modalOpen) return;
		modalOpen = isOpen;
		context.eventEmitter.broadcast({
			type: 'soundOnce',
			name: isOpen ? 'sfx_ui_popup_open' : 'sfx_ui_popup_close',
			forcePlay: true,
		});
	});
	const bl = $derived(context.stateGameDerived.boardLayout());

	onMount(() => {
		context.stateLayout.showLoadingScreen = true;
		applyBetModeMeta();
	});

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});

</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />
	<AnticipationZoom />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<MainContainer label="BoardFrameContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardFrame />
			</Container>
		</MainContainer>

		<MainContainer label="BoardContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<Board />
			</Container>
		</MainContainer>

		<!--
			Second pass: the stone border only, drawn OVER the reels so symbols
			leaving the board slide behind it rather than being cut at the opening
			edge mid-spin (BoardMask is extended to match). The dark panel and the
			FS counters stay in the first pass, behind the reels.
		-->
		<MainContainer label="BoardFrameFrontContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardFrame front />
			</Container>
		</MainContainer>

		<!-- Anticipation columns render ABOVE the stone border (the front frame
		     pass), so the energy column is not clipped by the frame; they used to
		     live inside Board's masked layer. Still below the overlay wilds/coins. -->
		<MainContainer label="AnticipationsContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardContainer>
					<Anticipations />
				</BoardContainer>
			</Container>
		</MainContainer>

		<MainContainer label="MovingWildsContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardContainer>
					<MovingWilds />
					<SpecialOverlay />
				</BoardContainer>
			</Container>
		</MainContainer>

		<!-- Per-winline amounts, above every board layer (reels, front frame,
		     anticipations and the kraken's overlay symbols) so a plate is never
		     clipped or drawn under the symbol it belongs to. -->
		<MainContainer label="LineWinLabelsContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardContainer>
					<LineWinLabels />
				</BoardContainer>
			</Container>
		</MainContainer>

		<KrakenTopper />
		<GameLogo />

		<!-- Ante Bet toggle + Buy Feature price panels beside the reels (spec
		     v2.1). Base game only; inert while a bet is running. Layered under
		     the kraken so its attack cloud rolls OVER them — by mount order
		     alone they landed on top of the dust. -->
		{#if !stateUrlDerived.replay()}
			<MainContainer label="AnteBuyPanelsContainer" zIndex={zIndexes.sidePanels}>
				<AnteBuyPanels />
			</MainContainer>
		{/if}

		<!-- Above kraken + logo so its screen shade dims them too -->
		<MainContainer label="RetriggerContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardContainer>
					<FreeSpinRetrigger />
				</BoardContainer>
			</Container>
		</MainContainer>

		{#if stateUrlDerived.replay()}
			<!-- replay keeps only the readouts the approval docs ask to stay
			     visible (win, bet cost, currency) — no controls -->
			<ReplayHud />
		{:else}
			<UI>
				{#snippet gameName()}{/snippet}
				{#snippet logo()}{/snippet}
			</UI>
		{/if}
		<Win />
		<!-- above Win: the multiplier dives INTO the win box, so it must draw over it -->
		<SpinMultiplier />
		<FreeSpinOutro />
		<FsCloudTransition />
		<!-- ABOVE the cloud (mount order = draw order): since the 2026-08-26
		     intro rework the burst is HELD at full coverage while the intro is
		     up, so the texts and the press bar must draw on top of it — below
		     it they would never be seen at all. -->
		<FreeSpinIntro />
		<Transition />
	{/if}
</App>

{#snippet version()}
	<!-- Footer of the SHARED paytable/rules modals. The game draws its own
	     PayTable/GameRules over these, so what the player actually reads is
	     PayTable.svelte's footer — both take the same constant so they cannot
	     drift. -->
	<GameVersion version={GAME_VERSION} />
{/snippet}
<!--
	The shared modal set, composed HERE rather than via <Modals> so the two BUY
	popups are simply never mounted — the game draws its own (BuyShop/BuyConfirm).
	Hiding them with CSS instead left them ghosting through the new screens'
	semi-transparent overlays. <Modals>' global font-size rules moved to
	modal-theme.css.
-->
<ModalError />
<ModalBetMenu />
<ModalAutoSpin />
<ModalAutoSpinMessage />
<ModalPayTable>
	{@render version()}
</ModalPayTable>
<ModalGameRules>
	{@render version()}
</ModalGameRules>
<ModalSettings />
<PayTable />
<GameRules />
<!-- from-scratch buy screens, drawn over the shared modals (PayTable pattern) -->
<BuyShop />
<BuyConfirm />
<!--
	Replay mode's round card — the Start Replay panel before playback and the
	Replay Again panel after it. HTML, so it lives out here with the modals
	rather than inside <App>.
-->
<ReplayOverlay />
