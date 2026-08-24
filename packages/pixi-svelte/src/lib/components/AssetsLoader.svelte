<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as PIXI from 'pixi.js';

	import { getContextApp } from '../context.svelte';
	import { getProcessed } from '../assetLoad';
	import type { LoadedAssets, RawAsset } from '../types';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContextApp();

	let preLoaded = $state(false);

	const assetNameList = $derived(
		context.stateApp.assets
			? Object.keys(context.stateApp.assets).filter(
					(key) => Boolean(context.stateApp.assets?.[key].preload) === false,
				)
			: [],
	);

	const preAssetNameList = $derived(
		context.stateApp.assets
			? Object.keys(context.stateApp.assets).filter(
					(key) => context.stateApp.assets?.[key].preload === true,
				)
			: [],
	);

	let counter = 0;

	const onProgress = (value: number) => {
		if (preLoaded && value === 1) {
			counter = counter + 1;
			const ratio = counter / assetNameList.length;
			context.stateApp.loadingProgress = ratio * 100;
		}
	};

	// Turns on mipmap generation for every texture source behind a loaded asset.
	// MUST run before the texture's first render: GlTextureSystem computes the
	// mip chain length once, in _initSource (first bind) — setting the flag on an
	// already-rendered texture leaves mipLevelCount at 1 and silently does
	// nothing. Loading finishes before anything mounts, so this window is safe.
	//
	// maxAnisotropy counters trilinear's softness: plain mipmapping alone reads
	// as smooth-but-blurred at 2-4x minification; anisotropic sampling pulls the
	// sharpness back while keeping the aliasing gone. Each TextureSource owns its
	// TextureStyle instance, so this does not leak to unflagged assets.
	const applyMipmaps = (rawAsset: RawAsset) => {
		const sources = new Set<PIXI.TextureSource>();
		const collect = (texture: unknown) => {
			if (texture instanceof PIXI.Texture) sources.add(texture.source);
		};
		if (rawAsset instanceof PIXI.Texture) {
			collect(rawAsset);
		} else if (rawAsset instanceof PIXI.BitmapFont) {
			// bitmap fonts: glyph atlas pages (values drawn below 1:1 alias too)
			for (const page of rawAsset.pages) collect(page?.texture);
		} else if (rawAsset && typeof rawAsset === 'object') {
			if ('textures' in rawAsset) {
				Object.values(rawAsset.textures).forEach(collect);
			}
			// spine: the raw asset is a dict of {atlas, skeleton}; atlas pages carry
			// a SpineTexture wrapper (whose .texture is the pixi texture). collect()
			// type-guards, so probing both shapes is safe across runtime versions.
			for (const value of Object.values(rawAsset)) {
				const pages = (value as { pages?: { texture?: { texture?: unknown } }[] })?.pages;
				if (Array.isArray(pages)) {
					for (const page of pages) {
						collect(page?.texture?.texture);
						collect(page?.texture);
					}
				}
			}
		}
		for (const source of sources) {
			source.autoGenerateMipmaps = true;
			source.style.maxAnisotropy = 16;
		}
		return sources.size;
	};

	const loadAssets = async (nameList: string[]) => {
		const loadedAssetsArray = await Promise.all(
			nameList.map(async (key) => {
				try {
					const { type, src, mipmap } = context.stateApp.assets![key];
					const loadSrc =
						type === 'spine' ? Object.values(src).filter((item) => typeof item === 'string') : src;
					const rawAsset = await PIXI.Assets.load<RawAsset>(loadSrc, onProgress);
					if (mipmap) {
						const sourceCount = applyMipmaps(rawAsset);
						// 0 here means the walker failed to reach this asset type's
						// textures — the flag silently did nothing. Dev-only so the
						// pipeline is verifiable without a debugger.
						if (import.meta.env?.DEV) {
							console.debug(`[mipmaps] ${key}: ${sourceCount} texture source(s)`);
						}
					}
					const processed = getProcessed({ key, rawAsset, type, src });
					return processed;
				} catch (error) {
					console.error(error);
				}
			}),
		);

		return loadedAssetsArray.reduce(
			(acc, cur) => ({
				...acc,
				...cur,
			}),
			{} as LoadedAssets,
		);
	};

	$effect(() => {
		if (!preLoaded) {
			(async () => {
				if (preAssetNameList.length > 0) {
					const preLoadedAssets = await loadAssets(preAssetNameList);
					if (preLoadedAssets) context.stateApp.loadedAssets = preLoadedAssets;
				}
				preLoaded = true;
			})();
		}
	});

	$effect(() => {
		if (!context.stateApp.loaded && preLoaded) {
			(async () => {
				if (assetNameList.length > 0) {
					const postLoadedAssets = await loadAssets(assetNameList);
					if (postLoadedAssets)
						context.stateApp.loadedAssets = {
							...context.stateApp.loadedAssets,
							...postLoadedAssets,
						};
				}
				context.stateApp.loaded = true;
			})();
		}
	});
</script>

{#if preLoaded}
	{@render props.children()}
{/if}
