<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';

	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		multiplier: number;
		/** Coin display size in world units — the text is sized off this. */
		size?: number;
		/**
		 * Fade the value in as it appears. Used where the value is being REVEALED —
		 * the overlay coin, as `coin_win`'s flip turns it face-on.
		 * Off everywhere the value is already on screen and simply changing hands
		 * (the board coin taking over at the reel stop, the copy in flight to the
		 * kraken), because fading there would read as a second reveal.
		 */
		reveal?: boolean;
	};

	const { multiplier, size = SYMBOL_SIZE, reveal = false }: Props = $props();

	// The coin art is a blank plate; the value is struck onto it here, in one
	// place, so the board coin, the kraken's overlay coin and the coin in flight
	// all read identically.
	const alpha = new Tween(reveal ? 0 : 1, { duration: 300, easing: cubicOut });
	$effect(() => {
		alpha.set(1);
	});
</script>

<Container zIndex={20} alpha={alpha.current}>
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
