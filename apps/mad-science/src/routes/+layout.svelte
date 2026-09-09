<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import { stateUrlDerived, stateBet } from 'state-shared';

	import Game from '../components/Game.svelte';
	import LoaderGame from '../components/LoaderGame.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	// Dev mode (same rule as Kraken's Wilds): no rgs_url in the URL → skip RGS
	// auth and boot with a mock balance so the game loads without a session.
	// Spinning still needs an RGS. The test tool always passes rgs_url.
	const isDevMode = !stateUrlDerived.rgsUrl();
	if (isDevMode) {
		stateBet.balanceAmount = 10000;
	}

	setContext();
</script>

<GlobalStyle>
	{#if isDevMode}
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	{:else}
		<Authenticate>
			<LoadI18n {messagesMap}>
				<Game />
			</LoadI18n>
		</Authenticate>
	{/if}
</GlobalStyle>

<!--
	The game's own loader, shown from the first frame and tied to the real
	asset load. No Stake Engine GIF in front of it, same call as Kraken's Wilds:
	the approval rules bar Stake branding in game assets, and it cost 2s of
	dead boot time.
-->
<LoaderGame />

{@render props.children()}
