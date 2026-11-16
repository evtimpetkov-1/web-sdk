<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import Ambient, { AMBIENT_SCENES, type AmbientScene } from './Ambient.svelte';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isFreeSpins = $derived(context.stateGame.gameType === 'freegame');
	// portrait-shaped canvases (phones upright, tablets upright) get the portrait
	// street: it crops far less than the landscape art there. Decided by the canvas,
	// not the layout type, because it is purely about which art covers best.
	const isPortrait = $derived(canvas.height > canvas.width);

	/**
	 * Cover-fit the background to the canvas, measuring the texture instead of
	 * trusting a hardcoded size (pattern proven in Kraken's Wilds — a hardcoded
	 * native size silently stretches the art when the file is swapped).
	 * The fallback is only for the frames before the texture resolves.
	 */
	const cover = (key: string, fallbackWidth: number, fallbackHeight: number) => {
		const texture = context.stateApp.loadedAssets?.[key] as
			| { width?: number; height?: number }
			| undefined;
		const width = texture?.width || fallbackWidth;
		const height = texture?.height || fallbackHeight;
		const scale = Math.max(canvas.width / width, canvas.height / height);
		return { width: width * scale, height: height * scale, scale };
	};

	// the street by day and at night (Cash Respins) cross-fade on gameType; the
	// switch happens under the feature's intro / outro, which cover the board. The
	// day street has a portrait cut; the night has none, so its landscape art
	// cover-fits every shape (`portrait` unset = any orientation).
	// `scene`: what moves over that art (Ambient), in the art's own pixels.
	const BACKGROUNDS: { key: string; freeSpins: boolean; portrait?: boolean; scene: AmbientScene }[] = [
		{ key: 'msBg', freeSpins: false, portrait: false, scene: AMBIENT_SCENES.day },
		{ key: 'msBgPortrait', freeSpins: false, portrait: true, scene: AMBIENT_SCENES.portrait },
		{ key: 'msBgFs', freeSpins: true, scene: AMBIENT_SCENES.night },
	];
	const shown = (bg: (typeof BACKGROUNDS)[number]) =>
		bg.freeSpins === isFreeSpins && (bg.portrait === undefined || bg.portrait === isPortrait);
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

{#each BACKGROUNDS as bg (bg.key)}
	{@const box = cover(bg.key, bg.scene.width, bg.scene.height)}
	<FadeContainer show={shown(bg)} duration={500} zIndex={-2}>
		<Sprite
			key={bg.key}
			anchor={0.5}
			x={canvas.width / 2}
			y={canvas.height / 2}
			width={box.width}
			height={box.height}
		/>
		<!-- the art's cover transform: Ambient draws in the art's pixels -->
		<Ambient
			scene={bg.scene}
			x={(canvas.width - box.width) / 2}
			y={(canvas.height - box.height) / 2}
			scale={box.width / bg.scene.width}
			active={shown(bg)}
		/>
	</FadeContainer>
{/each}
