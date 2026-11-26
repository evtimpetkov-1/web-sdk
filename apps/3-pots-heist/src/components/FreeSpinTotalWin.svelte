<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { stateBet } from 'state-shared';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { counterText } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder } from '../i18n/format';

	/**
	 * TOTAL WIN: the feature's running total (the book's last setTotalWin), one line in
	 * the right half of the frame's bottom steel. Shown for the same span as the free
	 * spins counter.
	 */
	const context = getContext();
	const line = $derived(context.stateGameDerived.counterLine());

	const shown = new Tween(0, { duration: 400, easing: cubicOut });
	$effect(() => {
		shown.set(stateBet.winBookEventAmount);
	});

	let show = $state(false);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<ResponsiveText
			anchor={{ x: 0.5, y: 0.5 }}
			x={line.right}
			y={line.y}
			maxWidth={line.maxWidth}
			text={`${i18nDerived.totalWin()} ${drawnOrder(bookEventAmountToWinCurrencyString(shown.current))}`}
			style={counterText(line.size)}
		/>
	</BoardContainer>
</FadeContainer>
