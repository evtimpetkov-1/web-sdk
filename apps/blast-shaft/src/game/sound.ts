import { createSound } from 'utils-sound';

/**
 * Every cue the game plays (tools/audio-pipeline/games/blast-shaft). Ladders (reel
 * land, bonus land) are ONE file pitched up per repeat via soundOnce `rate`.
 *
 * Evtim's sound review of 2026-11-24 (after the third rejection, "Bad sound design"
 * x2; board https://claude.ai/artifact/QtRqFWzVwx2cXStvNw9Mro): 24 cues were REMOVED
 * from the game with nothing in their place (the win light-up, hit, amount pop and
 * counter step, the count-up tick, the small / medium total stingers, the big win's
 * exit, three multiplier cues, the bomb's arm and blast hit, the cloner's cast, the
 * popup boards in and out, the retrigger stamp, the start whistle and the mascot's
 * laughs). Two moments were given a sound he already liked: a bomb LANDING plays the
 * old win hit (the file is sfx_bs_bomb_land now), a clone landing plays the cloner's
 * own landing sound.
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
	| 'sfx_bs_win_build'
	| 'sfx_bs_shatter'
	| 'sfx_bs_tickup_end'
	| 'sfx_bs_win_big'
	| 'sfx_bs_win_mega'
	| 'sfx_bs_win_epic'
	| 'sfx_bs_shower'
	// multiplier
	| 'sfx_bs_mult_fly'
	| 'sfx_bs_mult_up'
	// bomb
	| 'sfx_bs_bomb_explode'
	// cloner
	| 'sfx_bs_cloner_flood'
	| 'sfx_bs_clone_burst'
	// free spins
	| 'sfx_bs_scatter_win'
	| 'sfx_bs_curtain_close'
	| 'sfx_bs_curtain_open'
	| 'sfx_bs_curtain_build'
	| 'sfx_bs_curtain_blast'
	| 'sfx_bs_fs_counter';

export type SoundName = MusicName | SoundEffectName;

/**
 * Sounds switched OFF while a replacement is being chosen: their triggers stay where
 * they are and Sound.svelte skips these names. EMPTY since the review's last round
 * (2026-11-24): all ten sounds Evtim wanted changed have the take he picked and are back
 * on (both music loops, the three win beds and the total win bed, the anticipation start
 * and loop, the free spins trigger, the buy confirmation). Add a name here to silence a
 * sound without touching its trigger.
 */
export const SOUNDS_OFF_FOR_NOW: ReadonlySet<SoundName> = new Set<SoundName>([]);

const sound = createSound<SoundName>();

export { sound };
