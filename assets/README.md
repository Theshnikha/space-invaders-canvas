# Assets Directory

## Overview

The **Space Invaders Canvas Game** is engineered with a **Zero-Dependency Procedural Asset Architecture**. All visual sprites and sound effects are generated programmatically in real-time, eliminating external asset load latency, missing image/audio 404 errors, and bandwidth overhead.

---

## 1. Pixel Art Sprites (Procedural Bitmap Matrices)

Rather than loading external sprite sheets or PNG files, all game sprites are defined as 2-dimensional binary arrays in `js/game.js` (`SPRITES` object) and rendered directly onto the HTML5 Canvas via `renderMatrixSprite()`:

* **Player Defender Tank** (`11 × 8` matrix, Neon Cyan)
* **Commander Squid Invader** (`8 × 8` matrix, 2 animation frames, 30 points, Neon Magenta)
* **Crab Invader** (`11 × 8` matrix, 2 animation frames, 20 points, Neon Cyan)
* **Octopus Trooper Invader** (`12 × 8` matrix, 2 animation frames, 10 points, Neon Green)
* **Mystery Flying Saucer (UFO)** (`16 × 7` matrix, 50–300 points, Neon Red)
* **Destructible Defense Bunkers** (`18 × 14` block matrix with individual sub-pixel chip damage craters)

### Adding Custom PNG / Sprite Assets (Optional)
If you wish to replace procedural bitmaps with custom graphic files:
1. Place image files (e.g. `sprites.png`) inside this `assets/` directory.
2. In `js/game.js`, load the image via `new Image()` and replace `renderMatrixSprite()` calls with `ctx.drawImage()`.

---

## 2. Retro Audio Synthesizer (Web Audio API)

Sound effects are synthesized dynamically using the browser's native **Web Audio API** in the `RetroAudio` class:

* **Laser Cannon**: Square oscillator pitch-sliding exponentially from 880Hz to 110Hz.
* **Alien Explosion**: Bandpass-filtered white noise buffer burst (600Hz down to 100Hz).
* **Player Ship Explosion**: Low-pass filtered decaying noise burst with pitch dive (400Hz to 40Hz).
* **Alien March Cadence**: 4-note cycling low square-wave bass pulses (110Hz, 98Hz, 87Hz, 73Hz).
* **UFO Mystery Siren**: Sawtooth oscillator warbling between 480Hz and 560Hz.
* **Wave Cleared**: 4-tone ascending arpeggio fanfare (C4, E4, G4, C5).

### Adding Custom Audio Files (Optional)
If you prefer `.wav` or `.mp3` samples:
1. Place audio files (e.g., `shoot.wav`, `explosion.wav`) in this `assets/` directory.
2. In `js/game.js`, preload them using `new Audio('assets/filename.wav')` or `fetch()` + `audioContext.decodeAudioData()`.
