/**
 * Local math file loader for dev mode.
 *
 * Prepare math files: ./tools/prepare-math.sh path/to/library/
 * This decompresses books.jsonl.zst → books.jsonl and copies lookup.csv
 * into static/assets/math/
 *
 * payoutMultiplier is integer cents (250 = 2.50x).
 */

import type { BookEvent } from './typesBookEvent';
import { stateGame } from './stateGame.svelte';

type MathBook = {
	id: number;
	payoutMultiplier: number;
	events: BookEvent[];
};

export type DevCheatMode = 'none' | 'fs' | 'retrigger' | 'bigwin';
export let devCheatMode: DevCheatMode = 'none';

export function setDevCheatMode(mode: DevCheatMode) {
	devCheatMode = mode;
	filteredCache = null;
	console.log(`[dev] Cheat mode: ${mode}`);
}

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

let filteredCache: { mode: DevCheatMode; books: MathBook[] } | null = null;

function getFilteredBooks(): MathBook[] {
	// Retrigger mode filter depends on gameType, so don't cache it
	if (filteredCache && filteredCache.mode === devCheatMode && devCheatMode !== 'retrigger')
		return filteredCache.books;
	if (!books) throw new Error('Math files not loaded');

	let arr = Array.from(books.values());

	if (devCheatMode === 'fs') {
		arr = arr.filter((b) => b.events.some((e) => e.type === 'freeSpinTrigger'));
	} else if (devCheatMode === 'retrigger') {
		if (stateGame.gameType === 'freegame') {
			// Already in free spins — pick books with retrigger events
			arr = arr.filter((b) => b.events.some((e) => e.type === 'freeSpinRetrigger'));
		} else {
			// Base game — first trigger free spins
			arr = arr.filter((b) => b.events.some((e) => e.type === 'freeSpinTrigger'));
		}
	} else if (devCheatMode === 'bigwin') {
		arr = arr.filter((b) => b.payoutMultiplier >= 1000);
	}

	filteredCache = { mode: devCheatMode, books: arr };
	return arr;
}

/** Weighted random selection — same algorithm as the RGS. Uses cheat filter when active. */
export function selectRandomBook(): { payoutMultiplier: number; events: BookEvent[] } {
	if (!books || !cumWeights) throw new Error('Math files not loaded');

	if (devCheatMode !== 'none') {
		const pool = getFilteredBooks();
		const book = pool[Math.floor(Math.random() * pool.length)];
		return {
			payoutMultiplier: book.payoutMultiplier / 100,
			events: book.events,
		};
	}

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

	return {
		payoutMultiplier: book.payoutMultiplier / 100,
		events: book.events,
	};
}
