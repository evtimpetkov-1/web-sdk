<script lang="ts" module>
	// the thrown-tile reveal's four fracture patterns (spines/cl2CloneFx flood_0..3)
	let lastFlood = -1;
</script>

<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { CLONE_OWNS_CELL, CLONE_STYLE, FX_SET, SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import type { RawSymbol } from '../game/types';

	/**
	 * The cloner's effect over one reel cell, drawn OVER the symbol (ReelSymbol
	 * mounts it at zIndex 3 from a stateGame.cloneFx entry). `splat`: the cell
	 * becomes a cloner; `flood`: a cloner turns into the paying symbol. The rig
	 * fires `swap` when the symbol underneath is to be exchanged and ends empty;
	 * `complete` releases the caller.
	 *
	 * Three rigs:
	 * - CLONE_STYLE frames / zap / flip / scan (spines/cl2Clone, a plate-sized box): the rig
	 *   holds every tile and draws the cell itself. Track 0 = the picture the cell
	 *   had (`from`), track 1 = the one it turns into (`to`), track 2 = the move.
	 *   `hide`: the rig has the old picture up, the real symbol goes (ReelSymbol);
	 *   `burst`: the reveal's moment; `swap`: the new picture stands at rest, the
	 *   real symbol is exchanged and shown again.
	 * - CLONE_STYLE throw (spines/cl2CloneFx): a copy of the cloner TILE is the
	 *   cover; splat = it slams in, flood = it charges and bursts into its pieces.
	 * - FX_SET slime (spines/clonefx, a one-cell box): the painted slime covers.
	 */
	type Props = {
		kind: 'splat' | 'flood';
		from?: RawSymbol;
		to?: RawSymbol;
		x?: number;
		y?: number;
		onhide?: () => void;
		onburst?: () => void;
		onswap?: () => void;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const ENERGY = FX_SET === 'energy';
	const plate = getSymbolInfo({ rawSymbol: { name: 'C' }, state: 'static' }).sizeRatios;
	// the static picture's name in the rig (a Multiplier is its bare plate)
	const tile = (rawSymbol: RawSymbol | undefined) =>
		getSymbolInfo({ rawSymbol: rawSymbol ?? { name: 'C' }, state: 'static' }).assetKey.replace(/\.png$/, '');
	const pickFlood = () => {
		let index = Math.floor(Math.random() * 4);
		if (index === lastFlood) index = (index + 1) % 4;
		lastFlood = index;
		return `flood_${index}`;
	};
	// 'frames': the reveal is an explosion of the cloner's tile, on one of four fracture
	// patterns, so cloners going off together do not break alike
	const explodes = CLONE_STYLE === 'frames' && props.kind === 'flood';
	const animationName = CLONE_OWNS_CELL
		? explodes
			? `frames_out_${pickFlood().slice(-1)}`
			: `${CLONE_STYLE}_${props.kind === 'splat' ? 'in' : 'out'}`
		: !ENERGY
			? props.kind
			: props.kind === 'flood'
				? pickFlood()
				: 'splat';
	// the explosion draws the two the other way up: the symbol the cell becomes stands
	// under, the cloner's tile is over it until it is blown apart
	const oldPicture = `old_${tile(explodes ? props.to : props.from)}`;
	const newPicture = `new_${tile(explodes ? props.from : props.to)}`;
</script>

<SpineProvider
	key={CLONE_OWNS_CELL ? 'cl2Clone' : ENERGY ? 'cl2CloneFx' : 'msCloneFx'}
	x={props.x}
	y={props.y}
	width={ENERGY ? SYMBOL_SIZE * plate.width : SYMBOL_SIZE}
	height={ENERGY ? SYMBOL_SIZE * plate.height : SYMBOL_SIZE}
>
	{#if CLONE_OWNS_CELL}
		<SpineTrack trackIndex={0} animationName={oldPicture} loop={false} />
		<SpineTrack trackIndex={1} animationName={newPicture} loop={false} />
	{/if}
	<SpineTrack
		trackIndex={CLONE_OWNS_CELL ? 2 : 0}
		{animationName}
		loop={false}
		timeScale={stateBetDerived.timeScale()}
		listener={{
			complete: () => props.oncomplete?.(),
			event: (_, event) => {
				const name = event.data?.name;
				if (name === 'hide') props.onhide?.();
				if (name === 'burst') props.onburst?.();
				if (name === 'swap') props.onswap?.();
			},
		}}
	/>
</SpineProvider>
