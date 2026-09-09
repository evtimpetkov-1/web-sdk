<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI, stateUiTheme } from 'components-ui-pixi';
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

	import { getContext } from '../game/context';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import Anticipations from './Anticipations.svelte';
	import ClusterWinAmounts from './ClusterWinAmounts.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import GlobalMultiplier from './GlobalMultiplier.svelte';
	import MultiplierBoard from './MultiplierBoard.svelte';
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
	import { applyBetModeMeta } from '../game/betModeMeta';

	const context = getContext();

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

		<MainContainer>
			<Board />
			<BoardFrame />
			<Anticipations />
			<TumbleWinAmount />
			<GlobalMultiplier />
		</MainContainer>

		<MainContainer>
			<TumbleBoard />
			<!-- <TumbleAnticipations /> -->
			<ClusterWinAmounts />
		</MainContainer>

		<MainContainer>
			<MultiplierBoard />
		</MainContainer>

		<VideoMascot />

		<GameLogo />

		<UI>
			<!-- the logo is the GameLogo sprite (top-left / above the plate); the
			     SDK's text slots stay empty -->
			{#snippet gameName()}{/snippet}
			{#snippet logo()}{/snippet}
		</UI>
		<Win />
		<FreeSpinIntro />
		<!-- both counters sit on the frame's top pipe either side of the multiplier
		     plate, so they have a home on every layout -->
		<FreeSpinCounter />
		<FreeSpinTotalWin />
		<FreeSpinOutro />
		<Transition />

	{/if}
</App>

{#snippet version()}
	<GameVersion version="0.0.0" />
{/snippet}
<!--
	The shared modal set, composed here rather than via <Modals> so the SDK's
	two BUY popups are never mounted — the game draws its own (BuyShop /
	BuyConfirm, HTML, so they live out here with the modals). <Modals>' global
	font-size rules are carried below.
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
<BuyShop />
<BuyConfirm />

<style lang="scss">
	:global(html) {
		font-size: 16px;
		@media screen and (max-width: 500px) {
			font-size: 110%;
		}
		@media screen and (orientation: landscape) and (max-height: 450px) {
			font-size: 75%;
		}
	}
</style>
