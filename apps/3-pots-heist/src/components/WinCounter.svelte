<script lang="ts" module>
	export type EmitterEventWinCounter =
		| { type: 'winCounterShow' }
		| { type: 'winCounterHide' }
		| { type: 'winCounterUpdate'; amount: number };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { reachesTotalBet } from '../game/utils';
	import { counterText } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder } from '../i18n/format';

	/**
	 * The base game's WIN line on the frame's bottom steel (stateGame counterLine):
	 * what the spin paid. A win that reaches the bet counts up; a smaller one just
	 * shows. It stays up after its round and leaves when the next spin starts. In free
	 * spins the TOTAL WIN line stands in for it (FreeSpinTotalWin).
	 */
	const context = getContext();
	const line = $derived(context.stateGameDerived.counterLine());
	const COUNT_MS = 500;

	let show = $state(false);
	const amount = new Tween(0, { duration: COUNT_MS, easing: cubicOut });
	const visible = $derived(show && context.stateGame.gameType !== 'freegame');
	// the figure frozen as the line fades out, so the next spin's reset does not flash
	let frozen = $state<number | null>(null);
	const shown = $derived(frozen ?? amount.current);

	context.eventEmitter.subscribeOnMount({
		winCounterShow: () => {
			frozen = null;
			amount.set(0, { duration: 0 });
			show = true;
		},
		winCounterHide: () => {
			if (show) frozen = amount.current;
			show = false;
		},
		winCounterUpdate: async (emitterEvent) => {
			await amount.set(emitterEvent.amount, {
				duration: reachesTotalBet(emitterEvent.amount) ? COUNT_MS : 0,
			});
		},
	});
</script>

<FadeContainer show={visible}>
	<BoardContainer>
		<ResponsiveText
			anchor={{ x: 0.5, y: 0.5 }}
			x={line.centre}
			y={line.y}
			maxWidth={line.maxWidth}
			text={`${i18nDerived.win()} ${drawnOrder(bookEventAmountToWinCurrencyString(shown))}`}
			style={counterText(line.size)}
		/>
	</BoardContainer>
</FadeContainer>
