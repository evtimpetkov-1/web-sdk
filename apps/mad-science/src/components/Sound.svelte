<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean; rate?: number }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS } from '../game/constants';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		// ui
		// Every mode is played from the base game; free-spin music is started by the
		// book's freeSpinTrigger. (The sample's SUPERSPIN branch could never fire.)
		soundBetMode: () => { sound.players?.music.play({ name: 'bgm_ms_main' }); },
		soundPressGeneral: () => { sound.players?.once.play({ name: 'sfx_ms_ui_click' }); },
		// The same button starts a spin and slams it to a stop — opposite actions;
		// only the state machine knows which just happened.
		soundPressBet: () => {
			const starting = context.stateXstateDerived.isIdle();
			sound.players?.once.play({ name: starting ? 'sfx_ms_ui_spin' : 'sfx_ms_ui_stop', forcePlay: true });
		},
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => { sound.players?.music.play({ name }); },
		soundLoop: ({ name }) => { sound.players?.loop.play({ name }); },
		// `rate` drives the pitch ladders (REEL_LAND_RATES, BONUS_LAND_RATES,
		// CASCADE_STEP_RATES). play() registers the new sound id synchronously, so
		// rating it straight after is safe; a forced replay gets a fresh id at rate 1.
		soundOnce: ({ name, forcePlay, rate }) => {
			sound.players?.once.play({ name, forcePlay });
			if (rate !== undefined) sound.rate({ name, rate });
		},
		soundStop: ({ name }) => { sound.players && sound.stop({ name }); },
		soundFade: async ({ name, duration, from, to }) => { if (sound.players) await sound.fade({ name, duration, from, to }); },
	});

	/**
	 * The armed bomb's fuse loops while a bomb waits on the board during a round:
	 * from the moment its reel stops (not while it is still falling in) until the
	 * last bomb starts to explode (its tumble cell enters 'explode') or the round
	 * ends. Mid-tumble the tumble board is the truth, otherwise the reel board's
	 * visible rows.
	 */
	const bombArmed = $derived.by(() => {
		const { stateGame } = context;
		if (!stateGame.roundActive) return false;
		if (stateGame.tumbleBoardBase.length) {
			return stateGame.tumbleBoardBase.some((reel) =>
				reel.some((cell) => cell.rawSymbol.name === 'B' && cell.symbolState !== 'explode'),
			);
		}
		return stateGame.board.some(
			(reel) =>
				reel.reelState.motion === 'stopped' &&
				reel.reelState.symbols.some(
					(cell, row) => row > 0 && row <= BOARD_DIMENSIONS.y && cell.rawSymbol.name === 'B',
				),
		);
	});
	$effect(() => {
		if (bombArmed) sound.players?.loop.play({ name: 'sfx_ms_bomb_fuse' });
		else if (sound.players) sound.stop({ name: 'sfx_ms_bomb_fuse' });
	});

	onMount(() => {
		sound.players?.music.play({ name: 'bgm_ms_main' });
	});
</script>
