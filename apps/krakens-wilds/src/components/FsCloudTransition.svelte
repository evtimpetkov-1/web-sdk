<script lang="ts" module>
	export type EmitterEventFsCloud = { type: 'fsCloudBurst' };
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	let show = $state(false);
	let onCovered = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		// resolves when the cloud fully covers the screen — the caller swaps
		// scenes behind it while the burst dissipates on its own
		fsCloudBurst: async () => {
			show = true;
			await waitForResolve((resolve) => (onCovered = resolve));
		},
	});
</script>

{#if show}
	<!-- origin sits up near the kraken so the eruption reads as coming from it -->
	<SpineProvider
		key="fsFx"
		x={canvas.width / 2}
		y={canvas.height * 0.38}
		width={Math.max(canvas.width, canvas.height) * 1.15}
	>
		<SpineTrack
			trackIndex={0}
			animationName="cloud_burst"
			loop={false}
			listener={{
				event: (_, event) => {
					if (event.data?.name === 'covered') onCovered();
				},
				complete: () => (show = false),
			}}
		/>
	</SpineProvider>
{/if}
