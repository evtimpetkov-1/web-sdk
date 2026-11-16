<script lang="ts">
	import { onMount } from 'svelte';
	import { Geometry, Mesh, Shader, Texture, getContextParent } from 'pixi-svelte';
	import type { TextureSource } from 'pixi.js';

	import { WebCodecsPlayer } from '../game/webcodecsPlayer';

	// Plays "stacked alpha" H.264 videos: left half = color premultiplied over
	// black, right half = alpha matte. A tiny shader recombines them, so ordinary
	// mp4 gives us transparency in EVERY browser (Safari/iOS included) with one
	// code path — no VP9-alpha, no HEVC-alpha, no Pixi alpha-mode detection.
	//
	// srcs[0] is the IDLE clip and loops forever; every other clip is a one-shot
	// reaction started with playOnce(index) — it plays through, then the idle
	// loop resumes from its first frame (all clips bookend on the same pose).
	// All clips must share the same half-frame dimensions.
	type Props = {
		srcs: string[];
		/** pixel size of ONE half of the stacked frame (full frame when mode="plain") */
		halfWidth: number;
		halfHeight: number;
		x: number;
		y: number;
		/** on-screen height of the character in canvas px */
		targetHeight: number;
		/**
		 * stacked: left = premultiplied color, right = full alpha matte.
		 * plain:   single opaque frame, shown as-is.
		 * hybrid:  left = RAW frame over black, right = character-only matte;
		 *          the shader luma-keys the black background live so baked
		 *          effects (coins, rays, …) stay visible, while the matte keeps
		 *          the character's dark clothing opaque.
		 */
		mode?: 'stacked' | 'plain' | 'hybrid';
	};

	const { mode = 'stacked', ...props }: Props = $props();


	const w = props.halfWidth;
	const h = props.halfHeight;
	const geometry = new Geometry({
		attributes: {
			aPosition: [0, 0, w, 0, w, h, 0, h],
			aUV: [0, 0, 1, 0, 1, 1, 0, 1],
		},
		indexBuffer: [0, 1, 2, 0, 2, 3],
	});

	const VERTEX = `
		in vec2 aPosition;
		in vec2 aUV;
		out vec2 vUV;
		uniform mat3 uProjectionMatrix;
		uniform mat3 uWorldTransformMatrix;
		uniform mat3 uTransformMatrix;
		void main() {
			mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
			gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
			vUV = aUV;
		}
	`;
	const FRAGMENT_STACKED = `
		in vec2 vUV;
		uniform sampler2D uTexture;
		void main() {
			vec2 colorUV = vec2(vUV.x * 0.5, vUV.y);
			vec2 matteUV = vec2(vUV.x * 0.5 + 0.5, vUV.y);
			vec3 rgb = texture(uTexture, colorUV).rgb; // premultiplied over black
			float a = texture(uTexture, matteUV).r;
			gl_FragColor = vec4(min(rgb, vec3(a)), a);
		}
	`;
	const FRAGMENT_PLAIN = `
		in vec2 vUV;
		uniform sampler2D uTexture;
		void main() {
			gl_FragColor = vec4(texture(uTexture, vUV).rgb, 1.0);
		}
	`;
	// alpha = max(character matte, lifted luma). The lift (T) eats compression
	// noise in the near-black background; inside the matte the original colors
	// are used so dark clothing stays opaque and untouched.
	const FRAGMENT_HYBRID = `
		in vec2 vUV;
		uniform sampler2D uTexture;
		void main() {
			vec2 colorUV = vec2(vUV.x * 0.5, vUV.y);
			vec2 matteUV = vec2(vUV.x * 0.5 + 0.5, vUV.y);
			vec3 rgb = texture(uTexture, colorUV).rgb;
			float m = texture(uTexture, matteUV).r;
			const float T = 0.06;
			vec3 lifted = clamp((rgb - vec3(T)) / (1.0 - T), 0.0, 1.0);
			float fx = max(lifted.r, max(lifted.g, lifted.b));
			float a = max(m, fx);
			vec3 col = mix(lifted, rgb, m);
			gl_FragColor = vec4(min(col, vec3(a)), a);
		}
	`;
	const FRAGMENT =
		mode === 'stacked' ? FRAGMENT_STACKED : mode === 'hybrid' ? FRAGMENT_HYBRID : FRAGMENT_PLAIN;

	// Planar variant (Android software decode): Y/U/V planes as three R8
	// textures, BT.709 limited-range conversion in the shader. Uploading the
	// planes is 2.7 MB per frame with NO CPU colour conversion; handing Chrome
	// the VideoFrame itself cost ~7 MB per frame plus a main-thread YUV->RGBA
	// conversion, which capped the phone at ~17 fps.
	const YUV_HEAD = `
		in vec2 vUV;
		uniform sampler2D uY;
		uniform sampler2D uU;
		uniform sampler2D uV;
		vec3 yuv2rgb(vec2 uv) {
			float y = (texture(uY, uv).r - 0.0625) * 1.1643;
			float u = texture(uU, uv).r - 0.5;
			float v = texture(uV, uv).r - 0.5;
			return clamp(vec3(y + 1.7927 * v, y - 0.2132 * u - 0.5329 * v, y + 2.1124 * u), 0.0, 1.0);
		}
		float luma(vec2 uv) {
			return clamp((texture(uY, uv).r - 0.0625) * 1.1643, 0.0, 1.0);
		}
	`;
	const FRAGMENT_YUV_STACKED = `${YUV_HEAD}
		void main() {
			vec2 colorUV = vec2(vUV.x * 0.5, vUV.y);
			vec2 matteUV = vec2(vUV.x * 0.5 + 0.5, vUV.y);
			vec3 rgb = yuv2rgb(colorUV);
			float a = luma(matteUV);
			gl_FragColor = vec4(min(rgb, vec3(a)), a);
		}
	`;
	const FRAGMENT_YUV_PLAIN = `${YUV_HEAD}
		void main() {
			gl_FragColor = vec4(yuv2rgb(vUV), 1.0);
		}
	`;
	const FRAGMENT_YUV_HYBRID = `${YUV_HEAD}
		void main() {
			vec2 colorUV = vec2(vUV.x * 0.5, vUV.y);
			vec2 matteUV = vec2(vUV.x * 0.5 + 0.5, vUV.y);
			vec3 rgb = yuv2rgb(colorUV);
			float m = luma(matteUV);
			const float T = 0.06;
			vec3 lifted = clamp((rgb - vec3(T)) / (1.0 - T), 0.0, 1.0);
			float fx = max(lifted.r, max(lifted.g, lifted.b));
			float a = max(m, fx);
			vec3 col = mix(lifted, rgb, m);
			gl_FragColor = vec4(min(col, vec3(a)), a);
		}
	`;
	const FRAGMENT_YUV =
		mode === 'stacked' ? FRAGMENT_YUV_STACKED : mode === 'hybrid' ? FRAGMENT_YUV_HYBRID : FRAGMENT_YUV_PLAIN;

	const parentContext = getContextParent();
	const IDLE = 0;
	const meshes: Mesh[] = [];

	// addToParent registers Svelte lifecycle hooks, so every mesh MUST be built
	// during component initialisation (the script body) — never from a callback
	const buildMesh = (resources: Record<string, TextureSource>, fragment = FRAGMENT) => {
		const shader = Shader.from({
			gl: { vertex: VERTEX, fragment },
			resources,
		});
		const mesh = new Mesh({ geometry, shader });
		mesh.pivot.set(w / 2, h); // bottom-center anchor
		mesh.visible = false;
		parentContext.addToParent(mesh);
		meshes.push(mesh);
		return mesh;
	};

	// Engine choice (2026-09-03): the WebCodecs engine exists for ANDROID, where
	// hardware video frames imported into WebGL freeze the page (see the mascot
	// memory note); it runs there with the software decoder. iPhone and desktop
	// were flawless on the <video> engine and got slower on WebCodecs (Safari),
	// so they keep the element. Without WebCodecs (plain http, old Safari)
	// Android also falls back to the element.
	const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
	const useWebCodecs = WebCodecsPlayer.supported() && isAndroid;

	// ---------------------------------------------------------------------
	// Engine 1 (Android): WebCodecs with the software decoder — no media
	// pipeline, no hardware-frame import. Decoded frames are swapped into ONE
	// texture source built here at init around a blank canvas of the stacked
	// frame's size.
	// ---------------------------------------------------------------------
	let player: WebCodecsPlayer | null = null;
	let wcRaf = 0;
	const frameW = mode === 'plain' ? w : w * 2;
	const frameH = h;

	// (a) RGBA mesh: the VideoFrame itself is the resource (hardware frames)
	let rgbaSource: TextureSource | null = null;
	let rgbaMesh: Mesh | null = null;
	/** frames handed to Pixi, oldest first; closed once two newer ones exist */
	const retired: VideoFrame[] = [];
	// (b) planar mesh: three R8 textures fed from copied I420 planes
	let planeY: TextureSource | null = null;
	let planeU: TextureSource | null = null;
	let planeV: TextureSource | null = null;
	let planarMesh: Mesh | null = null;
	const halfW = frameW / 2;
	const halfH = frameH / 2;
	const planeBytes = frameW * frameH + 2 * halfW * halfH;
	// rotating destination buffers: Pixi uploads at its next render, so a
	// buffer must not be rewritten until two newer ones have been handed over
	const planeBuffers = [0, 1, 2].map(() => new Uint8Array(planeBytes));
	let planeCursor = 0;
	let copying = false;
	let planar: boolean | null = null; // decided on the first frame

	const r8 = (width: number, height: number) =>
		Texture.from(
			{
				resource: new Uint8Array(width * height),
				width,
				height,
				format: 'r8unorm',
				alphaMode: 'no-premultiply-alpha',
				autoGarbageCollect: false,
			},
			true,
		).source;

	if (useWebCodecs) {
		const placeholder = document.createElement('canvas');
		placeholder.width = frameW;
		placeholder.height = frameH;
		rgbaSource = Texture.from(
			{ resource: placeholder, alphaMode: 'no-premultiply-alpha', autoGarbageCollect: false },
			true,
		).source;
		rgbaMesh = buildMesh({ uTexture: rgbaSource });
		planeY = r8(frameW, frameH);
		planeU = r8(halfW, halfH);
		planeV = r8(halfW, halfH);
		planarMesh = buildMesh({ uY: planeY, uU: planeU, uV: planeV }, FRAGMENT_YUV);
	}

	const presentRgba = (frame: VideoFrame) => {
		if (!rgbaSource || !rgbaMesh) return;
		rgbaSource.resource = frame;
		rgbaSource.update();
		rgbaMesh.visible = true;
		retired.push(frame);
		while (retired.length > 3) retired.shift()!.close();
	};

	const presentPlanar = async (frame: VideoFrame) => {
		if (!planeY || !planeU || !planeV || !planarMesh) {
			frame.close();
			return;
		}
		if (copying) {
			// previous copy still in flight (should not happen at 30 fps): skip
			frame.close();
			return;
		}
		copying = true;
		const buffer = planeBuffers[planeCursor];
		planeCursor = (planeCursor + 1) % planeBuffers.length;
		try {
			await frame.copyTo(buffer, {
				layout: [
					{ offset: 0, stride: frameW },
					{ offset: frameW * frameH, stride: halfW },
					{ offset: frameW * frameH + halfW * halfH, stride: halfW },
				],
			});
		} catch {
			frame.close();
			copying = false;
			return;
		}
		frame.close();
		copying = false;
		planeY.resource = buffer.subarray(0, frameW * frameH);
		planeU.resource = buffer.subarray(frameW * frameH, frameW * frameH + halfW * halfH);
		planeV.resource = buffer.subarray(frameW * frameH + halfW * halfH, planeBytes);
		planeY.update();
		planeU.update();
		planeV.update();
		planarMesh.visible = true;
	};

	const startWebCodecs = async () => {
		// silent: Stake checks the console. To debug the decoder, pass a logger
		// here, e.g. new WebCodecsPlayer(console.info)
		player = new WebCodecsPlayer();
		await player.load(props.srcs);
		player.start();
		const frameLoop = (now: number) => {
			wcRaf = requestAnimationFrame(frameLoop);
			const frame = player?.tick(now);
			if (!frame) return;
			if (planar === null) {
				// software frames come as I420 (CPU memory): take the planar path;
				// anything else (hardware surfaces) goes straight in as RGBA
				planar = frame.format === 'I420' && frame.codedWidth === frameW && frame.codedHeight === frameH;
			}
			if (planar) void presentPlanar(frame);
			else presentRgba(frame);
		};
		wcRaf = requestAnimationFrame(frameLoop);
	};

	const stopWebCodecs = () => {
		cancelAnimationFrame(wcRaf);
		player?.destroy();
		player = null;
		if (rgbaMesh) rgbaMesh.visible = false;
		if (planarMesh) planarMesh.visible = false;
		for (const frame of retired) frame.close();
		retired.length = 0;
	};

	// ---------------------------------------------------------------------
	// Engine 2 (iPhone, desktop, and Android without WebCodecs): one <video> +
	// mesh per clip, the original implementation, built at init. Only the
	// playing clip's mesh is visible.
	// ---------------------------------------------------------------------
	type ElementClip = { video: HTMLVideoElement; mesh: Mesh };
	let current = IDLE;
	const clips: ElementClip[] = useWebCodecs
		? []
		: props.srcs.map((src, index) => {
				const video = document.createElement('video');
				video.muted = true;
				video.loop = index === IDLE;
				video.playsInline = true;
				video.setAttribute('webkit-playsinline', '');
				video.preload = 'auto';
				video.crossOrigin = 'anonymous';
				video.src = src;
				// autoPlay MUST be off: VideoSource would start every (muted) clip at
				// once and their stray 'ended' events would fight over visibility
				const texture = Texture.from({ resource: video, autoPlay: false }, true);
				const mesh = buildMesh({ uTexture: texture.source });
				return { video, mesh };
			});

	const show = (index: number) => {
		clips.forEach((clip, i) => (clip.mesh.visible = i === index));
	};
	const switchTo = (index: number) => {
		clips[current].video.pause();
		current = index;
		const next = clips[index];
		next.video.currentTime = 0;
		show(index);
		next.video.play().catch(() => {});
	};

	const startElement = () => {
		clips.forEach(({ video }, i) => {
			if (i === IDLE) return;
			video.addEventListener('ended', () => {
				if (i === current) switchTo(IDLE);
			});
		});
		clips[IDLE].video.addEventListener(
			'canplay',
			() => {
				show(IDLE);
				clips[IDLE].video.play().catch(() => {});
			},
			{ once: true },
		);
		clips.forEach(({ video }) => video.load());
	};

	const stopElement = () => {
		for (const { video } of clips) {
			video.pause();
			video.removeAttribute('src');
			video.load();
		}
	};

	/** Play a reaction clip once, then fall back to the idle loop. Ignored while another reaction is still playing. */
	export const playOnce = (index: number) => {
		if (index === IDLE || index >= props.srcs.length) return;
		if (player) {
			player.playOnce(index);
			return;
		}
		if (!clips.length || current !== IDLE) return;
		switchTo(index);
	};

	$effect(() => {
		for (const mesh of meshes) {
			mesh.x = props.x;
			mesh.y = props.y;
			mesh.scale.set(props.targetHeight / h);
		}
	});

	onMount(() => {
		if (useWebCodecs) {
			startWebCodecs().catch(() => stopWebCodecs());
		} else {
			startElement();
		}

		// element engine: resume if the browser paused us (tab switch, iOS heuristics)
		const resume = () => {
			const clip = clips[current];
			if (clip && clip.video.paused && !clip.video.ended) clip.video.play().catch(() => {});
		};
		document.addEventListener('visibilitychange', resume);
		return () => {
			document.removeEventListener('visibilitychange', resume);
			stopWebCodecs();
			stopElement();
		};
	});
</script>
