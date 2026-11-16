<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'MODE_CASH_RESPINS/book',
	});
</script>

<script lang="ts">
	import { StoryGameTemplate, StoryLocale, type TemplateArgs, templateArgs } from 'components-storybook';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet, convertTorResumableBet } from '../game/utils';
	import type { Bet } from '../game/typesBookEvent';
	import books from './data/cash_respins_books';
	import rgsRounds from './data/cash_respins_rounds';

	/**
	 * Chaos Lab 2's Cash Respins from the math's first two books (2026-11-03):
	 * the base spin, the trigger, the respins, the collect and the outro.
	 */
	const play = (book: (typeof books)[number]) => playBet({ ...book, state: book.events } as unknown as Bet);

	// Evtim's Overcharged Respins buy (betID 340324515), as the RGS returned it
	const rgsOvercharged = rgsRounds[0] as unknown as Bet;

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

<!-- 4 Scatters: empty grid; a bomb, two multiplier frames, a cloner spreading onto a x5 frame -->
<Story
	name="4 scatters (3135032)"
	args={templateArgs({ skipLoadingScreen: true, data: {}, action: async () => await play(books[0]) })}
	{template}
/>

<!-- 5 Scatters: 5 starting frames; a coin on a x10 frame, then a cloner and a bomb in one respin -->
<Story
	name="5 scatters, starting frames (3964721)"
	args={templateArgs({ skipLoadingScreen: true, data: {}, action: async () => await play(books[1]) })}
	{template}
/>

<!-- a bought round: buyCashRespins, all 30 positions framed, 139x -->
<Story
	name="rgs overcharged buy (340324515)"
	args={templateArgs({ skipLoadingScreen: true, data: {}, action: async () => await playBet(rgsOvercharged) })}
	{template}
/>

<!-- the same round reloaded at respin 4 (cursor = event 9, its cashRespinLand): must open
     straight on the grid with 5 purple coins (2x, 50x, 25x, 2x, 5x), every frame dimmed,
     RESPINS LEFT 3, no base game, curtains or intro, then play on from that respin -->
<Story
	name="rgs overcharged resume (respin 4)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => await playBet(convertTorResumableBet({ ...rgsOvercharged, event: '9' } as Bet)),
	})}
	{template}
/>
