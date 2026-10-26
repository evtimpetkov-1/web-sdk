import { createSound } from 'utils-sound';

/**
 * Every cue the game plays: Mad Science's own (sfx_ms_ / bgm_ms_, built from
 * tools/audio-pipeline/games/mad-science, map in SOUND-MAP-mad-science.md) plus
 * the shared library cues it still leans on. Ladders (reel land, bonus land,
 * cascade step) are ONE file pitched up per repeat via soundOnce `rate`.
 */
export type MusicName =
	| 'bgm_ms_main'
	| 'bgm_ms_freespin'
	| 'bgm_ms_totalwin'
	| 'bgm_ms_win_big'
	| 'bgm_ms_win_mega'
	| 'bgm_ms_win_epic';

export type SoundEffectName =
	// boot + ui
	| 'sfx_ms_game_start'
	| 'sfx_ms_ui_click'
	| 'sfx_ms_ui_spin'
	| 'sfx_ms_ui_stop'
	| 'sfx_ms_ui_popup_open'
	| 'sfx_ms_ui_popup_close'
	| 'sfx_ms_buy_confirm'
	// board
	| 'sfx_ms_board_dropout'
	| 'sfx_ms_reel_land'
	| 'sfx_ms_tumble_drop'
	| 'sfx_ms_anticipation_start'
	| 'sfx_ms_anticipation'
	| 'sfx_ms_anticipation_end'
	// symbol landings
	| 'sfx_ms_bonus_land'
	| 'sfx_ms_wild_land'
	| 'sfx_ms_mult_land'
	| 'sfx_ms_bomb_land'
	| 'sfx_ms_cloner_land'
	| 'sfx_ms_bomb_fuse'
	// wins and cascades
	| 'sfx_ms_win_cycle'
	| 'sfx_ms_win_zap'
	| 'sfx_ms_cluster_amount'
	| 'sfx_ms_goo_burst'
	| 'sfx_ms_cascade_step'
	| 'sfx_ms_tickup'
	| 'sfx_ms_tickup_end'
	| 'sfx_ms_win_small'
	| 'sfx_ms_win_medium'
	| 'sfx_ms_win_big'
	| 'sfx_ms_win_mega'
	| 'sfx_ms_win_epic'
	| 'sfx_ms_win_end'
	| 'sfx_ms_shower'
	// multiplier
	| 'sfx_ms_mult_activate'
	| 'sfx_ms_mult_fly'
	| 'sfx_ms_mult_up'
	| 'sfx_ms_mult_reset'
	| 'sfx_ms_mult_apply'
	// bomb
	| 'sfx_ms_bomb_arm'
	| 'sfx_ms_bomb_explode'
	| 'sfx_ms_blast_hit'
	// cloner
	| 'sfx_ms_cloner_cast'
	| 'sfx_ms_clone_splat'
	| 'sfx_ms_cloner_flood'
	// free spins
	| 'sfx_ms_scatter_win'
	| 'sfx_ms_curtain_close'
	| 'sfx_ms_curtain_open'
	| 'sfx_ms_fs_intro'
	| 'sfx_ms_popup_out'
	| 'sfx_ms_fs_counter'
	| 'sfx_ms_fs_retrigger'
	| 'sfx_ms_fs_outro'
	// the mascot's laugh: five takes, one at random (MASCOT_LAUGHS)
	| 'sfx_ms_mascot_win_1'
	| 'sfx_ms_mascot_win_2'
	| 'sfx_ms_mascot_win_3'
	| 'sfx_ms_mascot_win_4'
	| 'sfx_ms_mascot_win_5';

export type SoundName = MusicName | SoundEffectName;

const sound = createSound<SoundName>();

export { sound };
