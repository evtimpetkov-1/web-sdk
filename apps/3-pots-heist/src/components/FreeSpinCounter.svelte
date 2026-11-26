<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		/** `pop`: the line punches up as it changes (a retrigger's extra spins) */
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number; pop?: boolean };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { Container } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { counterText } from '../game/textStyles';
	import { i18nDerived } from '../i18n/i18nDerived';

	/**
	 * FREE SPINS n / total: one line in the left half of the frame's bottom steel
	 * (stateGame counterLine), mirrored by TOTAL WIN on the right (FreeSpinTotalWin).
	 */
	const context = getContext();
	const line = $derived(context.stateGameDerived.counterLine());

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);
	const pop = new Tween(1);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
			if (emitterEvent.pop) {
				pop
					.set(1.4, { duration: 110, easing: cubicOut })
					.then(() => pop.set(1, { duration: 320, easing: backOut }));
			}
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container x={line.left} y={line.y} scale={pop.current}>
			<ResponsiveText
				anchor={{ x: 0.5, y: 0.5 }}
				maxWidth={line.maxWidth}
				text={`${i18nDerived.freeSpins()} ${current} / ${total}`}
				style={counterText(line.size)}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
