<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { getContextSpine } from 'pixi-svelte';

	import { BOMB_HEARTBEAT } from '../game/constants';
	import { getContext } from '../game/context';

	/**
	 * Mounted inside an armed bomb's SpineProvider while it plays its idle loop: the
	 * fuse sound's heartbeat (rig_bomb idle, sfx_dg_bomb_fuse). Every cascade swaps
	 * the reel and tumble boards, so the loop used to restart from its first frame
	 * at a random point of the sound, and two bombs pulsed apart (Evtim, 2026-10-26).
	 * Here the loop is entered at the point the sound's clock is at, so every bomb
	 * beats with the sound and with each other. It used to wait at rest for the next
	 * quiet point of Chaos Lab's rig (up to 0.6 s after every cascade); this game's
	 * loop has no rest any more, and that wait was one reason it "did not loop
	 * smoothly" (Evtim, 2026-11-16). Set once per start; the loop runs at 1x like
	 * the sound.
	 */
	const context = getContext();
	const spine = getContextSpine();

	const lock = () => {
		const track = spine.state.tracks[0];
		if (track?.animation?.name !== BOMB_HEARTBEAT.animation) return false;
		const { period, offset } = BOMB_HEARTBEAT;
		// no fuse playing (e.g. a story without sound): any shared clock keeps bombs together
		const anchor = untrack(() => context.stateGame.bombFuseStartedAt) ?? 0;
		const phase = ((((performance.now() - anchor) / 1000 - offset) % period) + period) % period;
		track.delay = 0;
		track.trackTime = phase;
		return true;
	};

	// the track switches to the idle in SpineTrack's own effect: if it has not yet,
	// lock on the next frame
	onMount(() => {
		if (lock()) return;
		const frame = requestAnimationFrame(() => lock());
		return () => cancelAnimationFrame(frame);
	});
</script>
