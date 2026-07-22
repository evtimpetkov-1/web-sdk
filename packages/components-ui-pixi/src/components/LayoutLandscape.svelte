<script lang="ts">
	import { stateUi, stateModal } from 'state-shared';
	import { BLACK, WHITE } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, Text, Sprite } from 'pixi-svelte';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { stateBet, stateBetDerived } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { Button } from 'components-pixi';

	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';

	const props: LayoutUiProps = $props();
	const context = getContext();

	// Landscape design space: 1600 x 900
	const w = $derived(context.stateLayoutDerived.mainLayoutStandard().width);
	const h = $derived(context.stateLayoutDerived.mainLayoutStandard().height);
	const cx = $derived(w * 0.5);

	// Right button column — spin moved left, small buttons flanking
	const btnX = $derived(w - 180);
	const spinY = $derived((h - 100) * 0.5);

	// Bottom bar text style
	const labelStyle = {
		fontFamily: 'proxima-nova',
		fontSize: 36,
		fontWeight: '700',
		fill: 0xc0c8d0,
		letterSpacing: 2,
	} as const;

	const valueStyle = {
		fontFamily: 'proxima-nova',
		fontSize: 44,
		fontWeight: '700',
		fill: WHITE,
		letterSpacing: 1,
	} as const;

	// Reactive values for bottom bar
	const balanceValue = $derived(numberToCurrencyString(stateBet.balanceAmount));
	const winValue = $derived(bookEventAmountToCurrencyString(stateBet.winBookEventAmount));
	const betValue = $derived(numberToCurrencyString(stateBetDerived.betCost()));

	// Bet button handler
	const betDisabled = $derived(!context.stateXstateDerived.isIdle());
	const onBetPress = () => {
		if (betDisabled) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<!-- Logo: left side, vertically centered -->
<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.17}
	y={context.stateLayoutDerived.canvasSizes().height * 0.34}
	scale={0.7}
>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<!-- Bottom info bar -->
	<Rectangle
		x={cx}
		y={h - 130}
		anchor={{ x: 0.5, y: 0 }}
		width={w + 20}
		height={140}
		backgroundColor={0x000000}
		backgroundAlpha={0.7}
		borderRadius={14}
	/>

	<!-- BALANCE -->
	<Container x={250} y={h - 65}>
		<Text text={i18nDerived.balance()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
		<Text text={balanceValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} />
	</Container>

	<!-- WIN -->
	<Container x={cx} y={h - 65}>
		<Text text={i18nDerived.win()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
		<Text text={winValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} />
	</Container>

	<!-- BET or Free Spin Counter -->
	{#if stateUi.freeSpinCounterShow}
		<Container x={w - 350} y={h - 65} scale={0.48}>
			<LabelFreeSpinCounter stacked />
		</Container>
	{:else}
		<Container x={w - 350} y={h - 65}>
			<Text text={i18nDerived.bet()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
			<Text text={betValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} />
		</Container>
	{/if}

	<!-- Right button column -->
	<!-- Menu (top) -->
	<Container x={w - 80} y={spinY - 320} scale={0.77}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<!-- AutoSpin -->
	<Container x={w - 80} y={spinY - 180} scale={0.77}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>

	<!-- SPIN (hero) — bigger and moved left -->
	<Container x={btnX} y={spinY} scale={1.43}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<!-- Turbo -->
	<Container x={w - 80} y={spinY + 180} scale={0.77}>
		{@render props.buttonTurbo({ anchor: 0.5 })}
	</Container>

	<!-- Bet settings button -->
	<Container x={w - 80} y={spinY + 320} scale={0.77}>
		<Button
			anchor={0.5}
			sizes={{ width: 150, height: 150 }}
			disabled={betDisabled}
			onpress={onBetPress}
		>
			{#snippet children({ center, hovered, pressed })}
				<Sprite
					{...center}
					key="betButton"
					anchor={0.5}
					width={150}
					height={150}
					alpha={betDisabled ? 0.4 : hovered || pressed ? 1 : 0.85}
				/>
			{/snippet}
		</Button>
	</Container>
	<!-- Bet amount below button -->
	<Container x={w - 80} y={spinY + 395}>
		<Text
			text={betValue}
			anchor={{ x: 0.5, y: 0 }}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: 24,
				fontWeight: '700',
				fill: WHITE,
			}}
		/>
	</Container>
</MainContainer>

{#if stateUi.menuOpen}
	<Rectangle
		eventMode="static"
		cursor="pointer"
		alpha={0.5}
		anchor={0.5}
		backgroundColor={BLACK}
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={context.stateLayoutDerived.canvasSizes().height * 0.5}
		onpointerup={() => (stateUi.menuOpen = false)}
	/>

	<MainContainer standard alignVertical="bottom">
		<!-- Horizontal menu row, opening left from menu button -->
		<Container x={w - 80} y={spinY - 320}>
			<Container x={-150} scale={0.77}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container x={-300} scale={0.77}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container x={-450} scale={0.77}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container x={-600} scale={0.77}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container scale={0.77}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
