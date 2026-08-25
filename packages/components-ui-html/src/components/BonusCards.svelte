<script lang="ts">
	import { stateBet, stateModal, type BetModeData } from 'state-shared';
	import { Button } from 'components-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BaseIcon from './BaseIcon.svelte';
	import BonusCard from './BonusCard.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import { stateBonus } from '../stateBonus.svelte';
	import type { EmitterEventModal } from '../types';

	type Props = {
		list: BetModeData[];
	};

	const props: Props = $props();
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
</script>

{#each props.list as betModeData}
	{#if betModeData.type !== 'default'}
		<!--
			Declared out here and passed conditionally: a snippet written inside the
			component tag is ALWAYS passed, so a mode without a dialogImage (e.g. an
			activate/ante card) still got the image row plus the gap on either side
			of it. Handing over `undefined` drops the row entirely.
		-->
		{#snippet imageSnippet()}
			<img src={betModeData.assets.dialogImage} alt={betModeData.text.title} />
		{/snippet}
		<BonusCard image={betModeData.assets.dialogImage ? imageSnippet : undefined}>
			{#snippet title()}
				<div class="title">
					{betModeData.text.title}
				</div>
			{/snippet}

			{#snippet description()}
				{#if betModeData?.text?.description}
					<div class="description">
						{betModeData.text.description}
					</div>
				{/if}
			{/snippet}

			{#snippet price()}
				<div class="price">
					{`${numberToCurrencyString(stateBet.betAmount * betModeData.costMultiplier)}`}
				</div>
			{/snippet}

			{#snippet button()}
				<Button
					onclick={() => {
						stateBonus.selectedBetModeKey = betModeData.mode;
						eventEmitter.broadcast({ type: 'buyBonusConfirm' });
						eventEmitter.broadcast({ type: 'soundPressGeneral' });
					}}
					disabled={stateBet.betAmount <= 0 ||
						stateBet.balanceAmount < stateBet.betAmount * betModeData.costMultiplier}
				>
					<!--
						The card's primary action. `--modal-btn-cta-*` lets a game theme
						its call to action; the fallbacks are the previous hardcoded look,
						so games that do not define them are unchanged.
					-->
					<BaseIcon
						width="100%"
						height="2rem"
						background="var(--modal-btn-cta-bg, var(--modal-btn-bg))"
						border="var(--modal-btn-cta-border, 2px solid white)"
					/>
					<BaseButtonContent>
						<span style="font-size: 1rem;">{betModeData.text.button}</span>
					</BaseButtonContent>
				</Button>
			{/snippet}
		</BonusCard>
	{/if}
{/each}

<style lang="scss">
	.title {
		font-size: 1.25rem;
		line-height: 1.25rem;
		text-align: center;
		font-family: var(--modal-title-font, inherit);
		letter-spacing: 0.05em;
	}

	.description {
		font-size: 0.85rem;
		text-align: center;
		/*
			Reserves a common height so cards sitting side by side in one row keep
			their prices and buttons on a line. 4rem was ~2 spare lines of air on
			every short description (most visible on an image-less activate card,
			which has nothing else filling it); 2.5rem still covers the usual two
			lines.
		*/
		min-height: 2.5rem;
		white-space: pre-line;
		display: inline-flex;
		align-items: center;
	}

	.description:empty {
		display: none;
	}

	.price {
		font-size: 1.3rem;
		line-height: 1.3rem;
		font-weight: 700;
		color: var(--modal-accent-selected, inherit);
		text-align: center;
		white-space: nowrap;
	}
</style>
