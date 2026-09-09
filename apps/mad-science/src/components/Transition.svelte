<script lang="ts" module>
	export type EmitterEventTransition =
		/** curtains close and part again in one go */
		| { type: 'transition' }
		/** curtains close and STAY closed — swap the scene behind them, then open */
		| { type: 'transitionClose' }
		| { type: 'transitionOpen' };
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';

	/**
	 * The bloody theatre curtains (rig spines/msFsCurtain, built by
	 * art-review/madscience/fsintro/build_fsintro.py): four panels slide in from
	 * the sides over a black shade and part again. Base <-> free spins switches
	 * happen while they are closed (bookEventHandlerMap), so the background and
	 * frame swap is never seen.
	 */
	type Phase = 'open' | 'closing' | 'closed' | 'opening';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	/** the rig is 1600x1000: scale it to cover the canvas whatever its aspect */
	const scale = $derived(Math.max(canvas.width / 1600, canvas.height / 1000) * 1.02);

	let phase = $state<Phase>('open');
	let oncomplete = $state(() => {});

	const close = async () => {
		if (phase === 'closed') return;
		phase = 'closing';
		await waitForResolve((resolve) => (oncomplete = resolve));
		phase = 'closed';
	};
	const open = async () => {
		if (phase === 'open') return;
		phase = 'opening';
		await waitForResolve((resolve) => (oncomplete = resolve));
		phase = 'open';
	};

	context.eventEmitter.subscribeOnMount({
		transition: async () => {
			await close();
			await open();
		},
		transitionClose: close,
		transitionOpen: open,
	});

	// `close` holds its last frame while the phase is 'closed'
	const animationName = $derived(phase === 'opening' ? 'open' : 'close');
</script>

{#if phase !== 'open'}
	<SpineProvider key="msFsCurtain" x={canvas.width / 2} y={canvas.height / 2} {scale}>
		<SpineTrack
			trackIndex={0}
			{animationName}
			listener={{
				complete: () => oncomplete(),
			}}
		/>
	</SpineProvider>
{/if}
