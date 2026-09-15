export default {
	pressToContinueText: {
		type: 'sprites',
		src: new URL('../../assets/sprites/pressToContinueText/MM_pressanywhere.json', import.meta.url).href,
		preload: true,
	},
	H1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h1.json', import.meta.url).href,
			scale: 2,
		},
	},
	H2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h2.json', import.meta.url).href,
			scale: 2,
		},
	},
	H3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h3.json', import.meta.url).href,
			scale: 2,
		},
	},
	H4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h4.json', import.meta.url).href,
			scale: 2,
		},
	},
	H5: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h5.json', import.meta.url).href,
			scale: 2,
		},
	},
	L1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l1.json', import.meta.url).href,
			scale: 2,
		},
	},
	L2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l2.json', import.meta.url).href,
			scale: 2,
		},
	},
	L3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l3.json', import.meta.url).href,
			scale: 2,
		},
	},
	L4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l4.json', import.meta.url).href,
			scale: 2,
		},
	},
	M: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols2/symbols2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols2/M.json', import.meta.url).href,
			scale: 2,
		},
	},
	reelsFrame: {
		type: 'sprites',
		src: new URL('../../assets/sprites/reelsFrame/reels_frame.json', import.meta.url).href,
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
	// BIG / MEGA / EPIC WIN titles (Evtim's celebration art) as one rig: big_in,
	// <tier>_idle, to_mega, to_epic, <tier>_out, with slot_win_count for the
	// amount. Built by art-review/madscience/bigwin/build_bigwin.py; the sample's
	// spines/bigwin is no longer loaded.
	msBigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msBigwin/bigwin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msBigwin/bigwin.json', import.meta.url).href,
			scale: 1,
		},
	},
	foregroundAnimation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/foregroundAnimation/mm_bg.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/foregroundAnimation/mm_bg.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	foregroundFeatureAnimation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/foregroundFeatureAnimation/mm_bg_feature.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/foregroundFeatureAnimation/mm_bg_feature.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	tumble_multiplier: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/tumbleWin/tumble_win.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/tumbleWin/tumble_multiplier.json', import.meta.url).href,
			scale: 2,
		},
	},
	tumble_win: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/tumbleWin/tumble_win.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/tumbleWin/tumble_win.json', import.meta.url).href,
			scale: 2,
		},
	},
	reelhouse: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/reelhouse/reelhouse_glow.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/reelhouse/reelhouse_glow.json', import.meta.url).href,
			scale: 2,
		},
	},
	clusterWin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/clusterWin/clusterpay.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/clusterWin/clusterpay.json', import.meta.url).href,
			scale: 2,
		},
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
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/SD2_Coin.json', import.meta.url).href,
	},
	// the sample's fsIntro / fsIntroNumber / fsOutroNumber spines and freeSpins / winSmall
	// sheets were dropped on 2026-09-08: the intro/outro are msFsPopup + fsintro-digits now
	uiButtons0: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/sprites/uiButtons/ui_new_packed.json', import.meta.url).href,
		preload: true,
	},
	msH1Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/h1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	msH2Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/h2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	msH3Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/h3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	msH4Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/h4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	msAAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/a.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/a.json', import.meta.url).href,
			scale: 1,
		},
	},
	msKAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/k.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/k.json', import.meta.url).href,
			scale: 1,
		},
	},
	msQAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/q.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/q.json', import.meta.url).href,
			scale: 1,
		},
	},
	msJAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/j.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/j.json', import.meta.url).href,
			scale: 1,
		},
	},
	msTenAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/ten.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/ten.json', import.meta.url).href,
			scale: 1,
		},
	},
	msClonerAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/cloner.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/cloner.json', import.meta.url).href,
			scale: 1,
		},
	},
	msBombAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/bomb.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/bomb.json', import.meta.url).href,
			scale: 1,
		},
	},
	// scatter rig (land / prewin / idle), cut from bonus.png by
	// art-review/madscience/symbol_layers/cut_bonus.py + build_rigs_v2.py bonus
	msBonusAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msSymbols/bonus.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msSymbols/bonus.json', import.meta.url).href,
			scale: 1,
		},
	},
	msGoo: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goo/goo.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goo/goo.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Bomb blast for the 3x3 ring: one-cell box like msGoo, hit_00..hit_11 red
	// fire bursts (0.5s one-shots, end empty), drawn over the neighbour's plate
	// while it pops (BlastBurst / TumbleSymbol 'blasted').
	msBlast: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/blast/blast.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/blast/blast.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Cloner goo covers, one-cell box: `splat` (a ghost lands, the cell becomes a
	// cloner) and `flood` (every cloner turns into the paying symbol). Both fire
	// the Spine event `swap` when the cell is fully covered — the moment the
	// symbol underneath is exchanged (CloneFx / ReelSymbol) — and end empty.
	msCloneFx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/clonefx/clonefx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/clonefx/clonefx.json', import.meta.url).href,
			scale: 1,
		},
	},
	// the cloner's slime copy-frames without the plate (219x269): the ghosts that
	// fly from the cloner to the cells it clones onto (MovingClones)
	msClonerGhost: {
		type: 'sprite',
		src: new URL('../../assets/madscience/fx/cloner_ghost.png', import.meta.url).href,
	},
	msWinFx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/winfx/winfx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/winfx/winfx.json', import.meta.url).href,
			scale: 1,
		},
	},
	msBg: {
		type: 'sprite',
		src: new URL('../../assets/madscience/bg_v1.png', import.meta.url).href,
		preload: true,
	},
	msFrame: {
		type: 'sprite',
		src: new URL('../../assets/madscience/frame_resized.png', import.meta.url).href,
		preload: true,
	},
	// free spins: the blood-stained operating theatre and the matching frame
	// (same 1536x1024 / 960x879 cuts as the base art, same transparent window),
	// cross-faded in by Background / BoardFrame while gameType is 'freeSpins'
	msBgFs: {
		type: 'sprite',
		src: new URL('../../assets/madscience/fs_bg.png', import.meta.url).href,
	},
	msFrameFs: {
		type: 'sprite',
		src: new URL('../../assets/madscience/frame_resized_fs.png', import.meta.url).href,
	},
	// feature-buy button in the SDK bottom bar (ButtonBuyBonus hides without
	// these keys): the bonus disc, padded square (no resampling); hover is the
	// same disc slightly brighter, inactive is a grey dimmed copy.
	bonusActive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/buy_active.png', import.meta.url).href,
	},
	bonusHover: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/buy_hover.png', import.meta.url).href,
	},
	bonusInactive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/buy_inactive.png', import.meta.url).href,
	},
	msLogo: {
		type: 'sprite',
		src: new URL('../../assets/madscience/logo.png', import.meta.url).href,
		preload: true,
	},
	msMultPlate: {
		type: 'sprite',
		src: new URL('../../assets/madscience/mult_plate.png', import.meta.url).href,
		preload: true,
	},
	// TexturePacker sheet of every static symbol + the multiplier plate. Frames
	// are keyed by their source filename, e.g. Sprite key="h1.png". Sources live
	// in symbols/raw/ (not referenced by the game).
	msSymbols: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/madscience/symbols/symbols.json', import.meta.url).href,
		preload: true,
	},
	// Acid-drip "x" + digits for every multiplier value: the plate above the reels
	// and the multiplier symbols on the board. BMFont face "tickup-multipliers";
	// packed upright by tools/bitmap-font-generator/pack-tickup-multipliers.js
	// from tickup-multipliers/raw/.
	tickupMultipliers: {
		type: 'font',
		src: new URL('../../assets/madscience/tickup-multipliers/tickup-multipliers.xml', import.meta.url).href,
	},
	// Win count-up glyphs (the winbox + the free-spin total): riveted cracked-
	// stone caps with the acid-green rim, 177px cell, digits + . , + / + A-Z +
	// the lowercase and currency marks every Stake currency string needs.
	// BMFont face "tickup-win", packed by tools/bitmap-font-generator/
	// pack-tickup-win.js from tickup-win/raw/ (EGP's combined ج.م art is split
	// in-script). base = lineHeight, so anchor 0.5 centres the glyph cell — no
	// Kraken-style ANCHOR_DROP needed. Mipmapped: the box counts up at roughly
	// half the native glyph size.
	tickupWin: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/madscience/tickup-win/tickup-win.xml', import.meta.url).href,
	},
	// Free-spins intro / outro popup (Evtim's mockup 2026-09-08): the surgical
	// lamp with its beam, the riveted plate with the bloody cloth, the
	// CONGRATULATIONS / YOU WON / TOTAL WIN plates — one rig, intro_* and
	// outro_* animations, slot_line (intro count line) and slot_amount (outro).
	// Built by art-review/madscience/fsintro/build_fsintro.py.
	msFsPopup: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msFsPopup/fspopup.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msFsPopup/fspopup.json', import.meta.url).href,
			scale: 1,
		},
	},
	// the bloody curtains that close over the screen and part again around the
	// base <-> free spins switch (Transition): `close` / `open`
	msFsCurtain: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msFsCurtain/fscurtain.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msFsCurtain/fscurtain.json', import.meta.url).href,
			scale: 1,
		},
	},
	// "FREE SPINS" word art for the intro's count line (the number is drawn in
	// the fsintro-digits face next to it, so any spin count lays out)
	fsIntroFreeSpinsTxt: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/madscience/fsintro/free_spins.png', import.meta.url).href,
	},
	// orange riveted digits 0-9 for the intro's spin count; packed by
	// tools/bitmap-font-generator/pack-fsintro-digits.js from fsintro-digits/raw/
	fsIntroDigits: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/madscience/fsintro-digits/fsintro-digits.xml', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
