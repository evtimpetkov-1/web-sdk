<script lang="ts" module>
	// the four fracture patterns of spines/bsShatter (art-review/blast-shaft/build_shatter.py)
	const PATTERNS = ['a', 'b', 'c', 'd'] as const;
	let lastPattern = -1;
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import type { RawSymbol } from '../game/types';

	/**
	 * A symbol leaving the board breaks apart in its OWN pieces (2026-11-24, after
	 * the third review: "The symbol disappearance animations could be of better
	 * quality"). The rig holds every static tile cut into ten jagged pieces on four
	 * fracture patterns: white-hot cracks run through the tile, then the pieces are
	 * thrown out, tumbling and falling, over dust, splinters and gold sparks.
	 *
	 * Two tracks: `sym_<tile>_<pattern>` chooses the picture the pieces show,
	 * `break_<pattern>` moves them (0.62 s, ends empty) and gates the tumble through
	 * `oncomplete`. The skeleton box is the tile's art, so it is sized exactly like
	 * the symbol's sprite and the pieces start on the pixels the tile was drawn on:
	 * TumbleSymbol hides the tile as this mounts.
	 */
	type Props = {
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	// the tile as it stands on the board (a collected Multiplier is its bare plate)
	const info = getSymbolInfo({ rawSymbol: props.rawSymbol, state: 'static' });
	const tile = info.assetKey.replace(/\.png$/, '');
	// never the pattern the cell before it took: a row of winners must not break alike
	let index = Math.floor(Math.random() * PATTERNS.length);
	if (index === lastPattern) index = (index + 1) % PATTERNS.length;
	lastPattern = index;
	const pattern = PATTERNS[index];
</script>

<SpineProvider
	key="bsShatter"
	width={SYMBOL_SIZE * info.sizeRatios.width}
	height={SYMBOL_SIZE * info.sizeRatios.height}
>
	<SpineTrack trackIndex={0} animationName={`sym_${tile}_${pattern}`} loop={false} />
	<SpineTrack
		trackIndex={1}
		animationName={`break_${pattern}`}
		loop={false}
		timeScale={stateBetDerived.timeScale()}
		listener={{ complete: () => props.oncomplete?.() }}
	/>
</SpineProvider>
