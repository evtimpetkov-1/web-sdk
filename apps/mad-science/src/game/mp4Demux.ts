/**
 * Minimal MP4 (ISO BMFF) demuxer for the mascot clips — enough for WebCodecs:
 * one AVC video track, `stts`/`stss`/`stsz`/`stsc`/`stco|co64` sample tables,
 * optional `ctts`. Samples come back as byte ranges into the file plus
 * timestamps in microseconds, ready for `EncodedVideoChunk`. The files are our
 * own ffmpeg encodes (faststart, single track), so no edit-list or fragmented
 * MP4 support is needed.
 */
export type Mp4Sample = {
	offset: number;
	size: number;
	/** presentation timestamp, µs */
	timestamp: number;
	/** µs */
	duration: number;
	key: boolean;
};

export type Mp4Track = {
	/** WebCodecs codec string, e.g. avc1.4d4029 */
	codec: string;
	/** avcC box payload (the VideoDecoderConfig description) */
	description: Uint8Array;
	codedWidth: number;
	codedHeight: number;
	/** total duration, µs */
	duration: number;
	samples: Mp4Sample[];
};

type Box = { type: string; start: number; end: number; payload: number };

const readBoxes = (view: DataView, start: number, end: number): Box[] => {
	const boxes: Box[] = [];
	let p = start;
	while (p + 8 <= end) {
		let size = view.getUint32(p);
		const type = String.fromCharCode(
			view.getUint8(p + 4),
			view.getUint8(p + 5),
			view.getUint8(p + 6),
			view.getUint8(p + 7),
		);
		let header = 8;
		if (size === 1) {
			size = Number(view.getBigUint64(p + 8));
			header = 16;
		} else if (size === 0) {
			size = end - p;
		}
		boxes.push({ type, start: p, end: p + size, payload: p + header });
		p += size;
	}
	return boxes;
};

const find = (boxes: Box[], type: string) => boxes.find((box) => box.type === type);

export const demuxMp4 = (buffer: ArrayBuffer): Mp4Track => {
	const view = new DataView(buffer);
	const root = readBoxes(view, 0, buffer.byteLength);
	const moov = find(root, 'moov');
	if (!moov) throw new Error('mp4: no moov');
	const traks = readBoxes(view, moov.payload, moov.end).filter((box) => box.type === 'trak');

	for (const trak of traks) {
		const mdia = find(readBoxes(view, trak.payload, trak.end), 'mdia');
		if (!mdia) continue;
		const mdiaBoxes = readBoxes(view, mdia.payload, mdia.end);
		const hdlr = find(mdiaBoxes, 'hdlr');
		const mdhd = find(mdiaBoxes, 'mdhd');
		const minf = find(mdiaBoxes, 'minf');
		if (!hdlr || !mdhd || !minf) continue;
		const handler = String.fromCharCode(
			...new Uint8Array(buffer, hdlr.payload + 8, 4),
		);
		if (handler !== 'vide') continue;

		const mdhdVersion = view.getUint8(mdhd.payload);
		const timescale =
			mdhdVersion === 1 ? view.getUint32(mdhd.payload + 20) : view.getUint32(mdhd.payload + 12);

		const stbl = find(readBoxes(view, minf.payload, minf.end), 'stbl');
		if (!stbl) continue;
		const stblBoxes = readBoxes(view, stbl.payload, stbl.end);
		const stsd = find(stblBoxes, 'stsd');
		const stts = find(stblBoxes, 'stts');
		const stsz = find(stblBoxes, 'stsz');
		const stsc = find(stblBoxes, 'stsc');
		const stco = find(stblBoxes, 'stco') ?? find(stblBoxes, 'co64');
		const stss = find(stblBoxes, 'stss');
		const ctts = find(stblBoxes, 'ctts');
		if (!stsd || !stts || !stsz || !stsc || !stco) throw new Error('mp4: sample tables missing');

		// stsd -> avc1 -> avcC
		const entry = readBoxes(view, stsd.payload + 8, stsd.end)[0];
		if (!entry || (entry.type !== 'avc1' && entry.type !== 'avc3')) {
			throw new Error(`mp4: unsupported sample entry ${entry?.type}`);
		}
		const codedWidth = view.getUint16(entry.payload + 24);
		const codedHeight = view.getUint16(entry.payload + 26);
		const avcC = find(readBoxes(view, entry.payload + 78, entry.end), 'avcC');
		if (!avcC) throw new Error('mp4: no avcC');
		const description = new Uint8Array(buffer, avcC.payload, avcC.end - avcC.payload);
		const hex = (n: number) => n.toString(16).padStart(2, '0');
		const codec = `avc1.${hex(description[1])}${hex(description[2])}${hex(description[3])}`;

		// sample sizes
		const sampleSize = view.getUint32(stsz.payload + 4);
		const sampleCount = view.getUint32(stsz.payload + 8);
		const sizes = new Array<number>(sampleCount);
		for (let i = 0; i < sampleCount; i++) {
			sizes[i] = sampleSize || view.getUint32(stsz.payload + 12 + i * 4);
		}

		// chunk offsets + sample-to-chunk -> per-sample offsets
		const chunkCount = view.getUint32(stco.payload + 4);
		const chunkOffsets = new Array<number>(chunkCount);
		for (let i = 0; i < chunkCount; i++) {
			chunkOffsets[i] =
				stco.type === 'co64'
					? Number(view.getBigUint64(stco.payload + 8 + i * 8))
					: view.getUint32(stco.payload + 8 + i * 4);
		}
		const stscCount = view.getUint32(stsc.payload + 4);
		const stscEntries: { firstChunk: number; samplesPerChunk: number }[] = [];
		for (let i = 0; i < stscCount; i++) {
			stscEntries.push({
				firstChunk: view.getUint32(stsc.payload + 8 + i * 12),
				samplesPerChunk: view.getUint32(stsc.payload + 12 + i * 12),
			});
		}
		const offsets = new Array<number>(sampleCount);
		let sample = 0;
		for (let c = 0; c < chunkCount && sample < sampleCount; c++) {
			let perChunk = stscEntries[0].samplesPerChunk;
			for (const e of stscEntries) if (e.firstChunk - 1 <= c) perChunk = e.samplesPerChunk;
			let offset = chunkOffsets[c];
			for (let s = 0; s < perChunk && sample < sampleCount; s++) {
				offsets[sample] = offset;
				offset += sizes[sample];
				sample++;
			}
		}

		// decode timestamps (stts) + composition offsets (ctts)
		const sttsCount = view.getUint32(stts.payload + 4);
		const dts = new Array<number>(sampleCount);
		const durations = new Array<number>(sampleCount);
		let t = 0;
		let s = 0;
		for (let i = 0; i < sttsCount; i++) {
			const count = view.getUint32(stts.payload + 8 + i * 8);
			const delta = view.getUint32(stts.payload + 12 + i * 8);
			for (let k = 0; k < count && s < sampleCount; k++) {
				dts[s] = t;
				durations[s] = delta;
				t += delta;
				s++;
			}
		}
		const cts = dts.slice();
		if (ctts) {
			const cttsCount = view.getUint32(ctts.payload + 4);
			let idx = 0;
			for (let i = 0; i < cttsCount; i++) {
				const count = view.getUint32(ctts.payload + 8 + i * 8);
				const off = view.getInt32(ctts.payload + 12 + i * 8);
				for (let k = 0; k < count && idx < sampleCount; k++) {
					cts[idx] = dts[idx] + off;
					idx++;
				}
			}
		}

		// keyframes
		const keys = new Set<number>();
		if (stss) {
			const n = view.getUint32(stss.payload + 4);
			for (let i = 0; i < n; i++) keys.add(view.getUint32(stss.payload + 8 + i * 4) - 1);
		} else {
			for (let i = 0; i < sampleCount; i++) keys.add(i);
		}

		const toUs = (v: number) => Math.round((v * 1e6) / timescale);
		const samples: Mp4Sample[] = [];
		for (let i = 0; i < sampleCount; i++) {
			samples.push({
				offset: offsets[i],
				size: sizes[i],
				timestamp: toUs(cts[i]),
				duration: toUs(durations[i]),
				key: keys.has(i),
			});
		}
		return { codec, description, codedWidth, codedHeight, duration: toUs(t), samples };
	}
	throw new Error('mp4: no video track');
};
