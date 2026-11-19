#!/bin/sh
# Puts back the intro screen's first atlas (Evtim's plates at their own size, 2026-11-16),
# as it was before the high-resolution redraw of 2026-11-18. Same frame names; the
# screen sizes every piece itself, so nothing else changes.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cp -p "$HERE"/intro.json "$HERE"/intro.webp "$HERE/../../../static/assets/bs/intro/"
echo "intro atlas v1 restored"
