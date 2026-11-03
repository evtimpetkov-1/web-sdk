<script lang="ts">
	import { onMount } from 'svelte';

	import { Container, Rectangle, Sprite } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';

	/**
	 * What fills the frame window when the symbols do not: the board drops out
	 * every spin and cascades open holes, and without this the lab background
	 * showed straight through the frame. A dark chamber with grooves between the
	 * reels, two layers of toxic murk drifting opposite ways, and a green light
	 * along the window edge that breathes — the base game's quiet cousin of the
	 * free-spins reel glow, whose fill (zIndex -1) still lights the gaps on top.
	 * Board space, clipped to the window; the bleed hides under the inner pipes.
	 */
	const context = getContext();
	const board = $derived(context.stateGameDerived.boardLayout());

	const BLEED = 6;
	// units per second (opposite ways, different paces read as depth) and opacity
	const FOG_LAYERS = [
		{ key: 'msBackingFogA', speed: 9, alpha: 0.6 },
		{ key: 'msBackingFogB', speed: -5.5, alpha: 0.45 },
	];
	const GLOW_MIN = 0.55;
	const GLOW_PERIOD_S = 4;

	// driven by the Pixi ticker, so it pauses with the renderer
	let time = $state(0);
	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		const tick = () => (time += app.ticker.deltaMS / 1000);
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	const glowAlpha = $derived(
		GLOW_MIN + (1 - GLOW_MIN) * (0.5 + 0.5 * Math.sin((2 * Math.PI * time) / GLOW_PERIOD_S)),
	);
	/** each fog texture tiles with a period of one board width: two copies, wrapped into [-W, 0] */
	const fogX = (speed: number) => {
		const w = board.width;
		return -((((time * speed) % w) + w) % w);
	};
</script>

<Container zIndex={-2}>
	<BoardContainer>
		<Rectangle
			isMask
			x={-BLEED}
			y={-BLEED}
			width={board.width + BLEED * 2}
			height={board.height + BLEED * 2}
		/>
		<Sprite
			key="msBackingPanel"
			x={-BLEED}
			y={-BLEED}
			width={board.width + BLEED * 2}
			height={board.height + BLEED * 2}
		/>
		{#each FOG_LAYERS as layer (layer.key)}
			{#each [0, 1] as copy (copy)}
				<Sprite
					key={layer.key}
					x={fogX(layer.speed) + copy * board.width}
					width={board.width}
					height={board.height}
					alpha={layer.alpha}
				/>
			{/each}
		{/each}
		<Sprite key="msBackingGlow" width={board.width} height={board.height} alpha={glowAlpha} />
	</BoardContainer>
</Container>
