#!/bin/sh
# Puts back the intro as it was before Evtim's into_2 set (2026-11-19): his plates
# (logo plank, panels, WIN UP TO plank, prompt plate) over the dimmed game, HD atlas.
# The new background files and their two asset keys may stay: nothing else uses them.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HERE/../../.."
cp "$HERE/LoadingScreen.svelte" "$APP/src/components/LoadingScreen.svelte"
cp "$HERE/intro.json" "$HERE/intro.webp" "$APP/static/assets/bs/intro/"
echo "intro v2 restored"
