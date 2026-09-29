/**
 * Space Invaders Canvas Game
 * Clean, modular, zero-dependency retro arcade game engine.
 */

'use strict';

/* ==========================================================================
   1. RETRO AUDIO SYNTHESIZER (Web Audio API - Zero External Audio Files)
   ========================================================================== */

class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.marchFrequencies = [110, 98, 87, 73]; // Classic 4-note invader march
    this.marchIndex = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Player laser shot: fast pitch down glide
  playShoot() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  // Alien explosion: noise burst
  playAlienHit() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(100, now + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (_) {}
  }

  // Player death sound: long decaying retro explosion
  playPlayerDeath() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 0.6);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (_) {}
  }

  // Alien march step: cycling low bass thump
  playMarchStep() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freq = this.marchFrequencies[this.marchIndex];
      this.marchIndex = (this.marchIndex + 1) % this.marchFrequencies.length;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (_) {}
  }

  // UFO high-pitched retro mystery siren
  playUfoSiren() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.1);
      osc.frequency.linearRampToValueAtTime(480, now + 0.2);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (_) {}
  }

  // Level Clear jingle
  playLevelClear() {
    if (!this.enabled || !this.ctx) return;
    try {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = this.ctx.currentTime + i * 0.12;

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.18);
      });
    } catch (_) {}
  }
}

/* ==========================================================================
   2. PROCEDURAL RETRO SPRITE MATRICES (Pixel Art)
   ========================================================================== */

const SPRITES = {
  // Player Tank (11x8)
  player: [
    [0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1]
  ],

  // Squid (Top row: 30 pts) - 8x8 (Frame A & B)
  squid: [
    [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [0,0,1,0,0,1,0,0],
      [0,1,0,1,1,0,1,0],
      [1,0,1,0,0,1,0,1]
    ],
    [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,0,1,1,0,1,0],
      [1,0,0,0,0,0,0,1],
      [0,1,0,0,0,0,1,0]
    ]
  ],

  // Crab (Middle rows: 20 pts) - 11x8 (Frame A & B)
  crab: [
    [
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,0,0,1,0,0,0,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,1],
      [0,0,0,1,1,0,1,1,0,0,0]
    ],
    [
      [0,0,1,0,0,0,0,0,1,0,0],
      [1,0,0,1,0,0,0,1,0,0,1],
      [1,0,1,1,1,1,1,1,1,0,1],
      [1,1,1,0,1,1,1,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,0,0,1,0]
    ]
  ],

  // Octopus (Bottom rows: 10 pts) - 12x8 (Frame A & B)
  octopus: [
    [
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,0,1,1,0,0,1,1,0,0,0],
      [0,0,1,1,0,1,1,0,1,1,0,0],
      [1,1,0,0,0,0,0,0,0,0,1,1]
    ],
    [
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,0,0,0,1,1,0,0],
      [0,1,1,0,0,1,1,0,0,1,1,0],
      [0,0,1,1,0,0,0,0,1,1,0,0]
    ]
  ],

  // Mystery UFO (16x7)
  ufo: [
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0]
  ]
};

function renderMatrixSprite(ctx, matrix, x, y, pixelSize, color) {
  ctx.fillStyle = color;
  const rows = matrix.length;
  for (let r = 0; r < rows; r++) {
    const cols = matrix[r].length;
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(x + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

/* ==========================================================================
   3. STARFIELD BACKGROUND (Depth & Retro Ambiance)
   ========================================================================== */

class Starfield {
  constructor(width, height, count = 75) {
    this.width = width;
    this.height = height;
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.2 ? 2 : 1,
        speed: 0.15 + Math.random() * 0.45,
        brightness: 0.2 + Math.random() * 0.8,
        pulseSpeed: 0.02 + Math.random() * 0.04,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt) {
    for (const star of this.stars) {
      star.y += star.speed * (dt / 16.6);
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      star.pulseOffset += star.pulseSpeed;
    }
  }

  draw(ctx) {
    ctx.save();
    for (const star of this.stars) {
      const alpha = star.brightness * (0.6 + 0.4 * Math.sin(star.pulseOffset));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
    }
    ctx.restore();
  }
}

/* ==========================================================================
   4. PARTICLE EFFECTS & FLOATING SCORES
   ========================================================================== */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  createExplosion(x, y, color, count = 18, speedMult = 1.0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 3.5) * speedMult;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() < 0.5 ? 2 : 3,
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.025
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffe600') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -0.8,
      alpha: 1.0,
      color
    });
  }

  update(dt) {
    const timeScale = dt / 16.6;

    // Update explosion particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.alpha -= p.decay * timeScale;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating score texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * timeScale;
      ft.alpha -= 0.02 * timeScale;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    // Draw particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }

    // Draw floating score text
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}

/* ==========================================================================
   5. DESTRUCTIBLE BUNKERS / DEFENSIVE SHIELDS
   ========================================================================== */

class Bunker {
  constructor(x, y, scale = 4) {
    this.x = x;
    this.y = y;
    this.scale = scale; // each block is 4x4 px
    // Classic Space Invaders Bunker shape matrix (18 cols x 14 rows)
    const baseShape = [
      [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1],
      [1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1],
      [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
      [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
      [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1]
    ];

    this.rows = baseShape.length;
    this.cols = baseShape[0].length;
    this.width = this.cols * this.scale;
    this.height = this.rows * this.scale;

    // Create mutable grid
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = baseShape[r][c];
      }
    }
  }

  // Damage bunker around collision point with a crater radius
  damage(impactX, impactY, radius = 2) {
    const colCenter = Math.floor((impactX - this.x) / this.scale);
    const rowCenter = Math.floor((impactY - this.y) / this.scale);
    let hitBlocks = false;

    const rInt = Math.ceil(radius);
    const startRow = Math.max(0, rowCenter - rInt);
    const endRow = Math.min(this.rows - 1, rowCenter + rInt);
    const startCol = Math.max(0, colCenter - rInt);
    const endCol = Math.min(this.cols - 1, colCenter + rInt);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const dist = Math.hypot(c - colCenter, r - rowCenter);
        if (dist <= radius + Math.random() * 0.5) {
          if (this.grid[r] && this.grid[r][c] === 1) {
            this.grid[r][c] = 0;
            hitBlocks = true;
          }
        }
      }
    }
    return hitBlocks;
  }

  checkCollision(rect) {
    // Fast bounding box check
    if (
      rect.x + rect.width < this.x ||
      rect.x > this.x + this.width ||
      rect.y + rect.height < this.y ||
      rect.y > this.y + this.height
    ) {
      return false;
    }

    // Precise grid block check
    const startCol = Math.max(0, Math.floor((rect.x - this.x) / this.scale));
    const endCol = Math.min(this.cols - 1, Math.floor((rect.x + rect.width - this.x) / this.scale));
    const startRow = Math.max(0, Math.floor((rect.y - this.y) / this.scale));
    const endRow = Math.min(this.rows - 1, Math.floor((rect.y + rect.height - this.y) / this.scale));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.grid[r][c] === 1) {
          return true;
        }
      }
    }
    return false;
  }

  draw(ctx) {
    ctx.fillStyle = '#39ff14'; // Classic glowing green shields
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 1) {
          ctx.fillRect(this.x + c * this.scale, this.y + r * this.scale, this.scale, this.scale);
        }
      }
    }
  }
}

/* ==========================================================================
   6. PLAYER SPACESHIP ENTITY
   ========================================================================== */

class Player {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.pixelSize = 3;
    this.width = SPRITES.player[0].length * this.pixelSize; // 11 * 3 = 33px
    this.height = SPRITES.player.length * this.pixelSize;    // 8 * 3 = 24px
    
    this.baseSpeed = 340; // Pixels per second
    this.reset();
  }

  reset() {
    this.x = (this.canvasWidth - this.width) / 2;
    this.y = this.canvasHeight - 55;
    this.vx = 0;
    this.lives = 3;
    this.isHit = false;
    this.hitTimer = 0;
    this.invulnerableTimer = 0;
    this.shootCooldown = 0;
  }

  respawn() {
    this.x = (this.canvasWidth - this.width) / 2;
    this.vx = 0;
    this.isHit = false;
    this.hitTimer = 0;
    this.invulnerableTimer = 2.0; // 2 seconds invulnerability after respawn
  }

  update(dt, input) {
    const seconds = dt / 1000;

    // Cooldown timers
    if (this.shootCooldown > 0) this.shootCooldown -= seconds;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= seconds;

    if (this.isHit) {
      this.hitTimer -= seconds;
      if (this.hitTimer <= 0) {
        if (this.lives > 0) {
          this.respawn();
        }
      }
      return;
    }

    // Input Movement
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    // Movement physics with responsive friction/velocity
    this.vx = moveDir * this.baseSpeed;
    this.x += this.vx * seconds;

    // Clamp within screen boundaries
    if (this.x < 15) this.x = 15;
    if (this.x + this.width > this.canvasWidth - 15) {
      this.x = this.canvasWidth - 15 - this.width;
    }
  }

  draw(ctx) {
    if (this.isHit) return;

    // Blinking effect during invulnerability
    if (this.invulnerableTimer > 0) {
      if (Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
        return; // Skip drawing to create flicker
      }
    }

    renderMatrixSprite(ctx, SPRITES.player, this.x, this.y, this.pixelSize, '#00f3ff');
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

/* ==========================================================================
   7. PROJECTILES (Player Lasers & Alien Bombs)
   ========================================================================== */

class Bullet {
  constructor(x, y, vy, color, isAlien = false) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.width = isAlien ? 3 : 3;
    this.height = isAlien ? 10 : 12;
    this.color = color;
    this.isAlien = isAlien;
    this.zigzagPhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    const seconds = dt / 1000;
    this.y += this.vy * seconds;

    // Alien missiles have a classic erratic squiggle movement
    if (this.isAlien) {
      this.zigzagPhase += seconds * 15;
      this.x += Math.sin(this.zigzagPhase) * 0.8;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.width, this.height);
    ctx.shadowBlur = 0;
  }

  isOutOfBounds(canvasHeight) {
    return this.y < -15 || this.y > canvasHeight + 15;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

/* ==========================================================================
   8. ALIEN FLEET & MYSTERY UFO
   ========================================================================== */

class Alien {
  constructor(x, y, row, col, type, points, color) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.col = col;
    this.type = type;
    this.points = points;
    this.color = color;
    this.pixelSize = 3;
    this.spriteMatrix = SPRITES[type];
    this.width = this.spriteMatrix[0][0].length * this.pixelSize;
    this.height = this.spriteMatrix[0].length * this.pixelSize;
    this.alive = true;
  }

  draw(ctx, frame) {
    if (!this.alive) return;
    const currentFrameMatrix = this.spriteMatrix[frame % 2];
    renderMatrixSprite(ctx, currentFrameMatrix, Math.floor(this.x), Math.floor(this.y), this.pixelSize, this.color);
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

class AlienFleet {
  constructor(canvasWidth, canvasHeight, audio) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.audio = audio;
    this.aliens = [];
    this.direction = 1; // 1 = right, -1 = left
    this.stepSizeX = 14;
    this.stepSizeY = 20;
    this.animationFrame = 0;
    this.marchTimer = 0;
    this.baseMarchInterval = 0.8;
    this.currentMarchInterval = 0.8;
    this.bombCooldown = 0;
    this.totalInitialAliens = 55;
  }

  init(level = 1) {
    this.aliens = [];
    this.direction = 1;
    this.animationFrame = 0;
    this.bombCooldown = 1.5 + Math.random() * 1.0;

    const rows = 5;
    const cols = 11;
    this.totalInitialAliens = rows * cols;

    // Difficulty scaling based on level
    this.baseMarchInterval = Math.max(0.25, 0.85 - (level - 1) * 0.08);
    this.currentMarchInterval = this.baseMarchInterval;
    this.stepDownDistance = 18;

    const startX = 60;
    const startY = 70 + Math.min(40, (level - 1) * 6); // slightly lower each level
    const spacingX = 46;
    const spacingY = 34;

    for (let r = 0; r < rows; r++) {
      let type, points, color;
      if (r === 0) {
        type = 'squid';
        points = 30;
        color = '#ff007f'; // neon magenta
      } else if (r === 1 || r === 2) {
        type = 'crab';
        points = 20;
        color = '#00f3ff'; // neon cyan
      } else {
        type = 'octopus';
        points = 10;
        color = '#39ff14'; // neon green
      }

      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX;
        const y = startY + r * spacingY;
        this.aliens.push(new Alien(x, y, r, c, type, points, color));
      }
    }
  }

  getAliveAliens() {
    return this.aliens.filter(a => a.alive);
  }

  update(dt, onBombDrop) {
    const seconds = dt / 1000;
    const aliveAliens = this.getAliveAliens();
    const aliveCount = aliveAliens.length;

    if (aliveCount === 0) return;

    // Dynamic speedup: classic tension acceleration as alien count dwindles
    const countRatio = aliveCount / this.totalInitialAliens;
    this.currentMarchInterval = Math.max(0.06, this.baseMarchInterval * Math.pow(countRatio, 0.85));

    this.marchTimer += seconds;
    if (this.marchTimer >= this.currentMarchInterval) {
      this.marchTimer = 0;
      this.stepMarch();
    }

    // Alien bomb firing mechanism
    this.bombCooldown -= seconds;
    if (this.bombCooldown <= 0) {
      this.bombCooldown = 0.6 + Math.random() * 1.4 * (countRatio + 0.3);
      this.fireRandomBomb(aliveAliens, onBombDrop);
    }
  }

  stepMarch() {
    const aliveAliens = this.getAliveAliens();
    if (aliveAliens.length === 0) return;

    // Check if edge reached
    let hitEdge = false;
    for (const alien of aliveAliens) {
      if (this.direction === 1 && alien.x + alien.width >= this.canvasWidth - 25) {
        hitEdge = true;
        break;
      }
      if (this.direction === -1 && alien.x <= 25) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      // Step down and reverse direction
      this.direction *= -1;
      for (const alien of aliveAliens) {
        alien.y += this.stepDownDistance;
      }
    } else {
      // Step horizontal
      for (const alien of aliveAliens) {
        alien.x += this.stepSizeX * this.direction;
      }
    }

    this.animationFrame = (this.animationFrame + 1) % 2;
    this.audio.playMarchStep();
  }

  fireRandomBomb(aliveAliens, onBombDrop) {
    if (aliveAliens.length === 0) return;

    // Find bottom-most aliens in each column
    const columnBottomMap = new Map();
    for (const alien of aliveAliens) {
      const existing = columnBottomMap.get(alien.col);
      if (!existing || alien.row > existing.row) {
        columnBottomMap.set(alien.col, alien);
      }
    }

    const shooters = Array.from(columnBottomMap.values());
    if (shooters.length > 0) {
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      const bombX = shooter.x + shooter.width / 2 - 1.5;
      const bombY = shooter.y + shooter.height + 2;
      onBombDrop(bombX, bombY);
    }
  }

  hasReachedBottom(cutoffY) {
    const alive = this.getAliveAliens();
    for (const alien of alive) {
      if (alien.y + alien.height >= cutoffY) {
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    for (const alien of this.aliens) {
      alien.draw(ctx, this.animationFrame);
    }
  }
}

class MysterySaucer {
  constructor(canvasWidth, audio) {
    this.canvasWidth = canvasWidth;
    this.audio = audio;
    this.pixelSize = 3;
    this.width = SPRITES.ufo[0].length * this.pixelSize; // 16 * 3 = 48px
    this.height = SPRITES.ufo.length * this.pixelSize;   // 7 * 3 = 21px
    this.y = 42;
    this.active = false;
    this.x = 0;
    this.speed = 140;
    this.direction = 1;
    this.spawnTimer = 15 + Math.random() * 15;
    this.soundTimer = 0;
  }

  reset() {
    this.active = false;
    this.spawnTimer = 15 + Math.random() * 15;
    this.soundTimer = 0;
  }

  update(dt) {
    const seconds = dt / 1000;

    if (!this.active) {
      this.spawnTimer -= seconds;
      if (this.spawnTimer <= 0) {
        this.spawn();
      }
      return;
    }

    // Move saucer
    this.x += this.speed * this.direction * seconds;

    // Periodic retro siren sound
    this.soundTimer += seconds;
    if (this.soundTimer >= 0.22) {
      this.soundTimer = 0;
      this.audio.playUfoSiren();
    }

    // Check bounds
    if ((this.direction === 1 && this.x > this.canvasWidth + 20) ||
        (this.direction === -1 && this.x < -this.width - 20)) {
      this.active = false;
      this.spawnTimer = 20 + Math.random() * 20;
    }
  }

  spawn() {
    this.active = true;
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -this.width : this.canvasWidth;
    this.soundTimer = 0;
  }

  getPoints() {
    const possible = [50, 100, 150, 200, 300];
    return possible[Math.floor(Math.random() * possible.length)];
  }

  draw(ctx) {
    if (!this.active) return;
    renderMatrixSprite(ctx, SPRITES.ufo, Math.floor(this.x), Math.floor(this.y), this.pixelSize, '#ff3131');
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

/* ==========================================================================
   9. MAIN GAME ENGINE
   ========================================================================== */

const GAME_STATE = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_CLEARED: 'LEVEL_CLEARED',
  GAME_OVER: 'GAME_OVER'
};

class SpaceInvadersGame {
  constructor(canvasMock = null, domMock = null) {
    if (typeof document !== 'undefined') {
      this.canvas = canvasMock || document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;

      this.dom = domMock || {
        score: document.getElementById('score-display'),
        highScore: document.getElementById('high-score-display'),
        level: document.getElementById('level-display'),
        lives: document.getElementById('lives-display'),
        startScreen: document.getElementById('start-screen'),
        pauseScreen: document.getElementById('pause-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        gameOverReason: document.getElementById('game-over-reason'),
        finalScore: document.getElementById('final-score'),
        finalWave: document.getElementById('final-wave'),
        finalHighScore: document.getElementById('final-high-score'),
        newRecordBanner: document.getElementById('new-record-banner'),
        startBtn: document.getElementById('start-btn'),
        resumeBtn: document.getElementById('resume-btn'),
        restartBtn: document.getElementById('restart-btn'),
        soundToggleBtn: document.getElementById('sound-toggle-btn'),
        soundStatus: document.getElementById('sound-status'),
        soundIcon: document.getElementById('sound-icon')
      };
      this.bindEvents();
    } else {
      // Headless / Automated test environment
      this.canvas = canvasMock || {
        width: 800,
        height: 600,
        getContext: () => ({
          clearRect: () => {},
          fillRect: () => {},
          strokeRect: () => {},
          fillText: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          save: () => {},
          restore: () => {},
          setLineDash: () => {}
        })
      };
      this.ctx = this.canvas.getContext('2d');
      this.canvasWidth = this.canvas.width;
      this.canvasHeight = this.canvas.height;

      const createMockEl = () => ({
        textContent: '',
        innerHTML: '',
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        appendChild: () => {},
        addEventListener: () => {}
      });

      this.dom = domMock || {
        score: createMockEl(),
        highScore: createMockEl(),
        level: createMockEl(),
        lives: createMockEl(),
        startScreen: createMockEl(),
        pauseScreen: createMockEl(),
        gameOverScreen: createMockEl(),
        gameOverReason: createMockEl(),
        finalScore: createMockEl(),
        finalWave: createMockEl(),
        finalHighScore: createMockEl(),
        newRecordBanner: createMockEl(),
        startBtn: createMockEl(),
        resumeBtn: createMockEl(),
        restartBtn: createMockEl(),
        soundToggleBtn: createMockEl(),
        soundStatus: createMockEl(),
        soundIcon: createMockEl()
      };
    }

    // Systems
    this.audio = new RetroAudio();
    this.starfield = new Starfield(this.canvasWidth, this.canvasHeight);
    this.particles = new ParticleSystem();

    // Game Entities
    this.player = new Player(this.canvasWidth, this.canvasHeight);
    this.fleet = new AlienFleet(this.canvasWidth, this.canvasHeight, this.audio);
    this.mysterySaucer = new MysterySaucer(this.canvasWidth, this.audio);
    this.bunkers = [];
    this.playerBullets = [];
    this.alienBullets = [];

    // State Variables
    this.state = GAME_STATE.START;
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.level = 1;
    this.levelTransitionTimer = 0;
    this.lastTime = 0;

    // Input tracker
    this.input = {
      left: false,
      right: false,
      space: false
    };

    this.updateHUD();
    this.initBunkers();

    // Start rendering background loop if in browser
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  loadHighScore() {
    try {
      if (typeof localStorage !== 'undefined') {
        return parseInt(localStorage.getItem('space_invaders_hi_score') || '0', 10);
      }
    } catch (_) {}
    return 0;
  }

  saveHighScore() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('space_invaders_hi_score', this.highScore.toString());
      }
    } catch (_) {}
  }

  initBunkers() {
    this.bunkers = [];
    const bunkerCount = 4;
    const bunkerWidth = 18 * 4; // 72px
    const totalSpan = this.canvasWidth - 140;
    const spacing = (totalSpan - bunkerCount * bunkerWidth) / (bunkerCount - 1);
    const startX = 70;
    const bunkerY = this.canvasHeight - 130;

    for (let i = 0; i < bunkerCount; i++) {
      const x = startX + i * (bunkerWidth + spacing);
      this.bunkers.push(new Bunker(x, bunkerY, 4));
    }
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.audio.init();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.input.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.input.right = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleSpacePress();
      }
      if (e.code === 'KeyP') {
        this.togglePause();
      }
      if (e.code === 'KeyM') {
        this.toggleSound();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.input.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.input.right = false;
      }
      if (e.code === 'Space') {
        this.input.space = false;
      }
    });

    // Button interactions
    this.dom.startBtn.addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    this.dom.resumeBtn.addEventListener('click', () => {
      this.togglePause();
    });

    this.dom.restartBtn.addEventListener('click', () => {
      this.audio.init();
      this.startGame();
    });

    this.dom.soundToggleBtn.addEventListener('click', () => {
      this.audio.init();
      this.toggleSound();
    });
  }

  toggleSound() {
    const isEnabled = this.audio.toggleSound();
    this.dom.soundStatus.textContent = isEnabled ? 'ON' : 'OFF';
    this.dom.soundIcon.textContent = isEnabled ? '🔊' : '🔇';
    if (!isEnabled) {
      this.dom.soundToggleBtn.classList.add('muted');
    } else {
      this.dom.soundToggleBtn.classList.remove('muted');
    }
  }

  handleSpacePress() {
    if (this.state === GAME_STATE.START) {
      this.startGame();
    } else if (this.state === GAME_STATE.GAME_OVER) {
      this.startGame();
    } else if (this.state === GAME_STATE.PAUSED) {
      this.togglePause();
    } else if (this.state === GAME_STATE.PLAYING) {
      this.firePlayerLaser();
    }
  }

  startGame() {
    this.score = 0;
    this.level = 1;
    this.player.reset();
    this.initBunkers();
    this.particles.clear();
    this.playerBullets = [];
    this.alienBullets = [];
    this.mysterySaucer.reset();
    this.fleet.init(this.level);

    this.state = GAME_STATE.PLAYING;
    this.dom.startScreen.classList.remove('active');
    this.dom.startScreen.classList.add('hidden');
    this.dom.gameOverScreen.classList.remove('active');
    this.dom.gameOverScreen.classList.add('hidden');
    this.dom.pauseScreen.classList.remove('active');
    this.dom.pauseScreen.classList.add('hidden');

    this.updateHUD();
  }

  startNextLevel() {
    this.level++;
    this.playerBullets = [];
    this.alienBullets = [];
    this.fleet.init(this.level);
    this.mysterySaucer.reset();
    this.audio.playLevelClear();

    this.state = GAME_STATE.LEVEL_CLEARED;
    this.levelTransitionTimer = 2.0; // 2 seconds banner display

    this.updateHUD();
  }

  togglePause() {
    if (this.state === GAME_STATE.PLAYING) {
      this.state = GAME_STATE.PAUSED;
      this.dom.pauseScreen.classList.remove('hidden');
      this.dom.pauseScreen.classList.add('active');
    } else if (this.state === GAME_STATE.PAUSED) {
      this.state = GAME_STATE.PLAYING;
      this.dom.pauseScreen.classList.remove('active');
      this.dom.pauseScreen.classList.add('hidden');
    }
  }

  firePlayerLaser() {
    if (this.player.isHit) return;

    // Authentic arcade limit: max 2 active player bullets simultaneously
    if (this.playerBullets.length >= 2 || this.player.shootCooldown > 0) {
      return;
    }

    const bulletX = this.player.x + this.player.width / 2 - 1.5;
    const bulletY = this.player.y - 10;
    this.playerBullets.push(new Bullet(bulletX, bulletY, -520, '#00f3ff', false));
    this.player.shootCooldown = 0.22;
    this.audio.playShoot();
  }

  triggerGameOver(reason = 'THE INVASION SUCCEEDED') {
    this.state = GAME_STATE.GAME_OVER;
    const isNewRecord = this.score > this.highScore;

    if (isNewRecord) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    this.dom.gameOverReason.textContent = reason;
    this.dom.finalScore.textContent = this.score.toString().padStart(5, '0');
    this.dom.finalWave.textContent = this.level.toString().padStart(2, '0');
    this.dom.finalHighScore.textContent = this.highScore.toString().padStart(5, '0');

    if (isNewRecord && this.score > 0) {
      this.dom.newRecordBanner.classList.remove('hidden');
    } else {
      this.dom.newRecordBanner.classList.add('hidden');
    }

    this.dom.gameOverScreen.classList.remove('hidden');
    this.dom.gameOverScreen.classList.add('active');
    this.updateHUD();
  }

  updateHUD() {
    this.dom.score.textContent = this.score.toString().padStart(5, '0');
    this.dom.highScore.textContent = this.highScore.toString().padStart(5, '0');
    this.dom.level.textContent = this.level.toString().padStart(2, '0');

    // Render lives icons
    this.dom.lives.innerHTML = '';
    for (let i = 0; i < this.player.lives; i++) {
      const icon = typeof document !== 'undefined' ? document.createElement('span') : { className: '' };
      icon.className = 'life-icon';
      this.dom.lives.appendChild(icon);
    }
  }

  // Axis-Aligned Bounding Box (AABB) Collision Detection
  checkRectOverlap(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  /* ==========================================================================
     PHYSICS & COLLISION DETECTION
     ========================================================================== */
  updateGame(dt) {
    // 1. Starfield & Particles update in all states
    this.starfield.update(dt);
    this.particles.update(dt);

    if (this.state === GAME_STATE.LEVEL_CLEARED) {
      this.levelTransitionTimer -= dt / 1000;
      if (this.levelTransitionTimer <= 0) {
        this.state = GAME_STATE.PLAYING;
      }
      return;
    }

    if (this.state !== GAME_STATE.PLAYING) return;

    // 2. Update Player
    this.player.update(dt, this.input);

    // 3. Update Fleet & Bomb Drops
    this.fleet.update(dt, (bombX, bombY) => {
      // Alien bomb velocity scales gently with waves
      const bombSpeed = 220 + Math.min(100, (this.level - 1) * 15);
      this.alienBullets.push(new Bullet(bombX, bombY, bombSpeed, '#ff3131', true));
    });

    // 4. Update Mystery Saucer
    this.mysterySaucer.update(dt);

    // 5. Update Player Bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.update(dt);
      if (b.isOutOfBounds(this.canvasHeight)) {
        this.playerBullets.splice(i, 1);
      }
    }

    // 6. Update Alien Bullets
    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const b = this.alienBullets[i];
      b.update(dt);
      if (b.isOutOfBounds(this.canvasHeight)) {
        this.alienBullets.splice(i, 1);
      }
    }

    // 7. Check Collisions: Player Laser vs Aliens
    bulletLoop: for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const bullet = this.playerBullets[bi];
      const bBounds = bullet.getBounds();

      // Check against Mystery Saucer
      if (this.mysterySaucer.active) {
        const ufoBounds = this.mysterySaucer.getBounds();
        if (this.checkRectOverlap(bBounds, ufoBounds)) {
          const pts = this.mysterySaucer.getPoints();
          this.score += pts;
          this.mysterySaucer.active = false;
          this.playerBullets.splice(bi, 1);
          this.particles.createExplosion(bullet.x, bullet.y, '#ff3131', 25, 1.3);
          this.particles.createFloatingText(`+${pts}`, bullet.x, bullet.y, '#ff3131');
          this.audio.playAlienHit();
          this.updateHUD();
          continue bulletLoop;
        }
      }

      // Check against Invader Fleet
      for (const alien of this.fleet.aliens) {
        if (!alien.alive) continue;
        const aBounds = alien.getBounds();

        if (this.checkRectOverlap(bBounds, aBounds)) {
          alien.alive = false;
          this.score += alien.points;
          this.playerBullets.splice(bi, 1);
          this.particles.createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, alien.color, 16);
          this.particles.createFloatingText(`+${alien.points}`, alien.x + alien.width / 2, alien.y, alien.color);
          this.audio.playAlienHit();
          this.updateHUD();

          // Check if wave is wiped out
          if (this.fleet.getAliveAliens().length === 0) {
            this.startNextLevel();
          }
          continue bulletLoop;
        }
      }

      // Check against Bunkers
      for (const bunker of this.bunkers) {
        if (bunker.checkCollision(bBounds)) {
          bunker.damage(bullet.x, bullet.y, 2.5);
          this.playerBullets.splice(bi, 1);
          this.particles.createExplosion(bullet.x, bullet.y, '#39ff14', 6, 0.7);
          continue bulletLoop;
        }
      }
    }

    // 8. Check Collisions: Alien Bombs vs Player & Bunkers & Player Lasers
    bombLoop: for (let bi = this.alienBullets.length - 1; bi >= 0; bi--) {
      const bomb = this.alienBullets[bi];
      const bombBounds = bomb.getBounds();

      // Bomb hits Bunker
      for (const bunker of this.bunkers) {
        if (bunker.checkCollision(bombBounds)) {
          bunker.damage(bomb.x, bomb.y, 3);
          this.alienBullets.splice(bi, 1);
          this.particles.createExplosion(bomb.x, bomb.y, '#39ff14', 6, 0.7);
          continue bombLoop;
        }
      }

      // Bomb hits Player
      if (!this.player.isHit && this.player.invulnerableTimer <= 0) {
        const playerBounds = this.player.getBounds();
        if (this.checkRectOverlap(bombBounds, playerBounds)) {
          this.alienBullets.splice(bi, 1);
          this.handlePlayerHit();
          continue bombLoop;
        }
      }

      // Bomb hits Player Laser (projectile interception!)
      for (let pi = this.playerBullets.length - 1; pi >= 0; pi--) {
        const pBullet = this.playerBullets[pi];
        if (this.checkRectOverlap(bombBounds, pBullet.getBounds())) {
          this.alienBullets.splice(bi, 1);
          this.playerBullets.splice(pi, 1);
          this.particles.createExplosion(bomb.x, bomb.y, '#ffe600', 10, 0.9);
          continue bombLoop;
        }
      }
    }

    // 9. Check Aliens Reaching Defense Line / Player Area
    const defenseCutoff = this.canvasHeight - 90;
    if (this.fleet.hasReachedBottom(defenseCutoff)) {
      this.triggerGameOver('ALIENS INVADED DEFENSE BASE');
      return;
    }

    // 10. Check Alien fleet directly colliding with bunkers
    for (const alien of this.fleet.getAliveAliens()) {
      const aBounds = alien.getBounds();
      for (const bunker of this.bunkers) {
        if (bunker.checkCollision(aBounds)) {
          bunker.damage(alien.x + alien.width / 2, alien.y + alien.height, 4);
        }
      }
    }
  }

  handlePlayerHit() {
    this.player.lives--;
    this.player.isHit = true;
    this.player.hitTimer = 1.0;
    this.particles.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#00f3ff', 30, 1.6);
    this.audio.playPlayerDeath();
    this.updateHUD();

    if (this.player.lives <= 0) {
      setTimeout(() => {
        this.triggerGameOver('DEFENDER SHIP DESTROYED');
      }, 700);
    }
  }

  /* ==========================================================================
     RENDER PIPELINE
     ========================================================================== */
  render() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 1. Starfield background
    this.starfield.draw(this.ctx);

    // 2. Defense Baseline boundary marker
    this.ctx.strokeStyle = 'rgba(57, 255, 20, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(10, this.canvasHeight - 25);
    this.ctx.lineTo(this.canvasWidth - 10, this.canvasHeight - 25);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 3. Destructible Bunkers
    for (const bunker of this.bunkers) {
      bunker.draw(this.ctx);
    }

    // 4. Mystery Flying Saucer
    this.mysterySaucer.draw(this.ctx);

    // 5. Invader Fleet
    this.fleet.draw(this.ctx);

    // 6. Projectiles
    for (const bullet of this.playerBullets) {
      bullet.draw(this.ctx);
    }
    for (const bomb of this.alienBullets) {
      bomb.draw(this.ctx);
    }

    // 7. Player Ship
    this.player.draw(this.ctx);

    // 8. Particle Explosions & Text
    this.particles.draw(this.ctx);

    // 9. Next Wave / Level Clear Banner overlay on Canvas
    if (this.state === GAME_STATE.LEVEL_CLEARED) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, this.canvasHeight / 2 - 50, this.canvasWidth, 100);

      this.ctx.font = '20px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.textAlign = 'center';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.fillText('WAVE CLEARED!', this.canvasWidth / 2, this.canvasHeight / 2 - 8);

      this.ctx.font = '12px "Press Start 2P", monospace';
      this.ctx.fillStyle = '#ffe600';
      this.ctx.shadowColor = '#ffe600';
      this.ctx.fillText(`PREPARING FOR WAVE ${this.level}...`, this.canvasWidth / 2, this.canvasHeight / 2 + 25);
      this.ctx.restore();
    }
  }

  /* ==========================================================================
     MAIN GAME LOOP (requestAnimationFrame with fixed delta capping)
     ========================================================================== */
  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    let dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap delta time to prevent spiraling after tab unfocus/frame drop
    if (dt > 100) dt = 100;

    this.updateGame(dt);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// Instantiate game once DOM is loaded (browser environment)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.spaceInvadersGame = new SpaceInvadersGame();
  });
}

// CommonJS export for Node.js automated tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RetroAudio,
    SPRITES,
    renderMatrixSprite,
    Starfield,
    ParticleSystem,
    Bunker,
    Player,
    Bullet,
    Alien,
    AlienFleet,
    MysterySaucer,
    SpaceInvadersGame,
    GAME_STATE
  };
}
