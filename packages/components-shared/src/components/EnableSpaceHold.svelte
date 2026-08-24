<script lang="ts" module>
	import { stateBet, stateBetDerived, stateModal } from 'state-shared';
</script>

<script lang="ts">
	import OnHotkey from './OnHotkey.svelte';

	const spaceHoldOn = () => {
		stateBet.autoSpinsCounter = 0;
		stateBet.isSpaceHold = true;
		stateBetDerived.updateIsTurbo(true, { persistent: true });
	};

	const spaceHoldOff = () => {
		stateBet.isSpaceHold = false;
		stateBetDerived.updateIsTurbo(false, { persistent: true });
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
