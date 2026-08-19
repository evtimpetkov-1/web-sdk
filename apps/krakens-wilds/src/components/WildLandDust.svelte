<script lang="ts">
	import { Container, ParticleEmitter } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';

	/**
	 * The purple dust a wild kicks up as it lands.
	 *
	 * Built from the same puff art as the kraken's full-screen cloud burst (puff0-2,
	 * lifted out of the fsfx spine atlas into `dust`), so the landing reads as the
	 * kraken's doing rather than a generic effect.
	 *
	 * Drawn OVER the wild — the dust is thrown up in front of it, and the puffs fade
	 * out to hand the symbol back. Callers must render this AFTER the wild's spine.
	 *
	 * `emitSpeed` matters more than anything else here: ParticleEmitter defaults to
	 * 0.00234, which advances the simulation 2.34x faster than real time, so the
	 * first version's 0.4-0.7s puffs were alive for 0.17-0.30s and read as a faint
	 * flicker. 0.001 makes one tick one real millisecond, so the lifetimes below are
	 * the ones actually seen.
	 */
	type Props = {
		x: number;
		y: number;
		/** true while the landing animation is playing */
		emit: boolean;
		/**
		 * Lift above siblings that mount later. pixi-svelte appends on mount, so
		 * a reveal spine that mounts after this container would otherwise draw
		 * over the dust — markup order alone does not decide the stacking.
		 */
		zIndex?: number;
	};

	const props: Props = $props();

	// Tuning lives here rather than in constants-shared — this is game-specific and
	// wants to be adjusted against the animation, not shared with other games.
	// The puff source frames are 200px, so scale 0.5 ≈ 100px against a 128px symbol.
	const config = $derived({
		alpha: { start: 1, end: 0 },
		scale: { start: 0.5, end: 1.0, minimumScaleMultiplier: 0.7 },
		// bright lilac at the moment of impact, settling into the kraken's deep purple
		color: { start: '#e2ccff', end: '#7a44cc' },
		// slow enough to hang around the symbol rather than shooting off the board
		speed: { start: 170, end: 15, minimumSpeedMultiplier: 0.5 },
		// a gentle lift so the cloud rises and thins rather than dropping
		acceleration: { x: 0, y: -70 },
		maxSpeed: 0,
		startRotation: { min: 0, max: 360 },
		noRotation: false,
		rotationSpeed: { min: -70, max: 70 },
		lifetime: { min: 0.5, max: 0.9 },
		blendMode: 'normal',
		frequency: 0.008,
		emitterLifetime: -1,
		maxParticles: 45,
		pos: { x: 0, y: 0 },
		// in front of the wild, not behind it
		addAtBack: false,
		spawnType: 'circle',
		spawnCircle: { x: 0, y: SYMBOL_SIZE * 0.12, r: SYMBOL_SIZE * 0.42 },
	});
</script>

<Container x={props.x} y={props.y} zIndex={props.zIndex ?? 0}>
	<ParticleEmitter
		{config}
		key="dust"
		emit={props.emit}
		emitSpeed={0.001}
		spawnChance={props.emit ? 1 : 0}
	/>
</Container>
