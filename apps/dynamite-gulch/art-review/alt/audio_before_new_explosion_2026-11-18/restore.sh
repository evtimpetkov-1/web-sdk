#!/bin/sh
# Puts back Dynamite Gulch's sound sprite as it was before Blast Drop's picked explosion
# replaced sfx_dg_bomb_explode (2026-11-18). The cue names did not change. The cue's old
# file is in tools/audio-pipeline/_archive/dynamite-gulch_2026-11-18/.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cp -p "$HERE"/sounds.* "$HERE/../../../static/assets/audio/"
echo "sound sprite restored"
