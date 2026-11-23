// WRITTEN by art-review/chaoslab2/symbols_v4/install.py (out/tiles.json): do not edit by hand.
// The pictures of the symbols built from the layered PSD: `frame` = the static picture and the
// rig's skeleton box, `ink` = the tile's visible edge inside it (texture px). constants.ts draws
// the frame so that `ink` lands on a royal plate's own edge.
export const TILE_ART = {
	h1: { frame: { width: 493, height: 522 }, ink: { width: 486.75, height: 516.0 } },
	h2: { frame: { width: 492, height: 521 }, ink: { width: 486.0, height: 514.5 } },
	h3: { frame: { width: 491, height: 525 }, ink: { width: 485.25, height: 518.25 } },
	h4: { frame: { width: 492, height: 527 }, ink: { width: 486.0, height: 520.5 } },
	wild: { frame: { width: 490, height: 526 }, ink: { width: 484.5, height: 519.75 } },
	bonus: { frame: { width: 486, height: 523 }, ink: { width: 479.25, height: 517.5 } },
} as const;
