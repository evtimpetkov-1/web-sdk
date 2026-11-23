#!/bin/sh
# Puts back Blast Drop's desktop / landscape layout as it was before 2026-11-20 (the
# multiplier plate centred over the reel frame with FREE SPINS left of it and WIN /
# TOTAL WIN right of it, the board at scale 1, its sill partly behind the bar), and the
# plate shown only while it holds a value.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../../../src"
cp -p "$HERE/stateGame.svelte.ts" "$SRC/game/"
for f in GameLogo FreeSpinCounter FreeSpinTotalWin TumbleWinAmount GoldFx FreeSpinRetrigger GlobalMultiplier; do
	cp -p "$HERE/$f.svelte" "$SRC/components/"
done
echo "layout with the plate on top restored"
