#!/bin/sh
# Blast Drop's sounds before the round-5 picks (2026-11-26): the old break-up sound
# (sfx_bs_shatter), the old coin shower (sfx_bs_shower), no blast on the cloners' burst
# (sfx_bs_clone_burst did not exist). Puts back the sprite, the two game files that play
# them, and the tool settings; deletes the new cue's file.
#   sh restore.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
TOOLS="$(cd "$APP/../../../tools" && pwd)"
cp "$HERE"/audio/* "$APP/static/assets/audio/"
cp "$HERE/sound.ts" "$HERE/bookEventHandlerMap.ts" "$APP/src/game/"
cp "$HERE/bs-picks.json" "$HERE/manifest-blast-shaft.json" "$HERE/bs-heavy.py" "$HERE/bs-heavy-picks.json" "$TOOLS/audio-pipeline/"
cp "$HERE/master-audio.js" "$TOOLS/"
cp "$HERE"/games/*.mp3 "$TOOLS/audio-pipeline/games/blast-shaft/"
rm -f "$TOOLS/audio-pipeline/games/blast-shaft/sfx_bs_clone_burst.mp3"
echo "restored: the sounds as before the round-5 picks"
