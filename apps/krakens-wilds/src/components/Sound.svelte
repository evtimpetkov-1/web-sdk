<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		// ui
		soundBetMode: async ({ betModeKey }) => {
			if (!sound.players) return;
			if (betModeKey === 'SUPERSPIN') {
				await waitForTimeout(SECOND);
				console.log('[sound] music: bgm_freespin');
				sound.players.music.play({ name: 'bgm_freespin' });
			} else {
				console.log('[sound] music: bgm_main');
				sound.players.music.play({ name: 'bgm_main' });
			}
		},
		soundPressGeneral: () => { console.log('[sound] once: sfx_ui_click'); sound.players?.once.play({ name: 'sfx_ui_click' }); },
		soundPressBet: () => { console.log('[sound] once: sfx_ui_spin'); sound.players?.once.play({ name: 'sfx_ui_spin' }); },
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => { console.log('[sound] music:', name); sound.players?.music.play({ name }); },
		soundLoop: ({ name }) => { console.log('[sound] loop:', name); sound.players?.loop.play({ name }); },
		soundOnce: ({ name, forcePlay }) => { console.log('[sound] once:', name, forcePlay ? '(forced)' : ''); sound.players?.once.play({ name, forcePlay }); },
		soundStop: ({ name }) => { console.log('[sound] stop:', name); sound.players && sound.stop({ name }); },
		soundFade: async ({ name, duration, from, to }) => { console.log('[sound] fade:', name, from, '->', to); if (sound.players) await sound.fade({ name, duration, from, to }); },
	});

	onMount(() => {
		if (!sound.players) return;

		if (stateBet.activeBetModeKey === 'SUPERSPIN') {
			sound.players.music.play({ name: 'bgm_freespin' });
		} else {
			sound.players.music.play({ name: 'bgm_main' });
		}
	});
</script>
