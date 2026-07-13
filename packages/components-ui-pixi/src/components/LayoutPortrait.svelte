<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonDrawer from './ButtonDrawer.svelte';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const w = $derived(context.stateLayoutDerived.mainLayoutStandard().width);
	const h = $derived(context.stateLayoutDerived.mainLayoutStandard().height);
	const cx = $derived(w * 0.5);

	// Spin button: 150 base * 2.2 scale = 330px visual
	// Secondary buttons: 150 base * 0.8 scale = 120px visual
	// Ratio: spin is ~2.75x secondary buttons

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

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<!-- Drawer container: panel + action row -->
<MainContainer standard alignVertical="bottom">
	<Container y={drawerTween.current}>
		<!-- Semi-transparent dark panel -->
		<Rectangle
			x={cx}
			y={h - 470}
			anchor={{ x: 0.5, y: 0 }}
			width={w + 20}
			height={520}
			backgroundColor={0x000000}
			backgroundAlpha={0.5}
			borderRadius={30}
		/>

		<!-- SPIN (hero) — centered -->
		<Container x={cx} y={h - 280} scale={1.6}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>

		<!-- Secondary buttons — vertically centered with spin button -->
		<Container x={cx - 280} y={h - 280} scale={0.8}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<Container x={cx - 280 - 130} y={h - 280} scale={0.8}>
			{@render props.buttonMenu({ anchor: 0.5 })}
		</Container>

		<Container x={cx + 280} y={h - 280} scale={0.8}>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>

		<Container x={cx + 280 + 130} y={h - 280} scale={0.8}>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>
	</Container>
</MainContainer>

<!-- Info row (always visible) -->
<MainContainer standard alignVertical="bottom">
	<!-- Balance (below menu) -->
	<Container x={cx - 400} y={h - 90} scale={0.6}>
		{@render props.amountBalance({ stacked: true })}
	</Container>

	<!-- Win (center) -->
	<Container x={cx} y={h - 90} scale={0.6}>
		{@render props.amountWin({ stacked: true })}
	</Container>

	<!-- Bet or Free Spin Counter (below bonus) -->
	{#if stateUi.freeSpinCounterShow}
		<Container x={cx + 400} y={h - 90} scale={0.6}>
			<LabelFreeSpinCounter stacked />
		</Container>
	{:else}
		<Container x={cx + 400} y={h - 90} scale={0.6}>
			{@render props.amountBet({ stacked: true })}
		</Container>

		<Container x={cx + 320} y={h - 90} scale={0.35}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>

		<Container x={cx + 480} y={h - 90} scale={0.35}>
			{@render props.buttonIncrease({ anchor: 0.5 })}
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
		<Container x={cx} y={h - 500}>
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
