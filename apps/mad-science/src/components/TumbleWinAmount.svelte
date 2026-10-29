<script lang="ts" module>
	export type EmitterEventTumbleWinAmount =
		| { type: 'tumbleWinAmountShow' }
		| { type: 'tumbleWinAmountHide' }
		| { type: 'tumbleWinAmountReset' }
		| { type: 'tumbleWinAmountUpdate'; amount: number; animate: boolean };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { counterText } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder } from '../i18n/format';

	/**
	 * The spin's running cascade win in the base game: a WIN counter on the
	 * frame's top pipe, right of the multiplier plate — the spot and the style
	 * of the free spins' TOTAL WIN (FreeSpinTotalWin), which holds it in free
	 * spins. Replaces the template's tumble_win spine + gold font panel.
	 * Portrait (2026-10-26): one line in the middle of the frame's bottom pipe,
	 * where the counters moved (stateGame portraitCounterLayout).
	 * An update resolves once its count-up has landed, as the panel's did.
	 */
	const context = getContext();

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
	// a plain cascade step glides up; a multiplied one (boardMultiplierInfo) takes its time
	const STEP_MS = 400;
	const MULTIPLIED_MS = 700;

	let show = $state(false);
	const amount = new Tween(0, { duration: STEP_MS, easing: cubicOut });
	const visible = $derived(show && context.stateGame.gameType !== 'freegame');

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: () => (show = true),
		tumbleWinAmountHide: () => (show = false),
		tumbleWinAmountReset: () => amount.set(0, { duration: 0 }),
		tumbleWinAmountUpdate: async (emitterEvent) => {
			if (emitterEvent.amount === amount.target) return;
			await amount.set(emitterEvent.amount, {
				duration: emitterEvent.animate ? MULTIPLIED_MS : STEP_MS,
			});
		},
	});
</script>

<FadeContainer show={visible}>
	<BoardContainer>
		{#if line}
			<Sprite
				key="msCounterPlate"
				anchor={0.5}
				x={boardWidth / 2}
				y={line.y}
				width={line.plate.width}
				height={line.plate.height}
			/>
			<ResponsiveText
				anchor={{ x: 0.5, y: 0.5 }}
				x={boardWidth / 2}
				y={line.textY}
				maxWidth={line.maxWidth}
				text={`${i18nDerived.win()} ${drawnOrder(bookEventAmountToWinCurrencyString(amount.current))}`}
				style={counterText(line.size)}
			/>
		{:else}
			<Container {x} {y}>
				<ResponsiveText
					anchor={{ x: 0.5, y: 1 }}
					y={-GAP}
					maxWidth={room * 0.95}
					text={i18nDerived.win()}
					style={counterText(LABEL_SIZE)}
				/>
				<ResponsiveText
					anchor={{ x: 0.5, y: 0 }}
					y={GAP}
					maxWidth={room * 0.95}
					text={drawnOrder(bookEventAmountToWinCurrencyString(amount.current))}
					style={counterText(VALUE_SIZE)}
				/>
			</Container>
		{/if}
	</BoardContainer>
</FadeContainer>
