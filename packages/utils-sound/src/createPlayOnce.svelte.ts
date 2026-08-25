import type { Howl } from 'howler';

import type { PlayOptions, GetSound, GetSoundMap } from './types';

export function createPlayOnce<TSoundName extends string>(options: {
	howl: Howl;
	newSound: (value: TSoundName) => GetSound<TSoundName>;
	getSoundMap: () => GetSoundMap<TSoundName>;
	initSoundVolume: (soundName: TSoundName) => void;
}) {
	type Sound = GetSound<TSoundName>;

	const playOnce = (sound: Sound) => {
		const soundId = options.howl.play(sound.soundName);
		options.getSoundMap()[sound.soundName] = {
			...sound,
			soundId,
			soundState: 'playing',
		};

		options.initSoundVolume(sound.soundName);

		// `once` SCOPED TO THIS SOUND ID: a plain `on('end')` added a listener to
		// the shared Howl for every one-shot ever played and never removed it, so
		// a long session accumulated thousands of listeners, each invoked whenever
		// any sound ended. Scoped-and-once means it fires for this id only and
		// unregisters itself.
		options.howl.once(
			'end',
			() => {
				options.howl.stop(soundId);
				// Only clear the entry if it is still OURS: a forced replay puts a
				// newer id under the same name, and this (older) instance ending
				// must not evict the sound that is currently playing.
				if (options.getSoundMap()[sound.soundName]?.soundId === soundId) {
					delete options.getSoundMap()[sound.soundName];
				}
			},
			soundId,
		);
	};

	const soundPlayMap = {
		new: (sound: Sound) => playOnce(sound),
		paused: (sound: Sound) => playOnce(sound),
		playing: (sound: Sound, options: { forcePlay?: boolean }) => {
			if (options.forcePlay) playOnce(sound);
		},
	};

	const play = (playOptions: PlayOptions<TSoundName> & { forcePlay?: boolean }) => {
		const existingSound = options.getSoundMap()[playOptions.name];
		const sound = existingSound ?? options.newSound(playOptions.name);
		soundPlayMap[sound.soundState](sound, { forcePlay: playOptions.forcePlay });
	};

	return {
		play,
	};
}
