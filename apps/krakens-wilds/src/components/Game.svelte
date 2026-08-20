<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, REM, Container } from 'pixi-svelte';
	import { UI } from 'components-ui-pixi';
	import { stateUrlDerived, stateModal } from 'state-shared';
	import { GameVersion, Modals } from 'components-ui-html';
	import PayTable from './PayTable.svelte';
	import GameRules from './GameRules.svelte';

	import { getContext } from '../game/context';
	import { applyBetModeMeta } from '../game/betModeMeta';
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
	import FreeSpinRetrigger from './FreeSpinRetrigger.svelte';
	import KrakenTopper from './KrakenTopper.svelte';
	import GameLogo from './GameLogo.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import FsCloudTransition from './FsCloudTransition.svelte';
	import Transition from './Transition.svelte';
	import ReplayComplete from './ReplayComplete.svelte';

	const context = getContext();
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

		<KrakenTopper />
		<GameLogo />

		<!-- Above kraken + logo so its screen shade dims them too -->
		<MainContainer label="RetriggerContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardContainer>
					<FreeSpinRetrigger />
				</BoardContainer>
			</Container>
		</MainContainer>

		{#if !stateUrlDerived.replay()}
			<UI>
				{#snippet gameName()}{/snippet}
				{#snippet logo()}{/snippet}
			</UI>
		{/if}
		<Win />
		<FreeSpinIntro />
		<FreeSpinOutro />
		<FsCloudTransition />
		<Transition />
		<ReplayComplete />
	{/if}
</App>

<Modals>
	{#snippet version()}
		<!-- shown in the Pay Table + Game Rules footers. 1.0.0 was the rejected
		     (2026-07-31) submission; 2.0.0 is the reworked resubmission. -->
		<GameVersion version="2.0.0" />
	{/snippet}
</Modals>
<PayTable />
<GameRules />
