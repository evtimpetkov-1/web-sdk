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
    // Upload all textures to GPU to prevent color corruption on mobile
    const prepareTextures = async () => {
        const app = context.stateApp.pixiApplication;
        const renderer = app?.renderer;
        if (!renderer) return;
        const textures: PIXI.Texture[] = [];
        // Collect textures from loaded assets
        for (const asset of Object.values(context.stateApp.loadedAssets)) {
            if (asset instanceof PIXI.Texture) {
                textures.push(asset);
            } else if (asset && typeof asset === 'object' && 'textures' in asset) {
                for (const tex of Object.values((asset as { textures: Record<string, PIXI.Texture> }).textures)) {
                    if (tex instanceof PIXI.Texture) {
                        textures.push(tex);
                    }
                }
            }
        }
        // Also collect textures from PIXI Assets cache (includes Spine atlas textures)
        // @ts-ignore - accessing internal cache
        const cache = PIXI.Assets.cache;
        if (cache && cache._cache) {
            for (const cached of cache._cache.values()) {
                if (cached instanceof PIXI.Texture) {
                    textures.push(cached);
                }
                // Handle TextureAtlas pages (for Spine)
                if (cached && typeof cached === 'object' && 'pages' in cached) {
                    for (const page of (cached as { pages: Array<{ texture?: PIXI.Texture }> }).pages) {
                        if (page.texture instanceof PIXI.Texture) {
                            textures.push(page.texture);
                        }
                    }
                }
            }
        }
        // Force upload each texture to GPU sequentially to avoid race conditions
        for (const texture of textures) {
            try {
                renderer.texture.initSource(texture.source);
            } catch (e) {
                // Ignore errors for already uploaded sources
            }
        }
        // Use renderer.render with an empty container to flush the upload queue
        const emptyContainer = new PIXI.Container();
        renderer.render(emptyContainer);
        emptyContainer.destroy();
        // Wait for GPU to complete uploads
        await new Promise((resolve) => setTimeout(resolve, 100));
    };
    const loadAssets = async (nameList: string[]) => {
        const loadedAssetsArray = await Promise.all(
            nameList.map(async (key) => {
                try {
                    const { type, src } = context.stateApp.assets![key];
                    const loadSrc =
                        type === 'spine' ? Object.values(src).filter((item) => typeof item === 'string') : src;
                    const rawAsset = await PIXI.Assets.load<RawAsset>(loadSrc, onProgress);
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
                // Ensure all textures are uploaded to GPU before rendering
                await prepareTextures();
                context.stateApp.loaded = true;
            })();
        }
    });
</script>
{#if preLoaded}
    {@render props.children()}
{/if}
