#!/bin/sh
# Puts back Dynamite Gulch's sound sprite as it was before sfx_dg_mult_apply was dropped from it
# (2026-11-20, Evtim: "horrible sound remove it"). The code no longer plays the cue: to hear it
# again, also restore its three calls (ClusterWinAmount.svelte, CashRespinBoard.svelte x2) and
# its name in src/game/sound.ts, and take it out of spriteDrop in
# tools/audio-pipeline/manifest-dynamite-gulch.json.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cp -p "$HERE"/sounds.* "$HERE/../../../static/assets/audio/"
echo "sound sprite restored"
