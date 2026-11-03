<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { stateBet } from 'state-shared';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { counterText } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder } from '../i18n/format';

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
	 * Portrait (2026-10-26): one line in the right half of the frame's bottom
	 * pipe, mirroring FREE SPINS (stateGame portraitCounterLayout).
	 */
	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const boardWidth = $derived(context.stateGameDerived.boardLayout().width);
	const line = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait'
			? context.stateGameDerived.portraitCounterLayout()
			: undefined,
	);
	const room = $derived(boardWidth - (plate.x + plate.width / 2));
	const x = $derived(boardWidth - room / 2);
	const y = $derived(plate.y);
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
		{#if line}
			<Sprite
				key="msCounterPlate"
				anchor={0.5}
				x={line.right}
				y={line.y}
				width={line.plate.width}
				height={line.plate.height}
			/>
			<ResponsiveText
				anchor={{ x: 0.5, y: 0.5 }}
				x={line.right}
				y={line.textY}
				maxWidth={line.maxWidth}
				text={`${i18nDerived.totalWin()} ${drawnOrder(bookEventAmountToWinCurrencyString(shown.current))}`}
				style={counterText(line.size)}
			/>
		{:else}
			<Container {x} {y}>
				<ResponsiveText
					anchor={{ x: 0.5, y: 1 }}
					y={-GAP}
					maxWidth={room * 0.95}
					text={i18nDerived.totalWin()}
					style={counterText(LABEL_SIZE)}
				/>
				<ResponsiveText
					anchor={{ x: 0.5, y: 0 }}
					y={GAP}
					maxWidth={room * 0.95}
					text={drawnOrder(bookEventAmountToWinCurrencyString(shown.current))}
					style={counterText(VALUE_SIZE)}
				/>
			</Container>
		{/if}
	</BoardContainer>
</FadeContainer>
