export default {
	// DYNAMITE GULCH (2026-11-13): this app is Chaos Lab 2 re-themed. Every path
	// under assets/dg/ is the Wild West art; the comments below still describe
	// the Chaos Lab piece each key replaced (same canvases, frame names, rigs and
	// timings). Builders: stake-engine/art-review/dynamite-gulch/build_statics.py
	// (symbols), build_scene.py (backgrounds, frame, logos, loader), build_rigs.py
	// (symbol rigs), build_retheme.py (regraded effects, fonts, coins, particles).
	// prep_art.py + build_popup_rig.py (titles, feature popup, curtain, RESPINS
	// word, WIN UP TO banner, intro digits). Keys keep their ms* / cl2* names.
	// build_bigwin.py (BIG / MEGA / EPIC WIN). Still Chaos Lab art: the buy cards
	// and buy/ante buttons (regraded only).
	// BIG / MEGA / EPIC WIN titles (Evtim's celebration art) as one rig: big_in,
	// <tier>_idle, to_mega, to_epic, <tier>_out, with slot_win_count for the
	// amount. Built by art-review/madscience/bigwin/build_bigwin.py; the sample's
	// spines/bigwin (sample) is parked in art-review/template-assets.
	msBigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/bigwin/bigwin.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/bigwin/bigwin.json', import.meta.url).href,
			scale: 1,
		},
	},
	// free-spins glow around the reel frame (BoardFrame), built by
	// art-review/madscience/reelglow/build_reelglow.py in the frame image's px
	msReelGlow: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/reelglow/reelglow.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/reelglow/reelglow.json', import.meta.url).href,
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
		src: new URL('../../assets/dg/particles/particles.json', import.meta.url).href,
	},
	// soft black ellipse behind the winbox amount (Win.svelte), so the stone
	// glyphs stand off the stone royals behind them; generated, smoothstep falloff
	msWinShadow: {
		type: 'sprite',
		src: new URL('../../assets/madscience/fx/win_shadow.webp', import.meta.url).href,
	},
	// The reel backing (BoardBacking.svelte): what fills the frame window when the
	// symbols do not — dark chamber with reel grooves, an edge glow and two
	// tileable fog layers. Procedural, board space (555x500 units), built by
	// art-review/madscience/reel_backing/build_reel_backing.py.
	msBackingPanel: {
		type: 'sprite',
		src: new URL('../../assets/dg/backing/panel.webp', import.meta.url).href,
	},
	msBackingGlow: {
		type: 'sprite',
		src: new URL('../../assets/dg/backing/glow.webp', import.meta.url).href,
	},
	msBackingFogA: {
		type: 'sprite',
		src: new URL('../../assets/dg/backing/fog_a.webp', import.meta.url).href,
	},
	msBackingFogB: {
		type: 'sprite',
		src: new URL('../../assets/dg/backing/fog_b.webp', import.meta.url).href,
	},
	// the sample's fsIntro / fsIntroNumber / fsOutroNumber spines and freeSpins / winSmall
	// sheets were dropped on 2026-09-08: the intro/outro are msFsPopup + fsintro-digits now
	// the bet bar's buttons in the game's ink hand: a tan timber ring with iron nails
	// round a dark walnut face, flat gold icons; the SDK's 18 frame names at 2x the old
	// sizes (art-review/dynamite-gulch/rework/build_ink_ui.py)
	uiButtons0: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/dg/ui/ui_new_packed.json', import.meta.url).href,
		preload: true,
	},
	// the bet bar's strip, a dark walnut beam under a tan nailed rail (BarStrip.svelte):
	// one beam for portrait, two mirrored for the wide layouts
	dgBar: {
		type: 'sprite',
		src: new URL('../../assets/dg/ui/bar.webp', import.meta.url).href,
		preload: true,
	},
	dgBarWide: {
		type: 'sprite',
		src: new URL('../../assets/dg/ui/bar_wide.webp', import.meta.url).href,
		preload: true,
	},
	// GoldFx: one row of 128 px cells (glow, star, a coin at four angles) for the coins
	// a win throws at the WIN counter (art-review/dynamite-gulch/rework/build_ink_gold.py)
	dgGold: {
		type: 'sprite',
		src: new URL('../../assets/dg/fx/gold.webp', import.meta.url).href,
		preload: true,
	},
	// portrait's plank wall behind the buttons, made of the strip's own timber
	dgDeck: {
		type: 'sprite',
		src: new URL('../../assets/dg/ui/deck.webp', import.meta.url).href,
		preload: true,
	},
	msH1Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/h1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	msH2Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/h2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	msH3Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/h3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	msH4Anim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/h4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	// the Wild's own rig (ink set, 2026-11-16): the badge pops on its tile when it is part of a win
	msWildAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/wild.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/wild.json', import.meta.url).href,
			scale: 1,
		},
	},
	msAAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/a.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/a.json', import.meta.url).href,
			scale: 1,
		},
	},
	msKAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/k.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/k.json', import.meta.url).href,
			scale: 1,
		},
	},
	msQAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/q.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/q.json', import.meta.url).href,
			scale: 1,
		},
	},
	msJAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/j.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/j.json', import.meta.url).href,
			scale: 1,
		},
	},
	msTenAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/ten.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/ten.json', import.meta.url).href,
			scale: 1,
		},
	},
	msClonerAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/cloner.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/cloner.json', import.meta.url).href,
			scale: 1,
		},
	},
	msBombAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/bomb.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/bomb.json', import.meta.url).href,
			scale: 1,
		},
	},
	// scatter rig: the safe (land / prewin / idle / pending). Every symbol rig is
	// built by stake-engine/art-review/dynamite-gulch/build_rigs.py --install,
	// with Chaos Lab 2's animation names, durations and events
	msBonusAnim: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/symbols/bonus.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/symbols/bonus.json', import.meta.url).href,
			scale: 1,
		},
	},
	msGoo: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/goo/goo.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/goo/goo.json', import.meta.url).href,
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
			atlas: new URL('../../assets/dg/spines/clonefx/clonefx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/clonefx/clonefx.json', import.meta.url).href,
			scale: 1,
		},
	},
	// the cloner's slime copy-frames without the plate (219x269): the ghosts that
	// fly from the cloner to the cells it clones onto (MovingClones)
	msClonerGhost: {
		type: 'sprite',
		src: new URL('../../assets/dg/fx/cloner_ghost.webp', import.meta.url).href,
	},
	msWinFx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/winfx/winfx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/winfx/winfx.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Dynamite Gulch scene art (2026-11-13): the gulch by day, its portrait cut,
	// the same street at night for Cash Respins, the timber reel frame (and its
	// moonlit grade) and both logos, all on the canvases Chaos Lab 2 used. Built
	// by stake-engine/art-review/dynamite-gulch/build_scene.py --install. The
	// asset keys keep their `ms*` / `cl2*` names (renaming them is churn).
	msBg: {
		type: 'sprite',
		src: new URL('../../assets/dg/bg.webp', import.meta.url).href,
		preload: true,
	},
	// the gulch for portrait-shaped screens (1288x1920); Background picks it
	// whenever the canvas is taller than wide
	msBgPortrait: {
		type: 'sprite',
		src: new URL('../../assets/dg/bg_portrait.webp', import.meta.url).href,
		preload: true,
	},
	msFrame: {
		type: 'sprite',
		src: new URL('../../assets/dg/frame.webp', import.meta.url).href,
		preload: true,
	},
	// Cash Respins: the street at night and the frame in moonlight (same
	// 960x879 cut, same transparent window), cross-faded in by Background /
	// BoardFrame while gameType is 'freegame'
	msBgFs: {
		type: 'sprite',
		src: new URL('../../assets/dg/bg_night.webp', import.meta.url).href,
	},
	msFrameFs: {
		type: 'sprite',
		src: new URL('../../assets/dg/frame_night.webp', import.meta.url).href,
	},
	// the buy slot (BuySlot.svelte, the game's own button: the SDK's
	// ButtonBuyBonus draws only when a 'bonusActive' key exists, so these keys
	// keep it hidden). The Scatter's loot sack alone, no ring (as Blast Shaft's
	// nugget); three states from art-review/dynamite-gulch/rework/build_ink_ui.py.
	msBuyActive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/buy_active.webp', import.meta.url).href,
	},
	msBuyHover: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/buy_hover.webp', import.meta.url).href,
	},
	msBuyInactive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/buy_inactive.webp', import.meta.url).href,
	},
	// the buy slot while Showdown Mode / Bonus Boost is on: the dynamite / the sack
	// under two chevrons in the bar's own wooden button, same three states and builder
	msAnteChaosActive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/ante_chaos_active.webp', import.meta.url).href,
	},
	msAnteChaosHover: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/ante_chaos_hover.webp', import.meta.url).href,
	},
	msAnteChaosInactive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/ante_chaos_inactive.webp', import.meta.url).href,
	},
	msAnteBoostActive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/ante_boost_active.webp', import.meta.url).href,
	},
	msAnteBoostHover: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/ante_boost_hover.webp', import.meta.url).href,
	},
	msAnteBoostInactive: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/ui/ante_boost_inactive.webp', import.meta.url).href,
	},
	// The living background (Ambient.svelte): tumbleweeds, drifting clouds, dust,
	// a star glint and a soft light, one sheet (JSON hash, frames keyed by file
	// name: "weed_a.png"). art-review/dynamite-gulch/build_ambient.py --install.
	dgAmbient: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/dg/ambient/ambient.json', import.meta.url).href,
		preload: true,
	},
	// More life in the background (2026-11-16): the windmill's fan and the patches that
	// paint the painted one out, a dust devil's six frames, birds. Frames keyed by file
	// name. art-review/dynamite-gulch/rework/build_ink_life.py --install (it also writes
	// game/ambientLife.ts).
	dgLife: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/dg/ambient/life.json', import.meta.url).href,
		preload: true,
	},
	// The wind made visible and the reel frame's life (2026-11-17): wind lines, what
	// the wind carries, dust wisps (SceneWind); the hook and lantern on the frame, the
	// dust a quake shakes off it, its lights (FrameLife). Frames keyed by file name;
	// both layers are ParticleContainers, so the whole sheet is ONE texture.
	// art-review/dynamite-gulch/rework/build_ink_wind.py --install (also game/windLife.ts).
	dgWind: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/dg/ambient/wind.json', import.meta.url).href,
		preload: true,
	},
	// The loose tumbleweeds (2026-11-18): weed_c.png / weed_d.png, airy ones the ground
	// shows through. They cross in front of the reels in turn with the dense pair
	// (Boardwalk) and wander the ground behind them (Roamers).
	// art-review/dynamite-gulch/rework/build_ink_roam.py --install.
	dgRoam: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/dg/ambient/roam.json', import.meta.url).href,
		preload: true,
	},
	// The logo's light, laid over the logo sprite by GameLogo: a sweep across the
	// letters, glints on the stars, a flash on a win (`idle` loop, `win`). One rig
	// per logo, each on its logo's canvas. art-review/dynamite-gulch/build_logo_fx.py.
	dgLogoFx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/logofx/logofx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/logofx/logofx.json', import.meta.url).href,
			scale: 1,
		},
	},
	dgLogoRowFx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/logofx/logorowfx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/logofx/logorowfx.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Cash Respins (Chaos Lab 2). Coin v2 (Evtim, 2026-11-04): the gold coin
	// (433x478) with its value in cl2-coin; once a multiplier frame applies, the
	// purple one with cl2-coin-purple (art-review/chaoslab2/coin_v2/
	// prep_new_coin.py; v1's gold plate in art-review/static-leftovers/coin_v1).
	// The faces are packed by tools/bitmap-font-generator/pack-cl2-fonts.py from
	// art-review/chaoslab2/fonts/<face>/raw/ (base = lineHeight: anchor 0.5
	// centres the cell). cl2-multiplier = the purple multiplier that lands on the
	// reels, no plate.
	// (the gold coin and its face are on the intro screen too: loaded with the first batch)
	cl2CoinGold: {
		type: 'sprite',
		mipmap: true,
		preload: true,
		src: new URL('../../assets/dg/coin/coin_gold.webp', import.meta.url).href,
	},
	cl2CoinPurple: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/coin/coin_ruby.webp', import.meta.url).href,
	},
	cl2CoinFont: {
		type: 'font',
		mipmap: true,
		preload: true,
		src: new URL('../../assets/dg/fonts/cl2-coin/cl2-coin.xml', import.meta.url).href,
	},
	cl2CoinPurpleFont: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/dg/fonts/cl2-coin-purple/cl2-coin-purple.xml', import.meta.url).href,
	},
	cl2MultiplierFont: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/dg/fonts/cl2-multiplier/cl2-multiplier.xml', import.meta.url).href,
	},
	// one Cash Respins cell (137x144, corners transparent), cut from Evtim's
	// grid_v2.png and drawn on every position by CashRespinBoard; and the RESPINS
	// title art for the intro's count line ("3 RESPINS"). Built by
	// art-review/chaoslab2/respins/make_respins_art.py --install
	cl2RespinCell: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/respins/cell.webp', import.meta.url).href,
	},
	// a multiplier frame: the cell's frame in ruby, drawn round every cell that
	// carries one (art-review/dynamite-gulch/rework/build_ink_respins.py)
	dgRespinFrame: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/respins/frame.webp', import.meta.url).href,
	},
	cl2RespinsWord: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/respins/respins_word.webp', import.meta.url).href,
	},
	// Dynamite Gulch logos: the art is contained in Chaos Lab 2's 1480x985 and
	// 2209x701 canvases (build_scene.py), so every tuned layout keeps its box
	msLogo: {
		type: 'sprite',
		src: new URL('../../assets/dg/logo.webp', import.meta.url).href,
		preload: true,
	},
	// the one-row logo (2209x701 canvas) for the portrait layout: GameLogo above the
	// plate and the intro screen
	msLogoRow: {
		type: 'sprite',
		src: new URL('../../assets/dg/logo_one_row.webp', import.meta.url).href,
		preload: true,
	},
	// the intro screen's plates (Evtim's, 2026-11-16): the parchment panel, its title
	// ribbon, the curved plank with the English "WIN UP TO 31 445 X" lettering (bakes
	// the top max win: other languages and any other figure are drawn as text) and the
	// prompt's yellow plate. art-review/dynamite-gulch/rework/build_ink_intro.py
	dgIntro: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/dg/intro/intro.json', import.meta.url).href,
		preload: true,
	},
	// the street behind the intro's plates: the game's backgrounds blurred by the
	// builder (no filter in the game) and stored at a third of their size
	dgIntroBg: {
		type: 'sprite',
		src: new URL('../../assets/dg/intro/bg.webp', import.meta.url).href,
		preload: true,
	},
	dgIntroBgPortrait: {
		type: 'sprite',
		src: new URL('../../assets/dg/intro/bg_portrait.webp', import.meta.url).href,
		preload: true,
	},
	msMultPlate: {
		type: 'sprite',
		src: new URL('../../assets/dg/mult_plate.webp', import.meta.url).href,
		preload: true,
	},
	// the multiplier plaque's long cousin (1200x267) behind the portrait counters
	// under the reels; both from art-review/dynamite-gulch/build_plates.py
	msCounterPlate: {
		type: 'sprite',
		src: new URL('../../assets/dg/counter_plate.webp', import.meta.url).href,
		preload: true,
	},
	// One sheet of every static symbol + the multiplier plate (JSON hash). Frames
	// are keyed by filename, e.g. Sprite key="h1.png". Packed by
	// stake-engine/art-review/dynamite-gulch/build_statics.py --install.
	msSymbols: {
		type: 'sprites',
		mipmap: true,
		src: new URL('../../assets/dg/symbols/symbols.json', import.meta.url).href,
		preload: true,
	},
	// Acid-drip "x" + digits for every multiplier value: the plate above the reels
	// and the multiplier symbols on the board. BMFont face "tickup-multipliers";
	// packed upright by tools/bitmap-font-generator/pack-tickup-multipliers.js
	// from art-review/static-sources/tickup-multipliers/raw/.
	tickupMultipliers: {
		type: 'font',
		preload: true,
		src: new URL('../../assets/dg/fonts/tickup-multipliers/tickup-multipliers.xml', import.meta.url).href,
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
		src: new URL('../../assets/dg/fonts/tickup-win/tickup-win.xml', import.meta.url).href,
	},
	// Free-spins intro / outro popup (Evtim's mockup 2026-09-08): the surgical
	// lamp with its beam, the riveted plate with the bloody cloth, the
	// CONGRATULATIONS / YOU WON / TOTAL WIN plates — one rig, intro_* and
	// outro_* animations, slot_line (intro count line) and slot_amount (outro).
	// Built by art-review/madscience/fsintro/build_fsintro.py.
	msFsPopup: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/dg/spines/fspopup/fspopup.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/dg/spines/fspopup/fspopup.json', import.meta.url).href,
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
		src: new URL('../../assets/dg/curtain/curtain_left.webp', import.meta.url).href,
	},
	msCurtainRight: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/dg/curtain/curtain_right.webp', import.meta.url).href,
	},
	// "FREE SPINS" word art for the intro's count line (the number is drawn in
	// the fsintro-digits face next to it, so any spin count lays out)
	fsIntroFreeSpinsTxt: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/madscience/fsintro/free_spins.webp', import.meta.url).href,
	},
	// the retrigger's '+' (FreeSpinRetrigger), drawn beside the fsintro-digits count:
	// Nano Banana 2.1 off the digit sheet, Photoroom cut, 200 px tall = 0.65 of a
	// digit at the atlas's own scale (2026-10-26; sources in art-review/madscience/retrigger/)
	fsRetriggerPlus: {
		type: 'sprite',
		mipmap: true,
		src: new URL('../../assets/madscience/fsintro/plus.webp', import.meta.url).href,
	},
	// orange riveted digits 0-9 for the intro's spin count; packed by
	// tools/bitmap-font-generator/pack-fsintro-digits.js from art-review/static-sources/fsintro-digits/raw/
	fsIntroDigits: {
		type: 'font',
		mipmap: true,
		src: new URL('../../assets/dg/fonts/fsintro-digits/fsintro-digits.xml', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
