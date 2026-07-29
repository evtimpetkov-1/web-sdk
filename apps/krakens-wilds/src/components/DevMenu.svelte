<script lang="ts">
	import { devCheatMode, setDevCheatMode, type DevCheatMode } from '../game/devMath';
	import assets from '../game/assets';

	let active = $state(devCheatMode);
	let showReport = $state(false);
	let reportRows = $state<{ name: string; type: string; file: string; sizeKB: number }[]>([]);
	let totalSizeKB = $derived(reportRows.reduce((sum, r) => sum + r.sizeKB, 0));
	let loading = $state(false);

	function select(mode: DevCheatMode) {
		active = mode;
		setDevCheatMode(mode);
	}

	function extractUrls(name: string, asset: any): { name: string; type: string; url: string }[] {
		const type = asset.type as string;
		if (type === 'spine') {
			const urls: { name: string; type: string; url: string }[] = [];
			urls.push({ name: `${name} (skeleton)`, type, url: asset.src.skeleton });
			urls.push({ name: `${name} (atlas)`, type, url: asset.src.atlas });
			return urls;
		}
		return [{ name, type, url: typeof asset.src === 'string' ? asset.src : asset.src }];
	}

	async function fetchSize(url: string): Promise<number> {
		try {
			const res = await fetch(url, { method: 'HEAD' });
			const len = res.headers.get('content-length');
			if (len) return parseInt(len, 10);
			// Fallback: GET and measure
			const res2 = await fetch(url);
			const buf = await res2.arrayBuffer();
			return buf.byteLength;
		} catch {
			return 0;
		}
	}

	function getFileName(url: string): string {
		try {
			const u = new URL(url, window.location.href);
			const path = u.pathname;
			// Strip Vite hash: e.g. logo-Bx1k2f3.png -> logo.png
			const file = path.split('/').pop() || path;
			return file.replace(/-[a-zA-Z0-9_]{6,12}\./, '.');
		} catch {
			return url;
		}
	}

	async function generateReport() {
		if (loading) return;
		loading = true;
		showReport = true;
		reportRows = [];

		const entries: { name: string; type: string; url: string }[] = [];
		for (const [name, asset] of Object.entries(assets)) {
			entries.push(...extractUrls(name, asset));
		}

		// Also find spine atlas page images (PNG/WebP referenced in .atlas files)
		const atlasEntries = entries.filter((e) => e.url.endsWith('.atlas'));
		const atlasImageUrls: { name: string; type: string; url: string }[] = [];
		for (const entry of atlasEntries) {
			try {
				const res = await fetch(entry.url);
				const text = await res.text();
				// Atlas files reference image pages on the first non-empty line(s) before "size:"
				const lines = text.split('\n');
				for (const line of lines) {
					const trimmed = line.trim();
					if (trimmed && (trimmed.endsWith('.png') || trimmed.endsWith('.webp') || trimmed.endsWith('.jpg'))) {
						const baseUrl = entry.url.substring(0, entry.url.lastIndexOf('/') + 1);
						atlasImageUrls.push({
							name: `${entry.name.replace(' (atlas)', '')} (${trimmed})`,
							type: 'spine-img',
							url: baseUrl + trimmed,
						});
					}
				}
			} catch { /* skip */ }
		}
		entries.push(...atlasImageUrls);

		// Also find spritesheet images referenced by JSON manifests
		const spriteEntries = Object.entries(assets).filter(([, a]) => (a as any).type === 'sprites' || (a as any).type === 'spriteSheet');
		for (const [name, asset] of spriteEntries) {
			try {
				const res = await fetch((asset as any).src);
				const json = await res.json();
				const meta = json.meta;
				if (meta?.image) {
					const baseUrl = (asset as any).src.substring(0, (asset as any).src.lastIndexOf('/') + 1);
					entries.push({
						name: `${name} (${meta.image})`,
						type: 'sheet-img',
						url: baseUrl + meta.image,
					});
				}
			} catch { /* skip */ }
		}

		// Dedupe by URL
		const seen = new Set<string>();
		const unique = entries.filter((e) => {
			if (seen.has(e.url)) return false;
			seen.add(e.url);
			return true;
		});

		// Fetch sizes in parallel
		const results = await Promise.all(
			unique.map(async (entry) => {
				const bytes = await fetchSize(entry.url);
				return {
					name: entry.name,
					type: entry.type,
					file: getFileName(entry.url),
					sizeKB: Math.round(bytes / 1024 * 10) / 10,
				};
			}),
		);

		reportRows = results.sort((a, b) => b.sizeKB - a.sizeKB);
		loading = false;
	}
</script>

<div class="dev-menu">
	<span class="label">DEV</span>
	<button class:active={active === 'none'} onclick={() => select('none')}>Normal</button>
	<button class:active={active === 'fs'} onclick={() => select('fs')}>Free Spins</button>
	<button class:active={active === 'retrigger'} onclick={() => select('retrigger')}>Retrigger</button>
	<button class:active={active === 'bigwin'} onclick={() => select('bigwin')}>Big Win</button>
	<button class="size-btn" onclick={generateReport}>Size Report</button>
</div>

{#if showReport}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="overlay" onclick={() => (showReport = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="report" onclick={(e) => e.stopPropagation()}>
			<div class="report-header">
				<span>Asset Size Report</span>
				<button class="close-btn" onclick={() => (showReport = false)}>✕</button>
			</div>
			{#if loading}
				<div class="loading">Loading...</div>
			{:else}
				<div class="total">
					Total: <strong>{totalSizeKB > 1024 ? (totalSizeKB / 1024).toFixed(1) + ' MB' : totalSizeKB.toFixed(0) + ' KB'}</strong>
					({reportRows.length} files)
				</div>
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Asset</th>
								<th>Type</th>
								<th>File</th>
								<th>Size</th>
							</tr>
						</thead>
						<tbody>
							{#each reportRows as row}
								<tr class:large={row.sizeKB > 500}>
									<td>{row.name}</td>
									<td>{row.type}</td>
									<td class="file">{row.file}</td>
									<td class="size">{row.sizeKB > 1024 ? (row.sizeKB / 1024).toFixed(1) + ' MB' : row.sizeKB.toFixed(0) + ' KB'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.dev-menu {
		position: fixed;
		top: 8px;
		left: 8px;
		z-index: 99999;
		display: flex;
		gap: 4px;
		align-items: center;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 6px;
		padding: 4px 8px;
		font-family: monospace;
		font-size: 11px;
	}
	.label {
		color: #0f0;
		font-weight: bold;
		margin-right: 4px;
	}
	button {
		background: rgba(255, 255, 255, 0.1);
		color: #ccc;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		padding: 2px 8px;
		cursor: pointer;
		font-family: monospace;
		font-size: 11px;
	}
	button:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	button.active {
		background: rgba(0, 200, 0, 0.3);
		color: #0f0;
		border-color: #0f0;
	}
	.size-btn {
		color: #ffb74d;
		border-color: #ffb74d;
	}
	.size-btn:hover {
		background: rgba(255, 183, 77, 0.2);
	}
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100000;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.report {
		background: #1a1a2e;
		border: 1px solid #333;
		border-radius: 8px;
		max-width: 700px;
		width: 90vw;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		color: #ddd;
		font-family: monospace;
		font-size: 12px;
	}
	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 14px;
		border-bottom: 1px solid #333;
		font-size: 14px;
		font-weight: bold;
		color: #ffb74d;
	}
	.close-btn {
		background: none;
		border: none;
		color: #888;
		font-size: 16px;
		cursor: pointer;
		padding: 0 4px;
	}
	.close-btn:hover {
		color: #fff;
	}
	.total {
		padding: 8px 14px;
		color: #aaa;
		border-bottom: 1px solid #222;
	}
	.total strong {
		color: #fff;
	}
	.loading {
		padding: 20px;
		text-align: center;
		color: #888;
	}
	.table-wrap {
		overflow-y: auto;
		flex: 1;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th {
		position: sticky;
		top: 0;
		background: #1a1a2e;
		text-align: left;
		padding: 6px 10px;
		color: #888;
		border-bottom: 1px solid #333;
		font-weight: normal;
	}
	td {
		padding: 4px 10px;
		border-bottom: 1px solid #1e1e30;
	}
	.file {
		color: #888;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.size {
		text-align: right;
		white-space: nowrap;
	}
	tr.large td {
		color: #ff8a80;
	}
</style>
