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
	 * pipe, mirroring FREE SPINS; desktop / landscape (2026-11-20): one line in the
	 * middle of that beam, where the base game's WIN is (stateGame winBeamLayout).
	 */
	// one line on the beam under the reels (portrait: its right half; desktop /
	// landscape: its middle), else label over value beside the plate (tablet)
	const line = $derived(context.stateGameDerived.winBeamLayout(true));
	// right of the plate on its beam, or under it beside the frame (stateGame counterSpots)
	const spot = $derived(context.stateGameDerived.counterSpots().right);
	const room = $derived(spot.room);
	const x = $derived(spot.x);
	const y = $derived(spot.y);
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
				x={line.x}
				y={line.y}
				width={line.plate.width}
				height={line.plate.height}
			/>
			<ResponsiveText
				anchor={{ x: 0.5, y: 0.5 }}
				x={line.x}
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
