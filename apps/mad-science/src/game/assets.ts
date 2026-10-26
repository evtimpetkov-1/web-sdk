export default {
	// BIG / MEGA / EPIC WIN titles (Evtim's celebration art) as one rig: big_in,
	// <tier>_idle, to_mega, to_epic, <tier>_out, with slot_win_count for the
	// amount. Built by art-review/madscience/bigwin/build_bigwin.py; the sample's
	// spines/bigwin (sample) is parked in art-review/template-assets.
	msBigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msBigwin/bigwin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msBigwin/bigwin.json', import.meta.url).href,
			scale: 1,
		},
	},
	// free-spins glow around the reel frame (BoardFrame), built by
	// art-review/madscience/reelglow/build_reelglow.py in the frame image's px
	msReelGlow: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/msReelGlow/reelglow.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/msReelGlow/reelglow.json', import.meta.url).href,
			scale: 1,
		},
	},
	// The big-win / FS-outro shower (WinCoins): our skull coin at five spin angles,
	// two vials and two goo drops, each particle a random frame (coins listed
	// twice, so ~70% coins). Coin 487 px at meta scale 2 = the template coin's
	// size, so the shared particle configs keep their scale. Built by
	// art-review/madscience/win_particles/pack_particles.py. Replaces the
	// sample's SD2_Coin sheet; the template's anticipation, tumble_win and
	// transition spines, gold font and pressanywhere sheet went with it
	// (2026-10-23, parked in art-review/template-assets).
	msWinParticles: {
		type: 'spriteSheet',
		src: new URL('../../assets/madscience/particles/particles.json', import.meta.url).href,
	},
	// soft black ellipse behind the winbox amount (Win.svelte), so the stone
	// glyphs stand off the stone royals behind them; generated, smoothstep falloff
	msWinShadow: {
		type: 'sprite',
		src: new URL('../../assets/madscience/fx/win_shadow.png', import.meta.url).href,
	},
	// The reel backing (BoardBacking.svelte): what fills the frame window when the
	// symbols do not — dark chamber with reel grooves, an edge glow and two
	// tileable fog layers. Procedural, board space (555x500 units), built by
	// art-review/madscience/reel_backing/build_reel_backing.py.
	msBackingPanel: {
		type: 'sprite',
		src: new URL('../../assets/madscience/backing/panel.webp', import.meta.url).href,
	},
	msBackingGlow: {
		type: 'sprite',
		src: new URL('../../assets/madscience/backing/glow.webp', import.meta.url).href,
	},
	msBackingFogA: {
		type: 'sprite',
		src: new URL('../../assets/madscience/backing/fog_a.webp', import.meta.url).href,
	},
	msBackingFogB: {
		type: 'sprite',
		src: new URL('../../assets/madscience/backing/fog_b.webp', import.meta.url).href,
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
	// Backgrounds and logos are WebP since 2026-10-24 (3.5 MB of TinyPNG PNGs ->
	// 1.5 MB): lossy q90 from the full-colour originals, the logo at q95, and the
	// one-row logo lossless (lossy lost its edges). The PNGs they replaced are in
	// art-review/static-leftovers/png_before_webp/ to revert to.
	msBg: {
		type: 'sprite',
		src: new URL('../../assets/madscience/bg_v1.webp', import.meta.url).href,
		preload: true,
	},
	// the base lab for portrait-shaped screens (1024x1536); Background picks it
	// whenever the canvas is taller than wide
	msBgPortrait: {
		type: 'sprite',
		src: new URL('../../assets/madscience/bg_portrait.webp', import.meta.url).href,
		preload: true,
	},
	msFrame: {
		type: 'sprite',
		src: new URL('../../assets/madscience/frame_resized.png', import.meta.url).href,
		preload: true,
	},
	// free spins: the blood-stained operating theatre and the matching frame
	// (same 1536x1024 / 960x879 cuts as the base art, same transparent window),
	// cross-faded in by Background / BoardFrame while gameType is 'freegame'
	msBgFs: {
		type: 'sprite',
		src: new URL('../../assets/madscience/fs_bg.webp', import.meta.url).href,
	},
	msFrameFs: {
		type: 'sprite',
		src: new URL('../../assets/madscience/frame_resized_fs.png', import.meta.url).href,
	},
	// feature-buy button in the SDK bottom bar (ButtonBuyBonus hides without
	// these keys): the bonus disc, padded square (no resampling); hover is the
	// same disc slightly brighter, inactive is a grey dimmed copy.
	// the bottom bar's buy button (Evtim's cart disc, 2026-10-24): three states
	// built by art-review/madscience/buy_button/make_buy_button.py; the bonus
	// disc set it replaced is in art-review/static-leftovers/buy_button_old/
	bonusActive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/buy_active.webp', import.meta.url).href,
	},
	bonusHover: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/buy_hover.webp', import.meta.url).href,
	},
	bonusInactive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/sprites/ui/buy_inactive.webp', import.meta.url).href,
	},
	msLogo: {
		type: 'sprite',
		src: new URL('../../assets/madscience/logo.webp', import.meta.url).href,
		preload: true,
	},
	// the one-row logo (2172x724) for the portrait layout: GameLogo above the
	// plate and the intro screen
	msLogoRow: {
		type: 'sprite',
		src: new URL('../../assets/madscience/logo_one_row.webp', import.meta.url).href,
		preload: true,
	},
	msMultPlate: {
		type: 'sprite',
		src: new URL('../../assets/madscience/mult_plate.png', import.meta.url).href,
		preload: true,
	},
	// TexturePacker sheet of every static symbol + the multiplier plate. Frames
	// are keyed by their source filename, e.g. Sprite key="h1.png". Sources live
	// in art-review/static-sources/symbols/raw/ (out of static, so they do not ship).
	msSymbols: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/madscience/symbols/symbols.json', import.meta.url).href,
		preload: true,
	},
	// Acid-drip "x" + digits for every multiplier value: the plate above the reels
	// and the multiplier symbols on the board. BMFont face "tickup-multipliers";
	// packed upright by tools/bitmap-font-generator/pack-tickup-multipliers.js
	// from art-review/static-sources/tickup-multipliers/raw/.
	tickupMultipliers: {
		type: 'font',
		src: new URL('../../assets/madscience/tickup-multipliers/tickup-multipliers.xml', import.meta.url).href,
	},
	// Win count-up glyphs (the winbox + the free-spin total): riveted cracked-
	// stone caps with the acid-green rim, 177px cell, digits + . , + / + A-Z +
	// the lowercase and currency marks every Stake currency string needs.
	// BMFont face "tickup-win", packed by tools/bitmap-font-generator/
	// pack-tickup-win.js from art-review/static-sources/tickup-win/raw/ (EGP's combined ج.م art is split
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
	// The curtain (Transition): the two halves of Evtim's curtains_v2.png, each
	// with its stretch of rod and rings, tiled across the screen by code — cut
	// by art-review/madscience/curtain_v2/cut_curtain.py. Replaced the msFsCurtain
	// spine rig on 2026-10-23 (parked in art-review/static-leftovers).
	msCurtainLeft: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/madscience/curtain/curtain_left.webp', import.meta.url).href,
	},
	msCurtainRight: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/madscience/curtain/curtain_right.webp', import.meta.url).href,
	},
	// "FREE SPINS" word art for the intro's count line (the number is drawn in
	// the fsintro-digits face next to it, so any spin count lays out)
	fsIntroFreeSpinsTxt: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/madscience/fsintro/free_spins.png', import.meta.url).href,
	},
	// orange riveted digits 0-9 for the intro's spin count; packed by
	// tools/bitmap-font-generator/pack-fsintro-digits.js from art-review/static-sources/fsintro-digits/raw/
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
