<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isFreeSpins = $derived(context.stateGame.gameType === 'freegame');
	// portrait-shaped canvases (phones upright, tablets upright) get the portrait
	// lab: it crops far less than the landscape art there. Decided by the canvas,
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
		return { width: width * scale, height: height * scale };
	};

	// base lab and the free-spins operating theatre cross-fade on gameType; the
	// switch happens under the FS intro / outro, which cover the board. The base
	// lab has a portrait cut; free spins has no portrait art yet, so its landscape
	// art cover-fits every shape (`portrait` unset = any orientation).
	const BACKGROUNDS: { key: string; freeSpins: boolean; portrait?: boolean }[] = [
		{ key: 'msBg', freeSpins: false, portrait: false },
		{ key: 'msBgPortrait', freeSpins: false, portrait: true },
		{ key: 'msBgFs', freeSpins: true },
	];
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

{#each BACKGROUNDS as bg (bg.key)}
	<FadeContainer
		show={bg.freeSpins === isFreeSpins && (bg.portrait === undefined || bg.portrait === isPortrait)}
		duration={500}
		zIndex={-2}
	>
		<Sprite
			key={bg.key}
			anchor={0.5}
			x={canvas.width / 2}
			y={canvas.height / 2}
			{...cover(bg.key, 1536, 1024)}
		/>
	</FadeContainer>
{/each}
