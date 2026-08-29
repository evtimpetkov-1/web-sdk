<script lang="ts">
	import { Tween } from 'svelte/motion';

	import { stateBet } from 'state-shared';
	import { bookEventAmountToWinCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		stacked?: boolean;
		tiled?: boolean;
	};

	const props: Props = $props();
	const winBookEventAmountTween = new Tween(stateBet.winBookEventAmount);
	const label = $derived(i18nDerived.win());
	const value = $derived(bookEventAmountToWinCurrencyString(winBookEventAmountTween.current));

	$effect(() => {
		winBookEventAmountTween.set(stateBet.winBookEventAmount, { duration: 0 });
	});
</script>

<UiLabel tiled={props.tiled ?? true} {label} {value} stacked={props.stacked} />
