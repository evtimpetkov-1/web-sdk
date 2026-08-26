<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import LoaderGame from '../components/LoaderGame.svelte';
	import DevMenu from '../components/DevMenu.svelte';
	import { stateUrlDerived, stateBet } from 'state-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	// Dev mode: skip RGS auth and set mock balance when no rgs_url is provided
	const isDevMode = !stateUrlDerived.rgsUrl();
	if (isDevMode) {
		stateBet.balanceAmount = 10000;
	}

	setContext();
</script>

<GlobalStyle>
	{#if isDevMode}
		<DevMenu />
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
	The game's own loader, shown from the first frame. There used to be a
	Stake Engine GIF in front of it for a fixed 2s: dropped because the approval
	rules bar Stake branding in game assets ("Game assets cannot include material
	with Stake / Kick branding or themes" — /docs/approval), and it cost 1.24MB
	and two seconds of dead boot time for a screen the player did not need.
-->
<LoaderGame />

{@render props.children()}