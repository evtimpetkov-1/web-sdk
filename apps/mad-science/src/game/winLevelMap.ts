import { SECOND } from 'constants-shared/time';

/**
 * Win levels come from the book (setWin.winLevel, 1-10). Levels 6+ are "big"
 * and get the title presentation (WinAnimation); `tier` is the HIGHEST title
 * the count-up climbs to — the presentation always starts at BIG WIN and
 * upgrades through MEGA to EPIC as the count-up progresses (Win.svelte splits
 * the count-up evenly between the tiers). Three title arts exist, so the five
 * big levels share them: superwin rides mega's, max rides epic's.
 *
 * Sound: levels 2-3 / 4-5 take the small / medium stinger; every big level opens
 * on the BIG stinger (the MEGA / EPIC stingers fire on WinAnimation's upgrades)
 * over its top tier's bed — the three beds share key and tempo, so cuts are clean.
 */
export const winLevelMap = {
	1: {
		level: 1,
		alias: 'zero',
		type: 'small',
		text: null,
		presentDuration: 0,
		sound: { sfx: undefined, bgm: undefined },
		tier: undefined,
	},
	2: {
		level: 2,
		alias: 'standard',
		type: 'small',
		text: null,
		presentDuration: 0.6 * SECOND,
		sound: { sfx: 'sfx_ms_win_small', bgm: undefined },
		tier: undefined,
	},
	3: {
		level: 3,
		alias: 'small',
		type: 'small',
		text: null,
		presentDuration: 1 * SECOND,
		sound: { sfx: 'sfx_ms_win_small', bgm: undefined },
		tier: undefined,
	},
	4: {
		level: 4,
		alias: 'nice',
		type: 'medium',
		text: null,
		presentDuration: 1.5 * SECOND,
		sound: { sfx: 'sfx_ms_win_medium', bgm: undefined },
		tier: undefined,
	},
	5: {
		level: 5,
		alias: 'substantial',
		type: 'medium',
		text: null,
		presentDuration: 2.0 * SECOND,
		sound: { sfx: 'sfx_ms_win_medium', bgm: undefined },
		tier: undefined,
	},
	6: {
		level: 6,
		alias: 'big',
		type: 'big',
		text: 'BIG WIN',
		presentDuration: 6 * SECOND,
		sound: { sfx: 'sfx_ms_win_big', bgm: 'bgm_ms_win_big' },
		tier: 'big',
	},
	7: {
		level: 7,
		alias: 'superwin',
		type: 'big',
		text: 'SUPER WIN',
		presentDuration: 18 * SECOND,
		sound: { sfx: 'sfx_ms_win_big', bgm: 'bgm_ms_win_mega' },
		tier: 'mega',
	},
	8: {
		level: 8,
		alias: 'mega',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: 20 * SECOND,
		sound: { sfx: 'sfx_ms_win_big', bgm: 'bgm_ms_win_mega' },
		tier: 'mega',
	},
	9: {
		level: 9,
		alias: 'epic',
		type: 'big',
		text: 'EPIC WIN!',
		presentDuration: 26 * SECOND,
		sound: { sfx: 'sfx_ms_win_big', bgm: 'bgm_ms_win_epic' },
		tier: 'epic',
	},
	10: {
		level: 10,
		alias: 'max',
		type: 'big',
		text: 'MAX WIN',
		presentDuration: 32 * SECOND,
		sound: { sfx: 'sfx_ms_win_big', bgm: 'bgm_ms_win_epic' },
		tier: 'epic',
	},
} as const;

export type WinLevelMap = typeof winLevelMap;
export type WinLevel = keyof typeof winLevelMap;
export type WinLevelData = WinLevelMap[WinLevel];
export type WinLevelAlias = WinLevelData['alias'];
