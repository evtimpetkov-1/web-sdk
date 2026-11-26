<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean; rate?: number }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		// ui
		// Every mode is played from the base game; free-spin music is started by the
		// book's freeSpinTrigger. (The sample's SUPERSPIN branch could never fire.)
		soundBetMode: () => { sound.players?.music.play({ name: 'bgm_bs_main' }); },
		soundPressGeneral: () => { sound.players?.once.play({ name: 'sfx_bs_ui_click' }); },
		// The same button starts a spin and slams it to a stop — opposite actions;
		// only the state machine knows which just happened.
		soundPressBet: () => {
			const starting = context.stateXstateDerived.isIdle();
			sound.players?.once.play({ name: starting ? 'sfx_bs_ui_spin' : 'sfx_bs_ui_stop', forcePlay: true });
		},
		// game
		soundMusic: ({ name }) => { sound.players?.music.play({ name }); },
		soundLoop: ({ name }) => { sound.players?.loop.play({ name }); },
		// `rate` drives the pitch ladders (REEL_LAND_RATES). play() registers the new sound id synchronously, so
		// rating it straight after is safe; a forced replay gets a fresh id at rate 1.
		soundOnce: ({ name, forcePlay, rate }) => {
			sound.players?.once.play({ name, forcePlay });
			if (rate !== undefined) sound.rate({ name, rate });
		},
		soundStop: ({ name }) => { sound.players && sound.stop({ name }); },
		soundFade: async ({ name, duration, from, to }) => { if (sound.players) await sound.fade({ name, duration, from, to }); },
	});

	onMount(() => {
		sound.players?.music.play({ name: 'bgm_bs_main' });
	});
</script>
