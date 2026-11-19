<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateModal } from 'state-shared';
	import { OnHotkey } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';

	import GenericIcon from './GenericIcon.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	/**
	 * The generic Game Info page: ONE page for what used to be two popups, the
	 * paytable first and the rules under it. The page (title bar, close, scrolling
	 * column, neutral colours) is the same in every game; a game hands in its
	 * paytable and its rules as content. It opens for both of the SDK's modal names
	 * ('gameRules', 'payTable'), so either old button lands here.
	 *
	 * The content reads the --modal-* colour names, which the generic theme sets
	 * (GenericUI), and `--ms-display-font`, pinned to the UI face here so a game's
	 * display font does not come back through its own paytable styles.
	 */
	type Props = {
		/** the game's name, after the page title */
		name?: string;
		paytable: Snippet;
		rules: Snippet;
		/** version line and the like, at the very end */
		footer?: Snippet;
	};
	const props: Props = $props();

	const open = $derived(
		stateModal.modal?.name === 'gameRules' || stateModal.modal?.name === 'payTable',
	);
	const close = () => (stateModal.modal = null);

	// A press beside the sheet closes the page, as a press beside any popup does.
	// Not until the press that opened it has settled: its click may still land here.
	let armed = $state(false);
	$effect(() => {
		if (!open) {
			armed = false;
			return;
		}
		const timer = setTimeout(() => (armed = true), 250);
		return () => clearTimeout(timer);
	});
</script>

{#if open}
	<OnHotkey hotkey="Escape" onpress={close} />
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="info"
		role="dialog"
		aria-modal="true"
		style={`z-index: ${zIndex.modal + 1};`}
		onclick={(event) => {
			if (armed && event.target === event.currentTarget) close();
		}}
	>
		<div class="sheet">
			<header>
				<h1>
					{i18nDerived.gameInfo()}{#if props.name}<span class="name">&nbsp;· {props.name}</span>{/if}
				</h1>
				<button class="x" aria-label="Close" data-test="close-button" onclick={close}>
					<GenericIcon name="close" size="1.1rem" />
				</button>
			</header>
			<div class="scroll">
				<div class="column" dir="auto">
					{@render props.paytable()}
					<hr />
					{@render props.rules()}
					{@render props.footer?.()}
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	/* the scrim: what is "outside" the page */
	.info {
		position: fixed;
		inset: 0;
		display: flex;
		justify-content: center;
		background: rgba(8, 9, 12, 0.72);
		animation: info-in 180ms ease-out;
		overscroll-behavior: none;
		cursor: pointer;
	}

	/* the page: the full screen on a phone, a sheet with the game beside it on
	   anything wider */
	.sheet {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		width: min(1000px, 100%);
		height: 100%;
		background: #101216;
		cursor: auto;
		box-shadow: 0 0 60px rgba(0, 0, 0, 0.6);
		color: var(--gui-fg, #fff);
		font-family: var(--gui-font, 'Inter', system-ui, sans-serif);
		--ms-display-font: var(--gui-font, 'Inter', system-ui, sans-serif);
		/* a wide screen keeps a strip of the game either side to press */
		@media (orientation: landscape) {
			width: min(1000px, 88vw);
		}
	}

	@keyframes info-in {
		from {
			opacity: 0;
		}
	}

	header {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.85rem 3.6rem;
		border-bottom: 1px solid var(--gui-line, rgba(255, 255, 255, 0.14));

		h1 {
			margin: 0;
			font-size: 1rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			text-align: center;
		}
		.name {
			color: var(--gui-dim, rgba(255, 255, 255, 0.62));
		}
	}

	.x {
		appearance: none;
		border: 0;
		position: absolute;
		right: 0.8rem;
		top: 50%;
		transform: translateY(-50%);
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		color: inherit;
		cursor: pointer;

		&:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.scroll {
		flex: 1;
		min-height: 0;
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
		-webkit-overflow-scrolling: touch;
	}

	.column {
		box-sizing: border-box;
		width: 100%;
		margin: 0 auto;
		padding: 1rem 1.1rem calc(2rem + env(safe-area-inset-bottom, 0px));
	}

	hr {
		margin: 1.4rem 0;
		border: 0;
		border-top: 1px solid var(--gui-line, rgba(255, 255, 255, 0.14));
	}
</style>
