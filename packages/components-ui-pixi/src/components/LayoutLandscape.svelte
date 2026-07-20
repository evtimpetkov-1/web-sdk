<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';

	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';

	const props: LayoutUiProps = $props();
	const context = getContext();

	// Landscape design space: 1600 x 900
	const w = $derived(context.stateLayoutDerived.mainLayoutStandard().width);
	const h = $derived(context.stateLayoutDerived.mainLayoutStandard().height);
	const cx = $derived(w * 0.5);

	// Row baseline — centered in bottom bar
	const rowY = $derived(h - 65);
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
		height={130}
		backgroundColor={0x000000}
		backgroundAlpha={0.5}
		borderRadius={14}
	/>

	<!-- Left: Menu + BuyBonus -->
	<Container x={55} y={rowY} scale={0.45}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<Container x={150} y={rowY} scale={0.45}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<!-- BALANCE -->
	<Container x={400} y={rowY} scale={0.45}>
		{@render props.amountBalance({ stacked: true })}
	</Container>

	<!-- WIN -->
	<Container x={cx} y={rowY} scale={0.45}>
		{@render props.amountWin({ stacked: true })}
	</Container>

	<!-- [-] BET [+] — BET first, buttons on top -->
	<Container x={1110} y={rowY} scale={0.45}>
		{@render props.amountBet({ stacked: true })}
	</Container>

	<Container x={1110 - 75} y={rowY} scale={0.5}>
		{@render props.buttonDecrease({ anchor: 0.5 })}
	</Container>

	<Container x={1110 + 75} y={rowY} scale={0.5}>
		{@render props.buttonIncrease({ anchor: 0.5 })}
	</Container>

	<!-- AutoSpin -->
	<Container x={w - 300} y={rowY} scale={0.45}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>

	<!-- SPIN — hero, extends above bar -->
	<Container x={w - 170} y={rowY} scale={1.0}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<!-- Turbo -->
	<Container x={w - 50} y={rowY} scale={0.45}>
		{@render props.buttonTurbo({ anchor: 0.5 })}
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
		<Container x={cx} y={h - 170}>
			<Container y={-640} scale={0.6}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container y={-480} scale={0.6}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={-320} scale={0.6}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container y={-160} scale={0.6}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container scale={0.6}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
