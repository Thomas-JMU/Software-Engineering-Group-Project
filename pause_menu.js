// --- FILE: pause_menu.js ---

let isPaused = false;

let pauseSelectedIndex = 0;
let pauseButtons = [];

let pauseUI = {
  container: null,
  panel: null,
  btnContinue: null,
  btnEncyclopedia: null,
  btnMainMenu: null,
  prestigeLabel: null,
};

function createPauseUIOnce() {
  if (pauseUI.container) return;

  // Fullscreen dim background
  pauseUI.container = createDiv('');
  pauseUI.container.style('position', 'fixed');
  pauseUI.container.style('inset', '0');
  pauseUI.container.style('background', 'rgba(0,0,0,0.55)');
  pauseUI.container.style('display', 'grid');
  pauseUI.container.style('place-items', 'center');
  pauseUI.container.style('z-index', '9999');

  // Centered column panel
  pauseUI.panel = createDiv('');
  pauseUI.panel.parent(pauseUI.container);
  pauseUI.panel.style('display', 'flex');
  pauseUI.panel.style('flex-direction', 'column');
  pauseUI.panel.style('gap', '10px');
  pauseUI.panel.style('min-width', '240px');
  pauseUI.panel.style('padding', '14px 16px');
  pauseUI.panel.style('border-radius', '10px');
  pauseUI.panel.style('background', 'rgba(245,245,245,0.95)');


  pauseUI.prestigeLabel = createDiv('Prestige: 0');
  pauseUI.prestigeLabel.parent(pauseUI.panel);
  pauseUI.prestigeLabel.style('color', '#D4AF37');
  pauseUI.prestigeLabel.style('font-weight', 'bold');
  pauseUI.prestigeLabel.style('font-size', '18px');
  pauseUI.prestigeLabel.style('text-align', 'center');
  pauseUI.prestigeLabel.style('margin-bottom', '10px');
  pauseUI.prestigeLabel.style('text-transform', 'uppercase');

  pauseUI.btnContinue     = createButton('Continue');
  pauseUI.btnEncyclopedia = createButton('Encyclopedia');
  pauseUI.btnMainMenu     = createButton('Return to Menu');

  for (const b of [pauseUI.btnContinue, pauseUI.btnEncyclopedia, pauseUI.btnMainMenu]) {
    b.parent(pauseUI.panel);
    b.style('font-size', '16px');
    b.style('padding', '10px 12px');
    b.style('border-radius', '8px');
    b.style('border', '0');
    b.style('cursor', 'pointer');
    b.style('width', '100%');
    b.style('text-align', 'center');
  }

  // Actions
  pauseUI.btnContinue.mousePressed(() => hidePauseMenu());

  pauseUI.btnEncyclopedia.mousePressed(() => {
    // Hide the pause panel, but keep the game in a paused state
    if (pauseUI.container) pauseUI.container.hide();

    // Open the same Encyclopedia screen used on the title menu
    encyclopediaSource = "pause";   // remember we came from the pause menu
    gameState = "encyclopedia";
  });

  pauseUI.btnMainMenu.mousePressed(() => {
    hideEncyclopediaOverlay();
    hidePauseMenu();          // isPaused = false
    gameState = 'title';
    if (typeof showTitleButtons === 'function') showTitleButtons();
  });

  pauseButtons = [
    pauseUI.btnContinue,
    pauseUI.btnEncyclopedia,
    pauseUI.btnMainMenu
  ];
  highlightPauseButton(0);

  pauseUI.container.hide();
}

function showPauseMenu() {
  createPauseUIOnce();
  if (pauseUI.prestigeLabel) {
    pauseUI.prestigeLabel.html('Prestige: ${prestige}');
  }
  isPaused = true;
  pauseSelectedIndex = 0;
  highlightPauseButton(0);
  pauseUI.container.show();
}

function hidePauseMenu() { isPaused = false; if (pauseUI.container) pauseUI.container.hide(); }
function togglePauseMenu() {
  // Guard: if encyclopedia overlay is visible, ignore toggle
  if (encyclopediaOverlay && encyclopediaOverlay.style('display') !== 'none') return;
  isPaused ? hidePauseMenu() : showPauseMenu();
}

// --- Encyclopedia overlay inside Pause ---
let encyclopediaOverlay;
function showEncyclopediaOverlay() {
  if (!encyclopediaOverlay) {
    encyclopediaOverlay = createDiv('');
    encyclopediaOverlay.style('position', 'fixed');
    encyclopediaOverlay.style('inset', '0');
    encyclopediaOverlay.style('background', 'rgba(0,0,0,0.6)');
    encyclopediaOverlay.style('z-index', '10000');
    encyclopediaOverlay.style('display', 'flex');
    encyclopediaOverlay.style('align-items', 'center');
    encyclopediaOverlay.style('justify-content', 'center');

    const panel = createDiv('');
    panel.parent(encyclopediaOverlay);
    panel.style('background', '#fff');
    panel.style('padding', '20px');
    panel.style('border-radius', '10px');
    panel.style('text-align', 'center');
    panel.html('<h2>Encyclopedia</h2><p>(Overlay while paused)</p>');

    const row = createDiv('');
    row.parent(panel);
    row.style('margin-top', '10px');

    const btnBack = createButton('Back');
    btnBack.parent(row);
    btnBack.style('margin', '0 8px');
    btnBack.mousePressed(() => {
      encyclopediaOverlay.hide();
      showPauseMenu(); // return to pause overlay (still paused)
    });

    const btnMain = createButton('Return to Menu');
    btnMain.parent(row);
    btnMain.style('margin', '0 8px');
    btnMain.mousePressed(() => {
      encyclopediaOverlay.hide();
      hidePauseMenu();       // resume state cleared
      gameState = 'title';
      if (typeof showTitleButtons === 'function') showTitleButtons();
    });
  }
  encyclopediaOverlay.show();
}

function hideEncyclopediaOverlay() {
  if (encyclopediaOverlay) encyclopediaOverlay.hide();
}

function highlightPauseButton(index) {
  pauseButtons.forEach((btn, i) => {
    if (i === index) {
      // subtle highlight (keeps your aesthetics)
      btn.style('outline', '3px solid rgba(100,150,255,0.9)');
      btn.style('outline-offset', '2px');
    } else {
      btn.style('outline', 'none');
      btn.style('outline-offset', '0');
    }
  });
}

function updatePauseMenuNavigation(kbSnap, gpSnap) {
  // If the encyclopedia overlay is open, ignore pause navigation
  if (typeof encyclopediaOverlay !== "undefined" &&
      encyclopediaOverlay &&
      encyclopediaOverlay.style("display") !== "none") {
    return;
  }

  const hasKb = kbSnap && kbSnap.connected;
  const hasGp = gpSnap && gpSnap.connected;

  // Combine keyboard + gamepad one-shot edges
  const up =
    (hasKb && kbSnap.menuUp) ||
    (hasGp && gpSnap.menuUp);

  const down =
    (hasKb && kbSnap.menuDown) ||
    (hasGp && gpSnap.menuDown);

  const selectPressed =
    (hasKb && kbSnap.menuSelect && kbSnap.menuSelect.pressed) ||
    (hasGp && gpSnap.menuSelect && gpSnap.menuSelect.pressed);

  // Move selection
  if (up) {
    pauseSelectedIndex =
      (pauseSelectedIndex - 1 + pauseButtons.length) % pauseButtons.length;
    highlightPauseButton(pauseSelectedIndex);
  }
  if (down) {
    pauseSelectedIndex =
      (pauseSelectedIndex + 1) % pauseButtons.length;
    highlightPauseButton(pauseSelectedIndex);
  }

  // Confirm current choice
  if (selectPressed) {
    invokePauseAction(pauseSelectedIndex);
  }
}

function showPauseMenu() {
  createPauseUIOnce();
  isPaused = true;
  pauseSelectedIndex = 0;
  highlightPauseButton(0);
  pauseUI.container.show();
}

function invokePauseAction(index) {
  switch (index) {
    case 0: // Continue
      hidePauseMenu();
      break;

    case 1: // Encyclopedia (same screen as title, works with controller)
      // Hide pause menu panel but keep the game in a paused state
      if (pauseUI.container) pauseUI.container.hide();

      // Open the same Encyclopedia screen used on the title menu
      encyclopediaSource = "pause";   // remember we came from the pause menu
      gameState = "encyclopedia";
      break;

    case 2: // Return to Menu
      hideEncyclopediaOverlay();
      hidePauseMenu();       // isPaused = false
      gameState = 'title';
      if (typeof showTitleButtons === 'function') showTitleButtons();
      break;
  }
}
