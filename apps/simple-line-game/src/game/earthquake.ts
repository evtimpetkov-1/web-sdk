import type * as PIXI from 'pixi.js';

type EarthquakeDuration = 'short' | 'long';

const SHAKE_OFFSETS = [
	{ x: -4, y: 3 },
	{ x: 5, y: -4 },
	{ x: -3, y: 5 },
	{ x: 4, y: -2 },
	{ x: -5, y: 4 },
	{ x: 3, y: -5 },
	{ x: -4, y: 2 },
	{ x: 5, y: -3 },
	{ x: -2, y: 5 },
	{ x: 4, y: -4 },
	{ x: -5, y: 3 },
	{ x: 3, y: -2 },
];

/**
 * Shakes the PixiJS stage with an earthquake effect.
 * Offsets stage.position rapidly; no scale (avoids pivot issues).
 */
export function playEarthquake(
	app: PIXI.Application,
	duration: EarthquakeDuration = 'short',
): Promise<void> {
	const stage = app.stage;
	if (!stage) return Promise.resolve();

	const totalDuration = duration === 'short' ? 1200 : 2000;
	const stepDuration = duration === 'short' ? 40 : 50;
	const intensity = duration === 'short' ? 1.0 : 1.5;

	return new Promise((resolve) => {
		const startTime = performance.now();
		const origX = stage.position.x;
		const origY = stage.position.y;

		function tick() {
			const elapsed = performance.now() - startTime;

			if (elapsed >= totalDuration) {
				stage.position.x = origX;
				stage.position.y = origY;
				resolve();
				return;
			}

			const progress = elapsed / totalDuration;
			// Dampen: full intensity → 0 over the duration
			const dampen = 1 - progress;
			// Which shake step we're on
			const stepIndex = Math.floor(elapsed / stepDuration) % SHAKE_OFFSETS.length;
			// Yoyo within each step
			const stepProgress = (elapsed % stepDuration) / stepDuration;
			const yoyo = stepProgress < 0.5 ? stepProgress * 2 : (1 - stepProgress) * 2;

			const offset = SHAKE_OFFSETS[stepIndex];
			stage.position.x = origX + offset.x * intensity * yoyo * dampen;
			stage.position.y = origY + offset.y * intensity * yoyo * dampen;

			requestAnimationFrame(tick);
		}

		requestAnimationFrame(tick);
	});
}
