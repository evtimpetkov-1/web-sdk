import { createSound } from 'utils-sound';

/**
 * Every cue in the sprite. Two families, and the split is deliberate:
 *
 * - Unprefixed names come from the SHARED studio library
 *   (tools/audio-pipeline/manifest-shared.json) and are byte-identical in every
 *   game we ship. Do not rename one here without renaming it there.
 * - `_kw_` names are owned by Kraken's Wilds
 *   (tools/audio-pipeline/manifest-krakens-wilds.json).
 *
 * Three cues are PITCH LADDERS, played repeatedly at a rising `rate` rather than
 * existing as numbered files — see REEL_STOP_RATES, SCATTER_LAND_RATES and
 * KRAKEN_GULP_RATES in constants.ts.
 */
export type MusicName =
	| 'bgm_kw_main'
	| 'bgm_kw_freespin'
	| 'bgm_win_big'
	| 'bgm_win_mega'
	| 'bgm_totalwin';

export type SoundEffectName =
	// ui
	| 'sfx_ui_click'
	| 'sfx_ui_click_alt'
	| 'sfx_ui_spin'
	| 'sfx_ui_stop'
	| 'sfx_ui_toggle_on'
	| 'sfx_ui_toggle_off'
	| 'sfx_ui_popup_open'
	| 'sfx_ui_popup_close'
	| 'sfx_ui_denied'
	// reels
	| 'sfx_reel_spin'
	| 'sfx_reel_stop'
	| 'sfx_anticipation_start'
	| 'sfx_anticipation'
	| 'sfx_anticipation_end'
	// symbols
	| 'sfx_symbol_land'
	| 'sfx_symbol_land_special'
	// scatter
	| 'sfx_scatter_land'
	| 'sfx_scatter_win'
	| 'sfx_bonus_trigger'
	// wins
	| 'sfx_win_line'
	| 'sfx_win_line_tick'
	| 'sfx_countup'
	| 'sfx_countup_end'
	| 'sfx_win_small'
	| 'sfx_win_medium'
	| 'sfx_win_big'
	| 'sfx_win_end'
	| 'sfx_totalwin_panel'
	| 'sfx_coin_shower'
	// coins
	| 'sfx_coin_reveal'
	| 'sfx_coin_fly'
	| 'sfx_coin_collect'
	// free spins
	| 'sfx_fs_retrigger'
	| 'sfx_fs_counter'
	| 'sfx_fs_outro'
	// kraken's wilds
	| 'sfx_kw_kraken_attack'
	| 'sfx_kw_kraken_gulp'
	| 'sfx_kw_symbol_reveal'
	| 'sfx_kw_wild_land'
	| 'sfx_kw_fs_transition'
	| 'sfx_kw_fs_intro'
	| 'sfx_kw_mult_appear'
	| 'sfx_kw_mult_fly'
	| 'sfx_kw_mult_hit';

export type SoundName = MusicName | SoundEffectName;

const sound = createSound<SoundName>();

export { sound };
