<script lang="ts">
	import { stateUi, stateConfig, stateModal } from 'state-shared';
	import { BLACK, WHITE } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Circle, Container, Rectangle, Text, Sprite } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { stateBet, stateBetDerived } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { Button } from 'components-pixi';

	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';


	const props: LayoutUiProps = $props();
	const context = getContext();

	// Desktop design space: 1920 x 1080
	const w = $derived(context.stateLayoutDerived.mainLayoutStandard().width);
	const h = $derived(context.stateLayoutDerived.mainLayoutStandard().height);
	const cx = $derived(w * 0.5);

	// Row baseline — centered in bottom bar
	const rowY = $derived(h - 58);

	// Bottom bar text style
	const labelStyle = {
		fontFamily: 'Cinzel',
		fontSize: 26,
		fontWeight: '700',
		fill: 0xffd700,
		letterSpacing: 2,
	} as const;

	const valueStyle = {
		fontFamily: 'Inter',
		fontSize: 33,
		fontWeight: '700',
		fill: WHITE,
		letterSpacing: 1,
		dropShadow: { color: 0x000000, blur: 3, distance: 2, alpha: 0.5 },
	} as const;

	// Reactive values for bottom bar
	const balanceValue = $derived(numberToCurrencyString(stateBet.balanceAmount));
	const winValue = $derived(bookEventAmountToCurrencyString(stateBet.winBookEventAmount));
	const betValue = $derived(numberToCurrencyString(stateBetDerived.betCost()));
	const labelMaxWidth = $derived(w * 0.15);

	// +/- bet logic
	const smallest = $derived(stateConfig.betAmountOptions[0]);
	const biggest = $derived(stateConfig.betAmountOptions[stateConfig.betAmountOptions.length - 1]);
	const decDisabled = $derived(
		!context.stateXstateDerived.isIdle() || stateBet.betAmount === smallest,
	);
	const incDisabled = $derived(
		!context.stateXstateDerived.isIdle() || stateBet.betAmount === biggest,
	);

	const onDecrease = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		const nextSmaller = [...stateConfig.betAmountOptions]
			.sort((a, b) => b - a)
			.find((o) => o < stateBet.betAmount);
		stateBetDerived.setBetAmount(nextSmaller || smallest);
	};

	const onIncrease = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		const nextBigger = [...stateConfig.betAmountOptions]
			.sort((a, b) => a - b)
			.find((o) => o > stateBet.betAmount);
		stateBetDerived.setBetAmount(nextBigger || biggest);
	};

	/**
	 * 2026-08-28 stepper redesign: the -/+ render as code-drawn chips (navy
	 * fill, gold rim and glyph — the buy-shop stepper's voice) instead of the
	 * grey minus.png/plus.png sprites. Set true to revert to the sprites.
	 */
	const CLASSIC_STEPPER_SPRITES = false;

	// BET label + amount press → bet menu (same behavior as LabelBet)
	const betMenuDisabled = $derived(!context.stateXstateDerived.isIdle());
	const onBetMenu = () => {
		if (betMenuDisabled) return;
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
		y={h - 115}
		anchor={{ x: 0.5, y: 0 }}
		width={w + 20}
		height={115}
		backgroundColor={0x000000}
		backgroundAlpha={0.7}
		borderRadius={14}
	/>

	<!-- Left: Menu + BuyBonus -->
	<Container x={120} y={rowY} scale={0.42}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<Container x={220} y={rowY} scale={0.6}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<!-- BALANCE -->
	<Container x={w * 0.33} y={rowY}>
		<Text text={i18nDerived.balance()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
		<ResponsiveText text={balanceValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} maxWidth={labelMaxWidth} />
	</Container>

	<!-- WIN -->
	<Container x={cx} y={rowY}>
		<Text text={i18nDerived.win()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
		<ResponsiveText text={winValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} maxWidth={labelMaxWidth} />
	</Container>

	<!-- BET (press to open the bet menu; the +/- buttons render above and keep priority) -->
	<Container
		x={w * 0.67}
		y={rowY}
		eventMode="static"
		cursor={betMenuDisabled ? 'not-allowed' : 'pointer'}
		onpointerup={onBetMenu}
	>
		<Rectangle anchor={0.5} width={110} height={90} backgroundColor={0xffffff} backgroundAlpha={0} />
		<!-- 140 not 100: EINSATZ / APUESTA / TARUHAN shrank to 2/3; the -/+ chips
		     sit at ±80 (chip edge at ±55), so 140 still clears them -->
		<ResponsiveText text={i18nDerived.bet()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} maxWidth={140} />

		<ResponsiveText text={betValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} maxWidth={labelMaxWidth} />
	</Container>

	<!-- -/+ bet buttons -->
	{#snippet betChip(kind: 'minus' | 'plus', hovered: boolean, disabled: boolean)}
		<!-- navy chip, gold rim + glyph — the buy-shop stepper's voice in pixi -->
		<Container alpha={disabled ? 0.35 : 1} scale={hovered && !disabled ? 1.08 : 1}>
			<Circle
				anchor={0.5}
				diameter={46}
				backgroundColor={0x0d2c44}
				backgroundAlpha={0.95}
				borderColor={hovered && !disabled ? 0xffe282 : 0xc8a24a}
				borderWidth={2.5}
				borderAlpha={0.95}
			/>
			<Rectangle
				anchor={0.5}
				width={20}
				height={4.5}
				borderRadius={2}
				backgroundColor={hovered && !disabled ? 0xffe282 : 0xffd700}
			/>
			{#if kind === 'plus'}
				<Rectangle
					anchor={0.5}
					width={4.5}
					height={20}
					borderRadius={2}
					backgroundColor={hovered && !disabled ? 0xffe282 : 0xffd700}
				/>
			{/if}
		</Container>
	{/snippet}

	<Container x={w * 0.67 - 80} y={rowY - 26}>
		<Button
			anchor={0.5}
			sizes={{ width: 50, height: 50 }}
			disabled={decDisabled}
			onpress={onDecrease}
		>
			{#snippet children({ center, hovered })}
				{#if CLASSIC_STEPPER_SPRITES}
					<Sprite
						{...center}
						key="minus.png"
						anchor={0.5}
						width={50}
						height={50}
						alpha={decDisabled ? 0.3 : hovered ? 1 : 0.7}
					/>
				{:else}
					<Container {...center}>
						{@render betChip('minus', hovered, decDisabled)}
					</Container>
				{/if}
			{/snippet}
		</Button>
	</Container>

	<Container x={w * 0.67 + 80} y={rowY - 26}>
		<Button
			anchor={0.5}
			sizes={{ width: 50, height: 50 }}
			disabled={incDisabled}
			onpress={onIncrease}
		>
			{#snippet children({ center, hovered })}
				{#if CLASSIC_STEPPER_SPRITES}
					<Sprite
						{...center}
						key="plus.png"
						anchor={0.5}
						width={50}
						height={50}
						alpha={incDisabled ? 0.3 : hovered ? 1 : 0.7}
					/>
				{:else}
					<Container {...center}>
						{@render betChip('plus', hovered, incDisabled)}
					</Container>
				{/if}
			{/snippet}
		</Button>
	</Container>

	<!-- AutoSpin -->
	<Container x={w - 267} y={rowY} scale={0.42}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>

	<!-- SPIN — hero, extends above bar -->
	<Container x={w - 152} y={rowY - 20} scale={0.9}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<!-- Turbo -->
	<Container x={w - 42} y={rowY} scale={0.42}>
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
		<Container x={120} y={h - 220}>
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
