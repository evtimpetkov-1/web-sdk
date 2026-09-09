<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');

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
	// switch happens under the FS intro / outro, which cover the board
	const BACKGROUNDS = [
		{ key: 'msBg', freeSpins: false },
		{ key: 'msBgFs', freeSpins: true },
	];
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

{#each BACKGROUNDS as bg (bg.key)}
	<FadeContainer show={bg.freeSpins === isFreeSpins} duration={500} zIndex={-2}>
		<Sprite
			key={bg.key}
			anchor={0.5}
			x={canvas.width / 2}
			y={canvas.height / 2}
			{...cover(bg.key, 1536, 1024)}
		/>
	</FadeContainer>
{/each}
