import { createSound } from 'utils-sound';

export type MusicName =
	| 'bgm_main'
	| 'bgm_freespin'
	| 'bgm_winlevel_big'
	| 'bgm_winlevel_mega';

export type SoundEffectName =
	| 'jng_intro_fs'
	| 'sfx_anticipation'
	| 'sfx_countup'
	| 'sfx_countup_end'
	| 'sfx_reel_stop'
	| 'sfx_reelspin'
	| 'sfx_scatter_stop_1'
	| 'sfx_scatter_stop_2'
	| 'sfx_scatter_stop_3'
	| 'sfx_scatter_win_v2'
	| 'sfx_superfreespin'
	| 'sfx_totalwin_panel'
	| 'sfx_ui_click'
	| 'sfx_ui_spin'
	| 'sfx_wild_explode'
	| 'sfx_wild_land'
	| 'sfx_payline_switch'
	| 'sfx_win_line';

export type SoundName = MusicName | SoundEffectName;

const sound = createSound<SoundName>();

export { sound };
