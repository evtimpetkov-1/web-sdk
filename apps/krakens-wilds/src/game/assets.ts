export default {
	// Text-only logo — used everywhere in-game
	gameLogo: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/logo_text.webp', import.meta.url).href,
		preload: true,
	},
	// Kraken Spin feature art — loading screen only
	loadingKraken: {
		type: 'sprite',
		src: new URL('../../assets/sprites/loading/kraken_intro.webp', import.meta.url).href,
	},
	// English-only baked text art for the loading screen headers and the
	// press-anywhere bar; other locales fall back to the text labels
	// (same pattern as youWonTextEn/freeSpinsTextEn on the FS intro).
	loadingKrakenSpinTextEn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/loading/kraken_spin_text_en.webp', import.meta.url).href,
	},
	loadingFreeSpinsTextEn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/loading/free_spins_text_en.webp', import.meta.url).href,
	},
	pressAnywhereTextEn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/loading/press_anywhere_en.webp', import.meta.url).href,
	},
	H1: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	H2: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	H3: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	H4: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/h4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	L1: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l1.json', import.meta.url).href,
			scale: 1,
		},
	},
	L2: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l2.json', import.meta.url).href,
			scale: 1,
		},
	},
	L3: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l3.json', import.meta.url).href,
			scale: 1,
		},
	},
	L4: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/l4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/l4.json', import.meta.url).href,
			scale: 1,
		},
	},
	S: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/s.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/s.json', import.meta.url).href,
			scale: 1,
		},
	},
	W: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/w.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/w.json', import.meta.url).href,
			scale: 1,
		},
	},
	C: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/symbols-v2/coin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols-v2/coin.json', import.meta.url).href,
			scale: 1,
		},
	},
	kraken: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/kraken/kraken.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/kraken/kraken.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Ante Bet + Buy Feature side panels (spec v2.1). Decorated variants; the
	// undecorated *_nd source art is kept in the drive's ui/ folder unused.
	panelAnte: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/panels/panel_ante.webp', import.meta.url).href,
	},
	panelBuy: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/panels/panel_buy.webp', import.meta.url).href,
	},
	panelKnobOn: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/panels/panel_knob_on.webp', import.meta.url).href,
	},
	panelKnobOff: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/panels/panel_knob_off.webp', import.meta.url).href,
	},
	panelBetTxt: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/panels/panel_bet_txt.webp', import.meta.url).href,
	},
	panelBuyTxt: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/panels/panel_buy_txt.webp', import.meta.url).href,
	},
	bonusActive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/bonus_active.png', import.meta.url).href,
	},
	bonusHover: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/bonus_hover.png', import.meta.url).href,
	},
	bonusInactive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/bonus_inactive.png', import.meta.url).href,
	},
	// UI buttons spritesheet
	uiButtons0: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/sprites/uiButtons/ui_new_packed.json', import.meta.url).href,
	},
	frameEdgeDeep: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/reelsFrame/reels_frame_v2.webp', import.meta.url).href,
	},
	frameEdgeFs: {
		type: 'sprite',
		mipmap: true,
		// v3 candidate under test (blue stone). Previous: reelsFrame/fs_frame_v2.webp —
		// swapping back also needs FRAME_SCALE_FS restored in BoardFrame.svelte.
		src: new URL('../../assets/sprites/free_spins/fs_frame_v3.webp', import.meta.url).href,
	},
	anticipation: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/anticipation/anticipation.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/anticipation/anticipation.json', import.meta.url).href,
			scale: 1,
		},
	},
	payframe: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/spines/payframe/winframe.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/payframe/winframe.json', import.meta.url).href,
			scale: 1,
		},
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
		// v4 candidate under test. Previous: free_spins/bg_fs_land_2.png, fs_bg_v2.jpg
		src: new URL('../../assets/sprites/free_spins/bg_fs_land_3.webp', import.meta.url).href,
	},
	symbolsStatic: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/sprites/symbols/symbols.json', import.meta.url).href,
	},
	winGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/win_glow.webp', import.meta.url).href,
	},
	fsCounterBg: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/counters_plate.webp', import.meta.url).href,
	},
	fsIntroPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/fs_intro_plate.webp', import.meta.url).href,
	},
	freeSpinBgPortrait: {
		type: 'sprite',
		// v4 candidate under test. Previous: free_spins/bg_fs_port_2.png, fs_bg_portrait.jpg
		src: new URL('../../assets/sprites/free_spins/bg_fs_port_3.webp', import.meta.url).href,
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
		mipmap: true,
		src: new URL('../../assets/fonts/coinTickup/coin-tickup.xml', import.meta.url).href,
	},
	// v2 art. Same face name and 63-glyph charset as the v1 atlas one level up,
	// which is kept as-is for rollback — swap this path back to switch.
	winFont: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/fonts/winFont/v2/cinzel-bold-gold.xml', import.meta.url).href,
	},
	coins: {
		type: 'spriteSheet',
		mipmap: true,
		src: new URL('../../assets/sprites/coin/KW_Coin.json', import.meta.url).href,
	},
	// The three purple puffs lifted out of the fsfx spine atlas (puff0/1/2), packed
	// as a sheet so the particle emitter can throw them. Same art the kraken's
	// full-screen cloud burst is built from, so the wild's landing dust matches it.
	dust: {
		type: 'spriteSheet',
		mipmap: true,
		src: new URL('../../assets/sprites/dust/dust.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
