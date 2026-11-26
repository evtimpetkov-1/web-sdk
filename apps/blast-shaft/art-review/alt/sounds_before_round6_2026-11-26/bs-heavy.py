#!/usr/bin/env python3
"""Blast Drop, the HEAVY sound set (2026-11-18). Evtim, after the "Bad sound design"
review: "regenerate the sounds, we should have solid heavy sounds for explosions,
wins, cloners, other effects".

Nobody auditions (one version of everything is his standing ask for this game), so
this script does by measurement what a sound designer does by ear: it LAYERS.

Why layers: the cues were generated again from prompts that ask for weight (takes 2
and 3 of each; take 1 is set v1). Measured, the model then returns the weight and
drops the rest: the new EPIC WIN is a 2 s sub-bass boom with its fanfare 40 dB down,
where set v1's had the fanfare and no low end at all. Neither is the sound. So:

  1. CONTENT. Of all the takes of a cue, the one with the most mid-range (250 Hz to
     4 kHz: the crack, the clang, the tune) for as long as was asked for.
  2. WEIGHT, to a target. Each kind of cue has a share of its energy that should sit
     under 250 Hz (BODY below): heavy, but with the mids a phone's speaker plays.
     - too little: the low end of the cue's heaviest OTHER take is laid under the
       content, its hit on the content's hit, as loud as reaches the target. If no
       take has a low end, a synthesised impact stands in (a sine that drops in
       pitch and dies away, the "sub drop" under every film hit);
     - too much: the low end is turned down to the target.
  3. TRIM and a soft saturation, which gives the low end overtones.

  -> games/blast-shaft/<cue>.mp3 and bs-heavy-picks.json (take and numbers per cue).
Levels are not set here: tools/master-audio.js (its sfx_bs_ rows) is the mix.

    python3 bs-heavy.py [--only a,b]      then, from tools/:
    node assemble-game-audio.js blast-shaft && node build-audio-spritesheet.js blast-shaft
Set v1 is in _archive/blast-shaft_v1_2026-11-18/ (and the game's sprite in the app's
art-review/alt/audio_v1_2026-11-18/restore.sh).
"""
import glob, json, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "games", "blast-shaft")
SR = 44100
KINDS = {
    #        pitch from -> to (Hz), how fast it drops, how fast it dies (s)
    "boom": dict(f0=150, f1=38, drop=0.09, die=0.42),
    "slam": dict(f0=175, f1=52, drop=0.05, die=0.16),
    "tap":  dict(f0=190, f1=70, drop=0.035, die=0.09),
}
# the share of a cue's energy under 250 Hz: (at least, at most), per cent
BODY = {"boom": (55, 72), "slam": (45, 64), "tap": (26, 45), None: (0, 70)}
# cues that carry a tune or a fanfare: it has to be heard over the weight
MUSICAL = {"win_small", "win_medium", "win_big", "win_mega", "win_epic", "win_end", "win_cycle", "scatter_win", "fs_intro",
           "fs_outro", "fs_retrigger", "game_start", "mult_up", "cascade_step", "buy_confirm", "tickup_end"}
BODY_MUSICAL = (32, 52)
WEIGHT = {
    "boom": ["bomb_explode", "clone_burst", "blast_hit", "win_big", "win_mega", "win_epic", "mult_apply", "scatter_win", "fs_intro",
             "cloner_flood", "game_start", "anticipation_end", "fs_outro"],
    "slam": ["bomb_land", "shatter", "win_zap", "win_medium", "tickup_end", "fs_retrigger", "cloner_land", "clone_splat",
             "tumble_drop", "board_dropout", "reel_land", "wild_land", "bonus_land", "mult_land", "buy_confirm"],
    "tap":  ["bomb_arm", "win_cycle", "win_small", "win_end", "mult_activate", "mult_up", "cascade_step", "curtain_close",
             "popup_out", "ui_spin", "ui_stop"],
    None:   ["cloner_cast", "mult_fly", "anticipation_start", "curtain_open"],
}
KIND = {f"sfx_bs_{cue}": kind for kind, cues in WEIGHT.items() for cue in cues}
# PICKED BY EAR: cues Evtim chose from an audition. No layering (the sub drop this script
# adds is what buried the crack of the explosion he called unclear): the take as
# generated, made LOUDER the only way a file already at full scale can be, by density.
# `drive` dB of gain into a soft clip (tanh): the hit's body and its tail come up, the
# peak stays where it was. A re-run of this script makes them again the same way.
PICKED = {
    # 2026-11-18: "Explosion A is the chosen but should be louder". As heard (A-weighted,
    # loudest 0.3 s) after mastering: undriven -12.9 dB, +12 -> -10.6, +15 -> -9.6; the
    # heavy set's explosion was -11.7. More drive = louder and rougher.
    "sfx_bs_bomb_explode": dict(take="candidates/_audition_blast_2026-11-18/raw/explosion_A.mp3", drive=12),
    # 2026-11-26, round 5 of the sound board: the gold eruption (option C) for the cloners'
    # burst, and "for winning can you implement blast alone from option c gold eruption".
    # drive None = the file exactly as he heard it on the board (build_2026-11-26.py already
    # made it dense); master-audio.js puts the winners' copy 3 dB under the cloners'.
    "sfx_bs_clone_burst": dict(take="candidates/_audition_blast_2026-11-26/options/clone_c.mp3", drive=None),
    "sfx_bs_shatter": dict(take="candidates/_audition_blast_2026-11-26/options/clone_c.mp3", drive=None),
}

def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def encode(a, path):
    a = a / max(np.abs(a).max(), 1e-6) * 0.97
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-c:a", "libmp3lame", "-b:a", "192k", path],
                   input=a.astype(np.float32).tobytes(), check=True)

def band_share(mono, lo, hi):
    spec = np.abs(np.fft.rfft(mono)) ** 2
    freq = np.fft.rfftfreq(len(mono), 1 / SR)
    return float(spec[(freq >= lo) & (freq < hi)].sum() / (spec.sum() + 1e-12))

def smooth(x, seconds):
    n = max(1, int(SR * seconds))
    return np.convolve(x, np.ones(n) / n, "same")

def audible(mono):
    """first sample that is heard, last sample of the tail (a boom's rumble is quiet but it is the boom)"""
    env = smooth(np.abs(mono), 0.005)
    on = np.where(env > 0.02 * env.max())[0]
    tail = np.where(env > 0.004 * env.max())[0]
    return (int(on[0]), int(tail[-1])) if len(on) else (0, len(mono) - 1)

def trimmed(a):
    first, last = audible(a.mean(1))
    a = a[max(0, first - int(SR * 0.005)):min(len(a), last + int(SR * 0.05))].copy()
    fade = min(len(a), int(SR * 0.03))
    a[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return a / max(np.abs(a).max(), 1e-6)

def energies(a):
    mono = a.mean(1)
    spec = np.abs(np.fft.rfft(mono)) ** 2
    freq = np.fft.rfftfreq(len(mono), 1 / SR)
    return float(spec[freq < 250].sum()), float(spec[(freq >= 250) & (freq < 4000)].sum()), float(spec[freq >= 4000].sum())

def hit_time(a, low_only=False):
    """where the sound lands: the first moment its (low) envelope is most of the way to its peak"""
    mono = a.mean(1)
    env = smooth(np.abs(lowpass(mono, 220) if low_only else mono), 0.012)
    return int(np.argmax(env > 0.6 * env.max()))

def lowpass(mono, hz):
    spec = np.fft.rfft(mono)
    spec[np.fft.rfftfreq(len(mono), 1 / SR) > hz] = 0
    return np.fft.irfft(spec, len(mono))

def measure(a, asked):
    mono = a.mean(1)
    first, last = audible(mono)
    return dict(body=band_share(mono, 0, 250) * 100, sub=band_share(mono, 0, 90) * 100, mid=band_share(mono, 250, 4000) * 100,
                onset_ms=first / SR * 1000, filled=min(1.0, (last - first) / SR / asked))

def score(m):
    # weight AND something to carry it: a take that is all boom scores no better than one with none
    return min(m["body"], 55) + min(m["mid"], 40) + 25 * m["filled"] - max(0, m["onset_ms"] - 40) / 8

def thump(kind):
    k = KINDS[kind]
    t = np.arange(int(SR * (k["die"] * 4))) / SR
    freq = k["f1"] + (k["f0"] - k["f1"]) * np.exp(-t / k["drop"])
    phase = 2 * np.pi * np.cumsum(freq) / SR
    wave = np.sin(phase) + 0.4 * np.sin(2 * phase)
    return wave * np.exp(-t / k["die"]) * np.minimum(1, t / 0.003)

def low_gain(a, gain, hz=250, width=60):
    """the part of the sound under `hz` turned up or down, with a soft knee"""
    out = np.empty_like(a)
    freq = np.fft.rfftfreq(len(a), 1 / SR)
    curve = 1 + (gain - 1) * np.clip((hz + width - freq) / (2 * width), 0, 1)
    for ch in range(a.shape[1]):
        out[:, ch] = np.fft.irfft(np.fft.rfft(a[:, ch]) * curve, len(a))
    return out

def compose(takes, kind, target, asked):
    """takes: {number: trimmed, peak-normalised audio}. Returns audio and what was done."""
    lo, hi = target
    stats = {n: energies(a) for n, a in takes.items()}
    filled = {n: min(1.0, len(a) / SR / asked) for n, a in takes.items()}
    content = max(takes, key=lambda n: stats[n][1] * (0.5 + 0.5 * filled[n]))
    a = takes[content].copy()
    low, mid, high = stats[content]
    rest = mid + high
    body = low / (low + rest + 1e-12) * 100
    aim = (lo + hi) / 2 / 100
    did = f"take {content}"
    if body > hi:
        gain = np.sqrt((hi / 100 * rest) / ((1 - hi / 100) * low))
        a = low_gain(a, gain)
        did += f", its low end x{gain:.2f}"
    elif body < lo and kind:
        need = (aim * (low + rest) - low) / (1 - aim)
        others = [n for n in takes if n != content]
        donor = max(others, key=lambda n: stats[n][0]) if others else None
        if donor is not None and stats[donor][0] > 3 * low and stats[donor][0] > 0.05 * (low + rest):
            layer = lowpass(takes[donor].mean(1), 320)
            shift = hit_time(a) - hit_time(takes[donor], low_only=True)
            did += f" + the low end of take {donor}"
        else:
            layer = thump(kind)
            shift = hit_time(a)
            did += " + a synthesised impact"
        start = max(0, shift)
        layer = layer[max(0, -shift):]
        if start + len(layer) > len(a):
            a = np.vstack([a, np.zeros((start + len(layer) - len(a), 2), np.float32)])
        gain = np.sqrt(need / max(float((layer ** 2).sum()) * len(layer) / 2, 1e-12))     # Parseval: sum |X|^2 = N/2 * sum x^2 (rfft)
        gain = min(gain, 3.0)
        a[start:start + len(layer)] += (layer * gain)[:, None].astype(np.float32)
        did += f" at {20 * np.log10(max(gain, 1e-9)):+.0f} dB"
    fade = min(len(a), int(SR * 0.03))
    a[-fade:] *= np.linspace(1, 0, fade)[:, None]
    drive = 1.3                        # soft saturation: the weight gains overtones instead of clipping
    return np.tanh(a / max(np.abs(a).max(), 1e-6) * drive) / np.tanh(drive), did

def main():
    only = None
    if "--only" in sys.argv: only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    manifest = {e["name"]: e for e in json.load(open(os.path.join(HERE, "manifest-blast-shaft.json")))["sounds"]}
    picks = {}
    for cue, kind in sorted(KIND.items()):
        if only and cue not in only: continue
        if cue in PICKED:
            pick = PICKED[cue]
            raw = decode(os.path.join(HERE, pick["take"]))
            driven = raw / np.abs(raw).max() if pick["drive"] is None else np.tanh(raw * 10 ** (pick["drive"] / 20))
            # the same 0.9 ceiling for every pick (encode() would scale to 0.97: mp3 overshoots)
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-c:a", "libmp3lame", "-b:a", "192k",
                            os.path.join(OUT, f"{cue}.mp3")], input=(driven * 0.9).astype(np.float32).tobytes(), check=True)
            after = measure(decode(os.path.join(OUT, f"{cue}.mp3")), manifest[cue]["duration"])
            how = "as heard on the board" if pick["drive"] is None else f"as generated, +{pick['drive']} dB into a soft clip"
            picks[cue] = dict(kind=kind, did=f"Evtim's pick {pick['take']}, {how}",
                              seconds=manifest[cue]["duration"], body=round(after["body"], 1), mid=round(after["mid"], 1))
            print(f"{cue:28s} PICKED  {pick['take']}  {how}")
            continue
        files = {int(re.search(r"_v(\d+)\.mp3$", f).group(1)): f for f in glob.glob(os.path.join(HERE, "candidates", cue, f"{cue}_v*.mp3"))}
        asked = manifest[cue]["duration"]
        takes = {}
        for n, f in files.items():
            raw = decode(f)
            if np.abs(raw).max() > 0.02: takes[n] = trimmed(raw)       # a silent take is no take
        target = BODY_MUSICAL if cue[len("sfx_bs_"):] in MUSICAL else BODY[kind]
        out, did = compose(takes, kind, target, asked)
        encode(out, os.path.join(OUT, f"{cue}.mp3"))
        after = measure(decode(os.path.join(OUT, f"{cue}.mp3")), asked)
        picks[cue] = dict(kind=kind, did=did, seconds=round(len(out) / SR, 2), body=round(after["body"], 1), mid=round(after["mid"], 1))
        print(f"{cue:28s} {kind or '-':4s} {len(out) / SR:4.2f}s (asked {asked})  under 250 Hz {after['body']:5.1f}%  mid {after['mid']:5.1f}%  {did}")
    path = os.path.join(HERE, "bs-heavy-picks.json")
    known = json.load(open(path)) if os.path.exists(path) else {}
    known.update(picks)
    json.dump(known, open(path, "w"), indent=1)

if __name__ == "__main__":
    main()
