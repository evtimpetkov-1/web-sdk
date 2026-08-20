<script lang="ts">
	import { getContextSpine } from 'pixi-svelte';

	/**
	 * Grammar fix for the fstext splash: on a +1 retrigger the baked lettering
	 * must read "FREE SPIN", not "FREE SPINS".
	 *
	 * Rendered INSIDE the SpineProvider (needs the spine context). The trailing
	 * "S" is its own piece (slot fs_l5, verified against the atlas), and no
	 * animation carries attachment timelines — only alpha — so nulling the
	 * slot's attachment hides it for the whole splash. The attachment reset is
	 * automatic: each mount instantiates a fresh skeleton from the shared data.
	 *
	 * The letters hang off fs_grp, centred for the FULL word: without the S
	 * (spans x -673.3..+540.9) the remaining ink's centre sits at -66.2, so the
	 * group shifts +66.2 to recentre. That offset lives on the SHARED bone data
	 * (translate timelines add to data.x), so it is re-derived from a stashed
	 * pristine base on every mount — a singular splash can never leak its shift
	 * into a later plural one.
	 */
	type Props = { singular: boolean };

	const props: Props = $props();
	const spine = getContextSpine();

	const SHIFT_X = 66.2;

	const bone = spine.skeleton.findBone('fs_grp');
	if (bone) {
		const data = bone.data as unknown as { x: number; __baseX?: number };
		data.__baseX ??= data.x ?? 0;
		data.x = data.__baseX + (props.singular ? SHIFT_X : 0);
		bone.setToSetupPose();
	}
	if (props.singular) {
		const slot = spine.skeleton.findSlot('fs_l5');
		if (slot) slot.attachment = null;
	}
</script>
