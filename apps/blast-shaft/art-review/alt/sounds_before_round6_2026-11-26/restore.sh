#!/bin/sh
# Blast Drop's sounds before the round-6 picks (2026-11-26): the winners break apart to the
# gold eruption with no build, the free-spins curtain charges to the anticipation ratchet with
# no blast, the western-noir groove of 24 Nov is the base music. Puts back the sprite, the
# code that plays them, the game files and tool settings; deletes the three new cues' files.
#   sh restore.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
TOOLS="$(cd "$APP/../../../tools" && pwd)"
cp "$HERE"/audio/* "$APP/static/assets/audio/"
cp "$HERE/sound.ts" "$HERE/bookEventHandlerMap.ts" "$APP/src/game/"
cp "$HERE/Transition.svelte" "$APP/src/components/"
cp "$HERE/bs-picks.json" "$HERE/manifest-blast-shaft.json" "$HERE/bs-heavy.py" "$HERE/bs-heavy-picks.json" "$TOOLS/audio-pipeline/"
cp "$HERE/master-audio.js" "$TOOLS/"
cp "$HERE"/games/*.mp3 "$TOOLS/audio-pipeline/games/blast-shaft/"
rm -f "$TOOLS/audio-pipeline/games/blast-shaft/sfx_bs_win_build.mp3" "$TOOLS/audio-pipeline/games/blast-shaft/sfx_bs_curtain_build.mp3" "$TOOLS/audio-pipeline/games/blast-shaft/sfx_bs_curtain_blast.mp3"
echo "restored: the sounds as before the round-6 picks"
