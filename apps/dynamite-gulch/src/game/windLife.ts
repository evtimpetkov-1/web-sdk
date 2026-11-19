// WRITTEN by art-review/dynamite-gulch/rework/build_ink_wind.py --install: do not edit by hand.
// The reel frame's hook and lantern (wind.json: hook.png, lantern.png), each measured on its own
// sprite as a share of its width / height. `aspect` = width over height.
// hook: `foot` = the base plate's middle along the bottom edge (it stands there), `rest` = the
// point of the curl the lantern's bail hangs in. The art curls to the RIGHT.
// lantern: `bail` = the top of its wire handle (the pivot it swings about), `glass` = the globe's middle.
export const HOOK_ART = { aspect: 0.3889, foot: 0.2213, rest: { x: 0.8618, y: 0.1896 } } as const;
export const LANTERN_ART = { aspect: 0.4358, bail: { x: 0.4993, y: 0.0061 }, glass: { x: 0.4993, y: 0.6296 } } as const;
// The saloon's batwing doors in the day and the night painting (that art's pixels): `patch` = the
// doorway drawn over the painted doors, then the two leaves at their own place; the left one is
// hinged on its left edge, the right one on its right edge (Ambient swings them).
export const DOORS = {
	day: { patch: { key: 'doorway_day.png', x: 60, y: 617, width: 76, height: 142 }, left: { key: 'door_l_day.png', x: 61, y: 627, width: 42, height: 125 }, right: { key: 'door_r_day.png', x: 103, y: 630, width: 31, height: 122 } },
	night: { patch: { key: 'doorway_night.png', x: 60, y: 617, width: 76, height: 142 }, left: { key: 'door_l_night.png', x: 61, y: 622, width: 42, height: 134 }, right: { key: 'door_r_night.png', x: 103, y: 623, width: 32, height: 133 } },
} as const;
