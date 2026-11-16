<script lang="ts" module>
	/**
	 * What moves in each background, in that ART's own pixels (Background lays this
	 * layer over the art with the art's cover transform, so it follows any screen).
	 * Clouds: where each starts, its width and its drift in art px per second (slow:
	 * a crossing takes minutes). `occluders`: pieces of the art drawn again OVER
	 * the clouds, at their own place: the building tops a cloud passes behind (cut
	 * out by art-review/dynamite-gulch/build_ambient.py, same rects). Night only:
	 * the stars that twinkle and the two porch lanterns that flicker.
	 */
	export type AmbientScene = {
		width: number;
		height: number;
		night: boolean;
		clouds: { key: string; x: number; y: number; width: number; speed: number }[];
		occluders: { key: string; x: number; y: number; width: number; height: number }[];
		stars: { x: number; y: number; size: number }[];
		lanterns: { x: number; y: number; size: number }[];
	};

	export const AMBIENT_SCENES = {
		// the day street: both clouds keep above y 345 (a cloud is 0.42 of its width
		// tall), where only the two building tops stand in the sky. Lower down the
		// windmill does, and it is not cut out.
		day: {
			width: 1920,
			height: 1288,
			night: false,
			clouds: [
				{ key: 'cloud_a.png', x: 260, y: 96, width: 500, speed: 7 },
				{ key: 'cloud_c.png', x: 1180, y: 180, width: 380, speed: 4.5 },
			],
			occluders: [
				{ key: 'occ_left.png', x: 0, y: 120, width: 470, height: 350 },
				{ key: 'occ_right.png', x: 1600, y: 260, width: 320, height: 210 },
			],
			stars: [],
			lanterns: [],
		},
		// the tall art: its sky is open down to y 640, the clouds stay above that
		portrait: {
			width: 1288,
			height: 1920,
			night: false,
			clouds: [
				{ key: 'cloud_a.png', x: 120, y: 130, width: 520, speed: 6 },
				{ key: 'cloud_c.png', x: 820, y: 400, width: 400, speed: 4 },
			],
			occluders: [],
			stars: [],
			lanterns: [],
		},
		// the night street: no cloud (a dark cloud over a dark sky adds nothing)
		night: {
			width: 1920,
			height: 1288,
			night: true,
			clouds: [],
			occluders: [],
			stars: [
				{ x: 165, y: 58, size: 44 },
				{ x: 252, y: 196, size: 34 },
				{ x: 432, y: 300, size: 38 },
				{ x: 790, y: 216, size: 40 },
				{ x: 906, y: 402, size: 30 },
				{ x: 1104, y: 156, size: 36 },
				{ x: 1258, y: 76, size: 42 },
				{ x: 1640, y: 140, size: 40 },
				{ x: 1556, y: 36, size: 32 },
			],
			lanterns: [
				{ x: 316, y: 626, size: 170 },
				{ x: 1660, y: 662, size: 160 },
			],
		},
	} satisfies Record<string, AmbientScene>;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	/**
	 * The living background (Evtim, 2026-11-13: no mascot, "animate the background
	 * ... some other effects also would be nice, but just dont over do it"). Quiet
	 * things that never compete with the reels:
	 *  - by day two painted clouds drift across the sky, always, very slowly, and
	 *    BEHIND the buildings (their tops are drawn again over the clouds);
	 *  - at night the stars twinkle one at a time and the porch lanterns flicker.
	 * The tumbleweed and the hen are not here: they cross in front of the reels
	 * (Boardwalk.svelte).
	 * Everything is drawn in the art's pixels under the art's cover transform (the
	 * parent passes x / y / scale). Driven by the Pixi ticker, so it pauses with
	 * the renderer; `active` = this background is the one on screen. Motion is off
	 * under prefers-reduced-motion (the clouds then simply stand).
	 */
	type Props = {
		scene: AmbientScene;
		x: number;
		y: number;
		scale: number;
		active: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	// `?ambient=fast` (a look without the wait, as for the tumbleweed): the clouds
	// cross in seconds instead of minutes
	const CLOUD_PACE = new URLSearchParams(window.location.search).get('ambient') === 'fast' ? 30 : 1;

	let time = $state(0);
	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		const tick = () => {
			if (props.active) time += app.ticker.deltaMS / 1000;
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});

	const cloudX = (cloud: AmbientScene['clouds'][number]) => {
		const span = props.scene.width + cloud.width * 2;
		return ((((cloud.x + cloud.width + cloud.speed * CLOUD_PACE * time) % span) + span) % span) - cloud.width;
	};
	// one star at a time flares: each has its own slow beat, sharpened to a brief peak
	const starAlpha = (index: number) =>
		0.12 + 0.88 * Math.max(0, Math.sin(time * (0.5 + 0.13 * index) + index * 1.9)) ** 8;
	const lanternAlpha = (index: number) =>
		0.2 + 0.05 * Math.sin(time * 7.3 + index * 2) + 0.04 * Math.sin(time * 12.7 + index) + 0.03 * Math.sin(time * 2.1);
</script>

<Container x={props.x} y={props.y} scale={props.scale} visible={props.active}>
	{#each props.scene.clouds as cloud (cloud.key)}
		<Sprite
			key={cloud.key}
			x={cloudX(cloud)}
			y={cloud.y}
			width={cloud.width}
			height={cloud.width * 0.42}
			alpha={0.9}
		/>
	{/each}
	<!-- what stands in front of the sky, over the clouds -->
	{#each props.scene.occluders as occluder (occluder.key)}
		<Sprite
			key={occluder.key}
			x={occluder.x}
			y={occluder.y}
			width={occluder.width}
			height={occluder.height}
		/>
	{/each}

	{#each props.scene.stars as star, index (index)}
		<Sprite
			key="glint.png"
			anchor={0.5}
			x={star.x}
			y={star.y}
			width={star.size}
			height={star.size}
			alpha={starAlpha(index)}
			blendMode="add"
		/>
	{/each}

	{#each props.scene.lanterns as lantern, index (index)}
		<Sprite
			key="blob.png"
			anchor={0.5}
			x={lantern.x}
			y={lantern.y}
			width={lantern.size}
			height={lantern.size}
			alpha={lanternAlpha(index)}
			tint={0xffa838}
			blendMode="add"
		/>
	{/each}
</Container>
