<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { stateBet } from 'state-shared';
	import { bookEventAmountToWinCurrencyString, numberToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { replayTotalCost } from '../game/replayRound';
	import { i18nDerived } from '../i18n/i18nDerived';

	/**
	 * The readouts that stay on screen WHILE a replay plays back.
	 *
	 * Replay mode hides the whole <UI> (no balance, no spin, no bet selector, no
	 * autoplay), which left nothing visible at all. The approval docs' replay
	 * "Keep / Show" column asks for the win amount, the replay bet amount and
	 * the currency to remain visible throughout — this is that, and nothing
	 * more: no buttons, so there is no route back into normal play.
	 *
	 * Styled as the game's own bottom bar (same plate, same Cinzel gold caption
	 * over a white value) so it reads as part of the game rather than a
	 * platform overlay — the balance column is simply given over to a standing
	 * REPLAY marker.
	 */
	const context = getContext();

	const w = $derived(context.stateLayoutDerived.mainLayoutStandard().width);
	const h = $derived(context.stateLayoutDerived.mainLayoutStandard().height);
	const cx = $derived(w * 0.5);
	const isDesktop = $derived(context.stateLayoutDerived.layoutType() === 'desktop');

	/**
	 * Copied from the real bars so the plate lands exactly where the player is
	 * used to it: desktop runs a shorter bar and smaller type, every other
	 * layout shares the taller one (see LayoutDesktop vs Portrait / Landscape /
	 * Tablet in components-ui-pixi).
	 */
	const barHeight = $derived(isDesktop ? 115 : 140);
	const barTop = $derived(isDesktop ? h - 115 : h - 130);
	const rowY = $derived(isDesktop ? h - 58 : h - 65);

	const labelStyle = $derived({
		fontFamily: 'Cinzel',
		fontSize: isDesktop ? 26 : 34,
		fontWeight: '700',
		fill: 0xffd700,
		letterSpacing: 2,
	} as const);

	const valueStyle = $derived({
		fontFamily: 'Inter',
		fontSize: isDesktop ? 33 : 44,
		fontWeight: '700',
		fill: 0xffffff,
		letterSpacing: 1,
		dropShadow: { color: 0x000000, blur: 3, distance: 2, alpha: 0.5 },
	} as const);

	/**
	 * Three proportional columns, mirroring the real bar's BALANCE / WIN / BET
	 * rhythm with the balance slot given over to a standing REPLAY marker.
	 * Everything is a fraction of the standard width, so the same numbers hold
	 * for the 1920-wide layouts and the 1080-wide portrait one — absolute
	 * offsets collided with the WIN column in portrait.
	 */
	const markerX = $derived(w * 0.2);
	const winX = $derived(w * 0.5);
	const betX = $derived(w * 0.8);
	const markerMaxWidth = $derived(w * 0.22);
	// a safety cap only — it never binds on the amounts themselves
	const columnMaxWidth = $derived(w * 0.26);

	const winValue = $derived(bookEventAmountToWinCurrencyString(stateBet.winBookEventAmount));
	// the REAL cost: base bet x the round's cost multiplier. Not
	// stateBetDerived.betCost(), which only applies a multiplier for 'activate'
	// modes and so would report a bought round at its base bet.
	const betValue = $derived(numberToCurrencyString(replayTotalCost()));
</script>

<MainContainer standard alignVertical="bottom">
	<Rectangle
		x={cx}
		y={barTop}
		anchor={{ x: 0.5, y: 0 }}
		width={w + 20}
		height={barHeight}
		backgroundColor={0x000000}
		backgroundAlpha={0.7}
		borderRadius={14}
	/>

	<!-- standing REPLAY marker, in the slot the balance readout normally holds,
	     so it stays obvious throughout that this is a replay, not a live round -->
	<Container x={markerX} y={rowY}>
		<ResponsiveText
			text={i18nDerived.replay()}
			style={labelStyle}
			anchor={0.5}
			maxWidth={markerMaxWidth}
		/>
	</Container>

	<!-- WIN -->
	<Container x={winX} y={rowY}>
		<ResponsiveText
			text={i18nDerived.win()}
			style={labelStyle}
			anchor={{ x: 0.5, y: 1 }}
			y={-6}
			maxWidth={columnMaxWidth}
		/>
		<ResponsiveText
			text={winValue}
			style={valueStyle}
			anchor={{ x: 0.5, y: 0 }}
			y={4}
			maxWidth={columnMaxWidth}
		/>
	</Container>

	<!-- BET — the amount the round actually cost -->
	<Container x={betX} y={rowY}>
		<ResponsiveText
			text={i18nDerived.bet()}
			style={labelStyle}
			anchor={{ x: 0.5, y: 1 }}
			y={-6}
			maxWidth={columnMaxWidth}
		/>
		<ResponsiveText
			text={betValue}
			style={valueStyle}
			anchor={{ x: 0.5, y: 0 }}
			y={4}
			maxWidth={columnMaxWidth}
		/>
	</Container>
</MainContainer>
