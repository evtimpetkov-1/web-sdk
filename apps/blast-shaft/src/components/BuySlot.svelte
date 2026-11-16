<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';

	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { Button, FadeContainer, ResponsiveText } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { stateBet, stateModal } from 'state-shared';

	import { getContext } from '../game/context';
	import { ANTE_OPTIONS, getBuyOption } from '../game/buyOptions';
	import { disarmBuy, stateBuy } from '../game/stateBuy.svelte';
	import { BLACK_OPS_CAP_OFFSET } from '../game/textStyles';
	import { formatTimes } from '../i18n/format';

	/**
	 * The game's own buy button + what is switched on (Evtim, 2026-10-27; replaces
	 * the AnteIndicator badge by the spin button). Mounted after <UI>, so all of
	 * it draws OVER the shared bar (behind it, the bar hid half the ring on desktop).
	 * - The SLOT is the SDK's buy button redrawn here (ButtonBuyBonus stays hidden:
	 *   assets.ts has no 'bonusActive' key). It shows the cart disc, or the active
	 *   ante's disc (Chaos / Boost, the cart's siblings). Its X switches the ante
	 *   off or leaves an armed buy (stateBuy). A tap always opens the shop.
	 *   Desktop moves it next to Autoplay (the SDK puts it at the far left); the
	 *   other layouts keep the SDK's spot.
	 * - The RING around the spin button marks an active ante or an armed buy in
	 *   its colour: a pulsing halo, a crisp rim and a chip naming the cost ("2×",
	 *   "100×"). The halo reaches r+47, over Autoplay / Turbo too (11-16 units off
	 *   the disc on desktop): cut out around them, it read as being behind them
	 *   (Evtim chose over the buttons, 2026-10-27).
	 * Positions follow components-ui-pixi Layout*.svelte (standard units,
	 * bottom-aligned).
	 */
	const context = getContext();

	const UI_BASE_RADIUS = 75; // UI_BASE_SIZE 150 / 2
	const BUY_COLOR = 0xe040ff; // the cart disc's magenta
	const ANTE = {
		ANTE_1: { color: 0xff4a2a, disc: 'msAnteChaos' },
		ANTE_2: { color: 0xffc21a, disc: 'msAnteBoost' },
	} as Record<string, { color: number; disc: string }>;

	const ante = $derived(ANTE_OPTIONS.find((option) => option.key === stateBet.activeBetModeKey));
	const armed = $derived(stateBuy.armedKey ? getBuyOption(stateBuy.armedKey) : undefined);
	// what the ring + chip show: an armed buy, else an ante
	const active = $derived.by(() => {
		if (armed) return { color: BUY_COLOR, cost: armed.costMultiplier };
		if (ante) return { color: ANTE[ante.key].color, cost: ante.costMultiplier };
		return undefined;
	});
	// the last one shown, so switching off fades the ring out instead of blanking it
	let shown = $state<{ color: number; cost: number }>();
	$effect(() => {
		if (active) shown = active;
	});
	const disc = $derived(!armed && ante ? ANTE[ante.key].disc : 'msBuy');

	let uiShown = $state(true);
	context.eventEmitter.subscribeOnMount({
		uiShow: () => (uiShown = true),
		uiHide: () => (uiShown = false),
	});
	const showRing = $derived(!!active && uiShown && context.stateGame.gameType !== 'freegame');
	const idle = $derived(context.stateXstateDerived.isIdle());

	// the spin button, as Layout*.svelte place it
	const spin = $derived.by(() => {
		const { width: w, height: h } = context.stateLayoutDerived.mainLayoutStandard();
		switch (context.stateLayoutDerived.layoutType()) {
			case 'desktop':
				return { x: w - 152, y: h - 78, r: UI_BASE_RADIUS * 0.9 };
			case 'landscape':
				return { x: w - 180, y: (h - 100) * 0.5, r: UI_BASE_RADIUS * 1.43 };
			case 'tablet':
				return { x: w * 0.5, y: h - 300, r: UI_BASE_RADIUS * 1.4 };
			default:
				return { x: w * 0.5, y: h - 400, r: UI_BASE_RADIUS * 1.6 };
		}
	});

	// the slot: ButtonBuyBonus's box (UI_BASE_SIZE x 1.2, x1.0 on desktop) at
	// each layout's container scale
	const slot = $derived.by(() => {
		const { width: w, height: h } = context.stateLayoutDerived.mainLayoutStandard();
		switch (context.stateLayoutDerived.layoutType()) {
			case 'desktop':
				// in the bar, left of Autoplay (x w-267, r 31.5), 16 units clear of it
				return { x: w - 360, y: h - 58, size: 90 };
			case 'landscape':
				return { x: w - 230, y: (h - 100) * 0.5 + 320, size: 171 };
			case 'tablet':
				return { x: w * 0.5 - 430, y: h - 255, size: 153 };
			default:
				return { x: w - 140, y: h - 455, size: 162 };
		}
	});
	// the X that switches the ante / armed buy off (0.34 of the disc was too
	// small, Evtim 2026-10-28), set further out so it covers less of the disc
	const closeSize = $derived(slot.size * 0.46);
	const closeOffset = $derived(slot.size * 0.4);
	// the X on the slot's top-right, top-left in landscape: the Bet button sits
	// right next to it there
	const closeX = $derived(
		closeOffset * (context.stateLayoutDerived.layoutType() === 'landscape' ? -1 : 1),
	);
	const chip = $derived({ width: spin.r * 1.05, height: spin.r * 0.42 });

	// the halo's breath
	const pulse = new Tween(0.55);
	$effect(() => {
		if (!showRing) return;
		let alive = true;
		(async () => {
			while (alive) {
				await pulse.set(1, { duration: 650, easing: sineInOut });
				if (!alive) break;
				await pulse.set(0.55, { duration: 650, easing: sineInOut });
			}
		})();
		return () => (alive = false);
	});

	const openShop = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'buyBonus' };
	};
	const switchOff = () => {
		if (!idle) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		if (stateBuy.armedKey) disarmBuy();
		else stateBet.activeBetModeKey = 'BASE';
	};
</script>

<MainContainer standard alignVertical="bottom">
	<FadeContainer show={uiShown} duration={220}>
		<Container x={slot.x} y={slot.y}>
			<Button
				anchor={0.5}
				sizes={{ width: slot.size, height: slot.size }}
				disabled={!idle}
				onpress={openShop}
			>
				{#snippet children({ center, hovered, pressed })}
					<Sprite
						{...center}
						key={`${disc}${!idle ? 'Inactive' : hovered || pressed ? 'Hover' : 'Active'}`}
						anchor={0.5}
						width={slot.size}
						height={slot.size}
					/>
				{/snippet}
			</Button>
			{#if ante || armed}
				<!-- the hit area a little past the X, short of the disc's middle -->
				<Container x={closeX} y={-closeOffset}>
					<Button
						anchor={0.5}
						sizes={{ width: closeSize * 1.25, height: closeSize * 1.25 }}
						disabled={!idle}
						onpress={switchOff}
					>
						{#snippet children({ center, hovered, pressed })}
							<Sprite
								{...center}
								key="close.png"
								anchor={0.5}
								width={closeSize * (pressed ? 0.92 : 1)}
								height={closeSize * (pressed ? 0.92 : 1)}
								alpha={idle ? (hovered ? 1 : 0.92) : 0.45}
							/>
						{/snippet}
					</Button>
				</Container>
			{/if}
		</Container>
	</FadeContainer>
	<FadeContainer show={showRing} duration={220}>
		{#if shown}
			{@const color = shown.color}
			<Container x={spin.x} y={spin.y}>
				<!-- the halo: a coloured aura ring and stacked faint rings, pulsing,
				     over the bar and the neighbouring buttons alike (Evtim) -->
				<Graphics
					alpha={pulse.current}
					draw={(graphics) => {
						graphics
							.circle(0, 0, spin.r + 16)
							.fill({ color, alpha: 0.27 })
							.circle(0, 0, spin.r)
							.cut();
						for (let i = 0; i < 8; i++) {
							graphics
								.circle(0, 0, spin.r + 8 + i * 5)
								.stroke({ width: 8, color, alpha: 0.28 * (1 - i / 8) });
						}
					}}
				/>
				<Graphics
					draw={(graphics) => {
						// the crisp rim and one tight glow, r+1 .. r+11
						graphics.circle(0, 0, spin.r + 9).stroke({ width: 4, color, alpha: 0.3 });
						graphics.circle(0, 0, spin.r + 4).stroke({ width: 6, color, alpha: 1 });
					}}
				/>
				<Container y={-spin.r - 4}>
					<Graphics
						draw={(graphics) => {
							graphics
								.roundRect(-chip.width / 2, -chip.height / 2, chip.width, chip.height, chip.height / 2)
								.fill({ color: 0x0b0f0b, alpha: 0.92 })
								.stroke({ width: 3, color, alpha: 1 });
						}}
					/>
					<!-- the counters' face without their outline: the chip is the backing -->
					<ResponsiveText
						anchor={{ x: 0.5, y: 0.5 }}
						y={-chip.height * 0.66 * BLACK_OPS_CAP_OFFSET}
						maxWidth={chip.width * 0.8}
						text={formatTimes(shown.cost)}
						style={{ fontFamily: 'Black Ops One', fontSize: chip.height * 0.66, fill: color }}
					/>
				</Container>
			</Container>
		{/if}
	</FadeContainer>
</MainContainer>
