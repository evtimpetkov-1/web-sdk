<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { sineInOut } from 'svelte/easing';

	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { ResponsiveText } from 'components-pixi';

	import { getContext } from '../game/context';
	import { promptText } from '../game/textStyles';

	type Props = {
		onpress: () => void;
		/** false: the tap/Space handling only, no prompt (the winbox skips silently) */
		showText?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	/**
	 * "Press anywhere to continue" as translated text in the counters' style,
	 * breathing slowly (a fade, never a bounce). Replaces the template's sheet of
	 * per-language images. Taps anywhere and Space both count.
	 */
	const FONT_SIZE = 46;
	const MAX_WIDTH = 760;
	const BOTTOM_MARGIN = 28;
	const BREATH_MS = 900;

	const alpha = new Tween(1, { duration: BREATH_MS, easing: sineInOut });
	onMount(() => {
		let bright = true;
		const id = setInterval(() => {
			bright = !bright;
			alpha.set(bright ? 1 : 0.45);
		}, BREATH_MS);
		return () => clearInterval(id);
	});
</script>

{#if props.showText ?? true}
	<MainContainer alignVertical="bottom">
		<ResponsiveText
			anchor={{ x: 0.5, y: 1 }}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height - BOTTOM_MARGIN}
			alpha={alpha.current}
			maxWidth={MAX_WIDTH}
			text={context.i18nDerived.pressToContinue()}
			style={promptText(FONT_SIZE)}
		/>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
