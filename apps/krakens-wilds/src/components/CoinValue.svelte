<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';

	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		multiplier: number;
		/** Coin display size in world units — the text is sized off this. */
		size?: number;
		/** Scale-punch the value as it appears. Off for coins already in flight. */
		pop?: boolean;
	};

	const { multiplier, size = SYMBOL_SIZE, pop = false }: Props = $props();

	// The coin art is a blank plate; the value is struck onto it here, in one
	// place, so the board coin, the kraken's overlay coin and the coin in flight
	// all read identically.
	const scale = new Tween(pop ? 0.5 : 1, { duration: 220, easing: backOut });
	$effect(() => {
		scale.set(1);
	});
</script>

<Container zIndex={20} scale={scale.current}>
	<ResponsiveBitmapText
		anchor={0.5}
		maxWidth={size * 0.7}
		text={`x${multiplier}`}
		style={{
			fontFamily: 'coin-tickup',
			fontSize: size * 0.42,
			align: 'center',
			letterSpacing: 0,
		}}
	/>
</Container>
