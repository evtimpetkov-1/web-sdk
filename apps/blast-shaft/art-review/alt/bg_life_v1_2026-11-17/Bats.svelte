<script lang="ts">
	// Something alive in the mine, now and then (Evtim, 2026-11-16, idea 4: "a bat
	// across the tunnel"; rare, like the hen in Dynamite Gulch). A cave bat crosses
	// the upper part of the screen BEHIND the reels every half minute or so, on a
	// bobbing line, flapping (four painted frames, bs/fx/bat.webp). A bomb or the
	// cloners bursting sometimes flushes two or three out at once. Never more than
	// one flight at a time, and none under prefers-reduced-motion.
	// Canvas px at the root, between the living background (-1.5) and the board (0).
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	const FLAP_FPS = 13;
	const EVERY_S = [26, 58];
	const FLUSH_CHANCE = 0.4;
	type Bat = { id: number; t: number; life: number; x0: number; x1: number; y0: number; y1: number; size: number; bob: number; phase: number; delay: number };
	let bats = $state<Bat[]>([]);
	let nextId = 0;
	const rand = (a: number, b: number) => a + Math.random() * (b - a);

	const launch = (count: number, hurried: boolean) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const fromLeft = Math.random() < 0.5;
		for (let i = 0; i < count; i++) {
			const size = rand(0.17, 0.23) * height;
			bats.push({
				id: nextId++,
				t: 0,
				delay: i * rand(0.12, 0.3),
				life: (hurried ? rand(2.2, 3.0) : rand(3.4, 4.8)) * Math.max(1, width / height / 1.78),
				x0: fromLeft ? -size : width + size,
				x1: fromLeft ? width + size : -size,
				y0: rand(0.1, 0.3) * height,
				y1: rand(0.06, 0.34) * height,
				size,
				bob: rand(0.018, 0.04) * height,
				phase: rand(0, 6.28),
			});
		}
	};

	const quiet =
		typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	// ?ambient=fast: one every few seconds, to look at them
	const fast =
		typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ambient') === 'fast';
	let wait = fast ? 1.5 : rand(12, 30);
	// mounted by Game once the game is up, so the Pixi application exists here
	$effect(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || quiet) return;
		const tick = () => {
			const dt = Math.min(0.05, app.ticker.deltaMS / 1000);
			if (bats.length) {
				for (const bat of bats) bat.t += dt;
				if (bats.some((bat) => bat.t >= bat.life + bat.delay)) {
					bats = bats.filter((bat) => bat.t < bat.life + bat.delay);
				}
				return;
			}
			wait -= dt;
			if (wait <= 0 && !document.hidden) {
				wait = fast ? 2.5 : rand(EVERY_S[0], EVERY_S[1]);
				launch(Math.random() < 0.2 ? 2 : 1, false);
			}
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			if (quiet || bats.length) return;
			if ((preset === 'bomb' || preset === 'clonerBurst') && Math.random() < FLUSH_CHANCE) {
				launch(2 + Math.floor(Math.random() * 2), true);
			}
		},
	});
</script>

<Container zIndex={-1.4}>
	{#each bats as bat (bat.id)}
		{@const t = bat.t - bat.delay}
		{#if t >= 0}
			{@const k = t / bat.life}
			<Sprite
				key={`bat_${Math.floor(t * FLAP_FPS) % 4}.png`}
				anchor={0.5}
				x={bat.x0 + (bat.x1 - bat.x0) * k}
				y={bat.y0 + (bat.y1 - bat.y0) * k + bat.bob * Math.sin(bat.phase + t * 5.2)}
				width={bat.x1 > bat.x0 ? bat.size : -bat.size}
				height={bat.size}
			/>
		{/if}
	{/each}
</Container>
