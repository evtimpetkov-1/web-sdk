<script lang="ts" module>
	export type EmitterEventGenericUi =
		| { type: 'uiShow' }
		| { type: 'uiHide' }
		| { type: 'stopButtonClick' }
		| { type: 'stopButtonEnable' }
		| { type: 'soundPressGeneral' }
		| { type: 'soundPressBet' }
		| { type: 'bet' }
		| { type: 'autoBet' };
</script>

<script lang="ts">
	import {
		stateBet,
		stateBetDerived,
		stateConfig,
		stateMetaDerived,
		stateModal,
		stateSound,
		stateUi,
		AUTO_SPINS_TEXT_OPTIONS,
		AUTO_SPINS_TEXT_OPTION_MAP,
	} from 'state-shared';
	import { EnableSpaceHold, OnHotkey } from 'components-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { getContextLayout } from 'utils-layout';
	import { getContextXstate } from 'utils-xstate';
	import { numberToCurrencyString, bookEventAmountToWinCurrencyString } from 'utils-shared/amount';
	import { waitForTimeout } from 'utils-shared/wait';

	import GenericIcon from './GenericIcon.svelte';
	import StudioCat from '../studio/StudioCat.svelte';
	import { stateGenericBuy } from './stateGenericBuy.svelte';
	import { createBetPress } from './betPress.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	/**
	 * THE GENERIC UI (2026-11-18): one bottom bar for every game, in HTML over the
	 * canvas, with no game art in it. It replaces components-ui-pixi's <UI> and a
	 * game's own bar dressing (strip, deck, buy slot) when the game mounts this
	 * instead; nothing here reads a game's assets, fonts or colours, so a change in
	 * this folder changes every game that uses it.
	 *
	 * What it holds: balance / win / bet readouts, a bet stepper that walks the RGS
	 * bet levels in place (no bet menu popup) with a bar showing where the bet is in
	 * the range, Spin / Stop, Turbo (on the bar, not in the menu), Autoplay with its
	 * options in a panel anchored over the bar, a menu (sound, music, info) and the
	 * bonus button, which opens stateModal 'buyBonus' (GenericShop).
	 *
	 * Sizes are in `--u`, the px of one unit of the SDK's standard main layout
	 * (1920x1080, 1080x1920 portrait, 1920x1920 tablet), so the bar scales with the
	 * canvas exactly as the Pixi bar did and sits where the games' boards leave room:
	 * - row   (desktop): one plate centred at the bottom, Spin riding its top edge
	 * - side  (phone landscape, Stake's popouts): readouts in a strip, buttons in a
	 *         column on the right
	 * - stack (portrait, tablet): readouts in a strip, buttons in a row over it
	 *
	 * Mount it OUTSIDE the Pixi <App>, while the game is on screen and not in replay.
	 */
	type Props = {
		/** false hides the bonus button (a game with no modes to offer) */
		bonus?: boolean;
	};
	const props: Props = $props();

	const context = {
		...getContextEventEmitter<EmitterEventGenericUi>(),
		...getContextXstate(),
		...getContextLayout(),
	};
	const { eventEmitter, stateXstateDerived, stateLayoutDerived } = context;

	// ------------------------------------------------------------------ layout
	const mode = $derived.by(() => {
		const type = stateLayoutDerived.layoutType();
		if (type === 'desktop') return 'row' as const;
		if (type === 'landscape') return 'side' as const;
		return 'stack' as const;
	});
	const main = $derived(stateLayoutDerived.mainLayoutStandard());

	// ------------------------------------------------------------------ show / hide
	let shown = $state(false);
	$effect(() => {
		// in after the game's own opening (curtains, fade) has had its moment
		const timer = setTimeout(() => (shown = true), 350);
		return () => clearTimeout(timer);
	});
	const FADE_MS = 220;
	eventEmitter.subscribeOnMount({
		uiShow: async () => {
			if (shown) return;
			shown = true;
			await waitForTimeout(FADE_MS);
		},
		uiHide: async () => {
			if (!shown) return;
			shown = false;
			menuOpen = false;
			await waitForTimeout(FADE_MS);
		},
		// a slam stop plays the rest of the round in turbo, then hands the setting back
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});

	// the shop and the info page take the whole screen: the bar steps aside
	const covered = $derived(
		['buyBonus', 'buyBonusConfirm', 'gameRules', 'payTable'].includes(stateModal.modal?.name ?? ''),
	);

	const idle = $derived(stateXstateDerived.isIdle());
	const press = () => eventEmitter.broadcast({ type: 'soundPressGeneral' });

	// ------------------------------------------------------------------ readouts
	const balance = $derived(numberToCurrencyString(stateBet.balanceAmount));
	const win = $derived(bookEventAmountToWinCurrencyString(stateBet.winBookEventAmount));
	const bet = $derived(numberToCurrencyString(stateBetDerived.betCost()));

	// ------------------------------------------------------------------ bet stepper
	const levels = $derived([...stateConfig.betAmountOptions].sort((a, b) => a - b));
	// the level in use; a bet that is not on a level (never minted here) counts as
	// the highest level under it
	const levelIndex = $derived(
		Math.max(
			0,
			levels.findLastIndex((level) => level <= stateBet.betAmount),
		),
	);
	const betProgress = $derived(levels.length > 1 ? levelIndex / (levels.length - 1) : 1);
	const canLower = $derived(idle && levelIndex > 0);
	const canRaise = $derived(idle && levelIndex < levels.length - 1);
	const stepBet = (direction: -1 | 1) => {
		if (direction < 0 ? !canLower : !canRaise) return;
		press();
		stateBetDerived.setBetAmount(levels[levelIndex + direction]);
	};

	// ------------------------------------------------------------------ spin
	const betPress = createBetPress(context);
	// dead while any popup is up: Space under the buy confirm started a plain spin
	const spinLocked = $derived(stateModal.modal !== null);
	const spinKey = $derived(betPress.key);
	const spinPress = () => {
		if (spinLocked) return;
		betPress.press();
	};

	// ------------------------------------------------------------------ turbo
	const turboOn = $derived(stateBet.isTurboPersistent);
	const toggleTurbo = () => {
		if (stateBet.isSpaceHold) return;
		press();
		stateBetDerived.updateIsTurbo(!stateBet.isTurboPersistent, { persistent: true });
	};

	// ------------------------------------------------------------------ autoplay
	const autoRunning = $derived(stateBetDerived.hasAutoBetCounter());
	const autoOpen = $derived(stateModal.modal?.name === 'autoSpin');
	const autoDisabled = $derived.by(() => {
		if (stateBet.isSpaceHold) return true;
		if (!idle && !autoRunning) return true;
		if (!autoRunning && !autoOpen && !stateBetDerived.isBetCostAvailable()) return true;
		return false;
	});
	const autoPress = () => {
		if (autoDisabled) return;
		press();
		if (autoRunning) stateBet.autoSpinsCounter = 0;
		else stateModal.modal = autoOpen ? null : { name: 'autoSpin' };
	};
	const autoCount = $derived(
		stateBet.autoSpinsCounter === Infinity ? '∞' : `${stateBet.autoSpinsCounter}`,
	);
	// Autoplay asks for the number of spins and nothing else (Evtim, 2026-11-18:
	// "remove lose limit and single win limit, only the number of spins should be
	// selected"). The panel with its Start button is still the confirmation step
	// Stake asks for. The SDK's two limits are set to "none" on every start, so a
	// value left in the state by another UI can never stop a run.
	const startAuto = () => {
		if (!stateBetDerived.isBetCostAvailable()) return;
		stateBet.autoSpinsCounter = AUTO_SPINS_TEXT_OPTION_MAP[stateUi.autoSpinsText];
		stateBet.autoSpinsLossLimitAmount = Infinity;
		stateBet.autoSpinsSingleWinLimitAmount = Infinity;
		if (stateBetDerived.activeBetMode()?.type === 'buy') stateBet.activeBetModeKey = 'BASE';
		press();
		eventEmitter.broadcast({ type: 'autoBet' });
		stateModal.modal = null;
	};

	// ------------------------------------------------------------------ menu
	let menuOpen = $state(false);
	const toggleMenu = () => {
		press();
		menuOpen = !menuOpen;
	};
	$effect(() => {
		stateUi.menuOpen = menuOpen;
	});
	// a popup opened from anywhere closes the menu under it
	$effect(() => {
		if (stateModal.modal) menuOpen = false;
	});
	const VOLUME_ON = 75;
	const soundOn = $derived(stateSound.volumeValueMaster > 0);
	const musicOn = $derived(soundOn && stateSound.volumeValueMusic > 0);
	const toggleSound = () => {
		press();
		stateSound.volumeValueMaster = soundOn ? 0 : VOLUME_ON;
	};
	const toggleMusic = () => {
		press();
		if (musicOn) {
			stateSound.volumeValueMusic = 0;
			return;
		}
		// music on means it is heard: the master comes on with it
		if (!soundOn) stateSound.volumeValueMaster = VOLUME_ON;
		stateSound.volumeValueMusic = VOLUME_ON;
	};
	const openInfo = () => {
		press();
		menuOpen = false;
		stateModal.modal = { name: 'gameRules' };
	};

	// ------------------------------------------------------------------ bonus
	const hasModes = $derived(
		stateMetaDerived.betModeMetaList().some((betMode) => betMode.type !== 'default'),
	);
	const showBonus = $derived(props.bonus !== false && hasModes);
	// A PAID MODE IS ON: a mode that charges more per spin is switched on, or a
	// bought mode is still selected after its round (stateGenericBuy.armedKey: Spin
	// then asks to confirm it again). As in the bars the games had before this one
	// (Evtim, 2026-11-18: "return the previous feature ... refer to the design of
	// no limit"): Spin wears a rim in the alert colour and a box naming what the
	// next spin costs, and the bonus button carries an X. The X, and only the X,
	// switches the mode off; the button itself always opens the shop (Evtim, the
	// same day: "it doesnt make sense to click the cat to disable the feature and
	// then click the cat again to open the menu").
	const paidMode = $derived.by(() => {
		const type = stateBetDerived.activeBetMode()?.type;
		return type === 'activate' || type === 'buy';
	});
	const modeOn = $derived(paidMode);
	// what the next spin costs in that mode. stateBetDerived.betCost() counts a
	// switch's multiplier only (a bought mode is paid for at the confirmation), so
	// the BET readout stays the base bet under an armed buy and this box names the
	// purchase.
	const paidCost = $derived(
		numberToCurrencyString(
			stateBet.betAmount * (stateBetDerived.activeBetMode()?.costMultiplier ?? 1),
		),
	);
	const leaveMode = () => {
		if (!idle) return;
		press();
		// an armed buy goes back to what was on before it; a switch is switched off
		const armed = stateGenericBuy.armedKey !== '' && stateBet.activeBetModeKey === stateGenericBuy.armedKey;
		stateBet.activeBetModeKey = armed ? stateGenericBuy.modeAfterBuy : 'BASE';
		stateGenericBuy.armedKey = '';
		stateGenericBuy.modeAfterBuy = 'BASE';
	};
	// The bonus button is the studio's CAT and nothing else: no tile, no words
	// (Evtim, 2026-11-18, after an accent disc with two words, a tile with a star
	// and a tile with the cat beside the words: "the buy button is not nice, leave
	// only the cat logo without the text"). The words stay as the button's name for
	// screen readers and as its tooltip. The version with the tile and the words:
	// art-review/studio/royal-cat-gaming/alt/GenericUI_bonus_tile_with_words_2026-11-18.svelte
	const openShop = () => {
		if (!idle) return;
		press();
		menuOpen = false;
		stateModal.modal = { name: 'buyBonus' };
	};
</script>

<!-- Space: a press spins / stops, a hold spins on in turbo -->
<EnableSpaceHold />
<OnHotkey hotkey="Space" disabled={spinLocked} onpress={betPress.press} />
<OnHotkey
	hotkey="Escape"
	onpress={() => {
		menuOpen = false;
		if (autoOpen) stateModal.modal = null;
	}}
/>

{#snippet readout(label: string, value: string, kind: string)}
	<div class="readout {kind}">
		<span class="label">{label}</span>
		<span class="value amount">{value}</span>
	</div>
{/snippet}

{#snippet betBlock(flank: boolean)}
	<div class="bet" class:flank>
		{#if flank}
			<button class="step" disabled={!canLower} onclick={() => stepBet(-1)} aria-label="-">
				<GenericIcon name="minus" size="var(--step-icon)" />
			</button>
		{/if}
		<div class="bet-text">
			<span class="label">{i18nDerived.bet()}</span>
			<span class="value amount">{bet}</span>
			<!-- where the bet stands between the lowest and the highest level -->
			<span class="progress" aria-hidden="true"><i style={`width: ${betProgress * 100}%`}></i></span>
		</div>
		{#if flank}
			<button class="step" disabled={!canRaise} onclick={() => stepBet(1)} aria-label="+">
				<GenericIcon name="plus" size="var(--step-icon)" />
			</button>
		{:else}
			<div class="chevrons">
				<button class="step" disabled={!canRaise} onclick={() => stepBet(1)} aria-label="+">
					<GenericIcon name="chevronUp" size="var(--step-icon)" />
				</button>
				<button class="step" disabled={!canLower} onclick={() => stepBet(-1)} aria-label="-">
					<GenericIcon name="chevronDown" size="var(--step-icon)" />
				</button>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet spinButton()}
	<button
		class="spin"
		class:busy={!idle}
		class:dim={spinLocked || spinKey === 'spin_disabled' || spinKey === 'stop_disabled'}
		class:paid={paidMode}
		data-test="spin-button"
		aria-label={i18nDerived.bet()}
		onclick={spinPress}
	>
		{#if spinKey === 'stop_default'}
			<GenericIcon name="stop" size="34%" />
		{:else}
			<span class="arrows" class:turning={!idle}><GenericIcon name="spin" size="100%" /></span>
		{/if}
		{#if paidMode}
			<span class="cost amount" data-test="spin-cost">{paidCost}</span>
		{/if}
	</button>
{/snippet}

{#snippet turboButton()}
	<button
		class="btn turbo"
		class:on={turboOn}
		disabled={stateBet.isSpaceHold}
		aria-pressed={turboOn}
		aria-label={i18nDerived.turbo()}
		onclick={toggleTurbo}
	>
		<GenericIcon name="turbo" size="var(--btn-icon)" />
	</button>
{/snippet}

{#snippet autoButton()}
	<button
		class="btn auto"
		class:on={autoRunning}
		disabled={autoDisabled}
		aria-label={i18nDerived.autoSpin()}
		onclick={autoPress}
	>
		{#if autoRunning}
			<span class="count">{autoCount}</span>
		{:else if autoOpen}
			<GenericIcon name="close" size="calc(var(--btn-icon) * 0.72)" />
		{:else}
			<GenericIcon name="auto" size="var(--btn-icon)" />
		{/if}
	</button>
{/snippet}

{#snippet bonusButton()}
	{#if showBonus}
		<div class="bonus-wrap">
			<button
				class="bonus"
				class:on={modeOn}
				disabled={!idle}
				data-test="bonus-button"
				aria-label={i18nDerived.buyBonus()}
				title={i18nDerived.buyBonus()}
				onclick={openShop}
			>
				<span class="cat-mask"><span class="cat"><StudioCat /></span></span>
			</button>
			{#if modeOn}
				<button
					class="off-x"
					disabled={!idle}
					data-test="mode-off-button"
					aria-label={i18nDerived.disable()}
					title={i18nDerived.disable()}
					onclick={leaveMode}
				>
					<GenericIcon name="close" size="50%" />
				</button>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet menu()}
	<div class="menu-wrap">
		<button class="btn menu-btn" aria-label="Menu" aria-expanded={menuOpen} onclick={toggleMenu}>
			<GenericIcon name={menuOpen ? 'close' : 'menu'} size={`calc(var(--btn-icon) * ${menuOpen ? 0.72 : 0.9})`} />
		</button>
		{#if menuOpen}
			<div class="menu" role="menu">
				<button class="item" role="menuitemcheckbox" aria-checked={soundOn} onclick={toggleSound}>
					<GenericIcon name={soundOn ? 'soundOn' : 'soundOff'} size="1.5em" />
					<span>{i18nDerived.sound()}</span>
					<i class="state" class:on={soundOn}></i>
				</button>
				<button class="item" role="menuitemcheckbox" aria-checked={musicOn} onclick={toggleMusic}>
					<GenericIcon name={musicOn ? 'music' : 'musicOff'} size="1.5em" />
					<span>{i18nDerived.music()}</span>
					<i class="state" class:on={musicOn}></i>
				</button>
				<button class="item" role="menuitem" onclick={openInfo}>
					<GenericIcon name="info" size="1.5em" />
					<span>{i18nDerived.info()}</span>
				</button>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet chips(options: readonly string[], value: string, pick: (option: string) => void)}
	<div class="chips">
		{#each options as option (option)}
			<button class="chip" class:on={option === value} onclick={() => pick(option)}>
				{option}
			</button>
		{/each}
	</div>
{/snippet}

{#snippet autoPanel()}
	{#if autoOpen}
		<div class="auto-panel" role="dialog" aria-label={i18nDerived.autoSpins()} data-test="autoplay-panel">
			<h2>{i18nDerived.autoSpins()}</h2>
			<h3 data-test="number-of-rounds">{i18nDerived.numberOfRounds()}</h3>
			{@render chips(
				AUTO_SPINS_TEXT_OPTIONS,
				stateUi.autoSpinsText,
				(option) => (stateUi.autoSpinsText = option as typeof stateUi.autoSpinsText),
			)}
			<button class="start" disabled={!stateBetDerived.isBetCostAvailable()} onclick={startAuto}>
				{i18nDerived.startAutoplay()}
			</button>
		</div>
	{/if}
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="gui"
	class:shown={shown && !covered}
	data-mode={mode}
	style={`--u: ${main.scale}px; --mw: ${main.width}; --mh: ${main.height};`}
	onmousedown={(event) => {
		// a click must not leave a button focused: Space would then press it again
		// on top of the Space hotkey
		event.preventDefault();
	}}
>
	{#if menuOpen || autoOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="away"
			onclick={() => {
				menuOpen = false;
				if (autoOpen) stateModal.modal = null;
			}}
		></div>
	{/if}

	<div class="main">
		{#if mode === 'row'}
			<div class="row">
				{@render bonusButton()}
				<div class="plate">
					{@render menu()}
					{@render readout(i18nDerived.balance(), balance, 'balance')}
					{@render readout(i18nDerived.win(), win, 'win')}
					<span class="spacer"></span>
					{@render betBlock(false)}
					{@render turboButton()}
					<div class="spin-slot">{@render spinButton()}</div>
					{@render autoButton()}
					{@render autoPanel()}
				</div>
			</div>
		{:else}
			<div class="strip">
				<div class="strip-inner">
					{@render readout(i18nDerived.balance(), balance, 'balance')}
					{@render readout(i18nDerived.win(), win, 'win')}
					{@render betBlock(true)}
				</div>
			</div>
			{#if mode === 'side'}
				<div class="column">
					{@render menu()}
					{@render autoButton()}
					{@render spinButton()}
					{@render turboButton()}
					{@render bonusButton()}
				</div>
			{:else}
				<div class="deck">
					<div class="deck-side">
						{@render menu()}
						{@render bonusButton()}
					</div>
					{@render spinButton()}
					<div class="deck-side">
						{@render turboButton()}
						{@render autoButton()}
					</div>
				</div>
			{/if}
			{@render autoPanel()}
		{/if}
	</div>
</div>

<style lang="scss">
	/* The neutral theme. Every colour of the generic UI is one of these; the shared
	   popups (insufficient funds, error, autoplay message) and a game's own info
	   content read the --modal-* names, so they follow it too. Three :root's outrank
	   a game's own modal theme file. */
	:global(:root:root:root) {
		--gui-bg: rgba(12, 13, 16, 0.88);
		--gui-bg-solid: #121419;
		--gui-raise: rgba(255, 255, 255, 0.09);
		--gui-raise-hover: rgba(255, 255, 255, 0.18);
		--gui-line: rgba(255, 255, 255, 0.14);
		--gui-fg: #ffffff;
		--gui-dim: rgba(255, 255, 255, 0.62);
		--gui-accent: #ffc83d;
		--gui-on-accent: #16130a;
		/* a paid mode is on: Spin's rim and cost box, the bonus button's line */
		--gui-alert: #ff3347;
		--gui-font: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

		--modal-panel-bg: var(--gui-bg-solid);
		--modal-panel-border: 1px solid var(--gui-line);
		--modal-panel-radius: 12px;
		--modal-panel-shadow: 0 18px 50px rgba(0, 0, 0, 0.6);
		--modal-panel-padding: 1.4rem 1.6rem;
		--modal-title-font: var(--gui-font);
		--modal-title-size: 1.25rem;
		--modal-text: var(--gui-fg);
		--modal-text-dim: var(--gui-dim);
		--modal-accent: var(--gui-accent);
		--modal-accent-selected: var(--gui-accent);
		--modal-border: var(--gui-line);
		--modal-border-selected: var(--gui-accent);
		--modal-divider: var(--gui-line);
		--modal-bg: rgba(255, 255, 255, 0.05);
		--modal-bg-hover: rgba(255, 255, 255, 0.1);
		--modal-bg-active: rgba(255, 200, 61, 0.2);
		--modal-btn-bg: rgba(255, 255, 255, 0.08);
		--modal-btn-bg-hover: rgba(255, 255, 255, 0.16);
		--modal-btn-confirm-bg: var(--gui-accent);
		--modal-btn-confirm-border: var(--gui-accent);
		--modal-btn-radius: 8px;
		--modal-slider-track: rgba(255, 255, 255, 0.16);
		--modal-slider-thumb: var(--gui-accent);
		--modal-slider-fill: rgba(255, 200, 61, 0.55);
	}

	/* the shared popups' dressing, where a game's theme file styles it by class */
	:global(:root:root:root .ui-modal-title-wrap) {
		--modal-text: var(--gui-fg);
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-shadow: none;
	}
	:global(:root:root:root .pop-up-wrap .blur-layer) {
		background: rgba(8, 9, 12, 0.78);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}
	:global(:root:root:root .pop-up-wrap .close-button) {
		color: var(--gui-fg);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
	}

	.gui {
		position: fixed;
		inset: 0;
		z-index: 40; /* under the popups (constants-shared zIndex.modal = 50) */
		pointer-events: none;
		font-family: var(--gui-font);
		color: var(--gui-fg);
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 220ms ease,
			visibility 0s linear 220ms;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;

		&.shown {
			opacity: 1;
			visibility: visible;
			transition: opacity 220ms ease;
		}
	}

	.away {
		position: absolute;
		inset: 0;
		pointer-events: auto;
	}

	/* the SDK's standard main layout, bottom-aligned (MainContainer standard) */
	.main {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: calc(var(--mw) * var(--u));
		height: calc(var(--mh) * var(--u));
		transform: translateX(-50%);
	}

	button {
		appearance: none;
		border: 0;
		margin: 0;
		padding: 0;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
		pointer-events: auto;
		touch-action: manipulation;

		&:disabled {
			cursor: not-allowed;
		}
	}

	/* amounts are drawn left to right in every language (a currency sign the SDK
	   hands over in drawn order would be flipped again by the bidi algorithm) */
	.amount {
		direction: ltr;
		unicode-bidi: bidi-override;
		font-variant-numeric: tabular-nums;
	}

	.label {
		font-size: var(--fs-label);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--gui-dim);
		white-space: nowrap;
		line-height: 1.1;
	}

	.value {
		font-size: var(--fs-value);
		font-weight: 700;
		white-space: nowrap;
		line-height: 1.15;
	}

	/* the caption centred over its amount (Evtim, 2026-11-18: "everything is to
	   the left") */
	.readout {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
		text-align: center;
	}

	/* ---------------------------------------------------------------- buttons */
	.btn {
		display: grid;
		place-items: center;
		width: var(--btn);
		height: var(--btn);
		border-radius: var(--btn-radius);
		background: var(--btn-bg);
		color: var(--gui-fg);
		flex: none;
		transition:
			background-color 120ms ease,
			color 120ms ease,
			transform 120ms ease;

		/* Hover LAYERS a light over the button's own background and exists only for a
		   pointer that can hover. It used to replace the background: on the touch
		   layouts, where a button is a dark tile, a pressed Turbo or Menu stayed
		   see-through for as long as the pointer rested on it, and on a phone until
		   the next tap elsewhere (Evtim, 2026-11-18). */
		@media (hover: hover) {
			&:hover:not(:disabled) {
				background:
					linear-gradient(var(--gui-raise-hover), var(--gui-raise-hover)),
					var(--btn-bg);
			}
		}
		&:active:not(:disabled) {
			transform: scale(0.94);
		}
		&:disabled {
			opacity: 0.4;
		}
		&.on {
			color: var(--gui-accent);
		}
	}

	.auto .count {
		font-size: calc(var(--btn-icon) * 0.62);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.spin {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--spin);
		height: var(--spin);
		border-radius: 50%;
		background: var(--gui-bg-solid);
		box-shadow:
			inset 0 0 0 calc(var(--spin) * 0.045) var(--gui-fg),
			0 calc(var(--spin) * 0.03) calc(var(--spin) * 0.12) rgba(0, 0, 0, 0.55);
		color: var(--gui-fg);
		flex: none;
		transition:
			transform 120ms ease,
			opacity 160ms ease;

		@media (hover: hover) {
			&:hover {
				transform: scale(1.04);
			}
		}
		&:active {
			transform: scale(0.95);
		}
		&.dim {
			opacity: 0.55;
		}

		.arrows {
			display: grid;
			width: 56%;
			height: 56%;
			transition: transform 300ms ease;
		}
		.arrows.turning {
			animation: gui-turn 900ms linear infinite;
		}

		/* a paid mode is on: the rim in the alert colour, breathing outwards */
		&.paid {
			box-shadow:
				inset 0 0 0 calc(var(--spin) * 0.045) var(--gui-alert),
				0 calc(var(--spin) * 0.03) calc(var(--spin) * 0.12) rgba(0, 0, 0, 0.55);

			&::before {
				content: '';
				position: absolute;
				inset: 0;
				border-radius: 50%;
				box-shadow: 0 0 0 calc(var(--spin) * 0.03) var(--gui-alert);
				opacity: 0;
				pointer-events: none;
				animation: gui-paid 1500ms ease-out infinite;
			}
		}
		/* what the next spin costs, on the button's bottom edge */
		.cost {
			position: absolute;
			left: 50%;
			bottom: calc(var(--spin) * -0.06);
			transform: translateX(-50%);
			padding: 0.16em 0.6em 0.2em;
			border-radius: 0.42em;
			background: var(--gui-alert);
			color: #ffffff;
			font-size: calc(var(--spin) * 0.15);
			font-weight: 800;
			line-height: 1.15;
			white-space: nowrap;
			box-shadow: 0 calc(var(--spin) * 0.015) calc(var(--spin) * 0.05) rgba(0, 0, 0, 0.5);
			pointer-events: none;
			animation: gui-cost-in 220ms cubic-bezier(0.2, 0.9, 0.3, 1.3);
		}
	}

	@keyframes gui-paid {
		0% {
			opacity: 0.7;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.14);
		}
	}
	@keyframes gui-cost-in {
		from {
			opacity: 0;
			transform: translateX(-50%) scale(0.6);
		}
	}

	@keyframes gui-turn {
		to {
			transform: rotate(360deg);
		}
	}

	/* The studio's cat in a FRAME: a tile in the bar's own material and button shape
	   with an accent line, as tall as the buttons beside it; he stands on its bottom
	   edge and is taller than it, so his head and crown rise over the top. No words.
	   --bonus is the tile's width, --bonus-h its height (each layout sets both).
	   The wrap carries the X of a paid mode outside the tile's corner (the tile
	   itself is clipped). */
	.bonus-wrap {
		position: relative;
		/* over the bar's plate beside it: the X hangs over the plate's corner and was
		   half under it (Evtim, 2026-11-18: "the X button should be on top of the
		   black UI bar") */
		z-index: 2;
		flex: none;
		width: var(--bonus);
		height: var(--bonus-h);
	}

	.bonus {
		position: relative;
		display: block;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		padding: 0;
		border-radius: var(--bonus-radius);
		background: var(--gui-bg);
		box-shadow: inset 0 0 0 var(--bonus-line) var(--gui-accent);
		/* open upwards for his head, shut round the tile's own bottom corners */
		clip-path: inset(-100% 0 0 0 round var(--bonus-radius));
		transition:
			transform 120ms ease,
			background-color 140ms ease,
			box-shadow 140ms ease,
			opacity 160ms ease;

		/* He is cut off at the INSIDE of the tile's line, left, right and bottom, and
		   free upwards: when he tilts for his wink or turns under the pointer, no
		   corner of him lies over the line (Evtim, 2026-11-18: "the cat comes on top
		   of the button border ... implement some kind of mask") */
		.cat-mask {
			position: absolute;
			inset: 0;
			clip-path: inset(
				-100% var(--bonus-line) var(--bonus-line) var(--bonus-line) round
					calc(var(--bonus-radius) - var(--bonus-line))
			);
			pointer-events: none;
		}
		.cat {
			position: absolute;
			left: 50%;
			/* on the line the tile is drawn with, not over it */
			bottom: var(--bonus-line);
			width: 90%;
			transform: translateX(-50%);
			transform-origin: 50% 100%;
			pointer-events: none;
			transition: transform 160ms ease;
		}
		@media (hover: hover) {
			&:hover:not(:disabled) {
				background: var(--gui-bg-solid);

				.cat {
					transform: translateX(-50%) scale(1.06) rotate(-3deg);
				}
			}
		}
		&:active:not(:disabled) {
			transform: scale(0.96);
		}
		&:disabled {
			opacity: 0.45;
		}
		/* a paid mode is on: the line in the alert colour, as on Spin */
		&.on {
			box-shadow: inset 0 0 0 var(--bonus-line) var(--gui-alert);
		}
	}

	/* The X of a paid mode, on the tile's top corner: the one place that switches
	   the mode off. Large, and its press area is larger still (::before), so a
	   thumb finds it without hitting the cat under it. */
	.off-x {
		position: absolute;
		top: calc(var(--bonus-h) * -0.3);
		right: calc(var(--bonus-h) * -0.24);
		display: grid;
		place-items: center;
		width: calc(var(--bonus-h) * 0.6);
		height: calc(var(--bonus-h) * 0.6);
		border-radius: 50%;
		background: #ffffff;
		color: #14161b;
		box-shadow:
			0 0 0 calc(var(--bonus-line) * 0.75) var(--gui-alert),
			0 calc(var(--u) * 2) calc(var(--u) * 6) rgba(0, 0, 0, 0.55);
		transition: transform 120ms ease;
		animation: gui-cost-in-plain 200ms cubic-bezier(0.2, 0.9, 0.3, 1.3);

		&::before {
			content: '';
			position: absolute;
			inset: -18%;
			border-radius: 50%;
		}
		@media (hover: hover) {
			&:hover:not(:disabled) {
				transform: scale(1.1);
			}
		}
		&:active:not(:disabled) {
			transform: scale(0.92);
		}
		&:disabled {
			opacity: 0.45;
		}
	}
	@keyframes gui-cost-in-plain {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
	}

	/* ---------------------------------------------------------------- bet stepper */
	.bet {
		display: flex;
		align-items: center;
		gap: var(--bet-gap);
	}

	.bet-text {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: var(--bet-min);
		padding-bottom: calc(var(--fs-label) * 0.5);
	}

	.progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: max(2px, calc(var(--fs-label) * 0.2));
		border-radius: 99px;
		background: var(--gui-line);
		overflow: hidden;

		i {
			display: block;
			height: 100%;
			min-width: 6%;
			border-radius: inherit;
			background: var(--gui-accent);
			transition: width 160ms ease;
		}
	}

	.chevrons {
		display: flex;
		flex-direction: column;
		gap: calc(var(--u) * 4);
	}

	.step {
		display: grid;
		place-items: center;
		width: var(--step-w);
		height: var(--step-h);
		border-radius: var(--step-radius);
		background: var(--gui-raise);
		transition:
			background-color 120ms ease,
			transform 120ms ease;

		@media (hover: hover) {
			&:hover:not(:disabled) {
				background: var(--gui-raise-hover);
			}
		}
		&:active:not(:disabled) {
			transform: scale(0.92);
		}
		&:disabled {
			opacity: 0.3;
		}
	}

	/* ---------------------------------------------------------------- menu */
	.menu-wrap {
		position: relative;
		flex: none;
	}

	.menu {
		position: absolute;
		left: 0;
		bottom: calc(100% + var(--pop-gap));
		display: flex;
		flex-direction: column;
		min-width: 11em;
		padding: 0.35em;
		border-radius: 0.6em;
		background: var(--gui-bg);
		font-size: var(--fs-menu);
		pointer-events: auto;
		box-shadow: 0 0.6em 1.8em rgba(0, 0, 0, 0.5);
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.8em;
		padding: 0.7em 0.9em;
		border-radius: 0.4em;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		text-align: start;
		white-space: nowrap;

		span {
			flex: 1;
		}
		@media (hover: hover) {
			&:hover {
				background: var(--gui-raise);
			}
		}
	}

	/* on / off, as a small switch at the row's end */
	.state {
		position: relative;
		width: 2em;
		height: 1.1em;
		border-radius: 99px;
		background: var(--gui-line);
		transition: background-color 140ms ease;

		&::after {
			content: '';
			position: absolute;
			top: 0.15em;
			left: 0.15em;
			width: 0.8em;
			height: 0.8em;
			border-radius: 50%;
			background: var(--gui-fg);
			transition: transform 140ms ease;
		}
		&.on {
			background: var(--gui-accent);
		}
		&.on::after {
			transform: translateX(0.9em);
		}
	}

	/* ---------------------------------------------------------------- autoplay panel */
	.auto-panel {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 0.55em;
		padding: 1em 1.1em 1.1em;
		border-radius: 0.7em;
		background: var(--gui-bg);
		font-size: var(--fs-panel);
		pointer-events: auto;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
		box-shadow: 0 0.6em 1.8em rgba(0, 0, 0, 0.5);

		h2,
		h3 {
			margin: 0;
			font-weight: 700;
			letter-spacing: 0.06em;
			text-transform: uppercase;
		}
		h2 {
			font-size: 1.05em;
		}
		h3 {
			margin-top: 0.35em;
			padding-top: 0.6em;
			border-top: 1px solid var(--gui-line);
			font-size: 0.82em;
			color: var(--gui-accent);
		}
	}

	.chips {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.4em;
	}

	.chip {
		padding: 0.5em 0.2em;
		border-radius: 99px;
		background: var(--gui-raise);
		font-size: 0.9em;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		transition: background-color 120ms ease;

		@media (hover: hover) {
			&:hover:not(.on) {
				background: var(--gui-raise-hover);
			}
		}
		&.on {
			background: var(--gui-accent);
			color: var(--gui-on-accent);
		}
	}

	.start {
		margin-top: 0.5em;
		padding: 0.85em 1em;
		border-radius: 0.5em;
		background: var(--gui-accent);
		color: var(--gui-on-accent);
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		transition: filter 120ms ease;

		@media (hover: hover) {
			&:hover:not(:disabled) {
				filter: brightness(1.08);
			}
		}
		&:disabled {
			opacity: 0.4;
		}
	}

	/* ================================================================ row (desktop) */
	[data-mode='row'] {
		--fs-label: calc(var(--u) * 19);
		--fs-value: calc(var(--u) * 29);
		--fs-menu: calc(var(--u) * 21);
		--fs-panel: calc(var(--u) * 21);
		--btn: calc(var(--u) * 74);
		--btn-icon: calc(var(--u) * 40);
		--btn-radius: calc(var(--u) * 12);
		--btn-bg: transparent;
		--spin: calc(var(--u) * 150);
		--bonus: calc(var(--u) * 146);
		--bonus-h: calc(var(--u) * 96); /* the plate's height */
		--bonus-radius: calc(var(--u) * 14); /* and its corners */
		--bonus-line: calc(var(--u) * 3);
		--step-w: calc(var(--u) * 52);
		--step-h: calc(var(--u) * 34);
		--step-icon: calc(var(--u) * 22);
		--step-radius: calc(var(--u) * 7);
		--bet-gap: calc(var(--u) * 16);
		--bet-min: calc(var(--u) * 150);
		--pop-gap: calc(var(--u) * 24);

		.row {
			position: absolute;
			left: 50%;
			bottom: calc(var(--u) * 12);
			transform: translateX(-50%);
			display: flex;
			align-items: center;
			gap: calc(var(--u) * 20);
		}

		.plate {
			position: relative;
			display: flex;
			align-items: center;
			gap: calc(var(--u) * 30);
			width: calc(var(--u) * 1230);
			height: calc(var(--u) * 96);
			padding: 0 calc(var(--u) * 16);
			box-sizing: border-box;
			border-radius: calc(var(--u) * 14);
			background: var(--gui-bg);
			pointer-events: auto;
		}

		.readout.balance {
			min-width: calc(var(--u) * 200);
		}


		.spacer {
			flex: 1;
		}

		/* Spin rides the plate's top edge */
		.spin-slot {
			position: relative;
			width: var(--spin);
			height: 100%;
			flex: none;
			margin: 0 calc(var(--u) * -8);

			.spin {
				position: absolute;
				left: 0;
				bottom: calc(var(--u) * -2);
			}
		}

		.auto-panel {
			right: 0;
			bottom: calc(100% + var(--u) * 70);
			width: calc(var(--u) * 560);
			max-height: calc(var(--u) * 880);
		}
	}

	/* ================================================================ strip (side + stack) */
	.strip {
		position: absolute;
		/* full bleed: the main layout is narrower than a wide window */
		left: calc(50% - 50vw);
		width: 100vw;
		bottom: 0;
		height: var(--strip);
		background: var(--gui-bg);
		pointer-events: auto;
	}

	.strip-inner {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: calc(var(--strip-w) * var(--u));
		max-width: 100vw;
		transform: translateX(-50%);
		box-sizing: border-box;
		padding: 0 calc(var(--u) * 28);
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		align-items: center;
		gap: calc(var(--u) * 24);
	}

	/* ================================================================ side (phone landscape, popouts) */
	[data-mode='side'] {
		--fs-label: calc(var(--u) * 30);
		--fs-value: calc(var(--u) * 42);
		--fs-menu: calc(var(--u) * 38);
		--fs-panel: max(calc(var(--u) * 34), 9px);
		--strip: calc(var(--u) * 124);
		--strip-w: 1920;
		--btn: calc(var(--u) * 116);
		--btn-icon: calc(var(--u) * 62);
		--btn-radius: calc(var(--u) * 26);
		--btn-bg: var(--gui-bg);
		--spin: calc(var(--u) * 214);
		--bonus: calc(var(--u) * 164);
		--bonus-h: var(--btn);
		--bonus-radius: var(--btn-radius);
		--bonus-line: calc(var(--u) * 4);
		--step-w: calc(var(--u) * 96);
		--step-h: calc(var(--u) * 88);
		--step-icon: calc(var(--u) * 40);
		--step-radius: calc(var(--u) * 16);
		--bet-gap: calc(var(--u) * 22);
		--bet-min: calc(var(--u) * 190);
		--pop-gap: calc(var(--u) * 20);

		.strip-inner {
			grid-template-columns: 1fr 1fr auto;
			padding-right: calc(var(--u) * 40);
		}

		/* under Turbo in the column: room for his crown, which rises over the tile */
		.bonus-wrap {
			margin-top: calc(var(--u) * 16);
		}

		.column {
			position: absolute;
			right: calc(var(--u) * 28);
			top: 0;
			bottom: var(--strip);
			width: var(--spin);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: calc(var(--u) * 20);
		}

		/* the menu opens beside the column, not over it */
		.menu {
			left: auto;
			right: calc(100% + var(--pop-gap));
			bottom: auto;
			top: 0;
		}

		.auto-panel {
			right: calc(var(--spin) + var(--u) * 56);
			bottom: calc(var(--strip) + var(--u) * 16);
			width: calc(var(--u) * 900);
			max-height: calc(100dvh - var(--strip) - var(--u) * 40);
			box-sizing: border-box;
		}
	}

	/* ================================================================ stack (portrait, tablet) */
	[data-mode='stack'] {
		--fs-label: calc(var(--u) * 30);
		--fs-value: calc(var(--u) * 42);
		--fs-menu: calc(var(--u) * 40);
		--fs-panel: calc(var(--u) * 36);
		--strip: calc(var(--u) * 132);
		--strip-w: 1080;
		--btn: calc(var(--u) * 132);
		--btn-icon: calc(var(--u) * 68);
		--btn-radius: calc(var(--u) * 30);
		--btn-bg: var(--gui-bg);
		--spin: calc(var(--u) * 236);
		--bonus: calc(var(--u) * 176);
		--bonus-h: var(--btn);
		--bonus-radius: var(--btn-radius);
		--bonus-line: calc(var(--u) * 4);
		--step-w: calc(var(--u) * 96);
		--step-h: calc(var(--u) * 92);
		--step-icon: calc(var(--u) * 42);
		--step-radius: calc(var(--u) * 18);
		--bet-gap: calc(var(--u) * 18);
		--bet-min: calc(var(--u) * 170);
		--pop-gap: calc(var(--u) * 22);

		.deck {
			position: absolute;
			left: 50%;
			bottom: calc(var(--strip) + var(--u) * 26);
			width: calc(var(--u) * 1024);
			max-width: 96vw;
			transform: translateX(-50%);
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.deck-side {
			display: flex;
			align-items: center;
			gap: calc(var(--u) * 26);
			/* both sides the same width, so Spin stays in the middle */
			width: calc(var(--btn) + var(--bonus) + var(--u) * 26);

			&:last-child {
				justify-content: flex-end;
			}
		}

		.auto-panel {
			left: 50%;
			bottom: calc(var(--strip) + var(--spin) + var(--u) * 60);
			width: calc(var(--u) * 1000);
			max-width: 94vw;
			max-height: calc(100dvh - var(--strip) - var(--spin) - var(--u) * 100);
			transform: translateX(-50%);
			box-sizing: border-box;
		}
	}
</style>
