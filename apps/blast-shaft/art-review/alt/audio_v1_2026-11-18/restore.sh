#!/bin/sh
# Puts back the sound set Blast Drop was reviewed with (2026-11-17: "Bad sound design"),
# as it was before the heavy rework of 2026-11-18. The cue names did not change, so
# nothing else needs touching.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cp -p "$HERE"/sounds.* "$HERE/../../../static/assets/audio/"
echo "sound sprite v1 restored"
