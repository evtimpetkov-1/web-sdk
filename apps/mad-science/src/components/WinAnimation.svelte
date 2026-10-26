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

	/**
	 * On-screen width of the rig's 1600 x 1000 box (bigwin.json skeleton bounds):
	 * WIN_SCALE x the board width — 1.15 until Evtim asked for bigger
	 * (2026-10-24) — capped so the whole box stays inside the main layout.
	 * Portrait (800 wide) is the one the cap binds: there it grows 638 -> 784.
	 */
	const WIN_SCALE = 1.75;
	const RIG_RATIO = 1000 / 1600;
	const FIT = 0.98;
	const width = $derived.by(() => {
		const main = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		return Math.min(board.width * WIN_SCALE, main.width * FIT, (main.height * FIT) / RIG_RATIO);
	});

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
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ms_win_end' });
			return;
		}
		if (idx(props.tier) > idx(shown)) {
			shown = WIN_TIERS[idx(shown) + 1];
			phase = 'to';
			// BIG's stinger opened the presentation (winLevelMap); each upgrade stamps its own
			context.eventEmitter.broadcast({
				type: 'soundOnce',
				name: shown === 'epic' ? 'sfx_ms_win_epic' : 'sfx_ms_win_mega',
			});
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

<SpineProvider key="msBigwin" {width}>
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
