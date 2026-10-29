<script lang="ts" module>
	import { stateBet, stateBetDerived, stateModal } from 'state-shared';
</script>

<script lang="ts">
	import OnHotkey from './OnHotkey.svelte';

	/**
	 * Hold-to-spin runs in turbo, then hands the player's own turbo setting back.
	 * The release used to force turbo OFF (and save that), so a Space press held a
	 * little too long switched off the turbo the player had on, with the button
	 * still lit (2026-10-26). OnHotkey can fire onhold twice for one hold, so the
	 * setting is only taken when the hold begins.
	 */
	let turboBeforeHold = false;

	const spaceHoldOn = () => {
		if (!stateBet.isSpaceHold) turboBeforeHold = stateBet.isTurboPersistent;
		stateBet.autoSpinsCounter = 0;
		stateBet.isSpaceHold = true;
		stateBetDerived.updateIsTurbo(true, { persistent: true });
	};

	const spaceHoldOff = () => {
		if (!stateBet.isSpaceHold) return;
		stateBet.isSpaceHold = false;
		stateBetDerived.updateIsTurbo(turboBeforeHold, { persistent: true });
	};
</script>

<!-- Space must not arm hold-to-spin (or flip turbo) while a modal is up — same
     guard as ButtonBet's Space hotkey. -->
<OnHotkey
	hotkey="Space"
	disabled={stateModal.modal !== null}
	onhold={spaceHoldOn}
	onholdend={spaceHoldOff}
/>
