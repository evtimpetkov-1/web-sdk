<script lang="ts" module>
	export type EmitterEventFsCloud =
		/** `hold: true` freezes the burst at full coverage until fsCloudRelease. */
		| { type: 'fsCloudBurst'; hold?: boolean }
		| { type: 'fsCloudRelease' };
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	let show = $state(false);
	let onCovered = $state(() => {});
	/**
	 * The free-spins intro plays ON the cloud (2026-08-26 rework): the burst is
	 * frozen at its `covered` frame — timeScale 0 on the track — so the smoke
	 * stays up as the intro's backdrop instead of dissipating behind an opaque
	 * plate. `fsCloudRelease` lets it run on to completion, which is what
	 * reveals the free-spins board. A track at timeScale 0 can never fire
	 * `complete`, so the component cannot tear itself down while held.
	 */
	let holdRequested = $state(false);
	let held = $state(false);

	context.eventEmitter.subscribeOnMount({
		// resolves when the cloud fully covers the screen — the caller swaps
		// scenes behind it while the burst dissipates (or holds, see above)
		fsCloudBurst: async (emitterEvent) => {
			holdRequested = emitterEvent.hold ?? false;
			held = false;
			show = true;
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_kw_fs_transition', forcePlay: true }); // prettier-ignore
			await waitForResolve((resolve) => (onCovered = resolve));
		},
		fsCloudRelease: () => {
			held = false;
			holdRequested = false;
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
			timeScale={held ? 0 : 1}
			listener={{
				event: (_, event) => {
					if (event.data?.name === 'covered') {
						if (holdRequested) held = true;
						onCovered();
					}
				},
				complete: () => (show = false),
			}}
		/>
	</SpineProvider>
{/if}
