<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { stateBet } from 'state-shared';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { counterText } from '../game/textStyles';

	const context = getContext();

	/**
	 * TOTAL WIN counter on the frame's top pipe, right of the multiplier plate —
	 * the mirror of FreeSpinCounter (Evtim's FS mockup, 2026-09-08). Shown for
	 * the same span as the spins counter.
	 *
	 * The figure is the feature's running total, live: the book's last
	 * setTotalWin (stateBet.winBookEventAmount) plus the cascade win of the spin
	 * in progress (stateGame.tumbleWin, which setTotalWin folds in and zeroes),
	 * so it climbs with every cascade instead of jumping once per spin. The
	 * tumble win panel stays hidden in free spins; this is its stand-in.
	 */
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const boardWidth = $derived(context.stateGameDerived.boardLayout().width);
	const room = $derived(boardWidth - (plate.x + plate.width / 2));
	const x = $derived(boardWidth - room / 2);
	const y = $derived(plate.y);
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 0.75 : 1);
	const LABEL_SIZE = SYMBOL_SIZE * 0.26;
	const VALUE_SIZE = SYMBOL_SIZE * 0.36;
	const GAP = SYMBOL_SIZE * 0.02;

	const total = $derived(stateBet.winBookEventAmount + context.stateGame.tumbleWin);
	const shown = new Tween(0, { duration: 400, easing: cubicOut });
	$effect(() => {
		shown.set(total);
	});

	let show = $state(false);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {x} {y} {scale}>
			<ResponsiveText
				anchor={{ x: 0.5, y: 1 }}
				y={-GAP}
				maxWidth={room * 0.95}
				text="TOTAL WIN"
				style={counterText(LABEL_SIZE)}
			/>
			<ResponsiveText
				anchor={{ x: 0.5, y: 0 }}
				y={GAP}
				maxWidth={room * 0.95}
				text={bookEventAmountToWinCurrencyString(shown.current)}
				style={counterText(VALUE_SIZE)}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
