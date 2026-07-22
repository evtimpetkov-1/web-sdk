/**
 * Local math file loader for dev mode.
 *
 * Prepare math files: ./tools/prepare-math.sh path/to/library/
 * This decompresses books.jsonl.zst → books.jsonl and copies lookup.csv
 * into static/assets/math/
 *
 * Enable with ?math=local in the URL. Falls back to devBooks.ts otherwise.
 *
 * payoutMultiplier is integer cents (250 = 2.50x).
 */

import type { BookEvent } from './typesBookEvent';

type MathBook = {
	id: number;
	payoutMultiplier: number;
	events: BookEvent[];
};

let books: Map<number, MathBook> | null = null;
let cumWeights: { cumWeight: number; simId: number }[] | null = null;
let totalWeight = 0;

export async function loadMathFiles(): Promise<boolean> {
	try {
		const [booksRes, lutRes] = await Promise.all([
			fetch('/assets/math/books.jsonl'),
			fetch('/assets/math/lookup.csv'),
		]);

		if (!booksRes.ok || !lutRes.ok) {
			console.warn('[dev] Math files not found in static/assets/math/ — using devBooks');
			return false;
		}

		// Parse JSONL (one JSON object per line)
		const booksText = await booksRes.text();
		books = new Map();
		for (const line of booksText.trim().split('\n')) {
			if (!line) continue;
			const book: MathBook = JSON.parse(line);
			books.set(book.id, book);
		}

		// Parse lookup table (CSV: sim_id, weight, payoutMultiplier — no header)
		const lutText = await lutRes.text();
		cumWeights = [];
		totalWeight = 0;
		for (const line of lutText.trim().split('\n')) {
			const [simId, weight] = line.split(',').map(Number);
			totalWeight += weight;
			cumWeights.push({ cumWeight: totalWeight, simId });
		}

		console.log(`[dev] Loaded ${books.size} math books, ${cumWeights.length} LUT entries`);
		return true;
	} catch (e) {
		console.warn('[dev] Failed to load math files:', e);
		return false;
	}
}

/** Weighted random selection — same algorithm as the RGS. */
export function selectRandomBook(): { payoutMultiplier: number; events: BookEvent[] } {
	if (!books || !cumWeights) throw new Error('Math files not loaded');

	const rand = Math.random() * totalWeight;
	let lo = 0;
	let hi = cumWeights.length - 1;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (cumWeights[mid].cumWeight <= rand) lo = mid + 1;
		else hi = mid;
	}

	const simId = cumWeights[lo].simId;
	const book = books.get(simId);
	if (!book) throw new Error(`Book id=${simId} not found in books`);

	// payoutMultiplier is integer cents (250 = 2.50x)
	return {
		payoutMultiplier: book.payoutMultiplier / 100,
		events: book.events,
	};
}
