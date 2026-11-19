// WRITTEN by art-review/dynamite-gulch/rework/build_ink_life.py --install: do not edit by hand.
// The windmill in each background (that art's pixels): `patch` = the square of the painting with
// its painted fan filled in, drawn over the painting at its own place; then the fan itself
// (`rotor.png`, a square `size` wide centred on x / y, tinted to that scene's blades) turns on it.
export const MILLS = {
	day: { patch: { key: 'mill_day.png', x: 406, y: 358, size: 135 }, x: 473, y: 425, size: 113.1, tint: 0xc9bab5 },
	night: { patch: { key: 'mill_night.png', x: 404, y: 358, size: 137 }, x: 472.5, y: 426, size: 115.1, tint: 0x7d8cbf },
	portrait: { patch: { key: 'mill_portrait.png', x: 270, y: 752, size: 97 }, x: 318, y: 800, size: 75.4, tint: 0xd2ad94 },
} as const;
// the dust devil's flipbook (devil_0.png ...): frames and the frame canvas's width over its height
export const DEVIL_FRAMES = 6;
export const DEVIL_ASPECT = 241 / 320;
// where its foot stands on that canvas, of the width (the pivot it sways about)
export const DEVIL_FOOT = 0.519;
