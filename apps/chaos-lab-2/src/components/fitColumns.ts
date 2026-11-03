/**
 * Svelte action for a grid of cards: the most columns, up to the CSS
 * `--cols-max`, at which no card's content overflows it, set as `--cols` and
 * `data-cols`. The paytable's 3 x 3 spilled its values across the cards in a
 * long currency (Rp150000000, Evtim 2026-10-28). Pass whatever changes the
 * content (the formatted values) as the parameter; a width change re-fits on
 * its own.
 */
export const fitColumns = (node: HTMLElement, _content?: unknown) => {
	const fit = () => {
		node.style.removeProperty('--cols');
		const max = parseInt(getComputedStyle(node).getPropertyValue('--cols-max')) || 1;
		for (let cols = max; cols >= 1; cols--) {
			node.style.setProperty('--cols', String(cols));
			node.dataset.cols = String(cols);
			const overflows = [...node.children].some(
				(card) => card.scrollWidth > card.clientWidth + 0.5,
			);
			if (!overflows) return;
		}
	};
	// a new column count changes the grid's height, not its width: refitting on
	// height changes too would loop
	let width = -1;
	const observer = new ResizeObserver(() => {
		if (node.clientWidth === width) return;
		width = node.clientWidth;
		fit();
	});
	observer.observe(node);
	document.fonts?.ready.then(fit);
	fit();
	return { update: fit, destroy: () => observer.disconnect() };
};
