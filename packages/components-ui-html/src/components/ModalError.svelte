<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type RgsError = { error?: unknown; message?: unknown };

	const SESSION_CODES = ['ERR_IS', 'ERR_ATE'];

	/**
	 * What the player can do about it. Stake checks the error a bad rgs_url
	 * produces ("displays an appropriate error message"): fetch rejects with a
	 * TypeError when the host is unreachable, and a host that is not an RGS
	 * answers something that is not JSON (SyntaxError).
	 */
	const advice = (error: unknown) => {
		const code = (error as RgsError | null)?.error;
		if (typeof code === 'string' && SESSION_CODES.includes(code)) return i18nDerived.errorSession();
		if (error instanceof TypeError || error instanceof SyntaxError || code === 'ERR_RGS_URL') {
			return i18nDerived.errorConnection();
		}
		return i18nDerived.errorGeneric();
	};

	// the raw cause, small, for support: "ERR_IS: Invalid or expired sessionID."
	const detail = (error: unknown) => {
		if (!error) return '';
		if (error instanceof Error) return `${error.name}: ${error.message}`;
		const { error: code, message } = error as RgsError;
		if (code || message) return [code, message].filter(Boolean).map(String).join(': ');
		return String(error);
	};
</script>

{#if stateModal.modal?.name === 'error'}
	{@const error = stateModal.modal?.error}
	<Popup zIndex={zIndex.modal} persistent onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="100%">
			<BaseTitle>{i18nDerived.errorTitle()}</BaseTitle>
			<p class="advice" role="alert">{advice(error)}</p>
			{#if detail(error)}
				<p class="detail" data-test="error-detail">{detail(error)}</p>
			{/if}
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.advice {
		margin: 0;
		max-width: 28rem;
		text-align: center;
		white-space: normal;
	}

	.detail {
		margin: 0;
		max-width: 28rem;
		text-align: center;
		white-space: normal;
		overflow-wrap: anywhere;
		font-size: 0.75rem;
		color: var(--modal-text-dim);
		/* a play error can carry a whole response; three lines are enough */
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
