import { createSound } from 'utils-sound';

/**
 * Every cue the game plays: Mad Science's own (sfx_bs_ / bgm_bs_, built from
 * tools/audio-pipeline/games/chaos-lab, map in SOUND-MAP-chaos-lab.md) plus
 * the shared library cues it still leans on. Ladders (reel land, bonus land,
 * cascade step) are ONE file pitched up per repeat via soundOnce `rate`.
 */
export type MusicName =
	| 'bgm_bs_main'
	| 'bgm_bs_freespin'
	| 'bgm_bs_totalwin'
	| 'bgm_bs_win_big'
	| 'bgm_bs_win_mega'
	| 'bgm_bs_win_epic';

export type SoundEffectName =
	// boot + ui
	| 'sfx_bs_game_start'
	| 'sfx_bs_ui_click'
	| 'sfx_bs_ui_spin'
	| 'sfx_bs_ui_stop'
	| 'sfx_bs_ui_popup_open'
	| 'sfx_bs_ui_popup_close'
	| 'sfx_bs_buy_confirm'
	// board
	| 'sfx_bs_board_dropout'
	| 'sfx_bs_reel_land'
	| 'sfx_bs_tumble_drop'
	| 'sfx_bs_anticipation_start'
	| 'sfx_bs_anticipation'
	| 'sfx_bs_anticipation_end'
	// symbol landings
	| 'sfx_bs_bonus_land'
	| 'sfx_bs_wild_land'
	| 'sfx_bs_mult_land'
	| 'sfx_bs_bomb_land'
	| 'sfx_bs_cloner_land'
	| 'sfx_bs_bomb_fuse'
	// wins and cascades
	| 'sfx_bs_win_cycle'
	| 'sfx_bs_win_zap'
	| 'sfx_bs_cluster_amount'
	| 'sfx_bs_shatter'
	| 'sfx_bs_cascade_step'
	| 'sfx_bs_tickup'
	| 'sfx_bs_tickup_end'
	| 'sfx_bs_win_small'
	| 'sfx_bs_win_medium'
	| 'sfx_bs_win_big'
	| 'sfx_bs_win_mega'
	| 'sfx_bs_win_epic'
	| 'sfx_bs_win_end'
	| 'sfx_bs_shower'
	// multiplier
	| 'sfx_bs_mult_activate'
	| 'sfx_bs_mult_fly'
	| 'sfx_bs_mult_up'
	| 'sfx_bs_mult_reset'
	| 'sfx_bs_mult_apply'
	// bomb
	| 'sfx_bs_bomb_arm'
	| 'sfx_bs_bomb_explode'
	| 'sfx_bs_blast_hit'
	// cloner
	| 'sfx_bs_cloner_cast'
	| 'sfx_bs_clone_splat'
	| 'sfx_bs_cloner_flood'
	// free spins
	| 'sfx_bs_scatter_win'
	| 'sfx_bs_curtain_close'
	| 'sfx_bs_curtain_open'
	| 'sfx_bs_fs_intro'
	| 'sfx_bs_popup_out'
	| 'sfx_bs_fs_counter'
	| 'sfx_bs_fs_retrigger'
	| 'sfx_bs_fs_outro'
	// the mascot's laugh: five takes, one at random (MASCOT_LAUGHS)
	| 'sfx_bs_mascot_win_1'
	| 'sfx_bs_mascot_win_2'
	| 'sfx_bs_mascot_win_3'
	| 'sfx_bs_mascot_win_4'
	| 'sfx_bs_mascot_win_5';

export type SoundName = MusicName | SoundEffectName;

const sound = createSound<SoundName>();

export { sound };
