#!/usr/bin/env node
'use strict';

/**
 * Levels a directory of one-shots/loops to deliberate, consistent loudness.
 *
 * Why this exists: ElevenLabs returns everything normalised to roughly full
 * scale, so raw generations arrive with 0.0 dBFS peaks and a mean spread of 20+
 * dB between cues. Batch 1 shipped that way — sfx_wild_explode at -10 dB mean
 * next to sfx_scatter_stop_1 at -32 dB, and two cues clipping. Levels are a
 * BUILD concern, not a prompt concern; no amount of prompting fixes them.
 *
 * Two stages per file:
 *   1. gain to hit a per-category target mean (the mix balance — a UI click
 *      must not sit at the same level as a MEGA WIN braam)
 *   2. a brick-wall limiter at -1 dBFS (the safety net — nothing ever clips)
 *
 * Usage: node master-audio.js <inDir> <outDir>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Target mean volume per cue family, in dBFS. These ARE the mix: the ladder from
 * -26 (chrome you hear hundreds of times an hour) up to -14 (once-a-session
 * celebrations) is what stops the UI from fatiguing and the big wins from
 * feeling small. Matched by prefix, longest first.
 */
/**
 * Blast Drop's own levels (2026-11-18, the heavy set; Evtim: "solid heavy sounds for
 * explosions, wins, cloners, other effects"). The impacts sit 2 to 4 dB above where
 * the shared ladder puts them: a cue that is half low end reads quieter at the same
 * mean level, and these are the game's events. The beds and UI stay on the ladder.
 */
const BS_TARGETS = [
	['sfx_bs_bomb_explode', -12],
	// Dynamite Gulch plays the SAME explosion file (Evtim, 2026-11-18: "i like the new
	// explosion in the blast game, use it also in the dynamite"): the same level, so it is
	// the sound he approved. Its other cues stay on the shared ladder.
	['sfx_dg_bomb_explode', -12],
	['sfx_bs_blast_hit', -15],
	['sfx_bs_bomb_land', -17],
	['sfx_bs_bomb_arm', -20],
	// 2026-11-26, round 5: the gold eruption Evtim picked for the cloners' burst, at the level
	// he heard it on the board (2 dB under the explosion, as heard); the winners break apart to
	// the SAME file ("for winning ... blast alone from option c") 3 dB under it, as it plays on
	// every cascade. The count-up loop (in place of the coin shower) at the board's level.
	// Matched by measuring the built sprite against the board files.
	['sfx_bs_clone_burst', -10.7],
	['sfx_bs_shatter', -13.7],
	['sfx_bs_shower', -24.3],
	['sfx_bs_win_zap', -19],
	['sfx_bs_tumble_drop', -19],
	['sfx_bs_board_dropout', -19],
	['sfx_bs_reel_land', -19],
	['sfx_bs_wild_land', -17],
	['sfx_bs_bonus_land', -17],
	['sfx_bs_mult_land', -18],
	['sfx_bs_mult_apply', -14],
	['sfx_bs_cloner_', -17],
	['sfx_bs_clone_splat', -18],
	['sfx_bs_anticipation_end', -17],
	['sfx_bs_win_small', -17],
	['sfx_bs_win_medium', -16],
	['sfx_bs_win_big', -13],
	['sfx_bs_win_mega', -12.5],
	['sfx_bs_win_epic', -12],
	['sfx_bs_scatter_win', -14],
	['sfx_bs_fs_intro', -13],
	['sfx_bs_fs_outro', -14],
	['sfx_bs_fs_retrigger', -15],
	['sfx_bs_game_start', -15],
];

const TARGETS = [
	['sfx_ui_', -26],
	['sfx_win_line_tick', -26],
	['sfx_fs_counter', -26],
	// Tuned per bed, not per category: the -4.4 dB ("0.6 volume") that once sat
	// here was for the OLD mechanical bed; the watery bubble texture that
	// replaced it disappeared under the game at the -24 category level, so it
	// now runs at -20 — level with the anticipation riser it hands over to.
	['sfx_reel_spin', -20],
	['sfx_reel_stop', -22],
	['sfx_symbol_land', -23],
	['sfx_anticipation', -20],
	['sfx_coin_', -21],
	['sfx_scatter_land', -20],
	['sfx_countup', -20],
	['sfx_win_line', -20],
	['sfx_win_small', -19],
	['sfx_win_medium', -18],
	['sfx_win_end', -20],
	['sfx_fs_', -18],
	['sfx_totalwin_panel', -18],
	['sfx_scatter_win', -17],
	['sfx_win_big', -15],
	['sfx_win_mega', -14],
	['sfx_win_epic', -14],
	['sfx_bonus_trigger', -14],
	['sfx_kw_kraken_attack', -14],
	['sfx_kw_', -18],
	['bgm_win_', -16],
	// Mad Science free spins run a notch above the base bed: Evtim heard the
	// bonus candidates as "too low" next to bgm_ms_main even when the raw take
	// was hotter — the bonus has to FEEL louder, and that is a ladder decision.
	['bgm_ms_freespin', -17],
	['bgm_ms_win_', -16],
	['bgm_ms_totalwin', -18],
	// Mad Science cues (2026-09-18 sound map), mirroring the shared ladder:
	// chrome at -26, board mechanics -22/-23, feature beats -20, payoffs -14..-18.
	['sfx_ms_ui_', -26],
	['sfx_ms_fs_counter', -26],
	['sfx_ms_bomb_fuse', -26],
	['sfx_ms_cluster_amount', -25],
	['sfx_ms_tumble_drop', -23],
	['sfx_ms_board_dropout', -22],
	['sfx_ms_reel_land', -22],
	['sfx_ms_bomb_arm', -22],
	['sfx_ms_clone_splat', -22],
	['sfx_ms_win_zap', -22],
	['sfx_ms_popup_out', -22],
	['sfx_ms_shower', -22],
	['sfx_ms_cascade_step', -21],
	['sfx_ms_anticipation', -20],
	['sfx_ms_wild_land', -20],
	['sfx_ms_cloner_', -20],
	['sfx_ms_mult_', -20],
	['sfx_ms_win_cycle', -20],
	['sfx_ms_goo_burst', -20],
	['sfx_ms_tickup', -20],
	['sfx_ms_win_end', -20],
	['sfx_ms_mascot_win', -20],
	['sfx_ms_bonus_land', -19],
	['sfx_ms_win_small', -19],
	['sfx_ms_curtain_', -19],
	['sfx_ms_blast_hit', -18],
	['sfx_ms_win_medium', -18],
	['sfx_ms_buy_confirm', -18],
	['sfx_ms_mult_apply', -17],
	['sfx_ms_fs_retrigger', -17],
	['sfx_ms_game_start', -17],
	['sfx_ms_scatter_win', -16],
	['sfx_ms_fs_outro', -16],
	['sfx_ms_bomb_explode', -15],
	['sfx_ms_win_big', -15],
	['sfx_ms_win_mega', -14],
	['sfx_ms_win_epic', -14],
	['sfx_ms_fs_intro', -14],
	['bgm_', -20],
	['sfx_', -20],
];

const PEAK_CEILING_DB = -1;

const targetFor = (rawName) => {
	// Dynamite Gulch (dg_) is Chaos Lab re-themed cue for cue, so its cues sit on
	// the ms_ ladder: one mix to tune, not two copies of the same rows.
	// A game's own rows (BS_TARGETS: Blast Drop's heavy set, 2026-11-18) win over the
	// shared ms_ ladder, so its mix can differ without moving Chaos Lab's.
	const own = [...BS_TARGETS].sort((a, b) => b[0].length - a[0].length).find(([p]) => rawName.startsWith(p));
	if (own) return own[1];
	const name = rawName.replace(/^(sfx|bgm)_(?:dg|bs)_/, "$1_ms_").replace("sfx_ms_shatter", "sfx_ms_goo_burst");
	const hit = [...TARGETS].sort((a, b) => b[0].length - a[0].length).find(([p]) => name.startsWith(p));
	return hit ? hit[1] : -20;
};

const meanVolume = (file) => {
	const out = execSync(`ffmpeg -hide_banner -i "${file}" -af volumedetect -f null /dev/null 2>&1`, {
		encoding: 'utf-8',
		shell: '/bin/bash',
	});
	const m = out.match(/mean_volume:\s*(-?[\d.]+) dB/);
	return m ? parseFloat(m[1]) : null;
};

function main() {
	const [inDir, outDir] = process.argv.slice(2);
	if (!inDir || !outDir) throw new Error('Usage: node master-audio.js <inDir> <outDir>');
	fs.mkdirSync(outDir, { recursive: true });

	const files = fs.readdirSync(inDir).filter((f) => f.endsWith('.mp3')).sort();
	console.log(`Mastering ${files.length} files -> ${outDir}\n`);
	console.log(`${'cue'.padEnd(26)} ${'was'.padStart(7)} ${'gain'.padStart(7)} ${'target'.padStart(7)}`);

	for (const f of files) {
		const name = f.replace(/\.mp3$/, '');
		const src = path.join(inDir, f);
		const dst = path.join(outDir, f);
		const mean = meanVolume(src);
		const target = targetFor(name);

		if (mean === null || mean < -70) {
			// Digital silence — gain cannot rescue it, and boosting by 50 dB would
			// only amplify the noise floor. Copied through so the build still has
			// every key, and reported loudly.
			fs.copyFileSync(src, dst);
			console.log(`${name.padEnd(26)} ${String(mean).padStart(7)} ${'SKIP'.padStart(7)} ${'— SILENT SOURCE'}`);
			continue;
		}

		const gain = target - mean;
		execSync(
			`ffmpeg -y -v error -i "${src}" -af "volume=${gain.toFixed(2)}dB,alimiter=limit=${Math.pow(10, PEAK_CEILING_DB / 20).toFixed(4)}:level=false" -c:a libmp3lame -b:a 192k "${dst}"`,
			{ shell: '/bin/bash' },
		);
		console.log(
			`${name.padEnd(26)} ${mean.toFixed(1).padStart(7)} ${(gain >= 0 ? '+' : '') + gain.toFixed(1)}`.padEnd(43) +
				`${target}`.padStart(3),
		);
	}
	console.log(`\nDone. Peaks limited to ${PEAK_CEILING_DB} dBFS.`);
}

main();
