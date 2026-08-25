import { SECOND } from 'constants-shared/time';

/**
 * What each win level is worth, and what it sounds like.
 *
 * The stinger ladder is deliberately short of the level ladder: levels 1-2 stay
 * silent because sfx_win_line and the count-up already sound on every paying
 * spin, and a stinger on top of those would fire several times a minute. The
 * stingers start where a win is worth remarking on.
 *
 * Levels 7-10 reuse sfx_win_big rather than owning a MEGA stinger. The step up
 * is carried by bgm_win_mega, which is written in the same key and tempo as
 * bgm_win_big precisely so the game can cut from one to the other mid-
 * celebration — see manifest-shared.json.
 */
export const winLevelMap = {
	1: {
		level: 1,
		alias: 'zero',
		type: 'small',
		text: null,
		presentDuration: 0,
		sound: { sfx: undefined, bgm: undefined },
	},
	2: {
		level: 2,
		alias: 'standard',
		type: 'small',
		text: null,
		presentDuration: 0.6 * SECOND,
		sound: { sfx: undefined, bgm: undefined },
	},
	3: {
		level: 3,
		alias: 'small',
		type: 'small',
		text: null,
		presentDuration: 1 * SECOND,
		sound: { sfx: 'sfx_win_small', bgm: undefined },
	},
	4: {
		level: 4,
		alias: 'nice',
		type: 'medium',
		text: null,
		presentDuration: 1.5 * SECOND,
		sound: { sfx: 'sfx_win_medium', bgm: undefined },
	},
	5: {
		level: 5,
		alias: 'substantial',
		type: 'medium',
		text: null,
		presentDuration: 2.0 * SECOND,
		sound: { sfx: 'sfx_win_medium', bgm: undefined },
	},
	6: {
		level: 6,
		alias: 'big',
		type: 'big',
		text: 'BIG WIN',
		presentDuration: 6 * SECOND,
		sound: { sfx: 'sfx_win_big', bgm: 'bgm_win_big' },
	},
	7: {
		level: 7,
		alias: 'superwin',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: 18 * SECOND,
		sound: { sfx: 'sfx_win_big', bgm: 'bgm_win_mega' },
	},
	8: {
		level: 8,
		alias: 'mega',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: 20 * SECOND,
		sound: { sfx: 'sfx_win_big', bgm: 'bgm_win_mega' },
	},
	9: {
		level: 9,
		alias: 'epic',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: 26 * SECOND,
		sound: { sfx: 'sfx_win_big', bgm: 'bgm_win_mega' },
	},
	10: {
		level: 10,
		alias: 'max',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: 32 * SECOND,
		sound: { sfx: 'sfx_win_big', bgm: 'bgm_win_mega' },
	},
} as const;

export type WinLevelMap = typeof winLevelMap;
export type WinLevel = keyof typeof winLevelMap;
export type WinLevelData = WinLevelMap[WinLevel];
export type WinLevelAlias = WinLevelData['alias'];
