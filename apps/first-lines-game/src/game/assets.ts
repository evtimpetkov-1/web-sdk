export default {
	loader: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/loader/loader.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/loader/loader.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	pressToContinueText: {
		type: 'sprites',
		src: new URL('../../assets/sprites/pressToContinueText/MM_pressanywhere.json', import.meta.url).href,
		preload: true,
	},
	// UI buttons — spin
	spinActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/spin_active.png', import.meta.url).href,
	},
	spinHover: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/spin_hover.png', import.meta.url).href,
	},
	spinInactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/spin_inactive.png', import.meta.url).href,
	},
	// UI buttons — secondary
	menuActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/menu_active.png', import.meta.url).href,
	},
	menuHover: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/menu_hover.png', import.meta.url).href,
	},
	menuInactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/menu_inactive.png', import.meta.url).href,
	},
	autoActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/auto_active.png', import.meta.url).href,
	},
	autoHover: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/auto_hover.png', import.meta.url).href,
	},
	autoInactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/auto_inactive.png', import.meta.url).href,
	},
	turboActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/turbo_active.png', import.meta.url).href,
	},
	turboHover: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/turbo_hover.png', import.meta.url).href,
	},
	turboInactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/turbo_inactive.png', import.meta.url).href,
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
	minusActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/minus_active.png', import.meta.url).href,
	},
	minusHover: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/minus_hover.png', import.meta.url).href,
	},
	minusInactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/minus_inactive.png', import.meta.url).href,
	},
	plusActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/plus_active.png', import.meta.url).href,
	},
	plusHover: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/plus_hover.png', import.meta.url).href,
	},
	plusInactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/ui/plus_inactive.png', import.meta.url).href,
	},
	payFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/payFrame/payFrame.png', import.meta.url).href,
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/anticipation/anticipation.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/anticipation/anticipation.json', import.meta.url).href,
			scale: 2,
		},
	},
	goldFont: {
		type: 'font',
		src: new URL('../../assets/fonts/goldFont/mm_gold.xml', import.meta.url).href,
	},
	goldBlur: {
		type: 'font',
		src: new URL('../../assets/fonts/goldBlur/miningfont_gold_blur.xml', import.meta.url).href,
	},
	silverFont: {
		type: 'font',
		src: new URL('../../assets/fonts/silverFont/mm_silver.xml', import.meta.url).href,
	},
	purpleFont: {
		type: 'font',
		src: new URL('../../assets/fonts/purpleFont/mm_purple.xml', import.meta.url).href,
	},
	bigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/bigwin/big_wins.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/bigwin/mm_bigwin.json', import.meta.url).href,
			scale: 2,
		},
	},
	backgroundBaseGame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/background_base_game.jpg', import.meta.url).href,
		preload: true,
	},
	bgEffects: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/bgEffects/bg_effects.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/bgEffects/bg_effects.json', import.meta.url).href,
			scale: 2,
		},
	},
	reelsFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/reels_frame.png', import.meta.url).href,
	},
	reelsBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/reels_bg.png', import.meta.url).href,
	},
	progressBar: {
		type: 'sprites',
		src: new URL('../../assets/sprites/progressBar/progressBar.json', import.meta.url).href,
		preload: true,
	},
	winSmall: {
		type: 'sprites',
		src: new URL('../../assets/sprites/winSmall/MM_Localisation_winsmall.json', import.meta.url).href,
	},
	transition: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/transition/transition.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/transition/transition.json', import.meta.url).href,
			scale: 2,
		},
	},
	symbolsStatic: {
		type: 'sprites',
		src: new URL('../../assets/sprites/symbolsStatic/symbolsStatic.json', import.meta.url).href,
	},
	W: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbolsNew/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbolsNew/W.json', import.meta.url).href,
			scale: 2,
		},
	},
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/SD2_Coin.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
