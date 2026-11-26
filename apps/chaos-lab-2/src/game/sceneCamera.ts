/**
 * The scene camera's rooms (SceneCamera.svelte): what the shader needs to know
 * about each background painting to move it in depth. All in the painting's px.
 *
 * Each painting is treated as a box seen from inside: a back wall (a rectangle
 * round the vanishing point) with the floor, ceiling and side walls running from
 * its edges towards the viewer. A point's nearness is how far it lies outside that
 * rectangle: 1 on the back wall, growing towards the picture's edges.
 * - vanish: where the floor's lines meet
 * - wall: the back wall's edges [left x, top y, right x, bottom y]; its bottom is
 *   the line where the floor starts
 * - focus: the nearness that stays put when the camera moves (things further back
 *   go one way, nearer things the other). It is where the mascot's feet stand, so
 *   the floor does not slide under her.
 * - deepest: nearness is capped here (the floor at the viewer's feet would fly)
 * - fog: colour, density, how far towards the viewer it reaches (in units of the
 *   floor's depth on the picture), and the lens (how many of those depths away the
 *   viewer stands: it only shapes the fog's clouds, long and thin if it is too short)
 * - sway: up to four hanging things [x0, y0, x1, y1, px at the bottom, waves
 *   across (0 = it swings as one piece), speed, phase]: pinned along the top edge
 * Measured off gridded copies of the paintings (2026-11-26); a new painting needs
 * its own block.
 */
export type SceneRoom = {
	width: number;
	height: number;
	vanish: [number, number];
	wall: [number, number, number, number];
	focus: number;
	deepest: number;
	fog: { colour: [number, number, number]; density: number; reach: number; lens: number };
	sway: number[][];
};

export const SCENE_ROOMS: Record<'base' | 'portrait' | 'fs', SceneRoom> = {
	base: {
		width: 1536,
		height: 1024,
		vanish: [768, 450],
		wall: [270, 55, 1190, 612],
		focus: 2.0,
		deepest: 3.6,
		fog: { colour: [0.4, 0.82, 0.34], density: 0.4, reach: 1.1, lens: 5.5 },
		// the lamp over the door
		sway: [[736, 198, 830, 292, 5, 0, 1.25, 0]],
	},
	portrait: {
		width: 1024,
		height: 1536,
		vanish: [512, 610],
		wall: [165, 120, 840, 790],
		focus: 1.8,
		deepest: 4.2,
		fog: { colour: [0.4, 0.82, 0.34], density: 0.4, reach: 3.2, lens: 5.5 },
		sway: [[468, 282, 572, 386, 6, 0, 1.25, 0]],
	},
	// the operating theatre (Cash Respins): no walls to speak of, a floor and what hangs
	fs: {
		width: 1536,
		height: 1024,
		vanish: [768, 520],
		wall: [128, -200, 1408, 700],
		focus: 1.45,
		deepest: 1.9,
		fog: { colour: [1, 0.8, 0.58], density: 0.28, reach: 1.3, lens: 5 },
		sway: [
			// the two sheets: cloth, a wave running across them
			[520, 24, 962, 628, 7, 6, 0.9, 0],
			[1070, 100, 1498, 642, 6, 5, 0.75, 2.1],
			// chains with their rings: they swing as one piece
			[1146, 0, 1204, 428, 7, 0, 1.05, 1.0],
			[4, 0, 52, 214, 5, 0, 1.3, 3.0],
		],
	},
};

/** The camera's moves, in the painting's px at one unit of nearness from the focus. */
export const SCENE_CAMERA = {
	// one switch for the whole layer (`?camera=off` in the address does the same for one load)
	on: true,
	// the painting is drawn this much larger, so its edges never come into view
	overscan: 1.035,
	// it never rests: two slow swings laid over each other [px, seconds per swing]
	drift: { x: [6.5, 17, 2.2, 7.3], y: [1.6, 13, 0.7, 5.9], dolly: [0.006, 23] },
	// a mouse moves it (desktop): px at the screen's edge, and how fast it follows
	pointer: { x: 7, y: 2.6, follow: 2.4 },
	// a board shake throws it (SceneShake presets): px and dolly at trauma 1, the
	// spring's swings per second and how fast it settles
	kick: { px: 11, dolly: 0.012, hz: 1.7, damping: 3.2 },
	// Scatters pending: it leans in
	tension: { dolly: 0.012, tremble: 0.7 },
	limit: { x: 19, y: 6, dolly: 0.03 },
};
