
function createEnemy(object, health, x, y, type) {
    object.health = health;
    object.x = x;
    object.y = y;
    object.size = 25;
    object.speed = 2;
    object.type = type;
    if (type == "sniper") {
        object.timer = 0;
        object.cooldown = 120;
        object.bulletVel = 15;
        object.spread = 1;
    } else if (type == "shotgun") {
        object.timer = 0;
        object.cooldown = 120;
        object.bulletVel = 3;
        object.spread = 5;
    } if (type == "basic") {
        object.timer = 0;
        object.cooldown = 60;
        object.bulletVel = 3;
        object.spread = 1;
    } if (type == "rapid") {
        object.timer = 0;
        object.cooldown = 10;
        object.bulletVel = 3;
        object.spread = 1;
    } else if (type == "splitter small") {
        object.size = 12.5;
    }
    return object;
}

function meleeAi(e) {
    // if colliding with player and no iframes, do damage
    if (abs(e.x - playerX) <= (e.size + playerSize) / 2 && abs(e.y - playerY) <= (e.size + playerSize) / 2) {
        if (iFrames == 0) {
            iFrames = 30;
            playerHealth -= 10;
            if (e.type == "explode") e.health = 0;
        }
    } else { // otherwise move to player
        angleToPlayer = atan2(playerY - e.y, playerX - e.x);
        e.x += e.speed * cos(angleToPlayer);
        e.y += e.speed * sin(angleToPlayer);
    }
}

function shooterAi(e) {
    let distToPlayer = sqrt((e.x - playerX) ** 2 + (e.y - playerY) ** 2);
    let angleToPlayer = atan2(playerY - e.y, playerX - e.x);
    let cosPlayer = cos(angleToPlayer);
    let sinPlayer = sin(angleToPlayer);
    if (distToPlayer > 150) {
        e.x += e.speed * cosPlayer;
        e.y += e.speed * sinPlayer;
    }

    if (e.timer == 0) {
        if (e.spread == 1) {
            bullets.push({
                x: e.x + cosPlayer * 5,
                y: e.y + sinPlayer * 5,
                vx: cosPlayer * e.bulletVel,
                vy: sinPlayer * e.bulletVel,
                type: "enemy"
            });
        } else {
            /*for (let i = 0; i < e.spread; i++) {
                let angle = angleToPlayer - 22.5 + (45 * (i / (e.spread - 1)));
                bullets.push({
                    x: e.x + cos(angle) * 5,
                    y: e.y + sin(angle) * 5,
                    vx: cos(angle) * e.bulletVel,
                    vy: sin(angle) * e.bulletVel,
                    type: "enemy"
                });
            }*/
                let half = Math.PI / 8;
                for (let i = 0; i < e.spread; i++) {
                    let t = (i / (e.spread - 1)) || 0; 
                    let angle = angleToPlayer - half + t * (half * 2);
                    bullets.push({
                        x: e.x + cos(angle) * 5,
                        y: e.y + sin(angle) * 5,
                        vx: cos(angle) * e.bulletVel,
                        vy: sin(angle) * e.bulletVel,
                        type: "enemy"
                    });
                }
        }
        e.timer = e.cooldown;
    }
    e.timer--;
}

function updateEnemies(enemies) {
    let i = 0;
    let e;
    while (i < enemies.length) {
        e = enemies[i];
        fill(255,10,0);
        if (e.type == "melee1") {
            fill(255,10,0);
            meleeAi(e);
        } else if (e.type == "basic") {
            fill(148,13,13);
            shooterAi(e);
        } else if (e.type == "sniper") {
            fill(100,0,0);
            shooterAi(e);
        } else if (e.type == "shotgun") {
            fill(150,60,60);
            shooterAi(e);
        } else if (e.type == "rapid") {
            fill(250,120,120);
            shooterAi(e);
        } else if (e.type == "splitter big") {
            fill(200,50,50);
            meleeAi(e);
        } else if (e.type == "splitter small") {
            fill(200,50,50);
            meleeAi(e);
        } else if (e.type == "explode") {
            fill(200,120,50);
            meleeAi(e);
        }
        
        // CHECK IF PLAYER BULLET HITS ENEMY
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];

            if (abs(b.x - e.x) <= (e.size + BULLET_SIZE) / 2 
            && abs(b.y - e.y) <= (e.size + BULLET_SIZE) / 2 && b.type == "player") {

                // Use bullet-specific damage if present, otherwise fall back to 20
                const dmg = (typeof b.damage === "number") ? b.damage : 20;
                e.health -= dmg;
                
                // Function cannon triggers explosion on hit
                if (b.weaponType === "Function cannon") {
                createExplosion(
                    b.x,
                    b.y,
                    15, // duration
                    60, // radius
                    20, // damage per frame of explosion
                    false, // don't affect player
                    true   // affect enemies
                );
                }
                
                // Remove bullet after hit
                bullets.splice(i, 1);
            }
        }

        // draw the enemy

        //fill(255,70,70);
        //square(e.x, e.y, e.size);
        image(enemyAssets[e.type], e.x, e.y, e.size * 1.5, e.size * 1.5)
        // delete the enemy if its out of health
        if (e.health <= 0) {
            if (e.type == "splitter big") {
                let e1 = createEnemy({}, 100, e.x + 10, e.y, "splitter small");
                let e2 = createEnemy({}, 100, e.x - 10, e.y, "splitter small");
                enemies.push(e1);
                enemies.push(e2);
            } else if (e.type == "explode") {
                createExplosion(e.x, e.y, 15, 80, 10, true, false);
                print(explosions)
            }
            enemies.splice(i, 1);
            killCount++;
            totalKillCount++;
        } else {
            i++;
        }
    }
    /*for (const e of enemies) {
        fill(255,10,0);
        circle(e.x, e.y);
    }*/
}