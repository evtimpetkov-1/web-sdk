<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import type { HouseLantern } from '../game/houseLanterns';
	import { LANTERN_ART } from '../game/windLife';
	import { reducedMotion, windNow } from '../game/wind';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	/**
	 * The lanterns on the houses (Evtim, 2026-11-20: "these lanterns instead of being on the
	 * side of the reels, Can you put them on the left and on the right houses in the
	 * background", desktop and landscape only; FrameLife draws none there). Each house has a
	 * small painted lantern on a short rod, the saloon's under its balcony, the shed's under
	 * its porch roof: that one is painted out by a patch of the painting, and the game's
	 * lantern (the one the frame had) hangs from the rod's end instead.
	 * Under the porch they are sheltered: they sway gently in the street's wind (game/wind.ts),
	 * a strong quake of the board rattles them (it throws the saloon's doors open too), their
	 * flames flicker and they flare on a win, while a Scatter is awaited and when Cash Respins
	 * start; at night they glow brighter. Drawn in the painting's px under Ambient's cover
	 * transform. Under prefers-reduced-motion they hang still and lit.
	 * Built by art-review/dynamite-gulch/rework/build_house_lanterns.py (patches + game/houseLanterns.ts).
	 */
	type Props = { lanterns: HouseLantern[]; night: boolean; active: boolean };
	const props: Props = $props();
	const context = getContext();
	const still = reducedMotion();

	const GRAVITY = 17; // it swings about once in a second and a half, like the frame's did
	const DAMP = 1.1;
	// sheltered: a lean and a flutter in a gust, a slow breath in a lull (half the frame's)
	const WIND = { push: 1.1, gusty: 1.3, breath: 0.35 };
	const MAX_ANGLE = 0.32; // further and it would knock the post beside it
	const QUAKE = { from: 0.3, kick: [0.5, 1.6] }; // trauma it takes, rad/s at that trauma and at 1
	const GLOW = { size: 1.75, day: 0.4, night: 0.7, flare: 0.5 }; // size x the lantern's height
	const WARM = 0xffb040;
	const NIGHT_TINT = 0xb8c0e6;
	const ASPECT = 148 / 340; // lantern.png

	const swings = [
		{ angle: 0.02, speed: 0, phase: 0.4, flare: 0 },
		{ angle: -0.03, speed: 0, phase: 2.9, flare: 0 },
	];
	let time = $state(0);
	let angles = $state([0, 0]);
	let flares = $state([0, 0]);

	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || still) return;
		const tick = () => {
			if (!props.active) return;
			const dt = Math.min(0.05, app.ticker.deltaMS / 1000);
			time += dt;
			const gust = windNow();
			const pending = context.stateGame.scatterPending;
			swings.forEach((swing) => {
				// the wind blows left to right: it leans the lantern's foot that way (a negative turn)
				const flutter = Math.sin(2.3 * time + swing.phase) * Math.sin(0.9 * time + 2 * swing.phase);
				const torque =
					-WIND.push * (0.12 + gust) + WIND.gusty * gust * flutter + WIND.breath * Math.sin(1.1 * time + swing.phase);
				swing.speed += (-GRAVITY * Math.sin(swing.angle) - DAMP * swing.speed + torque) * dt;
				swing.angle += swing.speed * dt;
				if (Math.abs(swing.angle) > MAX_ANGLE) {
					swing.angle = Math.sign(swing.angle) * MAX_ANGLE;
					swing.speed *= -0.35;
				}
				if (pending) swing.flare = Math.max(swing.flare, 0.75);
				swing.flare = Math.max(0, swing.flare - 1.4 * dt);
			});
			angles = swings.map((swing) => swing.angle);
			flares = swings.map((swing) => swing.flare);
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	const flareAll = (level: number) => swings.forEach((swing) => (swing.flare = Math.max(swing.flare, level)));
	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			if (still || !props.active) return;
			const { trauma = 0 } = SHAKE_PRESETS[preset] as { trauma?: number };
			if (trauma < QUAKE.from) return;
			const kick = QUAKE.kick[0] + (QUAKE.kick[1] - QUAKE.kick[0]) * trauma;
			swings.forEach((swing) => (swing.speed += (Math.random() < 0.5 ? -1 : 1) * kick * (0.7 + 0.45 * Math.random())));
			if (trauma >= 0.5) flareAll(0.6);
		},
		winGoldFly: () => {
			if (!still) flareAll(0.7);
		},
		boardFrameGlowShow: () => {
			if (!still) flareAll(1);
		},
	});

	const flicker = (i: number) =>
		still ? 0 : 0.07 * Math.sin(7.3 * time + swings[i].phase) + 0.05 * Math.sin(12.7 * time + 2 * swings[i].phase) + 0.04 * Math.sin(2.1 * time);
	// the glass's middle: below the bail by its share of the height, turned with the lantern
	const glass = (lantern: HouseLantern, i: number) => {
		const drop = (LANTERN_ART.glass.y - LANTERN_ART.bail.y) * lantern.height;
		return { x: lantern.x - Math.sin(angles[i]) * drop, y: lantern.y + Math.cos(angles[i]) * drop };
	};
</script>

<!-- a persistent Container, not an {#if}: a remounted child is appended at the end of its
     parent and would jump over the stars and the clouds' occluders -->
<Container visible={props.active}>
	{#each props.lanterns as lantern, i (lantern.patch.key)}
		{@const at = glass(lantern, i)}
		{@const glow = lantern.height * GLOW.size * (1 + 0.5 * flares[i] + flicker(i))}
		<Sprite key={lantern.patch.key} x={lantern.patch.x} y={lantern.patch.y} width={lantern.patch.width} height={lantern.patch.height} />
		<Sprite
			key="lantern.png"
			anchor={{ x: LANTERN_ART.bail.x, y: LANTERN_ART.bail.y }}
			x={lantern.x}
			y={lantern.y}
			width={lantern.height * ASPECT}
			height={lantern.height}
			rotation={angles[i]}
			tint={props.night ? NIGHT_TINT : 0xffffff}
		/>
		<Sprite
			key="glow.png"
			anchor={0.5}
			x={at.x}
			y={at.y}
			width={glow}
			height={glow}
			tint={WARM}
			alpha={Math.min(1, (props.night ? GLOW.night : GLOW.day) + flicker(i) + GLOW.flare * flares[i])}
			blendMode="add"
		/>
	{/each}
</Container>
