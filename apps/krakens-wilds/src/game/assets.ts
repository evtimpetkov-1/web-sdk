export default {
	gameLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/logo.png', import.meta.url).href,
		preload: true,
	},
	H1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	H2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	H3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	H4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	L1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l1.json', import.meta.url).href,
			scale: 1,
		},
	},
	L2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l2.json', import.meta.url).href,
			scale: 1,
		},
	},
	L3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l3.json', import.meta.url).href,
			scale: 1,
		},
	},
	L4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l4.json', import.meta.url).href,
			scale: 1,
		},
	},
	S: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols2/S.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols2/S.json', import.meta.url).href,
			scale: 1,
		},
	},
	W: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols3/W.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols3/W.json', import.meta.url).href,
			scale: 1,
		},
	},
	// UI buttons spritesheet
	uiButtons0: {
		type: 'sprites',
		src: new URL('../../assets/sprites/uiButtons/ui_new_packed.json', import.meta.url).href,
	},
	frameEdgeDeep: {
		type: 'sprite',
		src: new URL('../../assets/sprites/reelsFrame/frame_edge_deep.png', import.meta.url).href,
	},
	frameEdgeFs: {
		type: 'sprite',
		src: new URL('../../assets/sprites/reelsFrame/frame_edge_fs.webp', import.meta.url).href,
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/anticipation/anticipation.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/anticipation/anticipation.json', import.meta.url).href,
			scale: 1,
		},
	},
	payframe: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/payframe/winframe.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/payframe/winframe.json', import.meta.url).href,
			scale: 1,
		},
	},
	bigwinBg: {
		type: 'sprite',
		src: new URL('../../assets/spines/bigwin/big_win_background_final.jpg', import.meta.url).href,
	},
	bigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/bigwin/bigwin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/bigwin/bigwin.json', import.meta.url).href,
			scale: 1,
		},
	},
	reelsOverlay: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/reelsOverlay/reels_overlay.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/reelsOverlay/reels_overlay.json', import.meta.url)
				.href,
			scale: 2,
		},
		preload: true,
	},
	baseGameBgDesktop: {
		type: 'sprite',
		src: new URL('../../assets/sprites/base_game_bg_desktop.jpg', import.meta.url).href,
		preload: true,
	},
	baseGameBgPortrait: {
		type: 'sprite',
		src: new URL('../../assets/sprites/base_game_bg_portrait.jpg', import.meta.url).href,
		preload: true,
	},
	freeSpinBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/fs_intro_bg/fs_bg_v2.jpg', import.meta.url).href,
	},
	frameOverlay: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/frameOverlay/frameOverlay.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/frameOverlay/frameOverlay.json', import.meta.url).href,
			scale: 1,
		},
	},
	symbolsStatic: {
		type: 'sprites',
		src: new URL('../../assets/sprites/symbols/symbols.json', import.meta.url).href,
	},
	winGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/win_glow.webp', import.meta.url).href,
	},
	fsCounterBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/fs_counter_bg_new.webp', import.meta.url).href,
	},
	winFont: {
		type: 'font',
		src: new URL('../../assets/fonts/winFont/cinzel-bold-gold.xml', import.meta.url).href,
	},
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/KW_Coin.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
