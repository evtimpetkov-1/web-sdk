/**
 * Every asset the game loads. `preload: true` = before the intro screen; the rest
 * load behind it.
 *
 * `ph*` keys are 3 Pots Heist's own art, installed by
 * art-review/3-pots-heist/app/build_app_assets.py into static/assets/heist.
 * `ms*` / `fs*` / `tickup*` keys are still BLAST DROP's: the big win titles, the win
 * box face and shower, the free spins popup with its digits, the curtains. They keep
 * those presentations working until this game has its own.
 */
export default {
	// the vault corridor (background/background.png)
	phBg: {
		type: 'sprite',
		src: new URL('../../assets/heist/bg/base.webp', import.meta.url).href,
		preload: true,
	},
	// the reel frame in two layers (BoardFrame): the whole art under the reels, its
	// steel border over them
	phFramePanel: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/heist/frame/panel.webp', import.meta.url).href,
		preload: true,
	},
	phFrameBorder: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/heist/frame/border.webp', import.meta.url).href,
		preload: true,
	},
	// every symbol's static picture, keyed by frame name: Sprite key="H1.png"
	// (math codes: L1-L5 = A K Q J 10, H1-H5 = the four thieves and the vault,
	// W, C = Coin, CL = Collect, P1-P3 = the pot symbols)
	phSymbols: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/heist/symbols/symbols.json', import.meta.url).href,
		preload: true,
	},
	// the symbol rigs (art-review/3-pots-heist/symbols): `win` on all ten, `land` on the
	// thieves and the vault. Keys = constants.ts rigKey(name).
	phRigL1: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/A.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/A.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigL2: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/K.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/K.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigL3: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/Q.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/Q.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigL4: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/J.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/J.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigL5: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/Ten.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/Ten.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigH1: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/T1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/T1.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigH2: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/T2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/T2.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigH3: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/T3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/T3.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigH4: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/T4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/T4.json', import.meta.url).href,
			scale: 1,
		},
	},
	phRigH5: {
		type: 'spine',
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/symbols/T5.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/symbols/T5.json', import.meta.url).href,
			scale: 1,
		},
	},
	// the three loot bags over the reels (art-review/3-pots-heist/pots; Bags.svelte):
	// idle_N / hit_N / win_N at fill level N = 1-5, up_N_M between levels
	phBagCash: {
		type: 'spine',
		preload: true,
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/bags/bag_cash.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/bags/bag_cash.json', import.meta.url).href,
			scale: 1,
		},
	},
	phBagGem: {
		type: 'spine',
		preload: true,
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/bags/bag_gem.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/bags/bag_gem.json', import.meta.url).href,
			scale: 1,
		},
	},
	phBagGold: {
		type: 'spine',
		preload: true,
		mipmap: true,
		src: {
			atlas: new URL('../../assets/heist/spines/bags/bag_gold.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/heist/spines/bags/bag_gold.json', import.meta.url).href,
			scale: 1,
		},
	},

	// ---- still Blast Drop's ----
	msBigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msBigwin/bigwin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msBigwin/bigwin.json', import.meta.url).href,
			scale: 1,
		},
	},
	msWinParticles: {
		type: 'spriteSheet',
		src: new URL('../../assets/bs/particles/particles.json', import.meta.url).href,
	},
	msWinShadow: {
		type: 'sprite',
		src: new URL('../../assets/bs/fx/win_shadow.png', import.meta.url).href,
	},
	tickupWin: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/bs/tickup-win/tickup-win.xml', import.meta.url).href,
	},
	msFsPopup: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msFsPopup/fspopup.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msFsPopup/fspopup.json', import.meta.url).href,
			scale: 1,
		},
	},
	msCurtainLeft: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/bs/curtain/curtain_left.webp', import.meta.url).href,
	},
	msCurtainRight: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/bs/curtain/curtain_right.webp', import.meta.url).href,
	},
	fsIntroFreeSpinsTxt: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/bs/fsintro/free_spins.png', import.meta.url).href,
	},
	fsIntroDigits: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/bs/fsintro-digits/fsintro-digits.xml', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
