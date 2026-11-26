/**
 * Svelte action: shrinks an element's font size until its one line fits its
 * box. A price in a long currency (Rp1000000000) has no break opportunity and
 * ran over the shop card's BUY button (Evtim, 2026-10-28). The CSS font size is
 * the largest it gets; the element needs a bounded width (a grid cell, or
 * max-width) and `white-space: nowrap`. Pass the text as the parameter so a new
 * price re-fits; a change in the room around it re-fits on its own.
 */
const MIN_SCALE = 0.5;

export const fitText = (node: HTMLElement, _text?: string) => {
	const room = node.parentElement ?? node;
	let width = -1;
	const fit = () => {
		node.style.fontSize = '';
		const max = parseFloat(getComputedStyle(node).fontSize);
		let size = max;
		while (node.scrollWidth > node.clientWidth + 0.5 && size > max * MIN_SCALE) {
			size = Math.max(max * MIN_SCALE, size * 0.95);
			node.style.fontSize = `${size}px`;
		}
		width = room.clientWidth;
	};
	// only the room's width matters: the fit itself resizes the node (and can
	// resize an auto-sized parent), and refitting on that would loop
	const observer = new ResizeObserver(() => {
		if (room.clientWidth !== width) fit();
	});
	observer.observe(room);
	document.fonts?.ready.then(fit);
	fit();
	return { update: fit, destroy: () => observer.disconnect() };
};
