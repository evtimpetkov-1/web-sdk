<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { anchorToPivot, Text, Container, type Sizes } from 'pixi-svelte';
	import { gameTextStyle } from '../game/textStyles';

	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const scale = 1;
	const position = $derived({
		x: canvas.width * 0.5,
		y: 50,
	});

	const fontSize = 28;

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);
	let titleSizes: Sizes = $state({ width: 0, height: 0 });
	let counterSizes: Sizes = $state({ width: 0, height: 0 });

	const textContainerSizes = $derived({
		width: titleSizes.width,
		height: titleSizes.height + counterSizes.height,
	});
	const counterPosition = $derived({ x: titleSizes.width / 2, y: titleSizes.height });

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});
</script>

<FadeContainer {show} {...position} {scale}>
	<Container
		label="FreeSpinCounterContainer"
		pivot={anchorToPivot({
			sizes: textContainerSizes,
			anchor: { x: 0.5, y: 0.5 },
		})}
	>
		<Text
			text={'FREE SPINS'}
			style={{
				...gameTextStyle,
				fontSize,
				wordWrap: false,
			}}
			onresize={(sizes) => (titleSizes = sizes)}
		/>
		<Text
			text={`${current} / ${total}`}
			{...counterPosition}
			anchor={{ x: 0.5, y: 0 }}
			style={{
				...gameTextStyle,
				fontSize,
			}}
			onresize={(sizes) => (counterSizes = sizes)}
		/>
	</Container>
</FadeContainer>
