<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoaderStakeEngine, LoadI18n } from 'components-shared';
	import LoaderGame from '../components/LoaderGame.svelte';
	import { stateUrlDerived, stateBet } from 'state-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	let showYourLoader = $state(false);

	const loaderUrlStakeEngine = new URL('../../stake-engine-loader.gif', import.meta.url).href;

	// Dev mode: skip RGS auth and set mock balance when no rgs_url is provided
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

<LoaderStakeEngine src={loaderUrlStakeEngine} oncomplete={() => (showYourLoader = true)} />

{#if showYourLoader}
	<LoaderGame />
{/if}

{@render props.children()}