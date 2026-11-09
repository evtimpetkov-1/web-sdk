<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { GlobalStyle, ModalError } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import { stateUrlDerived } from 'state-shared';

	import Game from '../components/Game.svelte';
	import LoaderGame from '../components/LoaderGame.svelte';
	import FpsMeter from '../components/FpsMeter.svelte';
	import { setContext } from '../game/context';
	import { displayFont } from '../game/textStyles';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	setContext();

	onMount(() => {
		// Every HTML popup's display face (modal titles, rules, paytable, shop)
		// follows the language: Creepster has no Polish/Turkish/Vietnamese letters,
		// so those read Black Ops One (displayFont). Set here, not in Game, so the
		// error a failed authentication shows instead of the game gets it too.
		document.documentElement.style.setProperty('--ms-display-font', displayFont());
		// app.html says en: the popups' uppercase (Turkish i -> İ) and the rules
		// table's hyphenation follow the html lang. Social mode is English.
		document.documentElement.lang = stateUrlDerived.social() ? 'en' : stateUrlDerived.lang();
	});
</script>

<!--
	i18n first, so a failed authentication can say so in the player's language.
	When it fails (a bad rgs_url, an expired session) the game never mounts: the
	error is all there is (Stake: "fails authentication, displays an error,
	prevents gameplay"). Under `vite dev` without an rgs_url, Authenticate boots
	on a mock balance instead; a build never does.
-->
<GlobalStyle>
	<LoadI18n {messagesMap}>
		<Authenticate>
			<Game />
			{#snippet failed()}
				<ModalError />
			{/snippet}
		</Authenticate>
	</LoadI18n>
</GlobalStyle>

<!--
	The game's own loader, shown from the first frame and tied to the real
	asset load. No Stake Engine GIF in front of it, same call as Kraken's Wilds:
	the approval rules bar Stake branding in game assets, and it cost 2s of
	dead boot time.
-->
<LoaderGame />

<!-- debug only: `?fps=true` in the URL; over the loader, the game and the popups -->
<FpsMeter />

{@render props.children()}
