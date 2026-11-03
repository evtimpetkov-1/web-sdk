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
	import { playBet } from '../game/utils';
	import type { Bet } from '../game/typesBookEvent';
	import books from './data/cash_respins_books';

	/**
	 * Chaos Lab 2's Cash Respins from the math's first two books (2026-11-03):
	 * the base spin, the trigger, the respins, the collect and the outro.
	 */
	const play = (book: (typeof books)[number]) => playBet({ ...book, state: book.events } as unknown as Bet);

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
