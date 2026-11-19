/**
 * The gulch's wind: ONE value for everything it moves, so the windmill, the clouds,
 * what blows across the street and the lanterns on the reel frame all answer the
 * same gust (Ambient, SceneWind, FrameLife). 0 = a lull, 1 = a gust: three slow
 * waves that never line up the same way twice, sharpened so gusts stand out of a
 * mostly light breeze. Read off the wall clock: every component sees the same wind
 * whenever it was mounted.
 */
export const windAt = (t: number) =>
	Math.min(1, Math.max(0, 0.5 + 0.34 * Math.sin(0.23 * t) + 0.3 * Math.sin(0.11 * t + 1.7) + 0.2 * Math.sin(0.57 * t + 4.1))) **
	1.6;

// `?ambient=fast` (the preview switch the crossings already use): the weather runs four
// times as fast, so a lull, a gust and what each brings pass in a few seconds
const PACE =
	typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ambient') === 'fast' ? 4 : 1;

export const windNow = () => windAt((performance.now() / 1000) * PACE);

/** no motion at all under the OS setting (every ambient layer checks it) */
export const reducedMotion = () =>
	typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Pixi 8's Particle keeps a NUMBER tint as it is and reads it as BGR: a plain 0xRRGGBB
// comes out with red and blue swapped (Blast Shaft's warm dust drew ice-blue)
export const bgr = (rgb: number) => ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff);
