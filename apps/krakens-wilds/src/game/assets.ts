export default {
	// Text-only logo — used everywhere in-game
	gameLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/logo_text.webp', import.meta.url).href,
		preload: true,
	},
	// Full logo with the kraken — loading screen only
	gameLogoKraken: {
		type: 'sprite',
		src: new URL('../../assets/sprites/logo_kraken.webp', import.meta.url).href,
		preload: true,
	},
	H1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	H2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	H3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	H4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	L1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l1.json', import.meta.url).href,
			scale: 1,
		},
	},
	L2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l2.json', import.meta.url).href,
			scale: 1,
		},
	},
	L3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l3.json', import.meta.url).href,
			scale: 1,
		},
	},
	L4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l4.json', import.meta.url).href,
			scale: 1,
		},
	},
	S: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/s.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/s.json', import.meta.url).href,
			scale: 1,
		},
	},
	W: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/w.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/w.json', import.meta.url).href,
			scale: 1,
		},
	},
	C: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/coin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/coin.json', import.meta.url).href,
			scale: 1,
		},
	},
	kraken: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/kraken/kraken.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/kraken/kraken.json', import.meta.url).href,
			scale: 1,
		},
	},
	bonusActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/bonus_active.png', import.meta.url).href,
	},
	bonusHover: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/bonus_hover.png', import.meta.url).href,
	},
	bonusInactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/bonus_inactive.png', import.meta.url).href,
	},
	// UI buttons spritesheet
	uiButtons0: {
		type: 'sprites',
		src: new URL('../../assets/sprites/uiButtons/ui_new_packed.json', import.meta.url).href,
	},
	frameEdgeDeep: {
		type: 'sprite',
		src: new URL('../../assets/sprites/reelsFrame/reels_frame_v2.webp', import.meta.url).href,
	},
	frameEdgeFs: {
		type: 'sprite',
		src: new URL('../../assets/sprites/reelsFrame/fs_frame_v2.webp', import.meta.url).href,
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
			atlas: new URL('../../assets/spines/bigwin-v2/bigwin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/bigwin-v2/bigwin.json', import.meta.url).href,
			scale: 1,
		},
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
		src: new URL('../../assets/sprites/free_spins/fs_bg_v2.jpg', import.meta.url).href,
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
		src: new URL('../../assets/sprites/counters_plate.webp', import.meta.url).href,
	},
	fsIntroPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/fs_intro_plate.webp', import.meta.url).href,
	},
	freeSpinBgPortrait: {
		type: 'sprite',
		src: new URL('../../assets/sprites/free_spins/fs_bg_portrait.jpg', import.meta.url).href,
	},
	// English-only baked title art for the FS intro (teal, matches the logo's
	// WILDS lettering); other locales fall back to text
	youWonTextEn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/free_spins/you_won_en.webp', import.meta.url).href,
	},
	freeSpinsTextEn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/free_spins/free_spins_en.webp', import.meta.url).href,
	},
	fsText: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/fstext/fstext.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/fstext/fstext.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Purple smoke FX: intro idle smoke + base→FS cloud-burst transition
	fsFx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/fsfx/fsfx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/fsfx/fsfx.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Digits + , . + x for the coin multiplier tick-up
	coinTickupFont: {
		type: 'font',
		src: new URL('../../assets/fonts/coinTickup/coin-tickup.xml', import.meta.url).href,
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
