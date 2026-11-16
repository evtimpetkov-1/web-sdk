<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { Container, Sprite } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import GooBurst from './GooBurst.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	/**
	 * The multiplier's empty tile bursting in its cell while its value is still
	 * flying to the plaque (Evtim, 2026-11-13: "when it starts to fly, at some point
	 * during midflight, the placeholder will explode"). The same pop and burst a
	 * paid symbol gets (TumbleSymbol): the tile swells and fades under the burst
	 * rig. The reel cell is already empty (M_GONE) when this mounts.
	 */
	type Props = {
		x: number;
		y: number;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const tile = getSymbolInfo({ rawSymbol: { name: 'M_TAKEN' }, state: 'static' });
	const scale = new Tween(1);
	const alpha = new Tween(1);

	onMount(async () => {
		const timeScale = stateBetDerived.timeScale();
		await scale.set(1.15, { duration: 80 / timeScale, easing: cubicOut });
		alpha.set(0, { duration: 60 / timeScale, easing: cubicIn });
		await scale.set(1.25, { duration: 60 / timeScale, easing: cubicOut });
	});
</script>

<Container x={props.x} y={props.y}>
	<Container scale={scale.current} alpha={alpha.current}>
		<Sprite
			key={tile.assetKey}
			anchor={0.5}
			width={SYMBOL_SIZE * tile.sizeRatios.width}
			height={SYMBOL_SIZE * tile.sizeRatios.height}
		/>
	</Container>
	<GooBurst oncomplete={props.oncomplete} />
</Container>
