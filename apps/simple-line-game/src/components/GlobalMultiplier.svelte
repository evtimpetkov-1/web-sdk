<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| { type: 'globalMultiplierUpdate'; multiplier: number };
</script>

<script lang="ts">
	import { getContext } from '../game/context';

	const context = getContext();

	let multiplier = $state(1);

	// TODO: add custom globalMultiplier Spine animation
	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => {},
		globalMultiplierHide: () => {},
		globalMultiplierUpdate: async (emitterEvent) => {
			multiplier = emitterEvent.multiplier;
		},
	});
</script>
