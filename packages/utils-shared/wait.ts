type Resolve = (value: void | PromiseLike<void>) => void;

export const waitForResolve = (callback: (resolve: Resolve) => void) =>
	new Promise<void>((resolve) => callback(resolve));

export const waitForTimeout = (time: number) =>
	new Promise<void>((resolve) => {
		const timeout = setTimeout(() => {
			clearTimeout(timeout);
			resolve();
		}, time);
	});

/**
 * Yields for `count` animation frames. Use this to spread expensive work
 * (mounting many components at once) over several frames instead of spiking a
 * single one. Falls back to a timeout where rAF is unavailable (SSR, tests).
 */
export const waitForFrames = (count: number = 1) =>
	new Promise<void>((resolve) => {
		if (typeof requestAnimationFrame !== 'function') return void setTimeout(resolve, count * 16);
		let remaining = Math.max(0, count);
		const step = () => {
			if (remaining <= 0) return resolve();
			remaining -= 1;
			requestAnimationFrame(step);
		};
		step();
	});
