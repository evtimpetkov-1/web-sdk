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
	import { reachesTotalBet } from '../game/utils';
	import { counterText } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { drawnOrder } from '../i18n/format';

	/**
	 * The spin's running cascade win in the base game: a WIN counter on the
	 * frame's top pipe, right of the multiplier plate — the spot and the style
	 * of the free spins' TOTAL WIN (FreeSpinTotalWin), which holds it in free
	 * spins. Replaces the template's tumble_win spine + gold font panel.
	 * Portrait (2026-10-26), and desktop / landscape since 2026-11-20: one line on
	 * a counter plate in the middle of the beam under the reels (stateGame
	 * winBeamLayout).
	 * An update resolves once its count-up has landed, as the panel's did.
	 * It stays up after its round (the win box is for big wins only, Evtim
	 * 2026-11-04) and fades out as the next spin starts.
	 */
	const context = getContext();

	// one line on the beam under the reels (portrait, desktop / landscape), else label over value
	const line = $derived(context.stateGameDerived.winBeamLayout(false));
	// right of the plate on its beam, or under it beside the frame (stateGame counterSpots)
	const spot = $derived(context.stateGameDerived.counterSpots().right);
	const room = $derived(spot.room);
	const x = $derived(spot.x);
	const y = $derived(spot.y);
	const LABEL_SIZE = SYMBOL_SIZE * 0.26;
	const VALUE_SIZE = SYMBOL_SIZE * 0.36;
	const GAP = SYMBOL_SIZE * 0.02;
	// a plain cascade step glides up; a multiplied one (boardMultiplierInfo) takes its
	// time; a running win still below the total bet just shows (Evtim, 2026-11-04)
	const STEP_MS = 400;
	const MULTIPLIED_MS = 700;

	let show = $state(false);
	const amount = new Tween(0, { duration: STEP_MS, easing: cubicOut });
	const visible = $derived(show && context.stateGame.gameType !== 'freegame');
	// the figure frozen as the counter fades out, so the next spin's reset to 0
	// does not flash on its way out
	let frozen = $state<number | null>(null);
	const shown = $derived(frozen ?? amount.current);

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: () => {
			frozen = null;
			show = true;
		},
		tumbleWinAmountHide: () => {
			if (show) frozen = amount.current;
			show = false;
		},
		tumbleWinAmountReset: () => amount.set(0, { duration: 0 }),
		tumbleWinAmountUpdate: async (emitterEvent) => {
			if (emitterEvent.amount === amount.target) return;
			const glide = emitterEvent.animate ? MULTIPLIED_MS : STEP_MS;
			await amount.set(emitterEvent.amount, {
				duration: reachesTotalBet(emitterEvent.amount) ? glide : 0,
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
				text={`${i18nDerived.win()} ${drawnOrder(bookEventAmountToWinCurrencyString(shown))}`}
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
					text={drawnOrder(bookEventAmountToWinCurrencyString(shown))}
					style={counterText(VALUE_SIZE)}
				/>
			</Container>
		{/if}
	</BoardContainer>
</FadeContainer>
