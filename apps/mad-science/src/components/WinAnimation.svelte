<script lang="ts" module>
	export type WinTier = 'big' | 'mega' | 'epic';
	/** climb order; a presentation always starts at big and upgrades one step at a time */
	export const WIN_TIERS: WinTier[] = ['big', 'mega', 'epic'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { SpineProvider, SpineTrack, SpineSlot } from 'pixi-svelte';

	import { getContext } from '../game/context';

	/**
	 * The big-win titles (spines/msBigwin, built by
	 * art-review/madscience/bigwin/build_bigwin.py): BIG / MEGA / EPIC WIN as one
	 * rig. Phases: `big_in` stamps the first title in, `<tier>_idle` loops,
	 * `to_mega` / `to_epic` blast the shown title away and stamp the next one in,
	 * `<tier>_out` collapses everything. The count-up text is mounted in the
	 * rig's `slot_win_count`, so the bone carries its punches.
	 */
	type Phase = 'in' | 'idle' | 'to' | 'out';

	type Props = {
		/** the tier to show now; raising it while idling plays the upgrade(s) */
		tier: WinTier;
		requestExit?: boolean;
		onexit?: () => void;
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();

	/** the rig is 1600 world px wide; the board width times this is what it spans on screen */
	const WIN_SCALE = 1.15;

	let shown = $state<WinTier>('big');
	let phase = $state<Phase>('in');

	const animationName = $derived(
		phase === 'in' ? 'big_in' : phase === 'to' ? `to_${shown}` : `${shown}_${phase}`,
	);
	const idx = (tier: WinTier) => WIN_TIERS.indexOf(tier);

	// decided whenever an animation completes, and at once when the inputs move while idling
	const advance = () => {
		if (phase === 'out') return;
		if (props.requestExit) {
			phase = 'out';
			return;
		}
		if (idx(props.tier) > idx(shown)) {
			shown = WIN_TIERS[idx(shown) + 1];
			phase = 'to';
			return;
		}
		phase = 'idle';
	};

	$effect(() => {
		void props.requestExit;
		void props.tier;
		if (phase === 'idle') advance();
	});
</script>

<SpineProvider
	key="msBigwin"
	width={context.stateGameDerived.boardLayout().width * WIN_SCALE}
>
	<SpineTrack
		trackIndex={0}
		{animationName}
		loop={phase === 'idle'}
		listener={{
			complete: () => {
				if (phase === 'out') props.onexit?.();
				else advance();
			},
		}}
	/>
	<SpineSlot slotName="slot_win_count">
		{@render props.children()}
	</SpineSlot>
</SpineProvider>
