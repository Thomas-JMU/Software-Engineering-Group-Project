let gameOverButton;

// Edge detection for controller confirm on the game over screen
let gameOverPrevConfirm = false;

function resetGameState() {
  // Reset all game variables to initial state
  playerHealth = maxHealth;
  iFrames = 0;
  bullets = [];
  enemies = [];
  
  // Reset player position to center
  playerX = worldWidth / 2;
  playerY = worldHeight / 2;
  prevPlayerX = playerX;
  prevPlayerY = playerY;
  
  // Reset movement-related vars
  dashTime = 0;
  dashCooldown = 0;
  dashVX = 0;
  dashVY = 0;
  bulletCooldown = 0;
  abilityCooldown = 0;

  for (let weapon of UNLOCK_THRESHOLDS) {
    if (!(weapon.locked)) {
      weapon.disabled = true;
    }
  }
  
  // Select a random weapon
  currentWeapon = random(WEAPONS);

  if (typeof selectedChar !== "number" ||
      selectedChar < 0 ||
      selectedChar >= CHARACTERS.length) {
    selectedChar = 0;
  }
  maxHealth = CHARACTERS[selectedChar].health;
  playerHealth = maxHealth;

  // Reset wave system variables
  currentLevel = 1;
  killCount = 0;
  target = 20;
  prestige = 0;
  
  // Reset obstacles to level 1 layout
  obstacles = [];
  selectedLayout = levelLayouts[currentLevel];
  for (let obsData of selectedLayout) {
    obstacles.push(obsData);
  }
}

function gameOver() {
  // Game over screen with "you died!" and return to title button
  background(0);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(36);
  text("You died!", width / 2, height / 2 - 30);


  textSize(24);
let unlockText = "";
  for (let weapon of UNLOCK_THRESHOLDS) {
    if (!weapon.locked && !weapon.disabled) {
      unlockText += weapon.name + "\n";
    }
  }
  if (unlockText != "") {
    text("Unlocked Weapons:", width / 2, height / 2 + 60);
    text(unlockText, width / 2, height / 2 + 150);
  } else {
    text("No new weapons unlocked.", width / 2, height / 2 + 70);
  }

  // Update input so keyboard / controller state is fresh on this screen.
  // This uses the same input managers as the main game loop.
  if (typeof KB !== "undefined" && KB && typeof KB.update === "function") {
    KB.update();
  }
  if (typeof GP !== "undefined" && GP && typeof GP.update === "function") {
    GP.update();
  }

  // create the button only once
  if (!gameOverButton) {
    gameOverButton = createButton("Return to Title");
    // position near center; adjustable as needed if width/height change
    gameOverButton.position(width / 2 - 60, height / 2 + 10);
    gameOverButton.mousePressed(() => {
      // Reset all game state
      resetGameState();
      // Return to title screen setup
      gameState = "title";
      gameOverButton.hide();
      startButton.show();
      encyclopediaButton.show();
    });
  } else {
    // ensure the button is visible
    gameOverButton.show();
    startButton.hide();
    encyclopediaButton.hide();
  }


  // Keyboard confirm: Enter or Space
  const keyConfirmNow = keyIsDown(13) || keyIsDown(32);

  // Gamepad confirm: A / Cross (button 0). Optionally also allow Start (button 9).
  let padConfirmNow = false;
  if (typeof isGamepadConnected === "function" &&
      isGamepadConnected() &&
      typeof gamepadButtonDown === "function") {
    padConfirmNow = gamepadButtonDown(0) || gamepadButtonDown(9);
  }

  const confirmNow = keyConfirmNow || padConfirmNow;
  const confirmPressed = confirmNow && !gameOverPrevConfirm;
  gameOverPrevConfirm = confirmNow;

  if (confirmPressed) {
    // Same effect as clicking the button: reset the run and return to title.
    resetGameState();
    gameState = "title";
    if (gameOverButton) gameOverButton.hide();
    if (typeof startButton !== "undefined" && startButton) startButton.show();
    if (typeof encyclopediaButton !== "undefined" && encyclopediaButton) encyclopediaButton.show();
  }
}

