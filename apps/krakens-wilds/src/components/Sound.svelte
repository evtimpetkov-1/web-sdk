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

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		// ui
		// Every mode this game has (BASE / ANTE / BONUS) is played from the base
		// game; free-spin music is started by the book's freeSpinTrigger, not from
		// here. The old SUPERSPIN branch was a leftover from the sample game and
		// could never fire.
		soundBetMode: () => { sound.players?.music.play({ name: 'bgm_kw_main' }); },
		soundPressGeneral: () => { sound.players?.once.play({ name: 'sfx_ui_click' }); },
		// The same button starts a spin and slams it to a stop, and those are
		// opposite actions — one launches, one interrupts. Only the state machine
		// knows which just happened.
		soundPressBet: () => {
			const starting = context.stateXstateDerived.isIdle();
			sound.players?.once.play({ name: starting ? 'sfx_ui_spin' : 'sfx_ui_stop', forcePlay: true });
		},
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => { sound.players?.music.play({ name }); },
		soundLoop: ({ name }) => { sound.players?.loop.play({ name }); },
		// `rate` drives the pitch ladders (see REEL_STOP_RATES). play() registers the
		// new sound id synchronously, so rating it straight after is safe — and it
		// must be set per play, because a forced replay gets a fresh id at rate 1.
		soundOnce: ({ name, forcePlay, rate }) => {
			sound.players?.once.play({ name, forcePlay });
			if (rate !== undefined) sound.rate({ name, rate });
		},
		soundStop: ({ name }) => { sound.players && sound.stop({ name }); },
		soundFade: async ({ name, duration, from, to }) => { if (sound.players) await sound.fade({ name, duration, from, to }); },
	});

	onMount(() => {
		sound.players?.music.play({ name: 'bgm_kw_main' });
	});
</script>
