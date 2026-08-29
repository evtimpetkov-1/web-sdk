/**
 * Replay-mode UI state.
 *
 * The replay intro/outro card is plain HTML (ReplayOverlay.svelte), rendered
 * from Game.svelte OUTSIDE <App> so it is a normal DOM overlay rather than a
 * Pixi layer. The "start" action still belongs to the Pixi loading screen —
 * it owns the fade-out and the handover to the board — so LoadingScreen
 * registers its handler here and the card calls it.
 */
export const stateReplay = $state({
	/** the intro card may be shown: assets + fonts are in, nothing started yet */
	introReady: false,
});

let startHandler: (() => void) | null = null;

export const setReplayStartHandler = (handler: (() => void) | null) => {
	startHandler = handler;
};

export const startReplay = () => startHandler?.();
