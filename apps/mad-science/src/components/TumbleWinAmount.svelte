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

	import { Container } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { counterText } from '../game/textStyles';

	/**
	 * The spin's running cascade win in the base game: a WIN counter on the
	 * frame's top pipe, right of the multiplier plate — the spot and the style
	 * of the free spins' TOTAL WIN (FreeSpinTotalWin), which holds it in free
	 * spins. Replaces the template's tumble_win spine + gold font panel.
	 * An update resolves once its count-up has landed, as the panel's did.
	 */
	const context = getContext();

	const plate = $derived(context.stateGameDerived.multiplierPlateLayout());
	const boardWidth = $derived(context.stateGameDerived.boardLayout().width);
	const room = $derived(boardWidth - (plate.x + plate.width / 2));
	const x = $derived(boardWidth - room / 2);
	const y = $derived(plate.y);
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 0.75 : 1);
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
		<Container {x} {y} {scale}>
			<ResponsiveText
				anchor={{ x: 0.5, y: 1 }}
				y={-GAP}
				maxWidth={room * 0.95}
				text="WIN"
				style={counterText(LABEL_SIZE)}
			/>
			<ResponsiveText
				anchor={{ x: 0.5, y: 0 }}
				y={GAP}
				maxWidth={room * 0.95}
				text={bookEventAmountToWinCurrencyString(amount.current)}
				style={counterText(VALUE_SIZE)}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
