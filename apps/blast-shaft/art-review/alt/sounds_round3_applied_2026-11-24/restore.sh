#!/bin/sh
# Blast Drop's sounds as they stood after round 3 of the sound review (2026-11-24) and
# before the round-4 picks went in: three sounds muted (total win bed, anticipation start
# and loop), their old files still in the sprite.
#   sh restore.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
TOOLS="$(cd "$APP/../../../tools" && pwd)"
cp "$HERE"/audio/* "$APP/static/assets/audio/"
cp "$HERE/sound.ts" "$APP/src/game/sound.ts"
cp "$HERE/bs-picks.json" "$HERE/manifest-blast-shaft.json" "$TOOLS/audio-pipeline/"
cp "$HERE"/games/*.mp3 "$TOOLS/audio-pipeline/games/blast-shaft/"
echo "restored: the sounds as after round 3 (three muted)"
