#!/bin/sh
# Blast Drop's sounds as they were reviewed the third time (before Evtim's sound review
# of 2026-11-24): all 63 cues in the sprite, every trigger in the code, nothing muted.
#   sh restore.sh
# Puts back the game's code and sound sprite, and in the workspace tools the manifest,
# the level table and the old bomb landing file, so a sprite rebuild gives the old set.
# NOTE: the code files here are from before the sound review but AFTER the same day's
# animation rework; restoring them keeps that rework.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
TOOLS="$(cd "$APP/../../../tools" && pwd)"
cp "$HERE"/src/components/*.svelte "$APP/src/components/"
cp "$HERE"/src/game/*.ts "$APP/src/game/"
cp "$HERE"/audio/* "$APP/static/assets/audio/"
cp "$HERE/manifest-blast-shaft.json" "$TOOLS/audio-pipeline/manifest-blast-shaft.json"
cp "$HERE/master-audio.js" "$TOOLS/master-audio.js"
cp "$HERE/sfx_bs_bomb_land_old.mp3" "$TOOLS/audio-pipeline/games/blast-shaft/sfx_bs_bomb_land.mp3"
echo "restored: 63-cue sprite, all triggers, nothing muted"
