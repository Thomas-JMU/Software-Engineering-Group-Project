let playerHealth = 100;
let maxHealth = 100;
let iFrames = 0;
let healthBarSize = 350;
let abilityBarSize = 350;
let enemies = [];
let explosions = [];
let killCount = 0;
let totalKillCount = 0;
let target = 20;
let prestige = 0;
let deaths = 0;

const CHARACTERS = [
  {
    name: "rogue",
    health: 100,
    speed: 5,
    cooldown: 40
  },
  {
    name: "leech",
    health: 50,
    speed: 7.5,
    cooldown: 600
  },
  {
    name: "brute",
    health: 150,
    speed: 2.5,
    cooldown: 300
  }
];

let selectedChar = 1; 

let abilityCooldown = 0;

let dashTime = 0;
let dashVX = 0;
let dashVY = 0;
const DASH_DURATION_FRAMES = 10;
const DASH_COOLDOWN_FRAMES = 40;
const DASH_SPEED = 12;

const LEECH_COOLDOWN_FRAMES = 600;
const LEECH_HEALTH_HEAL = 10;
const LEECH_RADIUS = 150;

const BLANK_COOLDOWN_FRAMES = 600;
const BLANK_RADIUS = 250;

let bullets = [];

// Helper function: check if point is in triangle using barycentric coordinates
// https://totologic.blogspot.com/2014/01/accurate-point-in-triangle-test.html
function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
  if (Math.abs(denominator) < 0.001) return false;
  
  const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
  const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
  const c = 1 - a - b;
  
  return a >= 0 && b >= 0 && c >= 0;
}

let bulletCooldown = 0;
const BULLET_COOLDOWN_FRAMES = 8;
const FUNCTION_CANNON_COOLDOWN_FRAMES = 25;
const SHOW_AIM_LINE = true;

// Hotfix Rifle fires slower than the Syntax Gun
const HOTFIX_RIFLE_COOLDOWN_FRAMES = 14;

// Bug Spray is also slower, since it hits in an area
const BUG_SPRAY_COOLDOWN_FRAMES = 14;


const BULLET_SPEED = 8;
const BULLET_SIZE = 6;
const ENEMY_BULLET_DAMAGE = 1; // damage done by enemy bullets

// starter weapon
const WEAPONS = [
  { 
    name: "Syntax Gun",
    bulletColor: [0, 0, 255], // blue
    damage: 20                // baseline
  },
];

const LOCKED_WEAPONS = [
    { 
    name: "Hotfix Rifle",
    bulletColor: [255, 0, 0], // red
    damage: 35                // slower but harder-hitting
  },
  { 
    name: "Byteblade",
    bulletColor: [128, 0, 128], // purple
    damage: 75                  // close to what you already had in code
  },
  { 
    name: "Function cannon",
    bulletColor: [255, 95, 31], // orange
    damage: 20                  // explosion decides final AoE damage
  },
  { 
    name: "Bug Spray",
    bulletColor: [0, 255, 0], // green
    damage: 8                 // weaker per hit, but can feel more DPS later
  }
];

// Unlock thresholds (adjust numbers as desired)
const UNLOCK_THRESHOLDS = [
  {name: "Bug Spray", threshold: 3, locked: true, disabled: false},
  {name: "Hotfix Rifle", threshold: 50, locked: true, disabled: false},
  {name: "Function cannon", threshold: 1, locked: true, disabled: false},
  {name: "Byteblade", threshold: 3, locked: true, disabled: false}
];

// Move weapons from LOCKED_WEAPONS to WEAPONS when thresholds are met.
function checkUnlocks() {
  for (let weapon of UNLOCK_THRESHOLDS) {
    console.log("Checking unlock for " + weapon.name);
    if (weapon.locked) {
      if (weapon.name === "Hotfix Rifle" && totalKillCount >= weapon.threshold) {
        WEAPONS.push(LOCKED_WEAPONS.find(w => w.name === "Hotfix Rifle"));
        weapon.locked = false;
        console.log("Unlocked Hotfix Rifle");
      }
      if (weapon.name === "Bug Spray" && deaths >= weapon.threshold) {
        WEAPONS.push(LOCKED_WEAPONS.find(w => w.name === "Bug Spray"));
        weapon.locked = false;
        console.log("Unlocked Bug Spray");
      }
      if (weapon.name === "Function cannon" && prestige >= weapon.threshold) {
        WEAPONS.push(LOCKED_WEAPONS.find(w => w.name === "Function cannon"));
        weapon.locked = false;
        console.log("Unlocked Function Cannon");
      }
      if (weapon.name === "Byteblade" && prestige >= weapon.threshold) {
        WEAPONS.push(LOCKED_WEAPONS.find(w => w.name === "Byteblade"));
        weapon.locked = false;
        console.log("Unlocked Byteblade");
      }
    }
  }
}

let currentWeapon = null; // set in resetGameState()


function game() {
  background(220);
  // --- Update input once per frame (keyboard + gamepad) ---
  // We do this here so we can use the same snapshots both for
  // pause handling and for player movement.
  KB.update();
  GP.update();

  const kbSnap = KB.snapshot();
  const gpSnap = GP.snapshot();

  // --- Pause toggle (P / START) ---
  if (kbSnap.menuPressed || gpSnap.menuPressed) {
    togglePauseMenu(); // from pause_menu.js
  }

  // --- If paused: draw frozen scene and exit early ---
  if (isPaused) {
    // Draw the current game state without updating it
    renderSceneFrozen(kbSnap, gpSnap);
    dummyHealthBar();

    // Allow controller / keyboard navigation in the pause menu
    updatePauseMenuNavigation(kbSnap, gpSnap);

    // IMPORTANT: no game logic updates while paused
    return;
  }

  // --- Normal game logic (only when NOT paused) ---

  // Player movement, dash & shooting using the same snapshots
  playerMovement(kbSnap, gpSnap);

  // Spawning waves, moving enemies, explosions, etc.
  waves();
  updateEnemies(enemies);
  updateExplosions();

  resetMatrix();
  drawVignette();

  // Handle death and switch to game over state
  if (playerHealth <= 0) {
    playerHealth = 0;
    deaths++;
    checkUnlocks();
    gameState = "gameover";
    return; // stop further game processing this frame
  }

  if (iFrames > 0) iFrames--;
  dummyHealthBar();
  abilityCooldownBar();
  drawProgressBar();
}

function abilityCooldownBar() {
  /*fill(50,50,50);
  rect(200, 0, abilityBarSize, 20);
  fill(200,200,200);
  rect(200, 0, (abilityCooldown / CHARACTERS[selectedChar].cooldown) * abilityBarSize, 20);

  fill(255);*/
}

// Returns the current ability name based on the selected character.
// Keep it in sync with your encyclopedia labels.
function getCurrentAbilityName() {
  if (!Array.isArray(CHARACTERS) || selectedChar == null) return "Ability";
  const c = CHARACTERS[selectedChar];
  if (!c || !c.name) return "Ability";

  // Map character -> ability label
  // rogue  -> Dash
  // brute  -> Blank (bullet clear)
  // leech  -> Lifesteal
  const name = c.name.toLowerCase();
  if (name === "rogue") return "Dash";
  if (name === "brute") return "Blank";
  if (name === "leech") return "Lifesteal";
  return "Ability";
}

function dummyHealthBar() {
    fill(0,0,0);
    rect(0,0,healthBarSize,20);

    rect(0, 22, 400, 100)

    fill(255,0,0);
    rect(0,0, (playerHealth / maxHealth) * healthBarSize,20);

    fill(255);

    fill(50,50,50);
    rect(400, 0, abilityBarSize, 20);
    fill(200,200,200);
    rect(400, 0, ((abilityCooldown / CHARACTERS[selectedChar].cooldown)) * abilityBarSize, 20);

  fill(255);

  push();
  noStroke();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(12);

  const weaponLabel = currentWeapon && currentWeapon.name ? currentWeapon.name : "None";
  const characterLabel = (CHARACTERS[selectedChar] && CHARACTERS[selectedChar].name)
    ? CHARACTERS[selectedChar].name.toUpperCase()
    : "UNKNOWN";
  const abilityLabel = getCurrentAbilityName();

  // Draw just below the 20px HP bar
  fill(0x1e, 0xff, 0x04);
  text("Weapon: "  + weaponLabel,   0, 22); // y=22 px
  text("Character: " + characterLabel, 0, 36);
  text("Ability: " + abilityLabel,  0, 50);
  pop();

}

function drawProgressBar() {
  push();
  rectMode(CORNER);

  let barHeight = 10; 
  let yPosition = height - barHeight; 
  let progress = constrain(killCount / target, 0, 1);

  noStroke();
  fill(50); 
  rect(0, yPosition, width, barHeight);
  fill(100, 255, 100);
  rect(0, yPosition, width * progress, barHeight);

  if (progress >= 1) {
      fill(255);
      rect(0, yPosition, width, barHeight);
  }
  
  pop();
}


function playerMovement() {

    prevPlayerX = playerX;
    prevPlayerY = playerY;

    const kbSnap = KB.snapshot();
    const gpSnap = GP.snapshot();

    let active = kbSnap;
    if (gpSnap.connected)
    {
      active = gpSnap;
    }

    if (dashTime > 0) {
      dashTime--;
    }
    if (abilityCooldown > 0) {
      abilityCooldown--;
    }

    if (
      active.dash.pressed &&
      //dashTime === 0 &&
      abilityCooldown === 0 //&&
      //(Math.abs(active.move.x) > 0.01 || Math.abs(active.move.y) > 0.01)
    ) {
      
      abilityCooldown = CHARACTERS[selectedChar].cooldown;

      if (CHARACTERS[selectedChar].name == "rogue") {
        if (Math.abs(active.move.x) > 0.01 || Math.abs(active.move.y) > 0.01) {
          dashVX = active.move.x;
          dashVY = active.move.y;
          dashTime = DASH_DURATION_FRAMES;
        }
      } else if (CHARACTERS[selectedChar].name == "brute") {
        let i = 0;
        createExplosion(playerX, playerY, 6, BLANK_RADIUS, 0, false, false);
        while (i < bullets.length) {
          let b = bullets[i];
          if (b.type == "player") break;
          if (dist(b.x, b.y, playerX, playerY) < BLANK_RADIUS) {
            bullets.splice(i, 1);
            i--;
          }
          i++
        }
      } else if (CHARACTERS[selectedChar].name == "leech") {
        let i = 0;
        createExplosion(playerX, playerY, 15, LEECH_RADIUS, 0, false, false);
        while (i < enemies.length) {
          let e = enemies[i];
          if (dist(e.x, e.y, playerX, playerY) < LEECH_RADIUS) {
            playerHealth += LEECH_HEALTH_HEAL;
            playerHealth = min(playerHealth, CHARACTERS[selectedChar].health);
            enemies.splice(i, 1);
            i--;
          }
          i++
        }
      }
    }

    // Compute current velocity
    let vx, vy;
    if (dashTime > 0) {
      // During dash: fast movement in the stored dash direction
      vx = dashVX * DASH_SPEED;
      vy = dashVY * DASH_SPEED;
    } else {
      // Normal walk speed
      vx = active.move.x * CHARACTERS[selectedChar].speed;
      vy = active.move.y * CHARACTERS[selectedChar].speed;
    }

    // Apply movement to player
    playerX += vx;
    playerY += vy;

    handlePlayerCollisions();

    // Keep player inside the fence
    let halfPlayer = playerSize / 2;
    playerX = constrain(playerX, halfPlayer, worldWidth - halfPlayer);
    playerY = constrain(playerY, halfPlayer, worldHeight - halfPlayer);

    if (bulletCooldown > 0) {
    bulletCooldown--;
    }

    const aimX = active.aim.x;
    const aimY = active.aim.y;

    const hasAim = Math.hypot(aimX, aimY) > 0.5;
    const wantsShoot = hasAim && active.shoot;

    if (wantsShoot && bulletCooldown === 0) {
    // --- Decide fire rate based on the current weapon ---
    let weaponCooldown = BULLET_COOLDOWN_FRAMES; // default: Syntax Gun

    if (currentWeapon) {
        if (currentWeapon.name === "Function cannon") {
            weaponCooldown = FUNCTION_CANNON_COOLDOWN_FRAMES;
        } else if (currentWeapon.name === "Hotfix Rifle") {
            weaponCooldown = HOTFIX_RIFLE_COOLDOWN_FRAMES;
        } else if (currentWeapon.name === "Bug Spray") {
            weaponCooldown = BUG_SPRAY_COOLDOWN_FRAMES;
        }
    }
    bulletCooldown = weaponCooldown;

    const muzzleOffset = playerSize * 0.5;

    // --- Byteblade: melee arc in front of the player ---
    if (currentWeapon && currentWeapon.name === "Byteblade") {
        const bladeLength = 70;
        const bladeWidth = 100;
        
        const pointX = playerX;
        const pointY = playerY;
        
        const perpX = -aimY;
        const perpY = aimX;
        
        const base1X = playerX + aimX * bladeLength + perpX * bladeWidth * 0.5;
        const base1Y = playerY + aimY * bladeLength + perpY * bladeWidth * 0.5;
        const base2X = playerX + aimX * bladeLength - perpX * bladeWidth * 0.5;
        const base2Y = playerY + aimY * bladeLength - perpY * bladeWidth * 0.5;
        
        // Deal damage to enemies in triangle
        const bladeDamage = 75;
        for (let e of enemies) {
            if (isPointInTriangle(e.x, e.y, pointX, pointY, base1X, base1Y, base2X, base2Y)) {
                e.health -= bladeDamage;
            }
        }
        
        // Store triangle for rendering (visual effect)
        bullets.push({
            type: "byteblade_visual",
            x1: pointX, y1: pointY,
            x2: base1X, y2: base1Y,
            x3: base2X, y3: base2Y,
            duration: 3 // frames to display
        });
    }

    // --- Bug Spray: explosion centered on the player ---
    else if (currentWeapon && currentWeapon.name === "Bug Spray") {
        // NOTE: explosion deals damage over several frames
        const sprayRadius = 80;
        const sprayDamage = currentWeapon.damage || 8;

        // AoE around the player, only hurts enemies
        createExplosion(
            playerX,
            playerY,
            8,          // duration in frames
            sprayRadius,
            sprayDamage,
            false,      // affectsPlayer
            true        // affectsEnemy
        );
    }

    // --- Function cannon: projectile that explodes on hit ---
    else if (currentWeapon && currentWeapon.name === "Function cannon") {
        bullets.push({
            x: playerX + aimX * muzzleOffset,
            y: playerY + aimY * muzzleOffset,
            vx: aimX * BULLET_SPEED,
            vy: aimY * BULLET_SPEED,
            type: "player",
            weaponType: "Function cannon",
            // Keep a damage value for consistency, even if explosion does main damage
            damage: currentWeapon ? currentWeapon.damage : 20
        });
    }

    // --- All other guns (Syntax Gun, Hotfix Rifle, etc.): normal bullet ---
    else {
        // Use weapon-specific damage value if available
        const damage = currentWeapon ? currentWeapon.damage : 20;

        bullets.push({
            x: playerX + aimX * muzzleOffset,
            y: playerY + aimY * muzzleOffset,
            vx: aimX * BULLET_SPEED,
            vy: aimY * BULLET_SPEED,
            type: "player",
            weaponType: currentWeapon ? currentWeapon.name : "Standard",
            damage: damage
        });
    }
  }

    for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    
    // Handle byteblade visual effect duration
    if (b.type === "byteblade_visual") {
      b.duration--;
      if (b.duration <= 0) {
        bullets.splice(i, 1);
      }
      continue;
    }
    
    b.x += b.vx;
    b.y += b.vy;
    
      let bulletRect = {
      x: b.x,
      y: b.y,
      w: BULLET_SIZE,
      h: BULLET_SIZE
    };

    // If enemy bullet, check collision with the player.
    // This is no longer a function so the damage is dealt automatically, rather than calling a function to do so!
    if (b.type === "enemy") {
      // Check bullet coords with player coords
      const halfPlayer = playerSize / 2;
      if (abs(b.x - playerX) <= (BULLET_SIZE + playerSize) / 2 && abs(b.y - playerY) <= (BULLET_SIZE + playerSize) / 2) {
        // apply damage only if player isn't in iFrames
        if (iFrames === 0) {
          playerHealth -= ENEMY_BULLET_DAMAGE;
          iFrames = 20; // Add iFrames
        }
        // Remove the bullet
        bullets.splice(i, 1);
        continue;
      }
    }
    
    let hasHitObstacle = false;
    for (let obs of obstacles) {
      if (isRectOverlap(obs, bulletRect)) {
        hasHitObstacle = true;
        break;
      }
    }

    if (
        b.x < 0 || b.x > worldWidth ||
        b.y < 0 || b.y > worldHeight ||
        hasHitObstacle
    ) {
        // Function cannon explodes on hit
        if (b.type === "player" && b.weaponType === "Function cannon") {
          createExplosion(
            b.x,
            b.y,
            15, // duration
            60, // radius
            20, // damage
            false, // don't affect player
            true   // affect enemies
          );
        }
        bullets.splice(i, 1);
    }
    }

    // Draw world around the player
    //push();

    // camera centered on player
    translate(width / 2, height / 2);
    translate(-playerX, -playerY);

    // Draw obstacles
    rectMode(CENTER);
    noStroke();
    fill(100);
    rect(worldWidth / 2, worldHeight / 2, 100, 100);

    fill(0);
    for (const obs of obstacles) {
      drawObs(obs); // uses [x,y,w,h]
    }


    // Draw border fence
    noFill();
    stroke(0);
    strokeWeight(10);

    rectMode(CORNER);
    rect(0, 0, worldWidth, worldHeight);

    rectMode(CENTER);

    // Rock for reference
    /*noStroke();
    fill(100);
    rect(worldWidth / 2, worldHeight / 2, 100, 100);*/

    // Player
    fill(0, 100, 255);
    noStroke();
    ellipse(playerX, playerY, playerSize * 0.8, playerSize * 0.8);

    // Draw aim direction line so we can "see" where we're aiming
    if (SHOW_AIM_LINE) {
      if (currentWeapon) {
        const color = currentWeapon.bulletColor;
        stroke(color[0], color[1], color[2]);
      }
      strokeWeight(2);
      line(
      playerX,
      playerY,
      playerX + active.aim.x * 40,
      playerY + active.aim.y * 40
      );
    }

    // Draw bullets
    noStroke();
    for (const b of bullets) {
    // Draw byteblade triangles
    if (b.type === "byteblade_visual") {
      if (currentWeapon) {
        const color = currentWeapon.bulletColor;
        fill(color[0], color[1], color[2]);
      }
      triangle(b.x1, b.y1, b.x2, b.y2, b.x3, b.y3);
    }
    // Draw standard bullets
    else if (b.type === "player" || b.type === "enemy") {
      fill(255, 0, 0);
      if (b.type == "player" && currentWeapon) {
        const color = currentWeapon.bulletColor;
        fill(color[0], color[1], color[2]);
      }
      ellipse(b.x, b.y, BULLET_SIZE, BULLET_SIZE);
    }
    }

    //pop();

    // text(playerX + ", " + playerY, 200, 200); display player coords.
}


// drawVignette creates the vision-limiting boxes around the player.

function drawVignette() {
    // Increase windowSize to allow the player to see more, decrease it to further limit vision.
    let windowSize = 350;
    let holeTop = (height / 2) - windowSize / 2;
    let holeBottom = (height / 2) + windowSize / 2;
    let holeLeft = (width / 2) - windowSize / 2;
    let holeRight = (width / 2) + windowSize / 2;

    fill(0);
    noStroke();
    rectMode(CORNER);

    rect(0, 0, width, holeTop);
    rect(0, holeBottom, width, height - holeBottom);
    rect(0, holeTop, holeLeft, windowSize);
    rect(holeRight, holeTop, width - holeRight, windowSize);

    rectMode(CENTER);
}

function renderSceneFrozen(kbSnap, gpSnap) {
  const active = (gpSnap.connected ? gpSnap : kbSnap);

  translate(width/2, height/2);
  translate(-playerX, -playerY);

  rectMode(CENTER);
  noStroke();
  fill(100);
  rect(worldWidth/2, worldHeight/2, 100, 100);

  fill(0);
  for (const obs of obstacles) drawObs(obs);

  noFill(); stroke(0); strokeWeight(10);
  rectMode(CORNER); rect(0,0,worldWidth,worldHeight); rectMode(CENTER);

  fill(0,100,255); noStroke();
  ellipse(playerX, playerY, playerSize * 0.8, playerSize * 0.8);

  if (typeof SHOW_AIM_LINE !== 'undefined' && SHOW_AIM_LINE) {
    stroke(255,255,0); strokeWeight(2);
    line(playerX, playerY, playerX + active.aim.x * 40, playerY + active.aim.y * 40);
  }

  noStroke(); fill(255,200,0);
  for (const b of bullets) ellipse(b.x, b.y, BULLET_SIZE, BULLET_SIZE);

  resetMatrix();
  drawVignette();
}
