<script lang="ts" module>
	import {
		Emitter,
		upgradeConfig,
		type EmitterConfigV3,
		type EmitterConfigV2,
		type EmitterConfigV1,
	} from '@barvynkoa/particle-emitter';

	import type { LoadedSpriteSheet } from '../types';

	export type Props = Partial<Emitter> & {
		key: string;
		emitSpeed?: number;
		config: EmitterConfigV3 | EmitterConfigV2 | EmitterConfigV1;
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getContextApp, getContextParent } from '../context.svelte';
	import { propsSyncEffect } from '../utils.svelte';

	const props: Props = $props();
	const context = getContextApp();
	const parentContext = getContextParent();
	const textures = $derived(context.stateApp.loadedAssets?.[props.key] as LoadedSpriteSheet);
	const updatedConfig = $derived(upgradeConfig(props.config, textures));
	// svelte-ignore state_referenced_locally
	const emitter = new Emitter(parentContext.parent, updatedConfig);

	propsSyncEffect({ props, target: emitter, ignore: ['emit'] });

	$effect(() => {
		emitter.init(updatedConfig);
	});

	// The ticker callback MUST be removed again on destroy. It used to be added
	// anonymously and never taken off, so every emitter that ever mounted kept a
	// live callback on the application ticker for the rest of the session — each
	// one still poking a destroyed emitter, sixty times a second, forever. Short-
	// lived emitters (a wild's landing dust, a coin shower) mount many times a
	// round, so this accumulated fast.
	const app = context.stateApp.pixiApplication;
	if (app) {
		const tick = () => {
			// NOTE: the library's `emit` setter re-arms `_emitterLife` on EVERY
			// assignment, so an emitter with a finite `emitterLifetime` that is held
			// at `emit={true}` restarts here each frame and never expires. Drive
			// `emit` to false from the caller to end a burst — do not rely on
			// `emitterLifetime` alone.
			emitter.emit = !!props.emit;
			emitter.update(app.ticker.deltaMS * (props.emitSpeed || 0.00234));
		};
		app.ticker.add(tick);
		onDestroy(() => app.ticker.remove(tick));
	}

	onDestroy(() => {
		emitter.emit = false;
		emitter.destroy();
	});
</script>
