#!/bin/sh
# Blast Drop as it was reviewed the third time (before the 2026-11-24 animation rework):
# the first big-win and free-spins popup rigs, the plain curtain at its old size, the
# generic debris overlay on winning symbols.
#   sh restore.sh          everything
#   sh restore.sh shatter  only the symbol break-up (back to the debris overlay)
#   sh restore.sh popups   only the big win + free-spins popup rigs and their code
#   sh restore.sh curtain  only the curtain (art, motion, no dust / light / gold)
# The new builders stay in the workspace's art-review/blast-shaft (build_shatter.py,
# build_popups2.py, build_plates_hd.py); running them installs the new version again.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
what="${1:-all}"
if [ "$what" = all ] || [ "$what" = shatter ]; then
	cp "$HERE/src/components/TumbleSymbol.svelte" "$APP/src/components/TumbleSymbol.svelte"
	echo "shatter: TumbleSymbol.svelte restored (SymbolShatter.svelte, spines/bsShatter and its assets.ts entry are left in place, unused)"
fi
if [ "$what" = all ] || [ "$what" = popups ]; then
	rm -rf "$APP/static/assets/spines/msBigwin" "$APP/static/assets/spines/msFsPopup"
	cp -R "$HERE/spines/msBigwin" "$HERE/spines/msFsPopup" "$APP/static/assets/spines/"
	cp "$HERE/src/components/FreeSpinOutro.svelte" "$APP/src/components/FreeSpinOutro.svelte"
	echo "popups: rigs + FreeSpinOutro.svelte restored (assets.ts keeps mipmap: true on both, harmless)"
fi
if [ "$what" = all ] || [ "$what" = curtain ]; then
	cp "$HERE/curtain/"*.webp "$APP/static/assets/bs/curtain/"
	cp "$HERE/src/components/Transition.svelte" "$APP/src/components/Transition.svelte"
	cp "$HERE/src/game/bookEventHandlerMap.ts" "$APP/src/game/bookEventHandlerMap.ts"
	echo "curtain: art, Transition.svelte and bookEventHandlerMap.ts restored (CurtainFx.svelte is left in place, unused)"
fi
