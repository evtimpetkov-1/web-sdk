<script lang="ts" module>
	export type EmitterEventFreeSpinRetrigger =
		| { type: 'freeSpinRetriggerShow'; extraSpins: number; positions: { reel: number; row: number }[] };
</script>

<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { CELL_W, CELL_H, SYMBOL_SIZE, REEL_PADDING, BOARD_SIZES } from '../game/constants';

	const context = getContext();

	type RetriggerLabel = {
		id: number;
		reel: number;
		row: number;
		y: Tween<number>;
		alpha: Tween<number>;
		scale: Tween<number>;
	};

	let labels = $state<RetriggerLabel[]>([]);
	let idCounter = 0;
	let extraSpins = $state(0);

	let splashAnim = $state<'retrigger_in' | 'retrigger_idle' | 'retrigger_out' | null>(null);
	// "+N" pop below the RETRIGGER splash
	const plusScale = new Tween(0);
	// full-screen dim behind the splash to focus attention on it
	const shadeAlpha = new Tween(0);

	context.eventEmitter.subscribeOnMount({
		freeSpinRetriggerShow: async (emitterEvent) => {
			extraSpins = emitterEvent.extraSpins;
			splashAnim = 'retrigger_in';
			plusScale.set(0, { duration: 0 });
			plusScale.set(1, { duration: 450, easing: cubicOut, delay: 250 });
			shadeAlpha.set(0.65, { duration: 300 });

			// Create a floating "+N" label for each bonus position
			const newLabels: RetriggerLabel[] = emitterEvent.positions.map((pos) => ({
				id: idCounter++,
				reel: pos.reel,
				row: pos.row,
				y: new Tween(0, { easing: cubicOut, duration: 800 }),
				alpha: new Tween(1, { duration: 600 }),
				scale: new Tween(0, { easing: cubicOut, duration: 300 }),
			}));

			labels = newLabels;

			// Pop in
			for (const label of newLabels) {
				label.scale.set(1);
			}

			await waitForTimeout(400);

			// Float up + fade out
			for (const label of newLabels) {
				label.y.set(-CELL_H * 0.6);
				label.alpha.set(0);
			}

			await waitForTimeout(900);
			labels = [];
		},
	});
</script>

{#if splashAnim}
	<!-- screen shade — oversized in board space so it covers the canvas at any layout scale -->
	<Rectangle
		anchor={0.5}
		x={BOARD_SIZES.width / 2}
		y={BOARD_SIZES.height / 2}
		width={6000}
		height={6000}
		backgroundColor={0x000000}
		alpha={shadeAlpha.current}
	/>
	<Container x={BOARD_SIZES.width / 2} y={BOARD_SIZES.height / 2 - 40} zIndex={11}>
		<SpineProvider key="fsText" width={680}>
			<SpineTrack
				trackIndex={0}
				animationName={splashAnim}
				loop={splashAnim === 'retrigger_idle'}
				listener={{
					complete: async () => {
						if (splashAnim === 'retrigger_in') {
							splashAnim = 'retrigger_idle';
							await waitForTimeout(3000);
							plusScale.set(0, { duration: 300, easing: cubicOut });
							shadeAlpha.set(0, { duration: 400 });
							splashAnim = 'retrigger_out';
						} else if (splashAnim === 'retrigger_out') {
							splashAnim = null;
						}
					},
				}}
			/>
		</SpineProvider>
		<!-- big +N above the spine's FREE SPINS line -->
		<Container y={-60} scale={plusScale.current}>
			<ResponsiveBitmapText
				anchor={0.5}
				maxWidth={360}
				text={`+${extraSpins}`}
				style={{
					fontFamily: 'cinzel-bold-gold',
					fontSize: 140,
					align: 'center',
					letterSpacing: 0,
				}}
			/>
		</Container>
	</Container>
{/if}

{#each labels as label (label.id)}
	{@const x = CELL_W * (label.reel + REEL_PADDING)}
	{@const baseY = (label.row - 0.5) * CELL_H}
	<Container
		x={x}
		y={baseY + label.y.current}
		zIndex={10}
	>
		<ResponsiveBitmapText
			anchor={0.5}
			maxWidth={SYMBOL_SIZE}
			text={`+${extraSpins}`}
			style={{
				fontFamily: 'cinzel-bold-gold',
				fontSize: 48,
				align: 'center',
				letterSpacing: 0,
			}}
			alpha={label.alpha.current}
			scaleX={label.scale.current}
			scaleY={label.scale.current}
		/>
	</Container>
{/each}
