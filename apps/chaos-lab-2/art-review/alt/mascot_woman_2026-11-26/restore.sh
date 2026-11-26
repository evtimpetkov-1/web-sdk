#!/bin/sh
# Puts Chaos Lab 2's woman mascot back in place of the Chemist (2026-11-26).
#   sh art-review/alt/mascot_woman_2026-11-26/restore.sh
# 1. her three clips go back into static (the Chemist's files stay where they are,
#    unused: delete static/assets/mascot/ before a build if she stays)
# 2. her Mascot.svelte replaces the Chemist's (his is saved beside this script)
# 3. MASCOT_KIND in src/game/constants.ts is set to 'woman' (landmarks, side-layout
#    room, the still, no laugh)
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
cp "$HERE/static/idle.mp4" "$HERE/static/win.mp4" "$HERE/static/win2.mp4" "$APP/static/assets/chaoslab2/mascot/"
cp "$APP/src/components/Mascot.svelte" "$HERE/Mascot_chemist.svelte"
cp "$HERE/Mascot.svelte" "$APP/src/components/Mascot.svelte"
sed -i '' "s/^export const MASCOT_KIND: 'chemist' | 'woman' = 'chemist';/export const MASCOT_KIND: 'chemist' | 'woman' = 'woman';/" "$APP/src/game/constants.ts"
grep -q "MASCOT_KIND: 'chemist' | 'woman' = 'woman'" "$APP/src/game/constants.ts" || { echo "MASCOT_KIND was not switched: set it to 'woman' by hand in src/game/constants.ts"; exit 1; }
echo "The woman mascot is back (MASCOT_KIND = 'woman')."
