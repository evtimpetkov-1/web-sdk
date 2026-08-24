import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventFreeSpinRetrigger } from '../components/FreeSpinRetrigger.svelte';
import type { EmitterEventFsCloud } from '../components/FsCloudTransition.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventKraken } from '../components/KrakenTopper.svelte';

// The free-spin counter plates live in BoardFrame and render off stateUi; the
// events remain the broadcast surface the book handlers drive them through.
export type EmitterEventFreeSpinCounter =
	| { type: 'freeSpinCounterShow' }
	| { type: 'freeSpinCounterHide' }
	| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventWin
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventFreeSpinRetrigger
	| EmitterEventFsCloud
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventKraken;
