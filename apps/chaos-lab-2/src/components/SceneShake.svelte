<script lang="ts" module>
	/**
	 * The slot's reactions to its big moments (Evtim, 2026-11-05). Each preset is a
	 * mix of two moves:
	 * - `trauma` (0-1): a noisy shake + a slight roll, for blasts and rumbles. It
	 *   stacks (two bombs shake harder than one, capped at 1), its strength is
	 *   trauma squared (a small hit stays small), and it runs out at `decay` per second.
	 * - `kick` (0-1): one damped downward thump, for slams and impacts.
	 * Where each fires:
	 * - bomb: a bomb's bang (the rig's `detonate`), base game and Cash Respins (Symbol)
	 * - wildSlam: the Wild slamming into a bomb's cell (`wild`, Symbol)
	 * - featureTrigger: the Scatters that start Cash Respins (cashRespinTrigger)
	 * - bigWin / megaWin / epicWin: each title stamping in (WinAnimation)
	 * - collect: the last coin counted into TOTAL WIN (CashRespinBoard)
	 * Values are first guesses, all tuned here.
	 */
	export const SHAKE_PRESETS = {
		bomb: { trauma: 0.6, decay: 1.6 },
		wildSlam: { kick: 0.35 },
		featureTrigger: { trauma: 0.5, decay: 0.55 },
		bigWin: { trauma: 0.45, decay: 1.4, kick: 0.4 },
		megaWin: { trauma: 0.6, decay: 1.2, kick: 0.5 },
		epicWin: { trauma: 0.8, decay: 1.0, kick: 0.6 },
		collect: { kick: 0.5 },
	} satisfies Record<string, { trauma?: number; decay?: number; kick?: number }>;

	export type ShakePreset = keyof typeof SHAKE_PRESETS;
	export type EmitterEventSceneShake = { type: 'sceneShake'; preset: ShakePreset };
</script>

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContext();

	// at trauma 1: the offset (x the board's on-screen height) and the roll (radians, ~1°)
	const MAX_OFFSET = 0.04;
	const MAX_ROLL = 0.0175;
	const NOISE_HZ = 14;
	// at kick 1: the thump's depth (x the board's height), its bounce and how fast it settles
	const KICK_OFFSET = 0.025;
	const KICK_HZ = 8;
	const KICK_DAMP = 10;
	const KICK_LIFE_S = 0.6;

	// the board's centre and height in canvas px (main layout anchor 0.5, boardLayout)
	const pivot = $derived.by(() => {
		const main = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		return {
			x: main.x + (board.x - main.width * 0.5) * main.scale,
			y: main.y + (board.y - main.height * 0.5) * main.scale,
			height: board.height * board.scale * main.scale,
		};
	});

	let trauma = 0;
	let decay = 1;
	let kicks: { amount: number; age: number }[] = [];
	let time = 0;
	let offsetX = $state(0);
	let offsetY = $state(0);
	let roll = $state(0);

	// three sines at unrelated rates: smooth, never visibly repeating, about -1..1
	const noise = (t: number, seed: number) => {
		const w = 2 * Math.PI * NOISE_HZ * t;
		return (
			0.5 * Math.sin(w + seed) + 0.3 * Math.sin(1.71 * w + 1.3 * seed) + 0.2 * Math.sin(2.63 * w + 2.1 * seed)
		);
	};

	// a reduced-motion setting turns the shake off (a vestibular trigger)
	const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	context.eventEmitter.subscribeOnMount({
		sceneShake: ({ preset }) => {
			if (reducedMotion()) return;
			const p: { trauma?: number; decay?: number; kick?: number } = SHAKE_PRESETS[preset];
			if (p.trauma) {
				trauma = Math.min(1, trauma + p.trauma);
				decay = p.decay ?? 1;
			}
			if (p.kick) kicks.push({ amount: p.kick, age: 0 });
		},
	});

	// the Pixi ticker, so the offset is set before the frame it shows in; idle costs nothing
	onMount(() => {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		const tick = () => {
			if (trauma === 0 && kicks.length === 0) {
				if (offsetX || offsetY || roll) offsetX = offsetY = roll = 0;
				return;
			}
			const dt = app.ticker.deltaMS / 1000;
			time += dt;
			trauma = Math.max(0, trauma - decay * dt);
			const shake = trauma * trauma;
			const size = pivot.height;
			let kickY = 0;
			for (const kick of kicks) {
				kick.age += dt;
				kickY +=
					KICK_OFFSET * kick.amount * Math.exp(-KICK_DAMP * kick.age) * Math.sin(2 * Math.PI * KICK_HZ * kick.age);
			}
			kicks = kicks.filter((kick) => kick.age < KICK_LIFE_S);
			offsetX = MAX_OFFSET * size * shake * noise(time, 1.0);
			offsetY = MAX_OFFSET * size * shake * noise(time, 4.2) + kickY * size;
			roll = MAX_ROLL * shake * noise(time, 7.7);
		};
		app.ticker.add(tick);
		return () => app.ticker.remove(tick);
	});
</script>

<!-- the pivot is the board's centre, so the roll turns the slot about itself -->
<Container
	pivot={{ x: pivot.x, y: pivot.y }}
	x={pivot.x + offsetX}
	y={pivot.y + offsetY}
	rotation={roll}
>
	{@render props.children()}
</Container>
