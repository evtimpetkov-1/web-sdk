#!/bin/sh
# Blast Drop's sounds as they stood after round 1 of the sound review (2026-11-24) and
# before the round-2 picks went in: 38 cues, the ten "Change" sounds muted, the old base
# music / big win bed / free spins trigger / buy confirmation still in the sprite.
#   sh restore.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
TOOLS="$(cd "$APP/../../../tools" && pwd)"
cp "$HERE"/audio/* "$APP/static/assets/audio/"
cp "$HERE/sound.ts" "$APP/src/game/sound.ts"
cp "$HERE/bs-picks.json" "$HERE/manifest-blast-shaft.json" "$TOOLS/audio-pipeline/"
cp "$HERE"/games/*.mp3 "$TOOLS/audio-pipeline/games/blast-shaft/"
echo "restored: the sounds as after round 1 (ten muted, old takes in the sprite)"
