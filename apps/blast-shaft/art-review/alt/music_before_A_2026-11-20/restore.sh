#!/bin/sh
# Puts back Blast Drop's base game music as it was before Evtim picked version A
# (2026-11-20: "ambient_A_deep_shaft" replaced the 104 BPM work-song stomp). Restores the
# game's sound sprite, the cue file the sprite is built from and bs-picks.json, so a later
# rebuild does not bring A back. The cue name did not change, so no code needs touching.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PIPE="$HERE/../../../../../../tools/audio-pipeline"
cp -p "$HERE"/sounds.* "$HERE/../../../static/assets/audio/"
cp -p "$HERE/bgm_bs_main.mp3" "$PIPE/games/blast-shaft/bgm_bs_main.mp3"
cp -p "$HERE/bs-picks.json" "$PIPE/bs-picks.json"
echo "base game music (work-song stomp) restored"
