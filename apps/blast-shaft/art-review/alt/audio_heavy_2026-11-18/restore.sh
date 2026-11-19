#!/bin/sh
# Puts back Blast Drop's sound sprite as the heavy set left it (2026-11-18, before Evtim's
# pick of a clearer dynamite explosion replaced sfx_bs_bomb_explode). The cue names did not
# change, so nothing else needs touching. The cue's old file is in
# tools/audio-pipeline/_archive/blast-shaft_heavy_2026-11-18/.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cp -p "$HERE"/sounds.* "$HERE/../../../static/assets/audio/"
echo "sound sprite (heavy set) restored"
