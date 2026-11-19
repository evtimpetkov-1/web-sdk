#!/bin/sh
# back to the background life the reviewers saw (before the draught rework of 2026-11-17)
cd "$(dirname "$0")" && cp BackgroundLife.svelte Bats.svelte ../../../src/components/ && echo restored
