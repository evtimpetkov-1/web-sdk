export * from './components/index';
export * from './utils.svelte';
export * from './types';
export * from './createApp.svelte';
export * from './context.svelte';
// The pixi values games may touch directly, re-exported so apps never depend
// on pixi.js themselves (type-only imports are fine — they compile away).
// PIXI's Rectangle is aliased: pixi-svelte's own <Rectangle> component owns
// the bare name.
export { BlurFilter, FillGradient, Texture, Rectangle as PixiRectangle } from 'pixi.js';
