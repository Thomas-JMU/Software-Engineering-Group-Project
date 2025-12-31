// Encyclopedia UI: two subpages (Enemies, Weapons) and a return to title button.
let encyclopediaEnemiesButton;
let encyclopediaWeaponsButton;
let encyclopediaAbilitiesButton;
let encyclopediaOtherButton;
let encyclopediaReturnButton;
let encyclopediaView = "enemies"; // view starts with enemies screen

// Where did we open the encyclopedia from?
// "title" = from main menu, "pause" = from pause menu in-game
var encyclopediaSource = "title";

// --- Gamepad/keyboard selection state for the Encyclopedia menu ---
let encyclopediaSelectedIndex = 0;   // 0 = Enemies, 1 = Weapons, 2 = Return to Title
let _encyPrevUp = false;
let _encyPrevDown = false;
let _encyPrevSelect = false;
let _encyAxisCooldown = 0;          // debounce for left stick Y

// Highlight function (same visual style as other menus)
function highlightEncyclopediaButton(index) {
    const buttons = [
        encyclopediaEnemiesButton,
        encyclopediaWeaponsButton,
        encyclopediaAbilitiesButton,
        encyclopediaOtherButton,
        encyclopediaReturnButton
    ];
    buttons.forEach((btn, i) => {
        if (!btn) return;
        if (i === index) {
            // subtle outline to show the selected button
            btn.style('outline', '3px solid rgba(100,150,255,0.9)');
            btn.style('outline-offset', '2px');
        } else {
            btn.style('outline', 'none');
            btn.style('outline-offset', '0');
        }
    });
}

function hideEncyclopediaButtons() {
    encyclopediaEnemiesButton.hide();
    encyclopediaWeaponsButton.hide();
    encyclopediaAbilitiesButton.hide();
    encyclopediaReturnButton.hide();
    encyclopediaOtherButton.hide();
}

function encyclopedia() {
    // background and heading
    background(0);
    textAlign(LEFT, TOP);
    fill(255);
    textSize(24);
    text("Encyclopedia", 50, 30);

    // create the navigation buttons once
    if (!encyclopediaEnemiesButton) {
        encyclopediaEnemiesButton = createButton("Enemies");
        encyclopediaWeaponsButton = createButton("Weapons");
        encyclopediaAbilitiesButton = createButton("Abilties");
        encyclopediaReturnButton = createButton("Return");
        encyclopediaOtherButton = createButton("Other");

        // position buttons
        encyclopediaEnemiesButton.position(50, 60);
        encyclopediaWeaponsButton.position(130, 60);
        encyclopediaAbilitiesButton.position(210, 60);
        encyclopediaOtherButton.position(280, 60);
        encyclopediaReturnButton.position(width / 2 - 60, height - 50);

        // button handlers
        encyclopediaEnemiesButton.mousePressed(() => {
            encyclopediaView = "enemies";
        });
        encyclopediaWeaponsButton.mousePressed(() => {
            encyclopediaView = "weapons";
        });
        encyclopediaAbilitiesButton.mousePressed(() => {
            encyclopediaView = "abilities";
        });
        encyclopediaOtherButton.mousePressed(() => {
            encyclopediaView = "other";
        });

        encyclopediaReturnButton.mousePressed(() => {
            // If we opened the encyclopedia from the pause menu,
            // go back to the paused game instead of the title.
            if (encyclopediaSource === "pause") {
                // Hide encyclopedia buttons
                hideEncyclopediaButtons();
                // Switch back to the game and reopen the pause menu
                gameState = "game";
                if (typeof showPauseMenu === "function") {
                    showPauseMenu(); // keeps the game in a paused state
                }
            } else {
                // Default behavior: opened from title -> return to main menu
                gameState = "title";
                hideEncyclopediaButtons();
                if (typeof showTitleButtons === "function") {
                    showTitleButtons();
                } else {
                    startButton.show();
                    encyclopediaButton.show();
                }
            }
        });

        // Initialize gamepad selection on first creation
        encyclopediaSelectedIndex = 0;
        highlightEncyclopediaButton(0);

    } else {
        // ensure buttons visible while in encyclopedia
        encyclopediaEnemiesButton.show();
        encyclopediaWeaponsButton.show();
        encyclopediaAbilitiesButton.show();
        encyclopediaOtherButton.show();
        encyclopediaReturnButton.show();
        // hide title UI
        startButton.hide();
        encyclopediaButton.hide();

        // Keep current selection highlighted
        highlightEncyclopediaButton(encyclopediaSelectedIndex);
    }

    // Render content depending on selected subpage
    textSize(12);
    let y = 100;
    let lineHeight = 15;

    if (encyclopediaView === "enemies") {
        textSize(20);
        text("Enemies", 50, y);

        textSize(12);
        y += lineHeight * 2;
        text("Bug - Ranged", 50, y);
        text("- Shoots single bullets", 70, y + lineHeight);

        y += lineHeight * 2.5;
        text("Error - Ranged", 50, y);
        text("- Shoots a spread of bullets", 70, y + lineHeight);

        y += lineHeight * 2.5;
        text("Bug - Melee", 50, y);
        text("- Splits when killed", 70, y + lineHeight);

        y += lineHeight * 2.5;
        text("Exception - Melee", 50, y);
        text("- Explodes on contact", 70, y + lineHeight);
    } else if (encyclopediaView === "weapons") {
        textSize(20);
        text("Weapons", 50, y);

        textSize(12);
        y += lineHeight * 2;
        text("Syntax Gun", 50, y);
        text("- Basic gun with average fire rate and damage", 70, y + lineHeight);

        y += lineHeight * 2.5;
        text("Hotfix Rifle", 50, y);
        text("- Slower than the Syntax Gun, but deals more damage", 70, y + lineHeight);

        y += lineHeight * 2.5;
        text("Byteblade", 50, y);
        text("- Melee weapon that deals damage in an arc in front of you", 70, y + lineHeight);

        y += lineHeight * 2.5;
        text("Function cannon", 50, y);
        text("- Trades very slow fire rate for big damage in an area", 70, y + lineHeight);

        y += lineHeight * 2.5;
        text("Bug Spray", 50, y);
        text("- Damages enemies within a radius of the player", 70, y + lineHeight);
    } else if (encyclopediaView === "abilities") {
        textSize(20);
        text("Abilties", 50, y);

        textSize(12);
        y += lineHeight * 2;
        text("Dash", 50, y);
        text("- A short burst of invulnerable movement", 70, y + lineHeight);

        y+= lineHeight * 2.5;
        text("Blank", 50, y);
        text("- Clears enemy bullets around the player", 70, y + lineHeight);

        y+= lineHeight * 2.5;
        text("Lifesteal", 50, y);
        text("- Kills enemies close to the player and restores some health", 70, y + lineHeight);

        /*y+= lineHeight * 2.5;
        text("Ability 4", 50, y);
        text("-Description 4", 70, y + lineHeight);*/
    } else if (encyclopediaView === "other") {
        textSize(20);
        text("Prestige", 50, y);

        textSize(12);
        y += lineHeight * 2;
        text("Upon beating 3 levels, the player gains 1 prestige.\nEach stack further empowers enemies.\nCheck your current prestige in the pause menu.", 50, y);

        y+= lineHeight * 3.5;
        textSize(20);
        text("Clearing Levels", 50, y);
        textSize(12);
        y += lineHeight;
        text("The player must defeat 20 enemies per level to advance.\nThis goal increases by 10 per each prestige level!", 50, y + lineHeight);

    }

    // After drawing the page, update controller/keyboard navigation
    updateEncyclopediaMenuNavigation();
}

// --- Gamepad + keyboard navigation for the Encyclopedia menu ---
function updateEncyclopediaMenuNavigation() {
    // If buttons are not created yet, nothing to do
    if (!encyclopediaEnemiesButton) return;

    // Keyboard input (arrows + Enter/Space)
    const kUpNow     = keyIsDown(38);                  // Up Arrow
    const kDownNow   = keyIsDown(40);                  // Down Arrow
    const kSelectNow = keyIsDown(13) || keyIsDown(32); // Enter or Space

    // Gamepad input using helpers defined in sketch.js: _firstPad, _padHeld, _axis
    const pad = (typeof _firstPad === 'function') ? _firstPad() : null;
    const gUpNow     = pad ? _padHeld(pad, 12) : false; // D-pad Up
    const gDownNow   = pad ? _padHeld(pad, 13) : false; // D-pad Down
    // Accept A/Cross (0), B (1) or X/Square (2) as select
    const gSelectNow = pad ? (_padHeld(pad, 0) || _padHeld(pad, 1) || _padHeld(pad, 2)) : false;

    // Merge keyboard + gamepad
    let upNow   = kUpNow   || gUpNow;
    let downNow = kDownNow || gDownNow;
    const selectNow = kSelectNow || gSelectNow;

    // Left stick Y fallback (if D-pad is not mapped)
    if (!upNow && !downNow && pad) {
        const y = _axis(pad, 1); // left stick Y
        const TH = 0.55;
        if (_encyAxisCooldown <= 0) {
            if (y <= -TH) { upNow = true;   _encyAxisCooldown = 10; }
            if (y >=  TH) { downNow = true; _encyAxisCooldown = 10; }
        } else {
            _encyAxisCooldown--;
        }
    }

    // One-shot edges
    const upEdge     = upNow     && !_encyPrevUp;
    const downEdge   = downNow   && !_encyPrevDown;
    const selectEdge = selectNow && !_encyPrevSelect;

    // Save states for the next frame
    _encyPrevUp     = upNow;
    _encyPrevDown   = downNow;
    _encyPrevSelect = selectNow;

    // Move selection (0 = Enemies, 1 = Weapons, 2 = Abilities, 3 = Other, 4 = Return to Title)
    const maxIndex = 4; // we have 5 buttons: indices 0..4

    if (upEdge) {
        encyclopediaSelectedIndex =
            (encyclopediaSelectedIndex - 1 + (maxIndex + 1)) % (maxIndex + 1);
        highlightEncyclopediaButton(encyclopediaSelectedIndex);
    }
    if (downEdge) {
        encyclopediaSelectedIndex =
            (encyclopediaSelectedIndex + 1) % (maxIndex + 1);
        highlightEncyclopediaButton(encyclopediaSelectedIndex);
    }

    // Confirm current selection
    if (selectEdge) {
        switch (encyclopediaSelectedIndex) {
            case 0: // Enemies
                encyclopediaView = "enemies";
                break;
            case 1: // Weapons
                encyclopediaView = "weapons";
                break;
            case 2: // Abilities
                encyclopediaView = "abilities";
                break;
            case 3: // Other
                encyclopediaView = "other";
                break;
            case 4: // Return
                // Make Return behave like the mouse button:
                // go back to the previous screen depending on encyclopediaSource.

                hideEncyclopediaButtons();

                if (encyclopediaSource === "pause") {
                    // Back to pause menu in-game
                    gameState = "game";
                    if (typeof showPauseMenu === "function") {
                        showPauseMenu();
                    }
                } else {
                    // Default: encyclopedia opened from the title screen → back to title
                    gameState = "title";
                    if (typeof showTitleButtons === 'function') {
                        showTitleButtons();
                    } else {
                        startButton.show();
                        encyclopediaButton.show();
                    }
                }
                break;
        }
    }

}