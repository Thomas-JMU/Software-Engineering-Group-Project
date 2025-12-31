let gameState;

// Player variables.
let playerX, playerY;
let prevPlayerX, prevPlayerY;
let playerSize = 40;
let playerSpeed = 5;

// Map variables.
let worldWidth = 600;
let worldHeight = 600;

let KB // Keyboard Input
let GP // Controller Input

// Character selection menu state
let charSelectIndex = 0;
let charSelectPrevUp = false;      
let charSelectPrevDown = false;    
let charSelectPrevConfirm = false; 
let charSelectAxisCooldown = 0;    

// 0 = START, 1 = ENCYCLOPEDIA
let titleSelectedIndex = 0;

// edge detection for menu navigation
let _titlePrevUp = false;
let _titlePrevDown = false;
let _titlePrevSel = false;
let _titleAxisCooldown = 0;
let _titlePadIndex = -1;

// Keep the last-connected gamepad index for stable reads
window.addEventListener('gamepadconnected', (e) => {
  _titlePadIndex = e.gamepad.index;
  if (TITLE_PAD_DEBUG) console.log('[title] gamepad connected:', e.gamepad.id);
});
window.addEventListener('gamepaddisconnected', (e) => {
  if (_titlePadIndex === e.gamepad.index) _titlePadIndex = -1;
  if (TITLE_PAD_DEBUG) console.log('[title] gamepad disconnected:', e.gamepad.id);
});

let enemyAssets;
let titleScreenImage = null;

function setup() {
  createCanvas(400, 400);

  // Load title screen background image
  titleScreenImage = loadImage("assets/title screen.png");

  enemyAssets = {
    "basic": loadImage("assets/basic.png"),
    "melee1": loadImage("assets/melee1.png"),
    "explode": loadImage("assets/explode.png"),
    "sniper": loadImage("assets/sniper.png"),
    "shotgun": loadImage("assets/shotgun.png"),
    "splitter big": loadImage("assets/splitter big.png"),
    "splitter small": loadImage("assets/splitter small.png"),
    "rapid": loadImage("assets/rapid.png")
  }
  // "game" = game screen, "title" = title screen.
  gameState = "title"

  playerX =worldWidth / 2;
  playerY = worldHeight / 2;
  prevPlayerX = playerX;
  prevPlayerY = playerY;
  rectMode(CENTER);
  startButton = createButton("START");
  encyclopediaButton = createButton("ENCYCLOPEDIA");
  startButton.position(155, 300);
  startButton.mousePressed(gameUpdate);
  encyclopediaButton.position(122, 350);
  encyclopediaButton.mousePressed(encyclopediaUpdate);

  // Style buttons: black background with red text
  startButton.style('background-color', '#000000');
  startButton.style('color', '#FF0000');
  startButton.style('border', '2px solid #FF0000');
  startButton.style('padding', '6px 12px');
  startButton.style('font-weight', 'bold');
  startButton.style('cursor', 'pointer');
  startButton.style('font-size', '14px');

  encyclopediaButton.style('background-color', '#000000');
  encyclopediaButton.style('color', '#FF0000');
  encyclopediaButton.style('border', '2px solid #FF0000');
  encyclopediaButton.style('padding', '6px 12px');
  encyclopediaButton.style('font-weight', 'bold');
  encyclopediaButton.style('cursor', 'pointer');
  encyclopediaButton.style('font-size', '14px');

  // Init selection + highlight once we are on title
  titleSelectedIndex = 0;
  highlightTitleButton(0);


  //spawnRandomObs(3);  create X random (possibly overlapping) persistent obstacles, no longer used.
  let selectedLayout = levelLayouts[1]; //default

  // push obstacles from the selected layout
  for (let obsData of selectedLayout) {
    obstacles.push(obsData);
  }
  // Create input managers
  KB = new KeyboardInput();
  GP = new GamepadInput();


  //enemies.push();
}

function draw() {
  if (gameState == "title") {
    // Draw title screen background image
    if (titleScreenImage) {
      image(titleScreenImage, 0, 0, width, height);
    } else {
      background(20);
    }

    // Draw "Hotfix Heroes" title text at the top with black shadow
    fill(0, 0, 0); // black shadow
    textAlign(CENTER, TOP);
    textSize(48);
    textStyle(BOLD);
    text("Hotfix Heroes", width / 2 + 2, 20 + 2); // shadow offset
    
    fill(255, 0, 0); // big red text
    text("Hotfix Heroes", width / 2, 20);
    textStyle(NORMAL);

    updateTitleMenuNavigation();

  } else if (gameState == "characterSelect") {
    background(220);
    updateCharacterSelectMenu();

  } else if (gameState == "game") {
    game();

  } else if (gameState == "encyclopedia") {
    background(220);
    encyclopedia();

  } else if (gameState == "gameover") {
    background(0);
    gameOver();
  }
}



function gameUpdate() {
  openCharacterSelectMenu();
}

function encyclopediaUpdate() {
  // We are opening the encyclopedia from the title screen
  encyclopediaSource = "title";

  gameState = "encyclopedia";
  startButton.hide();
  encyclopediaButton.hide();

  // Optionally reset selection to first entry if you use highlight
  if (typeof highlightEncyclopediaButton === "function") {
    encyclopediaSelectedIndex = 0;
    highlightEncyclopediaButton(0);
  }
}


function showTitleButtons() {
  if (startButton) startButton.show();
  if (encyclopediaButton) encyclopediaButton.show();
}
function hideTitleButtons() {
  if (startButton) startButton.hide();
  if (encyclopediaButton) encyclopediaButton.hide();
}

function showTitleButtons() {
  if (startButton) startButton.show();
  if (encyclopediaButton) encyclopediaButton.show();
  // Reset selection & highlight when returning to title
  titleSelectedIndex = 0;
  highlightTitleButton(0);
}

function openCharacterSelectMenu() {
  // Switch to the character selection state
  gameState = "characterSelect";

  // Hide title buttons while we are choosing a character
  hideTitleButtons();

  // Start from the currently selected character if valid, otherwise from the first one
  if (typeof selectedChar === "number" &&
      selectedChar >= 0 &&
      selectedChar < CHARACTERS.length) {
    charSelectIndex = selectedChar;
  } else {
    charSelectIndex = 0;
  }

  // Reset edge detection states
  charSelectPrevUp = false;
  charSelectPrevDown = false;
  charSelectAxisCooldown = 0;

  // IMPORTANT:
  // Seed previous "confirm" state with whatever is currently pressed,
  // so that holding Enter/Space/A from the title screen does NOT
  // instantly confirm the first character.
  const keyConfirmNow = keyIsDown(13) || keyIsDown(32); // Enter or Space

  const pad = _firstPad();
  const padConfirmNow =
    _padHeld(pad, 0) ||  // A / Cross
    _padHeld(pad, 2) ||  // X / Square
    _padHeld(pad, 1);    // Nintendo A

  charSelectPrevConfirm = keyConfirmNow || padConfirmNow;
}

function updateCharacterSelectMenu() {
  // --- Draw character selection screen ---
  background(20);

  textAlign(CENTER, CENTER);
  textSize(28);
  fill(255);
  text("Select your character", width / 2, 50);

  // Draw each character option with basic stats
  textSize(20);
  for (let i = 0; i < CHARACTERS.length; i++) {
    const c = CHARACTERS[i];
    const y = 130 + i * 60;

    if (i === charSelectIndex) {
      // Highlight the currently selected character
      push();
      rectMode(CENTER);
      fill(60);
      rect(width / 2, y, 340, 50, 8);
      pop();
      fill(255);
    } else {
      fill(180);
    }

    const label =
      c.name.toUpperCase() +
      "  HP:" + c.health +
      "  SPEED:" + c.speed +
      "  CD:" + c.cooldown;

    text(label, width / 2, y);
  }

  // Instructions at the bottom
  textSize(14);
  fill(200);
  text("Use Up/Down or D-pad, Enter / Space / A to confirm",
       width / 2, height - 30);

  // --- Input handling (keyboard + gamepad) ---

  // Keyboard
  const keyUpNow       = keyIsDown(38);                  // Up arrow
  const keyDownNow     = keyIsDown(40);                  // Down arrow
  const keyConfirmNow  = keyIsDown(13) || keyIsDown(32); // Enter or Space

  // Gamepad
  const pad = _firstPad();
  const padUpNow   = _padHeld(pad, 12); // D-pad Up
  const padDownNow = _padHeld(pad, 13); // D-pad Down
  const padConfirmNow =
    _padHeld(pad, 0) ||  // A / Cross
    _padHeld(pad, 2) ||  // X / Square
    _padHeld(pad, 1);    // Nintendo A

  // Merge keyboard + gamepad
  let upNow      = keyUpNow   || padUpNow;
  let downNow    = keyDownNow || padDownNow;
  let confirmNow = keyConfirmNow || padConfirmNow;

  // Optional: left stick Y as navigation with debounce
  if (!upNow && !downNow && pad) {
    const y = _axis(pad, 1);      // left stick Y
    const TH = 0.55;
    if (charSelectAxisCooldown <= 0) {
      if (y <= -TH) { upNow = true;  charSelectAxisCooldown = 10; }
      if (y >=  TH) { downNow = true; charSelectAxisCooldown = 10; }
    } else {
      charSelectAxisCooldown--;
    }
  }

  // Edges (pressed this frame)
  const upEdge       = upNow      && !charSelectPrevUp;
  const downEdge     = downNow    && !charSelectPrevDown;
  const confirmEdge  = confirmNow && !charSelectPrevConfirm;

  // Save current state for next frame
  charSelectPrevUp = upNow;
  charSelectPrevDown = downNow;
  charSelectPrevConfirm = confirmNow;

  // Move selection
  if (upEdge) {
    charSelectIndex =
      (charSelectIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
  }
  if (downEdge) {
    charSelectIndex =
      (charSelectIndex + 1) % CHARACTERS.length;
  }

  // Confirm selection -> set selectedChar, reset game, start playing
  if (confirmEdge) {
    // Use the selected character index for this run
    selectedChar = charSelectIndex;

    // Reset the run with this character and enter the game
    resetGameState();
    gameState = "game";
  }
}

// --- Gamepad helpers (safe reads) ---
function _firstPad() {
  const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
  for (const p of pads) { if (p) return p; }
  return null;
}
// Treats analog buttons as "down" when value > 0.5
function _padHeld(p, index) {
  if (!p || !p.buttons || p.buttons[index] == null) return false;
  const b = p.buttons[index];
  return !!b.pressed || (typeof b.value === 'number' && b.value > 0.5);
}
function _axis(p, index) {
  if (!p || !p.axes || p.axes[index] == null) return 0;
  return p.axes[index];
}

// --- Visual highlight for the selected title button (keeps your aesthetics) ---
function highlightTitleButton(index) {
  const arr = [startButton, encyclopediaButton];
  arr.forEach((btn, i) => {
    if (!btn) return;
    if (i === index) {
      btn.style('outline', '3px solid rgba(100,150,255,0.9)');
      btn.style('outline-offset', '2px');
    } else {
      btn.style('outline', 'none');
      btn.style('outline-offset', '0');
    }
  });
}

// --- Title menu navigation (gamepad + keyboard fallback) ---
function updateTitleMenuNavigation() {
  // Read keyboard fallback (optional)
  const kUpNow   = keyIsDown(38);                  // Up Arrow
  const kDownNow = keyIsDown(40);                  // Down Arrow
  const kSelNow  = keyIsDown(13) || keyIsDown(32); // Enter or Space

  // Read gamepad
  const pad = _firstPad();
  const gUpNow   = _padHeld(pad, 12); // D-pad Up
  const gDownNow = _padHeld(pad, 13); // D-pad Down

  // Accept A/Cross (0), X/Square (2), and Nintendo A (1) as "Select"
  const gSelNow  = _padHeld(pad, 0) || _padHeld(pad, 2) || _padHeld(pad, 1);

  // Merge inputs (keyboard OR gamepad)
  let upNow   = kUpNow   || gUpNow;
  let downNow = kDownNow || gDownNow;
  const selNow  = kSelNow  || gSelNow;

  // Left-stick Y fallback with debounce (in case D-pad isn't mapped)
  if (!upNow && !downNow && pad) {
    const y = _axis(pad, 1);           // left stick Y
    const TH = 0.55;                   // threshold
    if (_titleAxisCooldown <= 0) {
      if (y <= -TH) { upNow = true;  _titleAxisCooldown = 10; }
      if (y >=  TH) { downNow = true; _titleAxisCooldown = 10; }
    } else {
      _titleAxisCooldown--;
    }
  }

  // One-shot edges
  const upEdge   = upNow   && !_titlePrevUp;
  const downEdge = downNow && !_titlePrevDown;
  const selEdge  = selNow  && !_titlePrevSel;

  // Save for next frame
  _titlePrevUp   = upNow;
  _titlePrevDown = downNow;
  _titlePrevSel  = selNow;

  // Move selection
  if (upEdge) {
    titleSelectedIndex = (titleSelectedIndex - 1 + 2) % 2;
    highlightTitleButton(titleSelectedIndex);
  }
  if (downEdge) {
    titleSelectedIndex = (titleSelectedIndex + 1) % 2;
    highlightTitleButton(titleSelectedIndex);
  }

   // Confirm selection -> call your existing button handlers
  if (selEdge) {
    if (titleSelectedIndex === 0) {
      gameUpdate();         // START
    } else {
      encyclopediaUpdate(); // ENCYCLOPEDIA
    }
  }
}