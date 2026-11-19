import { stateBet, stateBetDerived, stateModal } from 'state-shared';

/**
 * The spin button's press, for the HTML bar. The same rules as
 * components-ui-pixi's ButtonBetProvider (keep the two in step): a bet the balance
 * cannot cover is answered with the insufficient-funds popup, a press over a 'buy'
 * mode asks the game first (stateBet.onBuyModeBet) and otherwise drops to BASE, a
 * press during a round is STOP (which also ends autoplay), and STOP goes inert
 * after one press until the round enables it again.
 */
type Context = {
	eventEmitter: {
		broadcast: (event: { type: 'bet' | 'stopButtonClick' | 'soundPressBet' }) => void;
		subscribeOnMount: (handlers: Record<string, () => void>) => void;
	};
	stateXstateDerived: { isIdle: () => boolean };
};

export type BetPressKey = 'spin_default' | 'spin_disabled' | 'stop_default' | 'stop_disabled';

export const createBetPress = (context: Context) => {
	let stopDisabled = $state(false);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => (stopDisabled = true),
		stopButtonEnable: () => (stopDisabled = false),
	});

	const bet = () => {
		if (!stateBetDerived.isBetCostAvailable()) {
			stateModal.modal = { name: 'insufficientFunds' };
			return;
		}
		if (stateBetDerived.activeBetMode()?.type === 'buy') {
			if (stateBet.onBuyModeBet?.()) return;
			stateBet.activeBetModeKey = 'BASE';
		}
		context.eventEmitter.broadcast({ type: 'bet' });
	};

	const stop = () => {
		if (stopDisabled) return;
		if (stateBetDerived.hasAutoBetCounter()) stateBet.autoSpinsCounter = 0;
		context.eventEmitter.broadcast({ type: 'stopButtonClick' });
	};

	return {
		press: () => {
			const starting = context.stateXstateDerived.isIdle();
			if (starting || !stopDisabled) context.eventEmitter.broadcast({ type: 'soundPressBet' });
			if (starting) bet();
			else stop();
		},
		get key(): BetPressKey {
			if (context.stateXstateDerived.isIdle()) {
				return stateBetDerived.isBetCostAvailable() ? 'spin_default' : 'spin_disabled';
			}
			if (stopDisabled) return 'stop_disabled';
			if (stateBetDerived.hasAutoBetCounter()) return 'stop_default';
			if (stateBet.isTurbo) return 'stop_disabled';
			return 'stop_default';
		},
	};
};
