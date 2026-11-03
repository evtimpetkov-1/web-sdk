<script lang="ts">
	import { OptionsGrid } from 'components-shared';
	import { stateBet, stateConfig } from 'state-shared';
	import { getCurrencyDecimals } from 'utils-shared/amount';

	import BaseIcon from './BaseIcon.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';

	const options = $derived(stateConfig.betMenuOptions);

	/**
	 * Every level as the full amount in the currency's decimals (2, or none for
	 * JPY & co.). Stake review 2026-10-29: bet and balance amounts are always
	 * shown rounded to two decimals, so no "1.5K" abbreviations and no "MAX"
	 * label in place of the top level.
	 */
	const formatValue = (value: number) => Math.abs(value).toFixed(getCurrencyDecimals());
	// long levels (MX$15000.00, Rp1500000) step down a size to stay in their chip
	const fontSize = (label: string) => (label.length > 8 ? '0.8rem' : label.length > 6 ? '0.9rem' : '1rem');
</script>

<OptionsGrid
	value={stateBet.betAmount}
	{options}
	wide
	onchange={(value) => (stateBet.betAmount = value)}
>
	{#snippet option({ option })}
		{@const label = formatValue(option)}
		<BaseIcon
			width="100%"
			height="2rem"
			background={option === stateBet.betAmount ? 'var(--modal-bg-active)' : 'var(--modal-btn-bg)'}
			border={option === stateBet.betAmount
				? '2px solid var(--modal-border-selected)'
				: '1px solid var(--modal-border)'}
		/>
		<BaseButtonContent>
			<span style="font-size: {fontSize(label)}; white-space: nowrap;">{label}</span>
		</BaseButtonContent>
	{/snippet}
</OptionsGrid>
