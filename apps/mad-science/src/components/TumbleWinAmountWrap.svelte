<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		show: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();

	// The multiplier plate (GlobalMultiplier) permanently owns the centre-top spot,
	// so the tumble win panel sits right of it on wide layouts (scaled down to fit
	// beside it) and above it on stacked ones.
	const stacked = $derived(context.stateLayoutDerived.isStacked());

	const desktopPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - SYMBOL_SIZE * 0.95,
		y: -SYMBOL_SIZE * 0.8 * 0.58,
	});

	const portraitPosition = $derived({
		x: context.stateGameDerived.boardLayout().width * 0.5,
		y: -SYMBOL_SIZE * 2.3,
	});

	const position = $derived(stacked ? portraitPosition : desktopPosition);
	const scale = $derived(stacked ? 1.28 : 0.6);
	// in free spins the TOTAL WIN counter takes this spot (FreeSpinTotalWin, live)
	const show = $derived(props.show && context.stateGame.gameType !== 'freeSpins');
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position} {scale}>
			{@render props.children()}
		</Container>
	</BoardContainer>
</FadeContainer>
