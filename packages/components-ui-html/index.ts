import Modals from './src/components/Modals.svelte';
import GameVersion from './src/components/GameVersion.svelte';
import GlobalStyle from './src/components/GlobalStyle.svelte';
// Individual modals, for games that compose their own set instead of taking
// the whole <Modals> bundle (e.g. replacing the buy popups with game-drawn
// screens while keeping the rest).
import ModalError from './src/components/ModalError.svelte';
import ModalBetMenu from './src/components/ModalBetMenu.svelte';
import ModalBuyBonus from './src/components/ModalBuyBonus.svelte';
import ModalBuyBonusConfirm from './src/components/ModalBuyBonusConfirm.svelte';
import ModalAutoSpin from './src/components/ModalAutoSpin.svelte';
import ModalAutoSpinMessage from './src/components/ModalAutoSpinMessage.svelte';
import ModalPayTable from './src/components/ModalPayTable.svelte';
import ModalGameRules from './src/components/ModalGameRules.svelte';
import ModalSettings from './src/components/ModalSettings.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';
// exposed so games can open the buy-bonus confirm flow from their own UI
// (e.g. a buy panel next to the reels) without going through the shop modal
export { stateBonus, stateBonusDerived } from './src/stateBonus.svelte';

export { messagesMap, i18nDerived, Modals, GameVersion, GlobalStyle };
export {
	ModalError,
	ModalBetMenu,
	ModalBuyBonus,
	ModalBuyBonusConfirm,
	ModalAutoSpin,
	ModalAutoSpinMessage,
	ModalPayTable,
	ModalGameRules,
	ModalSettings,
};
