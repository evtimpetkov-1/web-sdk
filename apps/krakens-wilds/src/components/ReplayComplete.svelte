<script lang="ts">
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { bookEventAmountToCurrencyString, numberToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { headingGold } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();
	const isReplay = stateUrlDerived.replay();

	// Track when replay round has been played
	let hasStartedResuming = $state(false);
	let replayComplete = $state(false);

	$effect(() => {
		if (context.stateXstateDerived.isResumingBet()) {
			hasStartedResuming = true;
		}
		if (hasStartedResuming && context.stateXstateDerived.isIdle()) {
			replayComplete = true;
		}
	});

	const show = $derived(isReplay && replayComplete);
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	const winAmount = $derived(bookEventAmountToCurrencyString(stateBet.winBookEventAmount));
	const betAmount = $derived(numberToCurrencyString(stateBet.wageredBetAmount));
	const hasWin = $derived(stateBet.winBookEventAmount > 0);

	const onPlayAgain = () => {
		window.location.reload();
	};
</script>

<FadeContainer {show}>
	<!-- Dark overlay -->
	<Rectangle
		width={canvas.width}
		height={canvas.height}
		backgroundColor={0x000000}
		backgroundAlpha={0.75}
	/>

	{@const cx = canvas.width / 2}
	{@const cy = canvas.height / 2}
	{@const s = Math.min(canvas.width / 380, canvas.height / 400, 1.6)}

	<!-- REPLAY label -->
	<ResponsiveText
		text={i18nDerived.replay()}
		anchor={0.5}
		x={cx}
		y={cy - 130 * s}
		maxWidth={canvas.width * 0.8}
		style={{
			...headingGold,
			fontSize: Math.max(48 * s, 16),
			letterSpacing: 12 * s,
		}}
	/>

	<!-- Win or No Win -->
	{#if hasWin}
		<Text
			text={i18nDerived.totalWin()}
			anchor={0.5}
			x={cx}
			y={cy - 55 * s}
			style={{
				fontFamily: 'Cinzel',
				fontWeight: '700',
				fill: 0xc0c8d0,
				fontSize: Math.max(32 * s, 12),
				letterSpacing: 4,
				align: 'center',
			}}
		/>
		<ResponsiveText
			text={winAmount}
			anchor={0.5}
			x={cx}
			y={cy + 10 * s}
			maxWidth={canvas.width * 0.75}
			style={{
				fontFamily: 'Cinzel',
				fontWeight: '700',
				fill: '#FFD700',
				stroke: { color: '#8B6914', width: 2 },
				fontSize: Math.max(64 * s, 20),
				letterSpacing: 2,
				align: 'center',
			}}
		/>
	{:else}
		<Text
			text={i18nDerived.noWin()}
			anchor={0.5}
			x={cx}
			y={cy - 20 * s}
			style={{
				fontFamily: 'Cinzel',
				fontWeight: '700',
				fill: 0x8090a0,
				fontSize: Math.max(44 * s, 16),
				letterSpacing: 6,
				align: 'center',
			}}
		/>
	{/if}

	<!-- Bet amount -->
	<Text
		text={`${i18nDerived.bet()}: ${betAmount}`}
		anchor={0.5}
		x={cx}
		y={cy + (hasWin ? 80 : 50) * s}
		style={{
			fontFamily: 'Cinzel',
			fontWeight: '400',
			fill: 0xb0c4de,
			fontSize: Math.max(32 * s, 12),
			letterSpacing: 3,
			align: 'center',
		}}
	/>

	<!-- Play Again -->
	<ResponsiveText
		text={`▶  ${i18nDerived.playAgain()}`}
		anchor={0.5}
		x={cx}
		y={cy + (hasWin ? 155 : 130) * s}
		maxWidth={canvas.width * 0.7}
		style={{
			...headingGold,
			fontSize: Math.max(44 * s, 14),
		}}
	/>

	<OnPressFullScreen onpress={onPlayAgain} />
	<OnHotkey hotkey="Space" onpress={onPlayAgain} />
</FadeContainer>
