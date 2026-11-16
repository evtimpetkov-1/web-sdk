import { demuxMp4, type Mp4Track } from './mp4Demux';

/**
 * WebCodecs clip player for the mascot (2026-09-03).
 *
 * Why: on Android Chrome, feeding an HTMLVideoElement to WebGL blocked the
 * main thread for ~1.1 s every few loops (Chrome's media pipeline rebuilding
 * its decoder while the texture upload waited on it). Decoding with
 * VideoDecoder uses the same hardware codec but there is no playback pipeline,
 * no seeking and no suspend logic: we feed compressed samples and receive
 * finished VideoFrames, which Pixi uploads like any image.
 *
 * Playlist model: clip 0 is the idle loop; other clips are one-shot reactions
 * (`playOnce`). Timestamps are kept continuous across loops and clip switches
 * (each clip starts on a keyframe), so a single decoder runs for the session.
 * Presentation is paced by `tick(now)` — call it once per animation frame;
 * it returns the frame that should be on screen (or null if unchanged). The
 * caller owns returned frames and must close each one when it is replaced.
 */
type Clip = { track: Mp4Track; bytes: Uint8Array };

// Hardware decoders (VideoToolbox on iPhone especially) hold several frames
// before emitting and then emit in bursts; a shallow queue starves them.
const MAX_DECODE_QUEUE = 6; // chunks waiting inside the decoder
const MAX_OUTPUT_QUEUE = 6; // decoded frames waiting for their time
/** frames we may be behind before dropping to catch up */
const DROP_BACKLOG = 2;
/**
 * Hard cap on decoded frames held. It MUST exceed MAX_DECODE_QUEUE +
 * MAX_OUTPUT_QUEUE: feeding stops at MAX_OUTPUT_QUEUE, but every chunk already
 * inside the decoder still comes out, so a burst can legitimately hold
 * decode + output frames. A cap below that closed the OLDEST frames — the
 * ones due next — and silently cost ~13 fps (the "17 fps, queue 10" symptom).
 */
const MAX_HELD_FRAMES = MAX_DECODE_QUEUE + MAX_OUTPUT_QUEUE + 2;

export class WebCodecsPlayer {
	private clips: Clip[] = [];
	private decoder: VideoDecoder | null = null;
	private configured: Uint8Array | null = null;
	private output: VideoFrame[] = [];
	private feedClip = 0;
	private feedIndex = 0;
	/** timestamp offset (µs) added to the clip-local sample timestamps */
	private feedOffset = 0;
	private nextTimestamp = 0;
	/** performance.now() ms that maps to timestamp 0 */
	private clock = 0;
	private started = false;
	private destroyed = false;
	private pendingOneShot: number | null = null;
	private playingClip = 0;
	private onClipStart?: (index: number) => void;

	constructor(private readonly log: (...args: unknown[]) => void = () => undefined) {}

	static supported() {
		return typeof VideoDecoder !== 'undefined' && typeof EncodedVideoChunk !== 'undefined';
	}

	async load(urls: string[], onClipStart?: (index: number) => void) {
		this.onClipStart = onClipStart;
		this.clips = await Promise.all(
			urls.map(async (url) => {
				const response = await fetch(url);
				const buffer = await response.arrayBuffer();
				return { track: demuxMp4(buffer), bytes: new Uint8Array(buffer) };
			}),
		);
		const first = this.clips[0].track;
		const support = await VideoDecoder.isConfigSupported({
			codec: first.codec,
			codedWidth: first.codedWidth,
			codedHeight: first.codedHeight,
			description: first.description,
		});
		if (!support.supported) throw new Error(`VideoDecoder: ${first.codec} unsupported`);
		this.log('webcodecs ready', first.codec, `${first.codedWidth}x${first.codedHeight}`, `${this.clips.length} clips`);
	}

	get width() {
		return this.clips[0]?.track.codedWidth ?? 0;
	}
	get height() {
		return this.clips[0]?.track.codedHeight ?? 0;
	}

	start() {
		if (this.started || this.destroyed) return;
		this.started = true;
		this.decoder = new VideoDecoder({
			output: (frame) => this.onFrame(frame),
			error: (error) => this.log('VideoDecoder error', String(error)),
		});
		this.configure(this.clips[0].track);
		this.clock = performance.now();
		this.feed();
	}

	/** queue a one-shot reaction; it starts after the frames already decoded */
	playOnce(index: number) {
		if (index <= 0 || index >= this.clips.length) return;
		if (this.playingClip !== 0 || this.pendingOneShot !== null) return;
		this.pendingOneShot = index;
	}

	/**
	 * Decoder preference. ANDROID: software (2026-09-03 finding on a MediaTek
	 * Motorola — importing HARDWARE video frames into WebGL blocked the main
	 * thread ~1.1 s every few loops, through both the <video> element and
	 * WebCodecs; software-decoded frames are plain memory and upload cleanly).
	 * Everywhere else the hardware codec is fine.
	 */
	private static acceleration(): HardwareAcceleration {
		if (typeof navigator === 'undefined') return 'no-preference';
		return /Android/i.test(navigator.userAgent) ? 'prefer-software' : 'no-preference';
	}

	private configure(track: Mp4Track) {
		if (!this.decoder) return;
		if (this.configured && sameBytes(this.configured, track.description)) return;
		const hardwareAcceleration = WebCodecsPlayer.acceleration();
		// optimizeForLatency makes Chrome's SOFTWARE decoder work one frame at a
		// time (slice threading); off, it pipelines frames across cores — the
		// difference between ~20 and 30 fps on a MediaTek. A few frames of
		// latency is nothing for a looping mascot and the queues absorb it.
		const optimizeForLatency = hardwareAcceleration !== 'prefer-software';
		this.decoder.configure({
			codec: track.codec,
			codedWidth: track.codedWidth,
			codedHeight: track.codedHeight,
			description: track.description,
			optimizeForLatency,
			hardwareAcceleration,
		});
		this.log('decoder configured', hardwareAcceleration, `optimizeForLatency=${optimizeForLatency}`);
		this.configured = track.description;
	}

	private onFrame(frame: VideoFrame) {
		if (this.destroyed) {
			frame.close();
			return;
		}
		this.output.push(frame);
		// safety valve only — see MAX_HELD_FRAMES
		while (this.output.length > MAX_HELD_FRAMES) this.output.shift()!.close();
		this.feed();
	}

	private feed() {
		const decoder = this.decoder;
		if (!decoder || decoder.state !== 'configured') return;
		while (decoder.decodeQueueSize < MAX_DECODE_QUEUE && this.output.length < MAX_OUTPUT_QUEUE) {
			const clip = this.clips[this.feedClip];
			const { samples } = clip.track;
			if (this.feedIndex >= samples.length) {
				// end of clip: reactions fall back to idle, idle loops; the
				// timeline simply continues
				this.feedOffset = this.nextTimestamp;
				this.feedIndex = 0;
				this.feedClip = this.pendingOneShot ?? 0;
				this.pendingOneShot = null;
				this.configure(this.clips[this.feedClip].track);
				continue;
			}
			if (this.feedIndex === 0 && this.pendingOneShot !== null && this.feedClip === 0) {
				// a reaction requested while idle sits at a loop boundary: take it now
				this.feedClip = this.pendingOneShot;
				this.pendingOneShot = null;
				this.configure(this.clips[this.feedClip].track);
				continue;
			}
			const sample = samples[this.feedIndex];
			const timestamp = this.feedOffset + sample.timestamp;
			if (this.feedIndex === 0) this.markClipStart(this.feedClip, timestamp);
			decoder.decode(
				new EncodedVideoChunk({
					type: sample.key ? 'key' : 'delta',
					timestamp,
					duration: sample.duration,
					data: clip.bytes.subarray(sample.offset, sample.offset + sample.size),
				}),
			);
			this.nextTimestamp = timestamp + sample.duration;
			this.feedIndex++;
		}
	}

	private clipStarts: { index: number; timestamp: number }[] = [];
	private markClipStart(index: number, timestamp: number) {
		this.clipStarts.push({ index, timestamp });
	}


	/**
	 * Presentation: returns the frame due at `now` (ms, performance.now()) or
	 * null when the current one should stay. One frame per call — the OLDEST
	 * due one — so a tick that finds two due frames (30 Hz rAF, bursty decoder)
	 * shows both over two ticks instead of discarding one; frames are dropped
	 * only once the backlog passes DROP_BACKLOG. The returned frame belongs to
	 * the caller.
	 */
	tick(now: number): VideoFrame | null {
		if (!this.started || this.destroyed) return null;
		const playhead = (now - this.clock) * 1000; // µs
		let dueCount = 0;
		while (dueCount < this.output.length && this.output[dueCount].timestamp <= playhead) dueCount++;
		let due: VideoFrame | null = null;
		if (dueCount > 0) {
			while (dueCount > DROP_BACKLOG) {
				this.output.shift()!.close();
				dueCount--;
			}
			due = this.output.shift()!;
		}
		if (due) {
			while (this.clipStarts.length && this.clipStarts[0].timestamp <= due.timestamp) {
				const start = this.clipStarts.shift()!;
				this.playingClip = start.index;
				this.onClipStart?.(start.index);
			}
			this.feed();
		} else if (this.output.length === 0) {
			// starved (tab was hidden, decoder hiccup): re-anchor the clock so we
			// do not burn through frames catching up
			const next = this.nextTimestamp;
			if (playhead > next) this.clock = now - next / 1000;
			this.feed();
		}
		return due;
	}

	destroy() {
		this.destroyed = true;
		for (const frame of this.output) frame.close();
		this.output = [];
		try {
			this.decoder?.close();
		} catch {
			/* already closed */
		}
		this.decoder = null;
	}
}

const sameBytes = (a: Uint8Array, b: Uint8Array) =>
	a.length === b.length && a.every((value, i) => value === b[i]);
