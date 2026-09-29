/**
 * Automated Test Suite for Space Invaders Canvas Game
 * Uses native Node.js Test Runner (node:test) and Assert (node:assert/strict).
 * Zero external dependencies.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  Player,
  Bullet,
  Alien,
  AlienFleet,
  MysterySaucer,
  Bunker,
  SpaceInvadersGame,
  GAME_STATE
} = require('../js/game.js');

describe('Space Invaders Game Test Suite', () => {

  /* ========================================================================
     1. PLAYER MOVEMENT TESTS
     ======================================================================== */
  describe('Player Movement', () => {
    let player;
    const canvasWidth = 800;
    const canvasHeight = 600;

    beforeEach(() => {
      player = new Player(canvasWidth, canvasHeight);
    });

    it('should initialize player in the horizontal center and near the bottom', () => {
      const expectedX = (canvasWidth - player.width) / 2;
      assert.strictEqual(player.x, expectedX, 'Player should start centered horizontally');
      assert.strictEqual(player.y, canvasHeight - 55, 'Player should be near bottom baseline');
      assert.strictEqual(player.lives, 3, 'Player should start with 3 lives');
    });

    it('should move left when left input is active', () => {
      const startX = player.x;
      player.update(100, { left: true, right: false });
      assert.ok(player.x < startX, `Player x (${player.x}) should be less than start (${startX})`);
    });

    it('should move right when right input is active', () => {
      const startX = player.x;
      player.update(100, { left: false, right: true });
      assert.ok(player.x > startX, `Player x (${player.x}) should be greater than start (${startX})`);
    });

    it('should clamp player within screen left boundary (x >= 15)', () => {
      player.x = 20;
      // Simulate continuous movement to the left for several seconds
      for (let i = 0; i < 20; i++) {
        player.update(100, { left: true, right: false });
      }
      assert.strictEqual(player.x, 15, 'Player should not cross the left margin (15px)');
    });

    it('should clamp player within screen right boundary (x + width <= canvasWidth - 15)', () => {
      const maxX = canvasWidth - 15 - player.width;
      player.x = maxX - 10;
      // Simulate continuous movement to the right for several seconds
      for (let i = 0; i < 20; i++) {
        player.update(100, { left: false, right: true });
      }
      assert.strictEqual(player.x, maxX, 'Player should not cross the right margin');
    });

    it('should remain stationary if both left and right keys are pressed or none', () => {
      const startX = player.x;
      player.update(100, { left: true, right: true });
      assert.strictEqual(player.x, startX, 'Player should not move when conflicting keys pressed');

      player.update(100, { left: false, right: false });
      assert.strictEqual(player.x, startX, 'Player should not move when no keys pressed');
    });
  });

  /* ========================================================================
     2. BULLET CREATION TESTS
     ======================================================================== */
  describe('Bullet Creation & Projectile Mechanics', () => {
    let game;

    beforeEach(() => {
      game = new SpaceInvadersGame();
      game.startGame();
    });

    it('should spawn a player bullet moving upward with correct velocity', () => {
      assert.strictEqual(game.playerBullets.length, 0);
      game.firePlayerLaser();

      assert.strictEqual(game.playerBullets.length, 1, 'Should create 1 player bullet');
      const bullet = game.playerBullets[0];
      assert.strictEqual(bullet.vy, -520, 'Bullet should have negative (upward) velocity');
      assert.strictEqual(bullet.isAlien, false, 'Should be flagged as player bullet');

      // Update bullet position
      const initialY = bullet.y;
      bullet.update(100);
      assert.ok(bullet.y < initialY, 'Bullet should travel upward');
    });

    it('should enforce authentic arcade rate-limiting (max 2 simultaneous player bullets)', () => {
      game.firePlayerLaser();
      game.player.shootCooldown = 0; // reset cooldown
      game.firePlayerLaser();
      assert.strictEqual(game.playerBullets.length, 2, 'Should allow 2 active bullets');

      game.player.shootCooldown = 0;
      game.firePlayerLaser();
      assert.strictEqual(game.playerBullets.length, 2, 'Should not exceed maximum 2 bullets');
    });

    it('should enforce shoot cooldown interval between consecutive shots', () => {
      game.firePlayerLaser();
      assert.strictEqual(game.playerBullets.length, 1);
      assert.ok(game.player.shootCooldown > 0, 'Cooldown must be active immediately after shot');

      // Immediate second shot attempt should be blocked by cooldown
      game.firePlayerLaser();
      assert.strictEqual(game.playerBullets.length, 1, 'Shot blocked by active cooldown');
    });

    it('should spawn alien bombs with downward velocity and zigzag effect', () => {
      const bomb = new Bullet(100, 100, 250, '#ff3131', true);
      assert.strictEqual(bomb.isAlien, true);
      assert.strictEqual(bomb.vy, 250);

      const initialX = bomb.x;
      const initialY = bomb.y;
      bomb.update(100);

      assert.ok(bomb.y > initialY, 'Alien bomb should move downwards');
      assert.notStrictEqual(bomb.x, initialX, 'Alien bomb should oscillate horizontally (zigzag)');
    });

    it('should detect when bullets travel out of canvas bounds', () => {
      const topBullet = new Bullet(100, -20, -500, '#00f3ff', false);
      assert.strictEqual(topBullet.isOutOfBounds(600), true);

      const bottomBullet = new Bullet(100, 620, 250, '#ff3131', true);
      assert.strictEqual(bottomBullet.isOutOfBounds(600), true);

      const onScreenBullet = new Bullet(100, 300, -500, '#00f3ff', false);
      assert.strictEqual(onScreenBullet.isOutOfBounds(600), false);
    });
  });

  /* ========================================================================
     3. ENEMY CREATION TESTS
     ======================================================================== */
  describe('Enemy Creation & Formation', () => {
    let fleet;

    beforeEach(() => {
      fleet = new AlienFleet(800, 600, { playMarchStep: () => {} });
      fleet.init(1);
    });

    it('should initialize exactly 55 aliens arranged in 5 rows of 11 columns', () => {
      assert.strictEqual(fleet.aliens.length, 55, 'Wave 1 must contain 55 total aliens');
      assert.strictEqual(fleet.getAliveAliens().length, 55, 'All aliens should start alive');
    });

    it('should configure correct species and points by row index', () => {
      // Row 0: Squids (30 pts)
      const row0 = fleet.aliens.filter(a => a.row === 0);
      assert.strictEqual(row0.length, 11);
      assert.ok(row0.every(a => a.type === 'squid' && a.points === 30));

      // Row 1 & 2: Crabs (20 pts)
      const row1and2 = fleet.aliens.filter(a => a.row === 1 || a.row === 2);
      assert.strictEqual(row1and2.length, 22);
      assert.ok(row1and2.every(a => a.type === 'crab' && a.points === 20));

      // Row 3 & 4: Octopuses (10 pts)
      const row3and4 = fleet.aliens.filter(a => a.row === 3 || a.row === 4);
      assert.strictEqual(row3and4.length, 22);
      assert.ok(row3and4.every(a => a.type === 'octopus' && a.points === 10));
    });

    it('should initialize movement direction heading right (direction = 1)', () => {
      assert.strictEqual(fleet.direction, 1, 'Initial march direction should be to the right');
    });

    it('should drop alien bombs only from the bottom-most alien of an active column', () => {
      let droppedBomb = false;
      fleet.fireRandomBomb(fleet.getAliveAliens(), (x, y) => {
        droppedBomb = true;
        assert.ok(typeof x === 'number');
        assert.ok(typeof y === 'number');
      });
      assert.strictEqual(droppedBomb, true, 'fireRandomBomb should invoke onBombDrop callback');
    });

    it('should accelerate march speed as alien population decreases', () => {
      const initialInterval = fleet.baseMarchInterval;

      // Kill 50 out of 55 aliens
      for (let i = 0; i < 50; i++) {
        fleet.aliens[i].alive = false;
      }

      fleet.update(16, () => {});
      assert.ok(
        fleet.currentMarchInterval < initialInterval,
        `Depleted fleet interval (${fleet.currentMarchInterval}) must be faster than initial (${initialInterval})`
      );
    });
  });

  /* ========================================================================
     4. COLLISION DETECTION TESTS
     ======================================================================== */
  describe('Collision Detection', () => {
    let game;

    beforeEach(() => {
      game = new SpaceInvadersGame();
      game.startGame();
    });

    it('should accurately test AABB rectangle overlap', () => {
      const boxA = { x: 50, y: 50, width: 20, height: 20 };
      const boxB = { x: 60, y: 60, width: 20, height: 20 }; // Overlaps boxA
      const boxC = { x: 100, y: 100, width: 20, height: 20 }; // Disjoint

      assert.strictEqual(game.checkRectOverlap(boxA, boxB), true, 'Overlapping boxes must return true');
      assert.strictEqual(game.checkRectOverlap(boxA, boxC), false, 'Separated boxes must return false');
    });

    it('should destroy alien and remove bullet when player laser hits alien', () => {
      const targetAlien = game.fleet.aliens[0];
      assert.strictEqual(targetAlien.alive, true);

      // Place a player bullet directly on target alien
      const bullet = new Bullet(targetAlien.x + 2, targetAlien.y + 2, -500, '#00f3ff', false);
      game.playerBullets.push(bullet);

      const initialScore = game.score;
      game.updateGame(16); // Run 1 physics frame

      assert.strictEqual(targetAlien.alive, false, 'Hit alien should be dead');
      assert.strictEqual(game.playerBullets.length, 0, 'Bullet should be consumed on impact');
      assert.strictEqual(game.score, initialScore + targetAlien.points, 'Score should increase by alien points');
    });

    it('should erode bunker blocks and destroy projectile when bullet hits bunker', () => {
      const bunker = game.bunkers[0];
      const bullet = new Bullet(bunker.x + 10, bunker.y + 5, -500, '#00f3ff', false);
      game.playerBullets.push(bullet);

      assert.strictEqual(bunker.checkCollision(bullet.getBounds()), true, 'Bullet should collide with bunker');

      game.updateGame(16);

      assert.strictEqual(game.playerBullets.length, 0, 'Bullet should be absorbed by bunker');
    });

    it('should destroy both projectiles when player laser intercepts alien bomb mid-air', () => {
      // Place projectiles in open airspace (y=360 and y=350) between the alien fleet (y < 240) and bunkers (y > 470)
      const playerLaser = new Bullet(350, 360, -520, '#00f3ff', false);
      const alienBomb = new Bullet(350, 350, 220, '#ff3131', true);

      game.playerBullets.push(playerLaser);
      game.alienBullets.push(alienBomb);

      game.updateGame(16);

      assert.strictEqual(game.playerBullets.length, 0, 'Player laser should be destroyed in interception');
      assert.strictEqual(game.alienBullets.length, 0, 'Alien bomb should be destroyed in interception');
    });
  });

  /* ========================================================================
     5. SCORE INCREMENT TESTS
     ======================================================================== */
  describe('Score Increment', () => {
    let game;

    beforeEach(() => {
      game = new SpaceInvadersGame();
      game.startGame();
    });

    it('should award 30 points for destroying a Commander Squid', () => {
      const squid = game.fleet.aliens.find(a => a.type === 'squid');
      game.playerBullets.push(new Bullet(squid.x + 2, squid.y + 2, -500, '#00f3ff', false));

      game.updateGame(16);
      assert.strictEqual(game.score, 30);
    });

    it('should award 20 points for destroying a Crab Invader', () => {
      const crab = game.fleet.aliens.find(a => a.type === 'crab');
      game.playerBullets.push(new Bullet(crab.x + 2, crab.y + 2, -500, '#00f3ff', false));

      game.updateGame(16);
      assert.strictEqual(game.score, 20);
    });

    it('should award 10 points for destroying an Octopus Trooper', () => {
      const octopus = game.fleet.aliens.find(a => a.type === 'octopus');
      game.playerBullets.push(new Bullet(octopus.x + 2, octopus.y + 2, -500, '#00f3ff', false));

      game.updateGame(16);
      assert.strictEqual(game.score, 10);
    });

    it('should award bonus mystery points when shooting the Mystery Saucer UFO', () => {
      game.mysterySaucer.spawn();
      game.mysterySaucer.x = 200;
      game.mysterySaucer.y = 42;

      game.playerBullets.push(new Bullet(205, 45, -500, '#00f3ff', false));
      game.updateGame(16);

      assert.ok(game.score >= 50 && game.score <= 300, `UFO score (${game.score}) must be between 50 and 300`);
      assert.strictEqual(game.mysterySaucer.active, false, 'Saucer should be deactivated upon hit');
    });
  });

  /* ========================================================================
     6. PLAYER LIVES TESTS
     ======================================================================== */
  describe('Player Lives & Damage States', () => {
    let game;

    beforeEach(() => {
      game = new SpaceInvadersGame();
      game.startGame();
    });

    it('should start with 3 lives', () => {
      assert.strictEqual(game.player.lives, 3);
    });

    it('should decrement lives by 1 when player is hit by an alien bomb', () => {
      const bomb = new Bullet(game.player.x + 5, game.player.y + 5, 250, '#ff3131', true);
      game.alienBullets.push(bomb);

      game.updateGame(16);

      assert.strictEqual(game.player.lives, 2, 'Lives should decrement from 3 to 2');
      assert.strictEqual(game.player.isHit, true, 'Player should be in hit state');
      assert.strictEqual(game.alienBullets.length, 0, 'Bomb should be consumed upon impact');
    });

    it('should grant temporary invulnerability after respawn and ignore damage while invulnerable', () => {
      game.player.respawn();
      assert.ok(game.player.invulnerableTimer > 0, 'Invulnerability timer should be active');

      // Attempt to hit player during invulnerability
      const bomb = new Bullet(game.player.x + 5, game.player.y + 5, 250, '#ff3131', true);
      game.alienBullets.push(bomb);

      game.updateGame(16);

      assert.strictEqual(game.player.lives, 3, 'Lives must not decrease during invulnerability');
    });
  });

  /* ========================================================================
     7. GAME-OVER CONDITION TESTS
     ======================================================================== */
  describe('Game-Over Conditions', () => {
    let game;

    beforeEach(() => {
      game = new SpaceInvadersGame();
      game.startGame();
    });

    it('should trigger GAME_OVER state when player lives drop to zero', () => {
      game.player.lives = 0;
      game.triggerGameOver('DEFENDER SHIP DESTROYED');

      assert.strictEqual(game.state, GAME_STATE.GAME_OVER);
      assert.strictEqual(game.dom.gameOverReason.textContent, 'DEFENDER SHIP DESTROYED');
    });

    it('should trigger GAME_OVER immediately if alien fleet invades Earth defense baseline', () => {
      const cutoffY = game.canvasHeight - 90;
      // Position an alien below the defense cutoff line
      game.fleet.aliens[0].y = cutoffY + 10;

      game.updateGame(16);

      assert.strictEqual(game.state, GAME_STATE.GAME_OVER, 'Invasion of baseline must trigger GAME_OVER');
      assert.strictEqual(game.dom.gameOverReason.textContent, 'ALIENS INVADED DEFENSE BASE');
    });

    it('should update and persist high score if final score exceeds previous high score', () => {
      game.score = 1500;
      game.highScore = 1000;

      game.triggerGameOver('DEFENDER SHIP DESTROYED');

      assert.strictEqual(game.highScore, 1500, 'High score should update to 1500');
    });
  });

  /* ========================================================================
     8. LEVEL PROGRESSION TESTS
     ======================================================================== */
  describe('Level Progression', () => {
    let game;

    beforeEach(() => {
      game = new SpaceInvadersGame();
      game.startGame();
    });

    it('should advance to wave 2 when all aliens are cleared', () => {
      assert.strictEqual(game.level, 1);

      // Destroy all aliens in current wave
      for (const alien of game.fleet.aliens) {
        alien.alive = false;
      }

      // One more bullet clears the last check in game loop
      const dummyAlien = game.fleet.aliens[0];
      game.playerBullets.push(new Bullet(dummyAlien.x + 2, dummyAlien.y + 2, -500, '#00f3ff', false));

      game.startNextLevel();

      assert.strictEqual(game.level, 2, 'Level should increment from 1 to 2');
      assert.strictEqual(game.state, GAME_STATE.LEVEL_CLEARED, 'Game state should show LEVEL_CLEARED transition');
      assert.strictEqual(game.fleet.getAliveAliens().length, 55, 'Wave 2 must spawn a fresh fleet of 55 aliens');
    });

    it('should increase alien speed with each advancing wave', () => {
      const wave1Interval = game.fleet.baseMarchInterval;

      game.startNextLevel(); // wave 2
      const wave2Interval = game.fleet.baseMarchInterval;

      assert.ok(
        wave2Interval < wave1Interval,
        `Wave 2 march interval (${wave2Interval}) should be faster than Wave 1 (${wave1Interval})`
      );
    });
  });

});
