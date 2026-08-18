<script lang="ts" module>
	import * as PIXI from 'pixi.js';

	import type { OverwriteCursor } from '../types';

	export type Props = OverwriteCursor<PIXI.SpriteOptions> & {
		isMask?: boolean;
	};
</script>

<script lang="ts">
	import { propsSyncEffect } from '../utils.svelte';
	import { getContextParent } from '../context.svelte';

	const props: Props = $props();

	const parentContext = getContextParent();
	const sprite = new PIXI.Sprite(props.texture);

	// `texture` first: width/height set scale from texture.orig, so applying them
	// while the old texture is still attached scales the sprite against the wrong
	// size. Only visible when a sprite's texture swaps between differently-sized
	// frames — e.g. symbols changing during a reel spin.
	propsSyncEffect({ props, target: sprite, ignore: ['isMask'], first: ['texture'] });

	$effect(() => {
		if (props.isMask !== undefined) {
			parentContext.parent.mask = props.isMask ? sprite : null;
		}
	});

	parentContext.addToParent(sprite);
</script>
