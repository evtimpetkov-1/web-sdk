#!/bin/sh
# Blast Drop's sounds as they stood after round 2 of the sound review (2026-11-24) and
# before the round-3 picks went in: six sounds muted, the old free spins music and
# MEGA / EPIC win beds still in the sprite.
#   sh restore.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
TOOLS="$(cd "$APP/../../../tools" && pwd)"
cp "$HERE"/audio/* "$APP/static/assets/audio/"
cp "$HERE/sound.ts" "$APP/src/game/sound.ts"
cp "$HERE/bs-picks.json" "$HERE/manifest-blast-shaft.json" "$TOOLS/audio-pipeline/"
cp "$HERE"/games/*.mp3 "$TOOLS/audio-pipeline/games/blast-shaft/"
echo "restored: the sounds as after round 2 (six muted)"
