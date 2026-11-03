<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'MODE_BONUS/book',
	});
</script>

<script lang="ts">
	import {
		StoryGameTemplate,
		StoryLocale,
		type TemplateArgs,
		templateArgs,
	} from 'components-storybook';
	import { randomInteger } from 'utils-shared/random';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet, convertTorResumableBet } from '../game/utils';
	import type { Bet } from '../game/typesBookEvent';
	import books from './data/bonus_books';
	import rgsRounds from './data/rgs_rounds';

	// real server round (betID 273392380): trigger, 10 + 5 free spins, every feature
	const rgsFreeSpins = rgsRounds[0] as unknown as Bet;
	// real Mutant Free Spins round (LUCKY_DRAW_FEATURE_HEAVY, betID 274417160): opens with buyFreeSpins;
	// free spin 4's event 52 pays two wins sharing a bomb's Wild (the round that hung)
	const rgsFeatureHeavy = rgsRounds[1] as unknown as Bet;
	// real Operation Free Spins round (LUCKY_DRAW_FREE_SPINS, betID 291105104): Evtim's reload during free spin 2
	const rgsOperation = rgsRounds[2] as unknown as Bet;

	
	setContext();
</script>

{#snippet template(args: TemplateArgs<any>)}
	<StoryGameTemplate
		skipLoadingScreen={args.skipLoadingScreen}
		action={async () => {
			await args.action?.(args.data);
		}}
	>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
{/snippet}

<Story
	name="random"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => {
			const index = randomInteger({ min: 0, max: books.length - 1 });
			const data = books[index];
			console.log('Running a book at index', index);
			await playBet({ ...data, state: data.events });
		},
	})}
	{template}
/>

<Story
	name="rgs free spins"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => await playBet(rgsFreeSpins),
	})}
	{template}
/>

<!-- the reload path: the snapshot of events 0-8, then the round from event 9 on -->
<Story
	name="rgs free spins resume"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => await playBet(convertTorResumableBet(rgsFreeSpins)),
	})}
	{template}
/>

<Story
	name="rgs feature heavy buy"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => await playBet(rgsFeatureHeavy),
	})}
	{template}
/>

<!-- the reload it came from: resumes at free spin 4 (event 46), one spin before
     the double-win Wild of event 52 -->
<Story
	name="rgs feature heavy resume"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => await playBet(convertTorResumableBet(rgsFeatureHeavy)),
	})}
	{template}
/>

<Story
	name="rgs operation buy"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => await playBet(rgsOperation),
	})}
	{template}
/>

<!-- Evtim's reload (event 11 = free spin 2's reveal): must open straight on spin 2,
     counter 2 / 10, total win 40, with no base game, curtains or intro -->
<Story
	name="rgs operation resume"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => await playBet(convertTorResumableBet(rgsOperation)),
	})}
	{template}
/>
