import { createAsset } from 'pixi-svelte';

import img from './symbols.webp';
import rawAtlas from './symbols.atlas?raw';
import W from './W.json';

export default createAsset({
	img,
	rawAtlas,
	spines: {
		W,
	},
});
