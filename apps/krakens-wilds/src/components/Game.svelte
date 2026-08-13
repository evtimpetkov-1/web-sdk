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
	import MovingWilds from './MovingWilds.svelte';
	import FreeSpinRetrigger from './FreeSpinRetrigger.svelte';
	import KrakenTopper from './KrakenTopper.svelte';
	import GameLogo from './GameLogo.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
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

		<MainContainer label="MovingWildsContainer">
			<Container x={bl.x} y={bl.y} pivot={{ x: bl.x, y: bl.y }} scale={bl.scale}>
				<BoardContainer>
					<MovingWilds />
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
		<Transition />
		<ReplayComplete />
	{/if}
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="1.0.0" />
	{/snippet}
</Modals>
<PayTable />
<GameRules />
