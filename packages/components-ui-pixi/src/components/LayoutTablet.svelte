<script lang="ts">
	import { stateUi, stateModal } from 'state-shared';
	import { BLACK, WHITE } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, Text, Sprite } from 'pixi-svelte';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { stateBet, stateBetDerived } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { Button } from 'components-pixi';

	import { getContext } from '../context';
	import type { LayoutUiProps } from '../types';

	import { i18nDerived } from '../i18n/i18nDerived';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const w = $derived(context.stateLayoutDerived.mainLayoutStandard().width);
	const h = $derived(context.stateLayoutDerived.mainLayoutStandard().height);
	const cx = $derived(w * 0.5);

	// Bottom bar text style
	const labelStyle = {
		fontFamily: 'Inter',
		fontSize: 36,
		fontWeight: '700',
		fill: 0xc0c8d0,
		letterSpacing: 2,
	} as const;

	const valueStyle = {
		fontFamily: 'Inter',
		fontSize: 44,
		fontWeight: '700',
		fill: WHITE,
		letterSpacing: 1,
	} as const;

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

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<!-- Bottom bar -->
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

	<!-- Menu button in bar (far left) -->
	<Container x={60} y={h - 65} scale={0.5}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<!-- BALANCE -->
	<Container x={w * 0.25} y={h - 65}>
		<Text text={i18nDerived.balance()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
		<Text text={balanceValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} />
	</Container>

	<!-- WIN -->
	<Container x={cx} y={h - 65}>
		<Text text={i18nDerived.win()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
		<Text text={winValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} />
	</Container>

	<!-- BET -->
	<Container x={w * 0.75} y={h - 65}>
		<Text text={i18nDerived.bet()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
		<Text text={betValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} />
	</Container>

	<!-- Buttons above bar -->
	<Container x={cx - 400} y={h - 250} scale={0.6}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<Container x={cx - 220} y={h - 250} scale={0.6}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>

	<!-- SPIN (hero) -->
	<Container x={cx} y={h - 300} scale={1.4}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<Container x={cx + 220} y={h - 250} scale={0.6}>
		{@render props.buttonTurbo({ anchor: 0.5 })}
	</Container>

	<Container x={cx + 400} y={h - 250} scale={0.6}>
		<Button
			anchor={0.5}
			sizes={{ width: 150, height: 150 }}
			disabled={betDisabled}
			onpress={onBetPress}
		>
			{#snippet children({ center, hovered, pressed })}
				<Sprite
					{...center}
					key="bet.png"
					anchor={0.5}
					width={150}
					height={150}
					alpha={betDisabled ? 0.4 : hovered || pressed ? 1 : 0.85}
				/>
			{/snippet}
		</Button>
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
		<Container x={60} y={h - 65}>
			<Container y={-800} scale={0.6}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container y={-640} scale={0.6}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={-480} scale={0.6}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container y={-320} scale={0.6}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container y={-160} scale={0.6}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
