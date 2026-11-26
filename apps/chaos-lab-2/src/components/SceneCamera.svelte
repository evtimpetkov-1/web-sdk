<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Container, Filter, GlProgram, PixiRectangle, type Texture } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SCENE_CAMERA, SCENE_ROOMS } from '../game/sceneCamera';
	import { SHAKE_PRESETS } from './SceneShake.svelte';

	/**
	 * The room has depth and the camera never stands still (2026-11-26; the reviewers
	 * wrote "the background is too static" a fourth time, about a build that already
	 * had every particle layer: light and particles laid over a painting that does
	 * not move still read as a still picture). Here the PAINTING moves.
	 * Everything behind the board (the paintings, SceneLife, LabLife) is drawn
	 * through one shader that knows each painting as a room (game/sceneCamera.ts):
	 * - depth: the camera drifts, and the back wall, the side walls and the floor
	 *   move against each other as they would in a real room. The mouse moves it on
	 *   desktop. A board shake throws it and it swings back; Scatters pending make
	 *   it lean in.
	 * - fog lies on the floor and rolls, in the floor's own perspective
	 * - what hangs sways: the lamp over the door, the theatre's sheets and chains
	 * (A ripple on everything green, and on the theatre's floor reflections, was in the
	 * first version: Evtim had it removed the same day, "from everything".)
	 * The board, the mascot, the logo and the bar are not in this layer: they stand
	 * still in front of a room that moves, which is what gives the depth away. The
	 * depth the camera turns about is the mascot's feet, so the floor does not slide
	 * under her.
	 * Cost: one screen-sized pass. Not used on WebGL 1 (its fragment shaders may lack
	 * the precision the painting's px need), nor under prefers-reduced-motion
	 * (Background), nor with `?camera=off`. `?camera=film` hands the clock to
	 * `window.__sceneCamera.time` (seconds), for films made frame by frame
	 * (tools/stake-review/camera-film.mjs), and `.kick(strength)` throws it as a shake does.
	 */
	type Props = { children: Snippet; active: boolean };

	const props: Props = $props();
	const context = getContext();
	const MODE = new URLSearchParams(window.location.search).get('camera');

	const VERTEX = `
		in vec2 aPosition;
		out vec2 vScreen;
		uniform vec4 uOutputFrame;
		uniform vec4 uOutputTexture;
		void main() {
			vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
			position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
			position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
			gl_Position = vec4(position, 0.0, 1.0);
			vScreen = aPosition * uOutputFrame.zw;
		}
	`;
	// (must start with its precision line: Pixi only then leaves it alone, and a
	// painting's px need more than mediump holds)
	const FRAGMENT = `precision highp float;
		in vec2 vScreen;
		out vec4 finalColor;
		uniform sampler2D uTexture;
		uniform sampler2D uNoise;
		uniform vec4 uInputSize;
		uniform vec4 uInputClamp;
		uniform vec4 uFit;   // canvas centre, painting -> screen scale, time
		uniform vec4 uArt;   // painting centre, focus, deepest
		uniform vec4 uV;     // vanishing point, floor line
		uniform vec4 uRoom;  // the back wall's edges, from the vanishing point: left, right, up, down
		uniform vec4 uCam;   // camera x, y, dolly
		uniform vec4 uFog;   // colour, density
		uniform vec4 uMisc;  // -, fog reach, overscan, the lens
		uniform mat4 uSway;  // four rects
		uniform mat4 uSwayP; // their px, waves, speed, phase

		vec4 painting(vec2 art) {
			vec2 screen = (art - uArt.xy) * uFit.z + uFit.xy;
			return texture(uTexture, clamp(screen * uInputSize.zw, uInputClamp.xy, uInputClamp.zw));
		}

		void main() {
			float time = uFit.w;
			// the point of the (slightly enlarged) painting this pixel looks at
			vec2 art = (vScreen - uFit.xy) / (uFit.z * uMisc.z) + uArt.xy;
			vec2 fromV = art - uV.xy;
			float nearX = fromV.x > 0.0 ? fromV.x / uRoom.y : -fromV.x / uRoom.x;
			float nearY = fromV.y > 0.0 ? fromV.y / uRoom.w : -fromV.y / uRoom.z;
			float near = clamp(max(nearX, nearY), 1.0, uArt.w) - uArt.z;
			// the camera: what is nearer than the focus goes one way, what is further the other
			vec2 at = art + uCam.xy * near;
			at = uV.xy + (at - uV.xy) * (1.0 - uCam.z * near);

			// what hangs: pinned along its top edge, free at the bottom
			for (int i = 0; i < 4; i++) {
				vec4 rect = uSway[i];
				vec4 move = uSwayP[i];
				if (move.x == 0.0) continue;
				vec2 u = (at - rect.xy) / (rect.zw - rect.xy);
				float inside = smoothstep(-0.12, 0.0, u.x) * smoothstep(1.12, 1.0, u.x)
					* step(0.0, u.y) * smoothstep(1.22, 1.0, u.y);
				float hang = pow(clamp(u.y, 0.0, 1.0), 1.3);
				float wave = sin(u.x * move.y - time * move.z + move.w)
					+ 0.45 * min(move.y, 1.0) * sin(u.x * move.y * 2.3 + time * move.z * 1.6 + u.y * 4.0);
				at.x -= move.x * inside * hang * wave;
			}

			float depth = uRoom.w;
			vec4 colour = painting(at);

			// fog on the floor, thickest along the foot of the back wall, in the floor's perspective
			float above = at.y - uV.z;
			float fromEye = max(at.y - uV.y, depth);
			// (uMisc.w: the lens, in floor depths. It makes a cloud as deep as it is wide
			// on the floor; too short a lens draws streaks towards the vanishing point)
			vec2 plane = vec2((at.x - uV.x) / fromEye, uMisc.w * depth / fromEye - min(above, 0.0) / depth);
			float cloudA = texture(uNoise, plane * 0.42 + vec2(time * 0.009, time * 0.005)).r;
			float cloudB = texture(uNoise, plane * 0.83 + vec2(-time * 0.014, 0.37 + time * 0.008)).r;
			float thick = above > 0.0 ? exp(-above / (depth * uMisc.y)) : exp(above / (depth * 0.3));
			float fog = thick * smoothstep(0.1, 0.95, cloudA * cloudB * 2.2) * uFog.a;
			colour.rgb += uFog.rgb * fog * (1.0 - colour.rgb * 0.6);

			finalColor = colour;
		}
	`;

	const area = new PixiRectangle(0, 0, 1, 1);
	let filters = $state.raw<Filter[] | null>(null);
	const noise = $derived(context.stateApp.loadedAssets?.cl2Fog as Texture | undefined);

	// the camera: its drift is a function of the clock; the mouse and the shakes are state
	let time = 0;
	const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
	// a shake's swing: place and speed on x, y and the dolly
	const swing = { x: 0, y: 0, d: 0, vx: 0, vy: 0, vd: 0 };
	let tension = 0;

	// a shake of the board throws the camera (strength 0-1); the spring in the tick brings it back
	const throwCamera = (strength: number) => {
		const omega = 2 * Math.PI * SCENE_CAMERA.kick.hz;
		const angle = Math.random() * 2 * Math.PI;
		// mostly sideways (the room has more room that way), always a push in
		swing.vx += Math.sign(Math.cos(angle) || 1) * (0.6 + 0.4 * Math.abs(Math.cos(angle))) * strength * SCENE_CAMERA.kick.px * omega;
		swing.vy += Math.sin(angle) * 0.3 * strength * SCENE_CAMERA.kick.px * omega;
		swing.vd += strength * SCENE_CAMERA.kick.dolly * omega;
	};
	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			const hit = SHAKE_PRESETS[preset] as { trauma?: number; kick?: number };
			throwCamera(Math.max(hit.trauma ?? 0, (hit.kick ?? 0) * 0.6));
		},
	});

	const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
	// a limit that is approached, never hit: a hard stop would show as a jolt
	const ease = (value: number, limit: number) => limit * Math.tanh(value / limit);

	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app || !props.active || !SCENE_CAMERA.on || MODE === 'off') return;
		// WebGL 2 only: it guarantees the fragment shader the precision this needs
		const gl = (app.renderer as unknown as { gl?: unknown }).gl;
		if (typeof WebGL2RenderingContext === 'undefined' || !(gl instanceof WebGL2RenderingContext)) return;

		let filter: Filter | undefined;
		const film: { time?: number; kick: (strength: number) => void } | undefined = MODE === 'film' ? { kick: throwCamera } : undefined;
		if (film) (window as unknown as { __sceneCamera: typeof film }).__sceneCamera = film;

		const onMove = (event: PointerEvent) => {
			if (event.pointerType !== 'mouse') return;
			pointer.targetX = clamp((event.clientX / window.innerWidth) * 2 - 1, 1);
			pointer.targetY = clamp((event.clientY / window.innerHeight) * 2 - 1, 1);
		};
		const onLeave = () => {
			pointer.targetX = pointer.targetY = 0;
		};
		window.addEventListener('pointermove', onMove);
		document.documentElement.addEventListener('pointerleave', onLeave);

		const tick = () => {
			if (!filter) {
				if (!noise) return;
				noise.source.addressMode = 'repeat';
				filter = new Filter({
					glProgram: GlProgram.from({ vertex: VERTEX, fragment: FRAGMENT, name: 'scene-camera' }),
					resources: {
						sceneCamera: {
							uFit: { value: new Float32Array(4), type: 'vec4<f32>' },
							uArt: { value: new Float32Array(4), type: 'vec4<f32>' },
							uV: { value: new Float32Array(4), type: 'vec4<f32>' },
							uRoom: { value: new Float32Array(4), type: 'vec4<f32>' },
							uCam: { value: new Float32Array(4), type: 'vec4<f32>' },
							uFog: { value: new Float32Array(4), type: 'vec4<f32>' },
							uMisc: { value: new Float32Array(4), type: 'vec4<f32>' },
							uSway: { value: new Float32Array(16), type: 'mat4x4<f32>' },
							uSwayP: { value: new Float32Array(16), type: 'mat4x4<f32>' },
						},
						uNoise: noise.source,
					},
					antialias: 'off',
				});
				filters = [filter];
			}
			// the layer is paintings shown larger than their own px: two px per unit holds
			// all they have, and spares a phone at three the rest
			filter.resolution = Math.min(2, app.renderer.resolution);
			// (a film sets the clock itself, and its frames are that far apart)
			const dt = film?.time === undefined ? Math.min(0.05, app.ticker.deltaMS / 1000) : Math.max(0, Math.min(0.1, film.time - time));
			time = film?.time ?? time + dt;

			const canvas = context.stateLayoutDerived.canvasSizes();
			area.width = canvas.width;
			area.height = canvas.height;
			const room =
				SCENE_ROOMS[
					context.stateGame.gameType === 'freegame' ? 'fs' : canvas.height > canvas.width ? 'portrait' : 'base'
				];
			const scale = Math.max(canvas.width / room.width, canvas.height / room.height);

			// the mouse, followed lazily
			const follow = 1 - Math.exp(-dt * SCENE_CAMERA.pointer.follow);
			pointer.x += (pointer.targetX - pointer.x) * follow;
			pointer.y += (pointer.targetY - pointer.y) * follow;
			// a shake's swing: a spring that pulls it back
			const omega = 2 * Math.PI * SCENE_CAMERA.kick.hz;
			for (const [p, v] of [['x', 'vx'], ['y', 'vy'], ['d', 'vd']] as const) {
				swing[v] += (-omega * omega * swing[p] - 2 * SCENE_CAMERA.kick.damping * swing[v]) * dt;
				swing[p] += swing[v] * dt;
			}
			tension += ((context.stateGame.scatterPending ? 1 : 0) - tension) * (1 - Math.exp(-dt * 1.4));

			const { drift, limit } = SCENE_CAMERA;
			const wave = (px: number, seconds: number, shift: number) => px * Math.sin((time / seconds) * 2 * Math.PI + shift);
			const x =
				wave(drift.x[0], drift.x[1], 0) + wave(drift.x[2], drift.x[3], 1.3) +
				pointer.x * SCENE_CAMERA.pointer.x + swing.x +
				tension * SCENE_CAMERA.tension.tremble * Math.sin(time * 37);
			const y =
				wave(drift.y[0], drift.y[1], 0.7) + wave(drift.y[2], drift.y[3], 2.9) +
				pointer.y * SCENE_CAMERA.pointer.y + swing.y +
				tension * SCENE_CAMERA.tension.tremble * 0.6 * Math.sin(time * 29 + 1);
			const dolly = wave(drift.dolly[0], drift.dolly[1], 0.4) + swing.d + tension * SCENE_CAMERA.tension.dolly;

			const u = filter.resources.sceneCamera.uniforms as Record<string, Float32Array>;
			u.uFit.set([canvas.width / 2, canvas.height / 2, scale, time]);
			u.uArt.set([room.width / 2, room.height / 2, room.focus, room.deepest]);
			u.uV.set([room.vanish[0], room.vanish[1], room.wall[3], 0]);
			u.uRoom.set([
				room.vanish[0] - room.wall[0],
				room.wall[2] - room.vanish[0],
				room.vanish[1] - room.wall[1],
				room.wall[3] - room.vanish[1],
			]);
			u.uCam.set([ease(x, limit.x), ease(y, limit.y), ease(dolly, limit.dolly), 0]);
			u.uFog.set([...room.fog.colour, room.fog.density]);
			u.uMisc.set([0, room.fog.reach, SCENE_CAMERA.overscan, room.fog.lens]);
			for (let i = 0; i < 4; i++) {
				const sway = room.sway[i];
				u.uSway.set(sway ? sway.slice(0, 4) : [0, 0, 1, 1], i * 4);
				u.uSwayP.set(sway ? sway.slice(4, 8) : [0, 0, 0, 0], i * 4);
			}
		};
		app.ticker.add(tick);
		return () => {
			app.ticker.remove(tick);
			window.removeEventListener('pointermove', onMove);
			document.documentElement.removeEventListener('pointerleave', onLeave);
			filters = null;
			filter?.destroy();
		};
	});
</script>

<!-- one container for everything behind the board: the camera's shader is its filter -->
<Container zIndex={-2} sortableChildren={true} {filters} filterArea={area}>
	{@render props.children()}
</Container>
