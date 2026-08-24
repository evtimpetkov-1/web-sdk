import Modals from './src/components/Modals.svelte';
import GameVersion from './src/components/GameVersion.svelte';
import GlobalStyle from './src/components/GlobalStyle.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';
// exposed so games can open the buy-bonus confirm flow from their own UI
// (e.g. a buy panel next to the reels) without going through the shop modal
export { stateBonus, stateBonusDerived } from './src/stateBonus.svelte';

export { messagesMap, i18nDerived, Modals, GameVersion, GlobalStyle };
