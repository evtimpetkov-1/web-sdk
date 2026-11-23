import { createSound } from 'utils-sound';

/**
 * Every cue the game plays, all its own: sfx_dg_ / bgm_dg_, one western take
 * per Chaos Lab 2 cue with the same trigger, length and loop flag
 * (tools/audio-pipeline/manifest-dynamite-gulch.json, built from
 * games/dynamite-gulch; the moments are Chaos Lab's, SOUND-MAP-chaos-lab.md).
 * No shared library cue ships. Ladders (reel land, bonus land, cascade step)
 * are ONE file pitched up per repeat via soundOnce `rate`. This union must
 * match the sprite's cue list exactly. Chaos Lab's five mascot laughs are gone
 * (never played here: the mascot does not talk).
 */
export type MusicName =
	| 'bgm_dg_main'
	| 'bgm_dg_freespin'
	| 'bgm_dg_totalwin'
	| 'bgm_dg_win_big'
	| 'bgm_dg_win_mega'
	| 'bgm_dg_win_epic';

export type SoundEffectName =
	// boot + ui
	| 'sfx_dg_game_start'
	| 'sfx_dg_ui_click'
	| 'sfx_dg_ui_spin'
	| 'sfx_dg_ui_stop'
	| 'sfx_dg_ui_popup_open'
	| 'sfx_dg_ui_popup_close'
	| 'sfx_dg_buy_confirm'
	// board
	| 'sfx_dg_board_dropout'
	| 'sfx_dg_reel_land'
	| 'sfx_dg_tumble_drop'
	| 'sfx_dg_anticipation_start'
	| 'sfx_dg_anticipation'
	| 'sfx_dg_anticipation_end'
	// symbol landings
	| 'sfx_dg_bonus_land'
	| 'sfx_dg_wild_land'
	| 'sfx_dg_mult_land'
	| 'sfx_dg_bomb_land'
	| 'sfx_dg_cloner_land'
	| 'sfx_dg_bomb_fuse'
	// wins and cascades
	| 'sfx_dg_win_cycle'
	| 'sfx_dg_win_zap'
	| 'sfx_dg_cluster_amount'
	| 'sfx_dg_goo_burst'
	| 'sfx_dg_cascade_step'
	| 'sfx_dg_tickup'
	| 'sfx_dg_tickup_end'
	| 'sfx_dg_win_small'
	| 'sfx_dg_win_medium'
	| 'sfx_dg_win_big'
	| 'sfx_dg_win_mega'
	| 'sfx_dg_win_epic'
	| 'sfx_dg_win_end'
	| 'sfx_dg_shower'
	// multiplier
	| 'sfx_dg_mult_activate'
	| 'sfx_dg_mult_fly'
	| 'sfx_dg_mult_up'
	| 'sfx_dg_mult_reset'
	// bomb
	| 'sfx_dg_bomb_arm'
	| 'sfx_dg_bomb_explode'
	| 'sfx_dg_blast_hit'
	// cloner
	| 'sfx_dg_cloner_cast'
	| 'sfx_dg_clone_splat'
	| 'sfx_dg_cloner_flood'
	// free spins
	| 'sfx_dg_scatter_win'
	| 'sfx_dg_curtain_close'
	| 'sfx_dg_curtain_open'
	| 'sfx_dg_fs_intro'
	| 'sfx_dg_popup_out'
	| 'sfx_dg_fs_counter'
	| 'sfx_dg_fs_retrigger'
	| 'sfx_dg_fs_outro';

export type SoundName = MusicName | SoundEffectName;

const sound = createSound<SoundName>();

export { sound };
