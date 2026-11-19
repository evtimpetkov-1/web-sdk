/**
 * The mine's draught: ONE value for everything the air moves (Dynamite Gulch's
 * game/wind.ts, underground), so the dust streaming out of the tunnel, the haze,
 * the lantern flames and the light they throw all answer the same gust
 * (BackgroundLife). 0 = still air, 1 = a gust: three slow waves that never line
 * up the same way twice, sharpened so gusts stand out. Read off the wall clock.
 */
export const draughtAt = (t: number) =>
	Math.min(1, Math.max(0, 0.5 + 0.34 * Math.sin(0.23 * t) + 0.3 * Math.sin(0.11 * t + 1.7) + 0.2 * Math.sin(0.57 * t + 4.1))) **
	1.6;

// `?ambient=fast` (the preview switch the bats already use): the air runs four times
// as fast, so a lull, a gust and what each brings pass in a few seconds
const PACE =
	typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ambient') === 'fast' ? 4 : 1;

export const draughtNow = () => draughtAt((performance.now() / 1000) * PACE);

/** no ambient motion under the OS setting */
export const reducedMotion = () =>
	typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
