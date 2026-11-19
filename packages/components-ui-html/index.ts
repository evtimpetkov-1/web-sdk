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
import ModalInsufficientFunds from './src/components/ModalInsufficientFunds.svelte';
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
	ModalInsufficientFunds,
	ModalPayTable,
	ModalGameRules,
	ModalSettings,
};

// THE GENERIC UI (src/generic): one HTML bar, bonus shop and info page for every
// game, with no game art or theme in it. A game mounts these instead of
// components-ui-pixi's <UI> and its own shop / paytable / rules popups.
export { default as GenericUI } from './src/generic/GenericUI.svelte';
export { default as GenericShop, type GenericOffer } from './src/generic/GenericShop.svelte';
export { default as GenericInfo } from './src/generic/GenericInfo.svelte';
export { default as GenericIcon } from './src/generic/GenericIcon.svelte';

// The studio ident (ROYAL CAT GAMING assembles itself), shown over a game's own
// loader from the first frame. The same in every game: <GlobalStyle> mounts it
// (its `studioIntro={false}` leaves it out), so a game never mounts this itself.
export { default as StudioIntro } from './src/studio/StudioIntro.svelte';
