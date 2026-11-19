/**
 * The background paintings and the dressing (reel frame, the plates over the
 * reels, the popup's plate, the transition curtain): Chaos Lab 1's basement lab
 * and operating theatre, its pipes and its hospital curtain.
 *
 * A purple "storm lab" set (new backgrounds, frame, plates, curtain) was built and
 * switched in here on 2026-11-16 and REJECTED by Evtim the same day ("way too AI and
 * too complicated and a lot of stuff on them"). Its files, the SceneLife that drew its
 * lightning and this module's two-set version are parked in
 * art-review/static-leftovers/storm_2026-11-16/; sources in the workspace's
 * art-review/chaoslab2/backgrounds and frame_v2. (Vite needs each URL as a string literal.)
 */
export const BACKGROUND_URLS = {
	base: new URL('../../assets/madscience/bg_v1.webp', import.meta.url).href,
	portrait: new URL('../../assets/madscience/bg_portrait.webp', import.meta.url).href,
	feature: new URL('../../assets/madscience/fs_bg.webp', import.meta.url).href,
	frame: new URL('../../assets/madscience/frame_resized.webp', import.meta.url).href,
	frameFeature: new URL('../../assets/madscience/frame_resized_fs.webp', import.meta.url).href,
	multPlate: new URL('../../assets/madscience/mult_plate.webp', import.meta.url).href,
	counterPlate: new URL('../../assets/madscience/counter_plate.webp', import.meta.url).href,
	curtainLeft: new URL('../../assets/madscience/curtain/curtain_left.webp', import.meta.url).href,
	curtainRight: new URL('../../assets/madscience/curtain/curtain_right.webp', import.meta.url).href,
	popupAtlas: new URL('../../assets/spines/msFsPopup/fspopup.atlas', import.meta.url).href,
};
