// Written by art-review/dynamite-gulch/rework/build_house_lanterns.py. The lanterns on the houses
// (desktop and landscape): per painting, the left (saloon) and right (shed) one. `patch` = the
// painting with its small painted lantern painted out (wind.json), drawn at its own place;
// x / y = the end of the painted rod, where the animated lantern's bail hangs; `height` = the
// lantern's height. All in that painting's px (1920x1288).
export type HouseLantern = { patch: { key: string; x: number; y: number; width: number; height: number }; x: number; y: number; height: number };
export const HOUSE_LANTERNS = {
	day: [{ patch: { key: 'lamp_l_day.png', x: 299, y: 580, width: 36, height: 71 }, x: 311.5, y: 589, height: 84 }, { patch: { key: 'lamp_r_day.png', x: 1640, y: 621, width: 42, height: 76 }, x: 1664, y: 629, height: 84 }],
	night: [{ patch: { key: 'lamp_l_night.png', x: 297, y: 578, width: 39, height: 80 }, x: 311.5, y: 589, height: 84 }, { patch: { key: 'lamp_r_night.png', x: 1640, y: 621, width: 42, height: 90 }, x: 1664, y: 629, height: 84 }],
} satisfies Record<string, HouseLantern[]>;
