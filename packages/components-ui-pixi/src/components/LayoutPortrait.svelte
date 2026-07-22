<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateUi, stateModal, stateBet, stateBetDerived } from 'state-shared';
	import { BLACK, WHITE } from 'constants-shared/colors';
	import { FadeContainer, Button } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, Text, Sprite } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonDrawer from './ButtonDrawer.svelte';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const w = $derived(context.stateLayoutDerived.mainLayoutStandard().width);
	const h = $derived(context.stateLayoutDerived.mainLayoutStandard().height);
	const cx = $derived(w * 0.5);

	// Bottom bar text styles (same as landscape)
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

	const DRAWER_Y = {
		unfold: 0,
		fold: 400,
	};
	const drawerTween = new Tween(stateUi.drawerFold ? DRAWER_Y.fold : DRAWER_Y.unfold, {
		easing: cubicInOut,
	});

	const DRAWER_BUTTON_Y = {
		unfold: 0,
		fold: 30,
	};
	const drawerButtonTween = new Tween(
		stateUi.drawerFold ? DRAWER_BUTTON_Y.fold : DRAWER_BUTTON_Y.unfold,
		{
			easing: cubicInOut,
		},
	);

	let drawerButtonFadeComplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		drawerButtonShow: async () => {
			if (!stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = true;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerButtonHide: async () => {
			if (stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = false;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.unfold);
				await drawerTween.set(DRAWER_Y.unfold);
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.fold);
				await drawerTween.set(DRAWER_Y.fold);
			}
		},
	});
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<!-- Logo: centered above the slot -->
<MainContainer standard>
	<Container x={cx + 215} y={h * 0.06} scale={2.8}>
		{@render props.logo()}
	</Container>
</MainContainer>

<!-- Drawer container: panel + action row -->
<MainContainer standard alignVertical="bottom">
	<Container y={drawerTween.current}>
		<!-- SPIN (hero) — centered -->
		<Container x={cx} y={h - 400} scale={1.6}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>

		<!-- Left: menu, autoplay -->
		<Container x={140} y={h - 280} scale={0.8}>
			{@render props.buttonMenu({ anchor: 0.5 })}
		</Container>

		<Container x={290} y={h - 280} scale={0.8}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<!-- Right: turbo, bet -->
		<Container x={w - 290} y={h - 280} scale={0.8}>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>

		<Container x={w - 140} y={h - 280} scale={0.8}>
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
	</Container>
</MainContainer>

<!-- Bottom info bar -->
<MainContainer standard alignVertical="bottom">
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
	<Container x={150} y={h - 65}>
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
		<Container x={w - 150} y={h - 65} scale={0.48}>
			<LabelFreeSpinCounter stacked />
		</Container>
	{:else}
		<Container x={w - 150} y={h - 65}>
			<Text text={i18nDerived.bet()} style={labelStyle} anchor={{ x: 0.5, y: 1 }} y={-6} />
			<Text text={betValue} style={valueStyle} anchor={{ x: 0.5, y: 0 }} y={4} />
		</Container>
	{/if}

	<!-- Drawer button -->
	<FadeContainer
		persistent
		show={stateUi.drawerButtonShow}
		oncomplete={drawerButtonFadeComplete}
		y={drawerButtonTween.current}
	>
		<Container x={w - 55} y={h - 150} scale={0.4}>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} anchor={0.5} />
		</Container>
	</FadeContainer>
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
		<Container x={cx - 410} y={h - 500}>
			<Container y={-640} scale={0.7}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container y={-480} scale={0.7}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={-320} scale={0.7}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container y={-160} scale={0.7}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container scale={0.7}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
