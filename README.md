# Space Invaders Canvas Game

A classic retro arcade **Space Invaders** web application built using **pure HTML5 Canvas, CSS3, and vanilla JavaScript**. It requires zero external frameworks, zero build steps, and zero external dependencies.

---

## 🕹️ Project Overview

The **Space Invaders Canvas Game** replicates the authentic 1978 arcade experience in modern desktop web browsers. Players command a laser cannon spaceship defending Earth from descending waves of alien invaders, dodging falling bombs, taking shelter behind destructible bunkers, and shooting down high-value mystery flying saucers.

All game graphics and 8-bit sound effects are generated procedurally in code via Canvas bitmap arrays and the browser Web Audio API—enabling instant loading with 100% offline capability.

---

## 🎮 Game Controls

| Action | Primary Key | Secondary Key | Alternative |
| :--- | :--- | :--- | :--- |
| **Move Left** | <kbd>←</kbd> (Left Arrow) | <kbd>A</kbd> | - |
| **Move Right** | <kbd>→</kbd> (Right Arrow) | <kbd>D</kbd> | - |
| **Fire Laser** | <kbd>SPACEBAR</kbd> | - | Button click on menus |
| **Pause / Resume** | <kbd>P</kbd> | - | "Resume Game" button |
| **Toggle Sound** | <kbd>M</kbd> | - | "Sound: ON/OFF" button |
| **Start / Restart**| <kbd>SPACEBAR</kbd> | - | "Insert Coin & Play" button |

---

## ✨ Features

1. **Retro Arcade Visuals & CRT Effects**:
   - Vintage arcade cabinet bezel with glowing neon accents.
   - CRT scanlines and radial vignette curvature simulation.
   - Google Font *Press Start 2P* pixel typography.
   - Parallax twinkling starfield background.
2. **Authentic Alien Invader Mechanics**:
   - 5 rows of 11 aliens (55 total invaders per wave) across 3 distinct species:
     - **Commander Squid** (Top row) — 30 points
     - **Crab Invader** (Middle 2 rows) — 20 points
     - **Octopus Trooper** (Bottom 2 rows) — 10 points
   - 2-frame walking animations synchronised with horizontal marching steps.
   - Wall bounce and step-down behavior when hitting boundaries.
   - Progressive march acceleration: aliens speed up dramatically as their ranks are depleted.
3. **Mystery Flying Saucer (UFO)**:
   - Periodically cruises across the top of the screen accompanied by a retro siren.
   - Awards bonus mystery points (50, 100, 150, 200, or 300 pts) when destroyed.
4. **Destructible Defense Bunkers (Shields)**:
   - 4 green defensive barricades guarding the player.
   - Realistic sub-pixel erosion/crater damage from both player laser shots and alien bombs.
5. **Alien Bomb Drops & Projectile Interception**:
   - Aliens fire erratic bombs downwards towards the player ship.
   - Player lasers can intercept and destroy alien bombs mid-air!
6. **Player Lives & Respawn Protection**:
   - 3 player lives with visual icon indicators in the HUD.
   - Respawn temporary invulnerability with classic sprite blinking.
7. **Invasion Baseline Failure State**:
   - If the alien fleet reaches Earth's defense baseline, the game triggers an instant Game Over regardless of remaining lives.
8. **Multi-Wave Progression & Difficulty Scaling**:
   - Clearing all aliens triggers a wave clear victory banner and advances to the next level.
   - Successive waves increase base alien march speed, reduce drop intervals, and increase bomb drop rates.
9. **Score Tracking & LocalStorage High Score**:
   - Current Score, All-Time High Score, Wave counter, and Lives dynamically updated.
   - High scores persist in browser `localStorage`.
10. **Native 8-Bit Web Audio Synthesizer**:
    - Synthesizes laser shots, noise-based alien explosions, player destruction, cycling 4-note march cadence, and UFO warbles in real-time.
    - Zero external `.mp3` or `.wav` files required.
    - One-click mute/unmute control.
11. **Responsive Desktop Display**:
    - Automatic crisp pixel-art scaling (`image-rendering: pixelated`) centered on desktop screens.

---

## 📁 Project Structure

```
space-invaders-canvas/
├── index.html        # Main HTML entry point, cabinet bezel, HUD, & modal overlays
├── css/
│   └── style.css     # Retro arcade styling, CRT scanlines, neon glows, responsive layout
├── js/
│   └── game.js       # Modular game engine (state machine, physics, entities, audio, loop)
├── tests/
│   └── game.test.js  # Automated unit test suite (32 unit tests, zero external dependencies)
├── assets/
│   └── README.md     # Architectural guide on procedural sprites and Web Audio synthesis
├── Dockerfile        # Production lightweight Nginx Alpine container image (~40MB)
├── .dockerignore     # Exclusion list for minimal and secure container builds
├── nginx.conf        # Production Nginx configuration with gzip, security headers, & /healthz
├── package.json      # Test runner script configuration
└── README.md         # Documentation and local setup instructions
```

---

## 🐳 Docker Deployment

The application is containerized using an optimized, production-grade **`nginx:1.27-alpine`** image (~40MB total footprint) with built-in gzip compression, security headers, and health monitoring.

### 1. Build the Docker Image
```bash
docker build -t space-invaders-game .
```

### 2. Run the Container
```bash
docker run -d -p 8080:80 --name space-invaders space-invaders-game
```

The game will be accessible in your browser at: **`http://localhost:8080`**

### 3. Check Container Health Status
```bash
# Check container status (includes healthy/unhealthy flag):
docker ps

# Verify health endpoint:
curl http://localhost:8080/healthz
# Expected output: healthy
```

### 4. Stop and Remove the Container
```bash
docker stop space-invaders
docker rm space-invaders
```

### Architecture Highlights:
* **Lightweight & Fast**: Built on Alpine Linux with minimal attack surface (~40MB).
* **Zero Compilation Overhead**: As a vanilla JS app, single-stage deployment serves static files directly through Nginx without heavy node runtimes or dev servers.
* **Production Nginx**: Includes HTTP gzip compression, static asset caching (7 days), and security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
* **Health Check**: Configured with Docker `HEALTHCHECK` pinging `/healthz` every 30s.

---

## 🧪 Automated Testing

The project includes an automated test suite powered by the native Node.js Test Runner (`node:test`) and assertion library (`node:assert/strict`). **Zero external testing libraries or npm packages are required.**

### Run Tests:

```bash
# Direct Node test runner (fastest, works everywhere with Node 18+):
node --test tests/game.test.js

# Or using npm:
npm test
# (On Windows PowerShell if scripts are restricted: npm.cmd test)
```

### Covered Test Areas (32 Tests):
* **Player Movement**: Initial centering, left/right responsiveness, screen boundary clamping (x=15px and right border), conflict handling.
* **Bullet Creation & Projectiles**: Player upward velocity, authentic arcade rate-limit (max 2 active bullets), shooting cooldown, alien bomb downward zigzag physics, out-of-bounds detection.
* **Enemy Creation & Formation**: 55 aliens in 5 rows × 11 columns, species point mapping (Squids 30pts, Crabs 20pts, Octopuses 10pts), initial direction, bottom-row bomb drops, progressive march acceleration.
* **Collision Detection**: AABB bounding-box calculation, bullet hitting alien, bullet eroding bunker blocks, mid-air bullet/bomb interception.
* **Score Increment**: Point awards for Squids, Crabs, Octopuses, and Mystery Saucer UFO (50–300pts).
* **Player Lives & Damage States**: 3 initial lives, bomb damage deduction, hit state, post-respawn invulnerability protection.
* **Game-Over Conditions**: Zero-lives defeat state, defense baseline invasion detection, high score updating and persistence.
* **Level Progression**: Wave clearance, level incrementing, fresh 55-alien fleet respawning, wave-over-wave march acceleration.

---

## 🚀 How to Run Locally

Because the game uses only native web technologies with zero dependencies or server components, you can run it using any of the methods below:

### Option 1: Direct File Opening
Double-click `index.html` in your file explorer, or open it in your browser:
```bash
# In Windows PowerShell:
Start-Process "index.html"
```
*(Note: Modern browsers support all features including Web Audio API once you click "Start Game" or press Space).*

### Option 2: Python Local HTTP Server
From inside the `space-invaders-canvas` folder:

```bash
# Python 3
python -m http.server 8000
```
Then navigate to: **`http://localhost:8000`**

### Option 3: Node.js (npx serve or http-server)
```bash
# Using npx
npx serve .
```

---

## 🌐 Browser Requirements

The game requires modern browser standards support:

* **HTML5 Canvas 2D Context** (`<canvas>`)
* **Web Audio API** (`window.AudioContext` or `webkitAudioContext`)
* **ECMAScript 6+** (ES2015+ Classes, Arrow functions, Modules)
* **CSS3 Flexbox, Grid & Backdrop Filter**
* **LocalStorage API**

### Supported Browsers:
* Google Chrome (v66+)
* Mozilla Firefox (v60+)
* Microsoft Edge (v79+)
* Apple Safari (v14.1+)
* Opera (v53+)
